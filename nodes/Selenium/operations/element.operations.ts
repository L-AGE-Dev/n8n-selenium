import { IExecuteFunctions, IHttpRequestOptions, INodeExecutionData } from 'n8n-workflow';
import { getElementId } from '../shared/helpers';

export async function clickElement(
	context: IExecuteFunctions,
	i: number,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const selectorType = context.getNodeParameter('selectorType', i) as string;
	const selector = context.getNodeParameter('selector', i) as string;
	const sessionId = context.getNodeParameter('sessionId', i) as string;

	const elementId = await getElementId(
		context,
		baseUrl,
		selectorType,
		selector,
		sessionId,
		timeout,
	);

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}/session/${sessionId}/element/${elementId}/click`,
		body: { id: elementId },
		json: true,
		timeout,
	};

	await context.helpers.httpRequestWithAuthentication.call(context, 'seleniumApi', requestOptions);

	return {
		json: {
			success: true,
			action: 'clickElement',
			selector,
			sessionId,
		},
	};
}

export async function sendKeys(
	context: IExecuteFunctions,
	i: number,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const sessionId = context.getNodeParameter('sessionId', i) as string;
	const keyEntries = context.getNodeParameter('keyEntries.entries', i, []) as Array<{
		selectorType: string;
		selector: string;
		value: string;
	}>;

	for (const entry of keyEntries) {
		const elementId = await getElementId(
			context,
			baseUrl,
			entry.selectorType,
			entry.selector,
			sessionId,
			timeout,
		);

		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/session/${sessionId}/element/${elementId}/value`,
			body: { text: entry.value, value: entry.value.split('') },
			json: true,
			timeout,
		};

		await context.helpers.httpRequestWithAuthentication.call(
			context,
			'seleniumApi',
			requestOptions,
		);
	}

	return {
		json: {
			success: true,
			action: 'sendKeys',
			entriesSent: keyEntries.length,
			sessionId,
		},
	};
}
