import { INodeProperties } from 'n8n-workflow';

export const scriptDescription: INodeProperties[] = [
	{
		displayName: 'Script',
		name: 'script',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: ['executeScript'],
			},
		},
		description: 'The JavaScript code to execute',
	},
];
