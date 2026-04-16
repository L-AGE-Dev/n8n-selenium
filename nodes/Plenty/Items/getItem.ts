import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { plentyApiRequest } from '../shared/transport';

export async function getItem(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const itemId = this.getNodeParameter('itemId', i) as string;
	const lang = this.getNodeParameter('lang', i) as string;

	const qs: IDataObject = {};
	if (lang) {
		qs.lang = lang;
	}

	const responseData = await plentyApiRequest.call(this, 'GET', `/rest/items/${itemId}`, {}, qs);

	return this.helpers.returnJsonArray(responseData);
}
