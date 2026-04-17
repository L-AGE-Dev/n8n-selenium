import { INodeProperties } from 'n8n-workflow';

export const commonDescription: INodeProperties[] = [
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			hide: {
				operation: ['startSession', 'closeAllSessions', 'getAllSessions'],
			},
		},
		description: 'The ID of the Selenium Session',
	},
	{
		displayName: 'Timeout',
		name: 'timeout',
		type: 'number',
		default: 10000,
		description: 'Maximum time to wait for the request to complete, in milliseconds',
	},
];
