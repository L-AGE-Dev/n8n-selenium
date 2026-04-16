import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IHttpRequestOptions,
} from 'n8n-workflow';

interface IGenericRecord {
	[key: string]: unknown;
}

export class Selenium implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Selenium',
		name: 'selenium',
		icon: 'file:selenium.svg',
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
				name: 'seleniumApi',
				required: true,
			},
		],

		properties: [
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
			{
				displayName: 'Wait For Selector',
				name: 'waitForSelector',
				type: 'string',
				default: '',
				description:
					'Prefix with selector type: css, xpath, ID, name, link text, partial link text, tag name, class name. e.g. "ID:my-btn" or "xpath://div". Defaults to CSS if no prefix.',
				displayOptions: {
					show: {
						operation: ['navigate'],
					},
				},
			},
			{
				displayName: 'Selector',
				name: 'selector',
				type: 'string',
				default: '',
				required: true,
				description:
					'Prefix with selector type: css, xpath, ID, name, link text, partial link text, tag name, class name. e.g "ID:my-btn" or "xpath://div[1]". Defaults to CSS if no prefix.',
				displayOptions: {
					show: {
						operation: ['clickElement', 'sendKeys'],
					},
				},
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				default: '',
				required: true,
				description: 'The text value to input into the element',
				displayOptions: {
					show: {
						operation: ['sendKeys'],
					},
				},
			},
			{
				displayName: 'Timeout',
				name: 'timeout',
				type: 'number',
				default: 10000,
				description: 'Maximum time to wait for the request to complete, in milliseconds',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('seleniumApi');

		if (!credentials) {
			throw new NodeOperationError(this.getNode(), 'No credentials provided!');
		}

		// Helper for delaying execution
		// eslint-disable-next-line @n8n/community-nodes/no-restricted-globals
		const wait = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

		const parseSelector = (selector: string) => {
			let using = 'css selector';
			let value = selector;

			// Known Selenium locator strategies
			const strategies = [
				'id',
				'xpath',
				'link text',
				'partial link text',
				'name',
				'tag name',
				'class name',
				'css selector',
				'css',
			];

			const colonIndex = selector.indexOf(':');
			if (colonIndex > 0) {
				const prefix = selector.substring(0, colonIndex).toLowerCase();
				if (strategies.includes(prefix)) {
					using = prefix === 'css' ? 'css selector' : prefix;
					value = selector.substring(colonIndex + 1).trim();
				}
			}

			return { using, value };
		};

		const getElementId = async (
			using: string,
			value: string,
			sessionId: string,
			timeout: number,
		) => {
			const elemReq: IHttpRequestOptions = {
				method: 'POST',
				url: `${credentials.url}/session/${sessionId}/element`,
				body: { using, value },
				json: true,
				timeout,
			};
			const elRes = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'seleniumApi',
				elemReq,
			);

			const data = elRes as IGenericRecord;
			const elValue = data?.value as Record<string, string>;

			// Check common W3C element IDs
			const elementId = elValue
				? elValue['element-6066-11e4-a52e-4f735466cecf'] ||
					elValue.ELEMENT ||
					Object.values(elValue)[0]
				: undefined;
			if (!elementId) {
				throw new NodeOperationError(this.getNode(), `Element not found for ${using}='${value}'`);
			}
			return elementId as string;
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const timeout = this.getNodeParameter('timeout', i, 10000) as number;

				if (operation === 'startSession') {
					const additionalFields = this.getNodeParameter('additionalFields', i) as {
						proxy?: string;
						chromeOptions?: string;
						userAgent?: string;
						experimentalOptions?: string;
					};

					let args: string[] = [];

					if (additionalFields.chromeOptions) {
						const customArgs = additionalFields.chromeOptions
							.split(',')
							.map((opt: string) => opt.trim())
							.filter((opt: string) => opt);
						args = args.concat(customArgs);
					}

					if (additionalFields.userAgent) {
						args.push(`--user-agent=${additionalFields.userAgent}`);
					}

					let proxySettings = undefined;
					if (additionalFields.proxy) {
						const proxyString = additionalFields.proxy;
						proxySettings = {
							proxyType: 'MANUAL',
							httpProxy: proxyString,
							sslProxy: proxyString,
						};
						args.push(`--proxy-server=${proxyString}`);
					}

					const googChromeOptions: IGenericRecord = {
						args,
					};

					if (additionalFields.experimentalOptions) {
						try {
							const expOpts = JSON.parse(additionalFields.experimentalOptions);
							Object.assign(googChromeOptions, expOpts);
						} catch (e) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid JSON in Experimental Options: ${(e as Error).message}`,
							);
						}
					}

					const capabilities: IGenericRecord = {
						alwaysMatch: {
							browserName: 'chrome',
							'goog:chromeOptions': googChromeOptions,
						},
					};

					if (proxySettings) {
						(capabilities.alwaysMatch as IGenericRecord).proxy = proxySettings;
					}

					const requestOptions: IHttpRequestOptions = {
						method: 'POST',
						url: `${credentials.url}/session`,
						body: { capabilities },
						json: true,
						timeout,
					};

					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'seleniumApi',
						requestOptions,
					);

					const data = responseData as IGenericRecord;
					const valueObj = data?.value as IGenericRecord;
					const sessionId = (valueObj?.sessionId as string) || (data?.sessionId as string);

					returnData.push({
						json: {
							success: true,
							action: 'startSession',
							sessionId,
						},
					});
				} else if (operation === 'navigate') {
					const targetUrl = this.getNodeParameter('url', i) as string;
					const sessionId = this.getNodeParameter('sessionId', i) as string;

					const requestOptions: IHttpRequestOptions = {
						method: 'POST',
						url: `${credentials.url}/session/${sessionId}/url`,
						body: { url: targetUrl },
						json: true,
						timeout,
					};

					await this.helpers.httpRequestWithAuthentication.call(
						this,
						'seleniumApi',
						requestOptions,
					);

					const waitForSelector = this.getNodeParameter('waitForSelector', i, '') as string;

					if (waitForSelector) {
						const { using, value } = parseSelector(waitForSelector);

						// Simple loop to wait for element
						let found = false;
						let err = null;
						// Calculate attempts dynamically based on timeout (min 1 attempt, max according to timeout / 1s interval)
						const attempts = Math.max(1, Math.floor(timeout / 1000));
						for (let attempt = 0; attempt < attempts; attempt++) {
							try {
								const elemReq: IHttpRequestOptions = {
									method: 'POST',
									url: `${credentials.url}/session/${sessionId}/element`,
									body: { using, value },
									json: true,
									timeout,
								};

								const elRes = await this.helpers.httpRequestWithAuthentication.call(
									this,
									'seleniumApi',
									elemReq,
								);
								const elData = elRes as IGenericRecord;
								if (elData?.value) {
									found = true;
									break;
								}
							} catch (e) {
								err = e;
							}
							await wait(1000);
						}

						if (!found) {
							throw new NodeOperationError(
								this.getNode(),
								`Timeout waiting for selector: ${waitForSelector}. ${err ? String(err) : ''}`,
							);
						}
					}

					returnData.push({
						json: {
							success: true,
							action: 'navigate',
							url: targetUrl,
							sessionId,
						},
					});
				} else if (operation === 'executeScript') {
					const script = this.getNodeParameter('script', i) as string;
					const sessionId = this.getNodeParameter('sessionId', i) as string;

					const requestOptions: IHttpRequestOptions = {
						method: 'POST',
						url: `${credentials.url}/session/${sessionId}/execute/sync`,
						body: { script, args: [] },
						json: true,
						timeout,
					};

					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'seleniumApi',
						requestOptions,
					);

					const data = responseData as IGenericRecord;

					returnData.push({
						json: {
							success: true,
							action: 'executeScript',
							result: data?.value ?? null,
							sessionId,
						},
					});
				} else if (operation === 'getAllSessions') {
					const sessionsReq: IHttpRequestOptions = {
						method: 'GET',
						url: `${credentials.url}/sessions`,
						json: true,
						timeout,
					};

					let activeSessions: Array<{ id: string }> = [];
					try {
						const sessionsRes = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'seleniumApi',
							sessionsReq,
						);
						activeSessions =
							((sessionsRes as IGenericRecord)?.value as Array<{ id: string }>) || [];
					} catch (e) {
						// Ignore error
						void e;
					}

					returnData.push({
						json: {
							success: true,
							action: 'getAllSessions',
							sessions: activeSessions,
						},
					});
				} else if (operation === 'getPageSource') {
					const sessionId = this.getNodeParameter('sessionId', i) as string;

					const requestOptions: IHttpRequestOptions = {
						method: 'GET',
						url: `${credentials.url}/session/${sessionId}/source`,
						json: true,
						timeout,
					};

					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'seleniumApi',
						requestOptions,
					);

					const data = responseData as IGenericRecord;

					returnData.push({
						json: {
							success: true,
							action: 'getPageSource',
							source: data?.value ?? null,
							sessionId,
						},
					});
				} else if (operation === 'clickElement') {
					const selector = this.getNodeParameter('selector', i) as string;
					const sessionId = this.getNodeParameter('sessionId', i) as string;

					const { using, value } = parseSelector(selector);
					const elementId = await getElementId(using, value, sessionId, timeout);

					const requestOptions: IHttpRequestOptions = {
						method: 'POST',
						url: `${credentials.url}/session/${sessionId}/element/${elementId}/click`,
						body: {},
						json: true,
						timeout,
					};

					await this.helpers.httpRequestWithAuthentication.call(
						this,
						'seleniumApi',
						requestOptions,
					);

					returnData.push({
						json: {
							success: true,
							action: 'clickElement',
							selector,
							sessionId,
						},
					});
				} else if (operation === 'sendKeys') {
					const selector = this.getNodeParameter('selector', i) as string;
					const textValue = this.getNodeParameter('value', i) as string;
					const sessionId = this.getNodeParameter('sessionId', i) as string;

					const { using, value } = parseSelector(selector);
					const elementId = await getElementId(using, value, sessionId, timeout);

					const requestOptions: IHttpRequestOptions = {
						method: 'POST',
						url: `${credentials.url}/session/${sessionId}/element/${elementId}/value`,
						body: { text: textValue, value: textValue.split('') },
						json: true,
						timeout,
					};

					await this.helpers.httpRequestWithAuthentication.call(
						this,
						'seleniumApi',
						requestOptions,
					);

					returnData.push({
						json: {
							success: true,
							action: 'sendKeys',
							selector,
							sessionId,
						},
					});
				} else if (operation === 'closeAllSessions') {
					// Grid v4 supports GET /sessions or graphql.
					const sessionsReq: IHttpRequestOptions = {
						method: 'GET',
						url: `${credentials.url}/sessions`,
						json: true,
						timeout,
					};

					const closedSessions: string[] = [];
					try {
						const sessionsRes = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'seleniumApi',
							sessionsReq,
						);
						const activeSessions = (sessionsRes as IGenericRecord)?.value as Array<{ id: string }>;
						if (Array.isArray(activeSessions)) {
							for (const session of activeSessions) {
								if (session.id) {
									await this.helpers.httpRequestWithAuthentication.call(this, 'seleniumApi', {
										method: 'DELETE',
										url: `${credentials.url}/session/${session.id}`,
										json: true,
										timeout,
									});
									closedSessions.push(session.id);
								}
							}
						}
					} catch (e) {
						// Grid might not support /sessions endpoint or give error
						void e;
					}

					returnData.push({
						json: {
							success: true,
							action: 'closeAllSessions',
							closedSessions,
							sessionId: closedSessions.join(','),
						},
					});
				} else if (operation === 'closeSession') {
					const sessionId = this.getNodeParameter('sessionId', i) as string;

					const requestOptions: IHttpRequestOptions = {
						method: 'DELETE',
						url: `${credentials.url}/session/${sessionId}`,
						json: true,
						timeout,
					};

					await this.helpers.httpRequestWithAuthentication.call(
						this,
						'seleniumApi',
						requestOptions,
					);

					returnData.push({
						json: {
							success: true,
							action: 'closeSession',
							sessionId,
						},
					});
				}
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
