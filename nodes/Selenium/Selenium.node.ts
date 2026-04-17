import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { commonDescription } from './descriptions/common.description';
import { elementDescription } from './descriptions/element.description';
import { navigationDescription } from './descriptions/navigation.description';
import { scriptDescription } from './descriptions/script.description';
import { sessionDescription } from './descriptions/session.description';
import { clickElement, sendKeys } from './operations/element.operations';
import { getPageSource, navigate } from './operations/navigation.operations';
import { executeScript } from './operations/script.operations';
import {
	closeAllSessions,
	closeSession,
	getAllSessions,
	startSession,
} from './operations/session.operations';

export class Selenium implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Selenium',
		name: 'selenium',
		icon: { light: 'file:../../icons/selenium.svg', dark: 'file:../../icons/selenium.dark.svg' },
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with a Selenium Server via W3C API',
		defaults: {
			name: 'Selenium',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				// eslint-disable-next-line @n8n/community-nodes/no-credential-reuse
				name: 'seleniumApi',
				required: true,
			},
		],
		properties: [
			// eslint-disable-next-line @n8n/community-nodes/resource-operation-pattern
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Click Element',
						value: 'clickElement',
						description: 'Click an element',
						action: 'Click an element',
					},
					{
						name: 'Close All Sessions',
						value: 'closeAllSessions',
						description: 'Closes all active WebDriver sessions',
						action: 'Close all sessions',
					},
					{
						name: 'Close Session',
						value: 'closeSession',
						description: 'Closes an active WebDriver session',
						action: 'Close a session',
					},
					{
						name: 'Execute Script',
						value: 'executeScript',
						description: 'Execute JavaScript on the page',
						action: 'Execute a script',
					},
					{
						name: 'Get All Sessions',
						value: 'getAllSessions',
						description: 'Gets a list of all active WebDriver sessions',
						action: 'Get all sessions',
					},
					{
						name: 'Get Page Source',
						value: 'getPageSource',
						description: 'Get HTML source of the page',
						action: 'Get page source',
					},
					{
						name: 'Navigate',
						value: 'navigate',
						description: 'Navigate to a URL',
						action: 'Navigate to a URL',
					},
					{
						name: 'Send Keys',
						value: 'sendKeys',
						description: 'Send keystrokes to an element',
						action: 'Send keystrokes to an element',
					},
					{
						name: 'Start Session',
						value: 'startSession',
						description: 'Starts a new WebDriver session',
						action: 'Start a session',
					},
				],
				default: 'startSession',
			},
			...commonDescription,
			...sessionDescription,
			...navigationDescription,
			...elementDescription,
			...scriptDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('seleniumApi');

		if (!credentials) {
			throw new NodeOperationError(this.getNode(), 'No credentials provided!');
		}

		const baseUrl = credentials.url as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const timeout = this.getNodeParameter('timeout', i, 10000) as number;

				let result: INodeExecutionData;

				if (operation === 'startSession') {
					result = await startSession(this, i, baseUrl, timeout);
				} else if (operation === 'closeSession') {
					result = await closeSession(this, i, baseUrl, timeout);
				} else if (operation === 'getAllSessions') {
					result = await getAllSessions(this, baseUrl, timeout);
				} else if (operation === 'closeAllSessions') {
					result = await closeAllSessions(this, baseUrl, timeout);
				} else if (operation === 'navigate') {
					result = await navigate(this, i, baseUrl, timeout);
				} else if (operation === 'getPageSource') {
					result = await getPageSource(this, i, baseUrl, timeout);
				} else if (operation === 'clickElement') {
					result = await clickElement(this, i, baseUrl, timeout);
				} else if (operation === 'sendKeys') {
					result = await sendKeys(this, i, baseUrl, timeout);
				} else if (operation === 'executeScript') {
					result = await executeScript(this, i, baseUrl, timeout);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

				returnData.push(result);
			} catch (error) {
				if (this.continueOnFail()) {
					items[i].json = { error: (error as Error).message };
					returnData.push(items[i]);
				} else {
					if (error instanceof NodeOperationError) {
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error as Error);
				}
			}
		}

		return [returnData];
	}
}
