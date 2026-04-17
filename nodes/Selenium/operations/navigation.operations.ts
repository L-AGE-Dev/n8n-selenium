import {
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { IGenericRecord } from '../shared/types';
import { wait } from '../shared/helpers';

export async function navigate(
	context: IExecuteFunctions,
	i: number,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const targetUrl = context.getNodeParameter('url', i) as string;
	const sessionId = context.getNodeParameter('sessionId', i) as string;

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}/session/${sessionId}/url`,
		body: { url: targetUrl },
		json: true,
		timeout,
	};

	await context.helpers.httpRequestWithAuthentication.call(context, 'seleniumApi', requestOptions);

	const waitForSelector = context.getNodeParameter('waitForSelector', i, '') as string;

	if (waitForSelector) {
		const using = context.getNodeParameter('waitForSelectorType', i, 'css selector') as string;
		const value = waitForSelector;

		let found = false;
		let err = null;
		const attempts = Math.max(1, Math.floor(timeout / 1000));

		for (let attempt = 0; attempt < attempts; attempt++) {
			try {
				const elemReq: IHttpRequestOptions = {
					method: 'POST',
					url: `${baseUrl}/session/${sessionId}/element`,
					body: { using, value },
					json: true,
					timeout,
				};

				const elRes = await context.helpers.httpRequestWithAuthentication.call(
					context,
					'seleniumApi',
					elemReq,
				);
				const elData = elRes as IGenericRecord;
				if (elData?.value) {
					found = true;
					break;
				}
			} catch (e) {
				err = e;
			}
			await wait(1000);
		}

		if (!found) {
			throw new NodeOperationError(
				context.getNode(),
				`Timeout waiting for selector: ${waitForSelector}. ${err ? String(err) : ''}`,
			);
		}
	}

	return {
		json: {
			success: true,
			action: 'navigate',
			url: targetUrl,
			sessionId,
		},
	};
}

export async function getPageSource(
	context: IExecuteFunctions,
	i: number,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const sessionId = context.getNodeParameter('sessionId', i) as string;

	const requestOptions: IHttpRequestOptions = {
		method: 'GET',
		url: `${baseUrl}/session/${sessionId}/source`,
		json: true,
		timeout,
	};

	const responseData = await context.helpers.httpRequestWithAuthentication.call(
		context,
		'seleniumApi',
		requestOptions,
	);

	const data = responseData as IGenericRecord;

	return {
		json: {
			success: true,
			action: 'getPageSource',
			source: data?.value ?? null,
			sessionId,
		},
	};
}
