import { INodeProperties } from 'n8n-workflow';

const selectorTypeOptions = [
	{ name: 'CSS Selector', value: 'css selector' },
	{ name: 'XPath', value: 'xpath' },
	{ name: 'ID', value: 'id' },
	{ name: 'Name', value: 'name' },
	{ name: 'Tag Name', value: 'tag name' },
	{ name: 'Class Name', value: 'class name' },
	{ name: 'Link Text', value: 'link text' },
	{ name: 'Partial Link Text', value: 'partial link text' },
];

export const elementDescription: INodeProperties[] = [
	// ── clickElement ──────────────────────────────────────────────────────────
	{
		displayName: 'Selector Type',
		name: 'selectorType',
		type: 'options',
		default: 'css selector',
		required: true,
		displayOptions: {
			show: {
				operation: ['clickElement'],
			},
		},
		options: selectorTypeOptions,
		description: 'The strategy used to locate the element',
	},
	{
		displayName: 'Selector',
		name: 'selector',
		type: 'string',
		default: '',
		required: true,
		description: 'The selector value for the chosen strategy, e.g. "#my-btn" or "//div[1]"',
		displayOptions: {
			show: {
				operation: ['clickElement'],
			},
		},
	},
	// ── sendKeys ──────────────────────────────────────────────────────────────
	{
		displayName: 'Key Entries',
		name: 'keyEntries',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Entry',
		default: { entries: [] },
		required: true,
		displayOptions: {
			show: {
				operation: ['sendKeys'],
			},
		},
		description: 'List of selector + value pairs to send keys to, executed in order',
		options: [
			{
				name: 'entries',
				displayName: 'Entry',
				values: [
					{
						displayName: 'Selector Type',
						name: 'selectorType',
						type: 'options',
						default: 'css selector',
						options: selectorTypeOptions,
						description: 'The strategy used to locate the element',
					},
					{
						displayName: 'Selector',
						name: 'selector',
						type: 'string',
						default: '',
						description: 'The selector value for the chosen strategy',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'The text to type into the element',
					},
				],
			},
		],
	},
];
