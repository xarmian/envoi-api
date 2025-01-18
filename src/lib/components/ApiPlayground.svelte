<script lang="ts">
  export let selectedEndpoint: string | undefined = undefined;
  let address = '';
  let name = '';
  let token_id = '';
  let pattern = '';
  let searchType = 'contains';
  let limit = 100;
  let avatar = 'thumb';
  let response: any = null;
  let isLoading = false;
  let error: string | null = null;
  let selectedLanguage = 'curl';

  // Default to 'name' if no endpoint is selected
  $: actualEndpoint = selectedEndpoint || 'name';

  $: requestUrl = (() => {
    let url = 'https://api.envoi.sh/api/';
    const avatarParam = avatar !== 'thumb' ? `?avatar=${avatar}` : '';
    
    switch (actualEndpoint) {
      case 'name':
        return url + `name/${address}${avatarParam}`;
      case 'address':
        return url + `address/${name}${avatarParam}`;
      case 'search':
        const searchParams = new URLSearchParams();
        if (pattern) searchParams.set('pattern', pattern);
        if (searchType !== 'contains') searchParams.set('type', searchType);
        if (limit !== 100) searchParams.set('limit', limit.toString());
        if (avatar !== 'thumb') searchParams.set('avatar', avatar);
        const queryString = searchParams.toString();
        return url + `search${queryString ? `?${queryString}` : ''}`;
      case 'token':
        return url + `token/${token_id}${avatarParam}`;
      default:
        return url;
    }
  })();

  $: codeExample = (() => {
    switch (selectedLanguage) {
      case 'curl':
        return `curl "${requestUrl}"`;
      
      case 'javascript':
        return `fetch("${requestUrl}")
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
      
      case 'python':
        return `import requests

response = requests.get("${requestUrl}")
data = response.json()
print(data)`;
      
      case 'php':
        return `<?php
$response = file_get_contents("${requestUrl}");
$data = json_decode($response, true);
print_r($data);`;
      
      case 'go':
        return `package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func main() {
    resp, err := http.Get("${requestUrl}")
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    var data interface{}
    json.Unmarshal(body, &data)
    fmt.Println(data)
}`;

      default:
        return '';
    }
  })();

  async function sendRequest() {
    let options: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    isLoading = true;
    error = null;

    try {
      const res = await fetch(requestUrl, options);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Request failed');
      }
      response = await res.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch response';
      response = null;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="playground">
  <h2>Try the API</h2>
  <div class="playground-content">
    <div class="input-section">
      <div class="input-group">
        <label for="endpoint">Endpoint</label>
        <select id="endpoint" bind:value={actualEndpoint} class="endpoint-select">
          <option value="name">Name Resolution (address to name)</option>
          <option value="address">Address Resolution (name to address)</option>
          <option value="search">Name Search (search for names)</option>
          <option value="token">Token ID Resolution (token ID to name)</option>
        </select>
      </div>

      {#if actualEndpoint === 'name'}
        <div class="input-group">
          <label for="address">Address</label>
          <input 
            type="text" 
            id="address"
            bind:value={address} 
            placeholder="Enter Voi address" />
        </div>
      {:else if actualEndpoint === 'address'}
        <div class="input-group">
          <label for="name">Name</label>
          <input 
            type="text" 
            id="name"
            bind:value={name} 
            placeholder="Enter .voi name" />
        </div>
      {:else if actualEndpoint === 'token'}
        <div class="input-group">
          <label for="token_id">Token ID</label>
          <input 
            type="text" 
            id="token_id"
            bind:value={token_id} 
            placeholder="Enter token ID" />
        </div>
      {:else}
        <div class="input-group">
          <label for="pattern">Search Pattern</label>
          <input 
            type="text" 
            id="pattern"
            bind:value={pattern} 
            placeholder="Enter search pattern" />
        </div>
        <div class="input-group">
          <label for="type">Search Type</label>
          <select id="type" bind:value={searchType}>
            <option value="contains">Contains</option>
            <option value="starts">Starts With</option>
            <option value="ends">Ends With</option>
          </select>
        </div>
        <div class="input-group">
          <label for="limit">Result Limit</label>
          <input 
            type="number" 
            id="limit"
            bind:value={limit} 
            min="1" 
            max="1000" 
            placeholder="Result limit" />
        </div>
      {/if}

      <div class="input-group">
        <label for="avatar">Avatar Size</label>
        <select id="avatar" bind:value={avatar}>
          <option value="thumb">Thumbnail (128px)</option>
          <option value="small">Small (480px)</option>
          <option value="full">Original Size</option>
        </select>
      </div>

      <div class="request-preview">
        <div class="code-header">
          <h3>Request Example</h3>
          <div class="language-selector">
            <select bind:value={selectedLanguage} class="language-select mobile-only">
              <option value="curl">cURL</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="php">PHP</option>
              <option value="go">Go</option>
            </select>
            <div class="language-tabs desktop-only">
              <button 
                class:active={selectedLanguage === 'curl'}
                on:click={() => selectedLanguage = 'curl'}>
                cURL
              </button>
              <button 
                class:active={selectedLanguage === 'javascript'}
                on:click={() => selectedLanguage = 'javascript'}>
                JavaScript
              </button>
              <button 
                class:active={selectedLanguage === 'python'}
                on:click={() => selectedLanguage = 'python'}>
                Python
              </button>
              <button 
                class:active={selectedLanguage === 'php'}
                on:click={() => selectedLanguage = 'php'}>
                PHP
              </button>
              <button 
                class:active={selectedLanguage === 'go'}
                on:click={() => selectedLanguage = 'go'}>
                Go
              </button>
            </div>
          </div>
        </div>
        <div class="code-block">
          <pre><code>{codeExample}</code></pre>
          <button 
            class="copy-button" 
            on:click={() => navigator.clipboard.writeText(codeExample)}
            title="Copy to clipboard"
            aria-label="Copy code example">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
        </div>
      </div>

      <button 
        class="send-button" 
        on:click={sendRequest}
        disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Request'}
      </button>
    </div>

    <div class="response-section">
      <h3>Response</h3>
      {#if error}
        <div class="error">
          {error}
        </div>
      {:else if response}
        <pre><code>{JSON.stringify(response, null, 2)}</code></pre>
      {:else}
        <div class="placeholder">
          Response will appear here
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .playground {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 2rem;
  }

  .playground-content {
    display: grid;
    gap: 2rem;
  }

  .input-section {
    display: grid;
    gap: 1rem;
  }

  .input-group {
    display: grid;
    gap: 0.5rem;
  }

  .input-group label {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  input, select {
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;
  }

  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    padding-right: 2.5rem;
  }

  .send-button {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 1rem;
  }

  .send-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .response-section {
    background: var(--code-bg);
    padding: 1.5rem;
    border-radius: 8px;
    overflow: auto;
  }

  .response-section h3 {
    margin: 0 0 1rem 0;
    color: var(--text-secondary);
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: monospace;
  }

  .error {
    color: #dc3545;
    padding: 1rem;
    background: rgba(220, 53, 69, 0.1);
    border-radius: 4px;
  }

  .placeholder {
    color: var(--text-secondary);
    font-style: italic;
  }

  .request-preview {
    margin-top: 1rem;
  }

  .request-preview h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .code-block {
    position: relative;
    background: var(--code-bg);
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
  }

  .code-block pre {
    margin: 0;
    font-family: monospace;
    line-height: 1.5;
  }

  .copy-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.4rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .code-block:hover .copy-button {
    opacity: 1;
  }

  .copy-button:hover {
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .language-selector {
    display: flex;
    align-items: center;
  }

  .language-tabs {
    display: flex;
    gap: 0.5rem;
  }

  .language-tabs button {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-secondary);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .language-tabs button.active {
    background: var(--accent-color);
    color: white;
    border-color: var(--accent-color);
  }

  .language-tabs button:hover:not(.active) {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .mobile-only {
    display: none;
  }

  @media (max-width: 768px) {
    .mobile-only {
      display: block;
    }
    
    .desktop-only {
      display: none;
    }

    .code-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .language-selector {
      width: 100%;
    }

    .language-select {
      width: 100%;
    }
  }
</style> 