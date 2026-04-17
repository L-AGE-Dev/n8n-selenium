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
			proxyType: 'MANUAL',
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

export async function getAllSessions(
	context: IExecuteFunctions,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const sessionsReq: IHttpRequestOptions = {
		method: 'GET',
		url: `${baseUrl}/sessions`,
		json: true,
		timeout,
	};

	let activeSessions: Array<{ id: string }> = [];
	try {
		const sessionsRes = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'seleniumApi',
			sessionsReq,
		);
		activeSessions = ((sessionsRes as IGenericRecord)?.value as Array<{ id: string }>) || [];
	} catch (e) {
		void e;
	}

	return {
		json: {
			success: true,
			action: 'getAllSessions',
			sessions: activeSessions,
		},
	};
}

export async function closeAllSessions(
	context: IExecuteFunctions,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const sessionsReq: IHttpRequestOptions = {
		method: 'GET',
		url: `${baseUrl}/sessions`,
		json: true,
		timeout,
	};

	const closedSessions: string[] = [];
	try {
		const sessionsRes = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'seleniumApi',
			sessionsReq,
		);
		const activeSessions = (sessionsRes as IGenericRecord)?.value as Array<{ id: string }>;
		if (Array.isArray(activeSessions)) {
			for (const session of activeSessions) {
				if (session.id) {
					await context.helpers.httpRequestWithAuthentication.call(context, 'seleniumApi', {
						method: 'DELETE',
						url: `${baseUrl}/session/${session.id}`,
						json: true,
						timeout,
					});
					closedSessions.push(session.id);
				}
			}
		}
	} catch (e) {
		void e;
	}

	return {
		json: {
			success: true,
			action: 'closeAllSessions',
			closedSessions,
			sessionId: closedSessions.join(','),
		},
	};
}
