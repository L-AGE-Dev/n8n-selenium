import { INodeProperties } from 'n8n-workflow';

export const navigationDescription: INodeProperties[] = [
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: ['navigate'],
			},
		},
		description: 'The URL to navigate to',
	},
	{
		displayName: 'Wait For Selector Type',
		name: 'waitForSelectorType',
		type: 'options',
		default: 'css selector',
		displayOptions: {
			show: {
				operation: ['navigate'],
			},
		},
		options: [
			{ name: 'CSS Selector', value: 'css selector' },
			{ name: 'XPath', value: 'xpath' },
			{ name: 'ID', value: 'id' },
			{ name: 'Name', value: 'name' },
			{ name: 'Tag Name', value: 'tag name' },
			{ name: 'Class Name', value: 'class name' },
			{ name: 'Link Text', value: 'link text' },
			{ name: 'Partial Link Text', value: 'partial link text' },
		],
		description: 'The strategy used to locate the element to wait for',
	},
	{
		displayName: 'Wait For Selector',
		name: 'waitForSelector',
		type: 'string',
		default: '',
		description: 'The selector value for the chosen strategy to wait for before continuing',
		displayOptions: {
			show: {
				operation: ['navigate'],
			},
		},
	},
];
