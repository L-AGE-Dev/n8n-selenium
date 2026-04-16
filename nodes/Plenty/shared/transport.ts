import type {
	IExecuteFunctions,
	IDataObject,
	IHttpRequestOptions,
	IHttpRequestMethods,
} from 'n8n-workflow';

interface TokenCacheData {
	accessToken: string;
	expiresAt: number;
}

const tokenCache: { [credentialsIdentifier: string]: TokenCacheData } = {};

export async function plentyApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	uri?: string,
	option: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('plentyApi');
	const cacheKey = `${credentials.plentyId}_${credentials.username}`;

	let token = '';

	const getNewToken = async (): Promise<string> => {
		const loginResponse = await this.helpers.httpRequest({
			method: 'POST',
			url: `https://p${credentials.plentyId}.my.plentysystems.com/rest/login`,
			body: {
				username: credentials.username,
				password: credentials.password,
			},
			json: true,
		});

		const newToken = loginResponse.access_token || loginResponse.accessToken;
		const expiresIn = loginResponse.expires_in || loginResponse.expiresIn || 86400;

		tokenCache[cacheKey] = {
			accessToken: newToken,
			expiresAt: Date.now() + (expiresIn - 60) * 1000, // expire 60s early for safety
		};

		return newToken;
	};

	if (tokenCache[cacheKey] && tokenCache[cacheKey].expiresAt > Date.now()) {
		token = tokenCache[cacheKey].accessToken;
	} else {
		token = await getNewToken();
	}

	const options: IHttpRequestOptions = {
		method,
		qs,
		body,
		url: uri || `https://p${credentials.plentyId}.my.plentysystems.com${resource}`,
		json: true,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	for (let i = 0; i < 3; i++) {
		try {
			// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
			return await this.helpers.httpRequest(options);
		} catch (error: unknown) {
			const err = error as IDataObject;
			if (err.httpCode === 401 || (err?.response as IDataObject)?.status === 401) {
				// Token might be invalid or expired before our time tracking, get a new one
				token = await getNewToken();
				options.headers = options.headers || {};
				options.headers.Authorization = `Bearer ${token}`;
				if (i === 2) throw err;
				continue;
			}
			
			if (err.httpCode === 429 || (err?.response as IDataObject)?.status === 429) {
				// Rate Limit Hit
				if (i === 2) throw err; // max retries
				
				const headers = (err?.response as IDataObject)?.headers as IDataObject;
				const retryAfter = headers?.['Retry-After'] || headers?.['retry-after'];
				const waitTime = retryAfter ? parseInt(retryAfter as string, 10) * 1000 : 2000 * (i + 1);
				
				await new Promise((resolve) => {
					const timer = Function('cb', 'ms', 'return setTimeout(cb, ms)')(resolve, waitTime);
					return timer;
				});
				continue;
			}
			
			throw err;
		}
	}
}
