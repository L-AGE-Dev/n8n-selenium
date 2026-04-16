import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { itemFields, itemOperations } from './shared/ItemDescription';
import { getItems } from './Items/getItems';
import { getItem } from './Items/getItem';

export class Plenty implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Plenty',
		name: 'plenty',
		icon: 'file:../../icons/PlentyONE-logo-blue.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume Plenty API',
		defaults: {
			name: 'Plenty',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'plentyApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['accessToken'],
					},
				},
			},
		],
		requestDefaults: {
			baseURL: '={{ `https://p${$credentials.plentyId}.my.plentysystems.com` }}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Item',
						value: 'item',
					},
				],
				default: 'item',
			},
			...itemOperations,
			...itemFields,
		],
	};

	methodes = {
		item: {
			getAll: getItems,
			get: getItem,
		},
	};
}
