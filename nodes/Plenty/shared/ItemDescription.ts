import type { INodeProperties } from 'n8n-workflow';

export const itemOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['item'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get an item',
				action: 'Get an item',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many items',
				action: 'Get many items',
			},
		],
		default: 'getAll',
	},
];

export const itemFields: INodeProperties[] = [
	{
		displayName: 'Item ID',
		name: 'itemId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['get'],
				resource: ['item'],
			},
		},
		default: '',
		description: 'The ID of the item to retrieve',
	},
	{
		displayName: 'Language',
		name: 'lang',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['get'],
				resource: ['item'],
			},
		},
		default: '',
		description: 'The language of the variation information',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getAll'],
				resource: ['item'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getAll'],
				resource: ['item'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['item'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Flag One',
				name: 'flagOne',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Flag Two',
				name: 'flagTwo',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				default: '',
				description:
					'Filter restricts the list of results to items with the specified ID. More than one ID should be separated by commas.',
			},
			{
				displayName: 'Items Per Page',
				name: 'itemsPerPage',
				type: 'number',
				default: 100,
				description: 'Limits the number of results listed per page',
			},
			{
				displayName: 'Language',
				name: 'lang',
				type: 'string',
				default: '',
				description: 'The language of the variation information',
			},
			{
				displayName: 'Manufacturer ID',
				name: 'manufacturerId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter restricts the list of results to items with the specified item name',
			},
			{
				displayName: 'OR Filter',
				name: 'or',
				type: 'string',
				default: '',
				description:
					'Filters can be defined in this param to link them via OR. E.g. (updatedBetween=1573050718&variationUpdatedBetween=1573050718).',
			},
			{
				displayName: 'Updated Between',
				name: 'updatedBetween',
				type: 'string',
				default: '',
				description:
					'Filter restricts the list of results to items updated during the specified period (e.g. 1451606400,1456790400)',
			},
			{
				displayName: 'Variation Related Updated Between',
				name: 'variationRelatedUpdatedBetween',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Variation Updated Between',
				name: 'variationUpdatedBetween',
				type: 'string',
				default: '',
				description:
					'Filter restricts the list of results to items with variations that were updated during the specified period',
			},
			{
				displayName: 'With',
				name: 'with',
				type: 'string',
				default: '',
				description:
					'Includes the specified variation information in the results. E.g. itemProperties, itemImages.',
			},
		],
	},
];
