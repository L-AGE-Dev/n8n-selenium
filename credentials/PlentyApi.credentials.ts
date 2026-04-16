import type { Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class PlentyApi implements ICredentialType {
	name = 'plentyApi';

	displayName = 'Plenty API';

	icon: Icon = 'file:../icons/PlentyONE-logo-blue.svg'

	documentationUrl = 'https://developers.plentymarkets.com/api-doc';

	properties: INodeProperties[] = [
		{
			displayName: 'Plenty ID',
			name: 'plentyId',
			type: 'string',
			default: '',
			required: true,
			description: 'Your Plenty ID (e.g. 12345)',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ `https://p${$credentials?.plentyId}.my.plentysystems.com` }}',
			url: '/rest/login',
			method: 'POST',
			body: {
				username: '={{$credentials?.username}}',
				password: '={{$credentials?.password}}',
			},
		},
	};
}
