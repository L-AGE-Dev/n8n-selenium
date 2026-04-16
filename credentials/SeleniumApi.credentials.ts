import type { Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class SeleniumApi implements ICredentialType {
	name = 'seleniumApi';

	displayName = 'Selenium API';

	icon: Icon = 'file:../icons/selenium.svg'; // You might want to add a proper icon

	documentationUrl = 'https://www.selenium.dev/documentation/grid/';

	properties: INodeProperties[] = [
		{
			displayName: 'Selenium Grid URL',
			name: 'url',
			type: 'string',
			default: 'http://n8n-selenium:4444',
			required: true,
			description: 'The URL to your Selenium Server (e.g. http://n8n-selenium:4444)',
		},
		{
			displayName: 'Username (Optional)',
			name: 'username',
			type: 'string',
			default: '',
			description: 'If you configured Basic Authentication in front of Selenium',
		},
		{
			displayName: 'Password (Optional)',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.url}}',
			url: '/status',
			method: 'GET',
		},
	};
}
