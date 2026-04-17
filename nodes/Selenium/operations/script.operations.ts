import { IExecuteFunctions, IHttpRequestOptions, INodeExecutionData } from 'n8n-workflow';
import { IGenericRecord } from '../shared/types';

export async function executeScript(
	context: IExecuteFunctions,
	i: number,
	baseUrl: string,
	timeout: number,
): Promise<INodeExecutionData> {
	const script = context.getNodeParameter('script', i) as string;
	const sessionId = context.getNodeParameter('sessionId', i) as string;

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}/session/${sessionId}/execute/sync`,
		body: { script, args: [] },
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
			action: 'executeScript',
			result: data?.value ?? null,
			sessionId,
		},
	};
}
