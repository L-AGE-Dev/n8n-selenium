import {
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { IGenericRecord } from '../shared/types';

export async function startSession(
	context: IExecuteFunctions,
	i: number,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const additionalFields = context.getNodeParameter('additionalFields', i) as {
		proxy?: string;
		chromeOptions?: string;
		userAgent?: string;
		experimentalOptions?: string;
	};

	let args: string[] = [];

	if (additionalFields.chromeOptions) {
		const customArgs = additionalFields.chromeOptions
			.split(',')
			.map((opt: string) => opt.trim())
			.filter((opt: string) => opt);
		args = args.concat(customArgs);
	}

	if (additionalFields.userAgent) {
		args.push(`--user-agent=${additionalFields.userAgent}`);
	}

	let proxySettings = undefined;
	if (additionalFields.proxy) {
		const proxyString = additionalFields.proxy;
		proxySettings = {
			proxyType: 'manual',
			httpProxy: proxyString,
			sslProxy: proxyString,
		};
		args.push(`--proxy-server=${proxyString}`);
	}

	const googChromeOptions: IGenericRecord = { args };

	if (additionalFields.experimentalOptions) {
		try {
			const expOpts = JSON.parse(additionalFields.experimentalOptions);
			Object.assign(googChromeOptions, expOpts);
		} catch (e) {
			throw new NodeOperationError(
				context.getNode(),
				`Invalid JSON in Experimental Options: ${(e as Error).message}`,
			);
		}
	}

	const capabilities: IGenericRecord = {
		alwaysMatch: {
			browserName: 'chrome',
			'goog:chromeOptions': googChromeOptions,
		},
	};

	if (proxySettings) {
		(capabilities.alwaysMatch as IGenericRecord).proxy = proxySettings;
	}

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}/session`,
		body: { capabilities },
		json: true,
		timeout,
	};

	const responseData = await context.helpers.httpRequestWithAuthentication.call(
		context,
		'seleniumApi',
		requestOptions,
	);

	const data = responseData as IGenericRecord;
	const valueObj = data?.value as IGenericRecord;
	const sessionId = (valueObj?.sessionId as string) || (data?.sessionId as string);

	return {
		json: {
			success: true,
			action: 'startSession',
			sessionId,
		},
	};
}

export async function closeSession(
	context: IExecuteFunctions,
	i: number,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const sessionId = context.getNodeParameter('sessionId', i) as string;

	const requestOptions: IHttpRequestOptions = {
		method: 'DELETE',
		url: `${baseUrl}/session/${sessionId}`,
		json: true,
		timeout,
	};

	await context.helpers.httpRequestWithAuthentication.call(context, 'seleniumApi', requestOptions);

	return {
		json: {
			success: true,
			action: 'closeSession',
			sessionId,
		},
	};
}

interface IGridSession {
	id: string;
	capabilities?: string;
	startTime?: string;
	uri?: string;
	nodeId?: string;
}

/**
 * Lists active sessions via the Selenium 4 GraphQL API. The legacy `GET /sessions`
 * endpoint (JSON Wire Protocol) was removed in Selenium 4 and returns 404.
 */
async function fetchActiveSessions(
	context: IExecuteFunctions,
	baseUrl: string,
	timeout: number,
): Promise<IGridSession[]> {
	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}/graphql`,
		body: {
			query: '{ sessionsInfo { sessions { id capabilities startTime uri nodeId } } }',
		},
		json: true,
		timeout,
	};

	const res = await context.helpers.httpRequestWithAuthentication.call(
		context,
		'seleniumApi',
		requestOptions,
	);

	const sessionsInfo = ((res as IGenericRecord)?.data as IGenericRecord)
		?.sessionsInfo as IGenericRecord;
	return (sessionsInfo?.sessions as IGridSession[]) || [];
}

/**
 * Safely parses the stringified capabilities returned by the GraphQL API.
 */
function parseCapabilities(capabilities?: string): IGenericRecord {
	if (typeof capabilities !== 'string') {
		return (capabilities as IGenericRecord | undefined) ?? {};
	}
	try {
		return JSON.parse(capabilities) as IGenericRecord;
	} catch (e) {
		void e;
		return {};
	}
}

/**
 * Best-effort lookup of the current page URL and title for a session.
 * Failures (e.g. a busy or just-closed session) are swallowed per field so
 * one unavailable session never breaks listing the rest.
 */
async function fetchSessionPageInfo(
	context: IExecuteFunctions,
	baseUrl: string,
	sessionId: string,
	timeout: number,
): Promise<{ url?: string; title?: string }> {
	const pageInfo: { url?: string; title?: string } = {};

	try {
		const urlRes = await context.helpers.httpRequestWithAuthentication.call(context, 'seleniumApi', {
			method: 'GET',
			url: `${baseUrl}/session/${sessionId}/url`,
			json: true,
			timeout,
		});
		pageInfo.url = (urlRes as IGenericRecord)?.value as string;
	} catch (e) {
		void e;
	}

	try {
		const titleRes = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'seleniumApi',
			{
				method: 'GET',
				url: `${baseUrl}/session/${sessionId}/title`,
				json: true,
				timeout,
			},
		);
		pageInfo.title = (titleRes as IGenericRecord)?.value as string;
	} catch (e) {
		void e;
	}

	return pageInfo;
}

export async function getAllSessions(
	context: IExecuteFunctions,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const sessions = await fetchActiveSessions(context, baseUrl, timeout);

	const parsedSessions = await Promise.all(
		sessions.map(async (session) => {
			const capabilities = parseCapabilities(session.capabilities);
			const pageInfo = await fetchSessionPageInfo(context, baseUrl, session.id, timeout);

			return {
				sessionId: session.id,
				startTime: session.startTime,
				uri: session.uri,
				nodeId: session.nodeId,
				browserName: capabilities.browserName,
				browserVersion: capabilities.browserVersion,
				platformName: capabilities.platformName,
				url: pageInfo.url,
				title: pageInfo.title,
			};
		}),
	);

	return {
		json: {
			success: true,
			action: 'getAllSessions',
			count: parsedSessions.length,
			sessions: parsedSessions,
		},
	};
}

export async function closeAllSessions(
	context: IExecuteFunctions,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const sessions = await fetchActiveSessions(context, baseUrl, timeout);

	const closedSessions: string[] = [];
	const failedSessions: string[] = [];

	for (const session of sessions) {
		if (!session.id) {
			continue;
		}
		try {
			await context.helpers.httpRequestWithAuthentication.call(context, 'seleniumApi', {
				method: 'DELETE',
				url: `${baseUrl}/session/${session.id}`,
				json: true,
				timeout,
			});
			closedSessions.push(session.id);
		} catch (deleteError) {
			void deleteError;
			// Record the failure and try to close the next one
			failedSessions.push(session.id);
		}
	}

	return {
		json: {
			success: failedSessions.length === 0,
			action: 'closeAllSessions',
			count: closedSessions.length,
			closedSessions,
			failedSessions,
			sessionId: closedSessions.join(','),
		},
	};
}
