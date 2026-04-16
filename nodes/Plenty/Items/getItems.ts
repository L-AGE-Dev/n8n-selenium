import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { plentyApiRequest } from '../shared/transport';

export async function getItems(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const returnAll = this.getNodeParameter('returnAll', i) as boolean;
	const filters = this.getNodeParameter('filters', i) as IDataObject;

	const qs: IDataObject = {};
	Object.assign(qs, filters);

	if (!returnAll) {
		const limit = this.getNodeParameter('limit', i) as number;
		qs.itemsPerPage = limit;
	}

	const responseData = await plentyApiRequest.call(this, 'GET', '/rest/items', {}, qs);

	let entries = responseData.entries || responseData;
	if (!Array.isArray(entries)) {
		entries = [entries];
	}

	const results = returnAll
		? entries
		: entries.slice(0, this.getNodeParameter('limit', i) as number);

	return this.helpers.returnJsonArray(results);
}
