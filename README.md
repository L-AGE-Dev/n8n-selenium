# n8n-nodes-lage-selenium

This is an n8n community node that lets you control a **Selenium WebDriver** server from your n8n workflows.

Selenium is a browser automation framework that drives real browsers (Chrome, Firefox, etc.) via the W3C WebDriver protocol. This node communicates directly with a Selenium Grid or standalone Selenium server, allowing you to start browser sessions, navigate pages, interact with elements, run JavaScript, and more — all without writing any driver code.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Search for `n8n-nodes-lage-selenium` in the community nodes panel.

## Operations

| Operation              | Description                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Start Session**      | Creates a new Chrome WebDriver session. Returns a `sessionId` used by all subsequent operations. |
| **Close Session**      | Closes an active WebDriver session by its `sessionId`.                                           |
| **Get All Sessions**   | Returns a list of all currently active WebDriver sessions on the server.                         |
| **Close All Sessions** | Closes every active session on the server at once.                                               |
| **Navigate**           | Navigates the browser to a URL. Optionally waits for a selector to appear before continuing.     |
| **Get Page Source**    | Returns the full HTML source of the current page.                                                |
| **Click Element**      | Finds an element on the page and clicks it.                                                      |
| **Send Keys**          | Types text into one or more elements in sequence.                                                |
| **Execute Script**     | Runs synchronous JavaScript on the current page and returns the result.                          |

### Selector strategies

The **Click Element**, **Send Keys**, and **Navigate** (wait-for) operations support the following selector strategies:

- CSS Selector
- XPath
- ID
- Name
- Tag Name
- Class Name
- Link Text
- Partial Link Text

### Start Session — Advanced Options

| Option                          | Description                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| **Chrome Options**              | Comma-separated list of Chrome command-line flags (e.g. `--headless,--disable-gpu`).    |
| **User Agent**                  | Override the browser's User-Agent string.                                               |
| **Proxy URL**                   | Proxy server to route browser traffic through (e.g. `http://user:pass@host:port`).      |
| **Experimental Options (JSON)** | Raw JSON object merged into `goog:chromeOptions` (e.g. to suppress automation banners). |

## Credentials

Create a **Selenium API** credential with the following fields:

| Field                 | Required | Description                                                                                    |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| **Selenium Grid URL** | Yes      | Base URL of your Selenium server (e.g. `http://localhost:4444` or `http://n8n-selenium:4444`). |
| **Username**          | No       | Basic Auth username, if your server is protected by a reverse proxy.                           |
| **Password**          | No       | Basic Auth password.                                                                           |

The credential is validated by sending a `GET /status` request to the configured URL.

### Running Selenium alongside n8n (Docker Compose)

```yaml
services:
  n8n:
    image: n8nio/n8n
    # ...

  n8n-selenium:
    image: selenium/standalone-chrome
    shm_size: 2gb
    environment:
      - SE_NODE_MAX_SESSIONS=5
```

With this setup the **Selenium Grid URL** is `http://n8n-selenium:4444`.

## Compatibility

- Requires **n8n** (any recent version supporting community nodes).
- Targets **Selenium Grid / standalone-chrome** with the W3C WebDriver protocol.
- Tested against `selenium/standalone-chrome` Docker images.
- The node is marked `usableAsTool: true` and can be used directly inside AI Agent workflows.

## Usage

### Typical workflow pattern

1. **Start Session** → stores `{{ $json.sessionId }}` in a variable or passes it to the next node.
2. **Navigate** → go to the target URL; optionally wait for a page element to confirm load.
3. **Click Element** / **Send Keys** → interact with the page.
4. **Get Page Source** / **Execute Script** → extract data.
5. **Close Session** → always close the session when done to free up browser resources.

### Passing the Session ID between nodes

Every operation that opens or uses a session outputs a `sessionId` field in its JSON. Reference it in downstream nodes with:

```
{{ $('Start Session').item.json.sessionId }}
```

### Waiting for page load after navigation

Set **Wait For Selector** on the Navigate operation to a CSS selector or XPath expression that only appears once the page has fully loaded. The node polls every second until the selector is found or the timeout is reached.

### Running JavaScript

The **Execute Script** operation runs synchronous JavaScript via `POST /execute/sync`. Use a `return` statement to get a value back:

```js
return document.title;
```

The return value is available as `{{ $json.result }}`.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Selenium WebDriver documentation](https://www.selenium.dev/documentation/)
- [Selenium Grid documentation](https://www.selenium.dev/documentation/grid/)
- [W3C WebDriver specification](https://www.w3.org/TR/webdriver/)
- [selenium/standalone-chrome on Docker Hub](https://hub.docker.com/r/selenium/standalone-chrome)
