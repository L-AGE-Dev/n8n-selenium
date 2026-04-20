import { IExecuteFunctions, IHttpRequestOptions, NodeOperationError, sleep } from 'n8n-workflow';
import { IGenericRecord } from './types';

 
export const wait = async (ms: number): Promise<void> => sleep(ms);

export const parseSelector = (selector: string): { using: string; value: string } => {
	let using = 'css selector';
	let value = selector;

	const strategies = [
		'id',
		'xpath',
		'link text',
		'partial link text',
		'name',
		'tag name',
		'class name',
		'css selector',
		'css',
	];

	const colonIndex = selector.indexOf(':');
	if (colonIndex > 0) {
		const prefix = selector.substring(0, colonIndex).toLowerCase();
		if (strategies.includes(prefix)) {
			using = prefix === 'css' ? 'css selector' : prefix;
			value = selector.substring(colonIndex + 1).trim();
		}
	}

	return { using, value };
};

export const getElementId = async (
	context: IExecuteFunctions,
	baseUrl: string,
	using: string,
	value: string,
	sessionId: string,
	timeout: number,
): Promise<string> => {
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

	const data = elRes as IGenericRecord;
	const elValue = data?.value as Record<string, string>;

	const elementId = elValue
		? elValue['element-6066-11e4-a52e-4f735466cecf'] || elValue.ELEMENT || Object.values(elValue)[0]
		: undefined;

	if (!elementId) {
		throw new NodeOperationError(context.getNode(), `Element not found for ${using}='${value}'`);
	}

	return elementId as string;
};
