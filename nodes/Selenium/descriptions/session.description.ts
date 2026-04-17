import { INodeProperties } from 'n8n-workflow';

export const sessionDescription: INodeProperties[] = [
	{
		displayName: 'Advanced Options',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['startSession'],
			},
		},
		options: [
			{
				displayName: 'User Agent',
				name: 'userAgent',
				type: 'string',
				default: '',
				description: 'Custom User-Agent string',
			},
			{
				displayName: 'Experimental Options (JSON)',
				name: 'experimentalOptions',
				type: 'json',
				default:
					'{\n  "excludeSwitches": ["enable-automation"],\n  "useAutomationExtension": false\n}',
				description: 'JSON object for Chrome experimental options',
			},
			{
				displayName: 'Proxy URL',
				name: 'proxy',
				type: 'string',
				default: '',
				description: 'Proxy URL (e.g. host:port or http://user:pass@host:port)',
			},
			{
				displayName: 'Chrome Options',
				name: 'chromeOptions',
				type: 'string',
				typeOptions: { rows: 4 },
				default:
					'--disable-gpu,--no-sandbox,--disable-dev-shm-usage,--disable-blink-features=AutomationControlled,--disable-infobars,--disable-popup-blocking,--disable-notifications,--disable-background-networking,--disable-sync,--metrics-recording-only,--disable-background-timer-throttling,--lang=de-DE,de,--timezone=Europe/Berlin,--start-maximized,--window-position=0,0,--ignore-certificate-errors,--allow-running-insecure-content',
				description: 'Comma-separated list of Chrome options (e.g., --headless, --disable-gpu)',
			},
		],
	},
];
