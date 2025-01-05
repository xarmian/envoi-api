<script lang="ts">
  import { marked } from 'marked';
  import { markedHighlight } from 'marked-highlight';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/github.css';
  import { onMount } from 'svelte';
  import DOMPurify from 'dompurify';
  import type { MarkedOptions } from 'marked';

  let readme = '';
  let activeTab = 'docs';
  let selectedEndpoint = 'name';
  let inputValue = '';
  let responseData = '';
  let isLoading = false;
  let parsedContent = '';
  let currentUrl = '';
  let curlCommand = '';

  onMount(async () => {
    const response = await fetch('/README.md');
    readme = await response.text();
    updateParsedContent();
  });

  const options: MarkedOptions = {
    gfm: true,
    breaks: true
  };

  marked.use(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code: string, lang: string | undefined) {
        if (lang === 'json') {
          try {
            const parsed = JSON.parse(code);
            code = JSON.stringify(parsed, null, 2);
          } catch (e) {
            // If parsing fails, leave the code as is
          }
        }
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (err) {
            // If highlighting fails, return the original code
          }
        }
        return hljs.highlightAuto(code).value;
      }
    })
  );

  function updateParsedContent() {
    const rawHtml = marked.parse(readme, options);
    if (typeof rawHtml === 'string') {
      parsedContent = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['pre', 'code'],
        ADD_ATTR: ['class']
      });
    }
  }

  async function testEndpoint() {
    isLoading = true;
    responseData = '';
    try {
      let url = '';
      let options: RequestInit = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      switch (selectedEndpoint) {
        case 'name':
          url = `/api/name/${inputValue}`;
          break;
        case 'address':
          url = `/api/address/${inputValue}`;
          break;
        case 'search':
          url = `/api/search?pattern=${encodeURIComponent(inputValue)}`;
          break;
      }

      const response = await fetch(url, options);
      const data = await response.json();
      responseData = JSON.stringify(data, null, 2);
    } catch (error) {
      responseData = JSON.stringify({ error: 'Failed to fetch data' }, null, 2);
    }
    isLoading = false;
  }

  function updateExamples() {
    const baseUrl = 'https://api.envoi.sh';
    
    switch (selectedEndpoint) {
      case 'name':
        currentUrl = `${baseUrl}/api/name/${inputValue}`;
        curlCommand = `curl ${baseUrl}/api/name/${inputValue}`;
        break;
      case 'address':
        currentUrl = `${baseUrl}/api/address/${inputValue}`;
        curlCommand = `curl ${baseUrl}/api/address/${inputValue}`;
        break;
      case 'search':
        currentUrl = `${baseUrl}/api/search?pattern=${encodeURIComponent(inputValue)}`;
        curlCommand = `curl "${baseUrl}/api/search?pattern=${encodeURIComponent(inputValue)}"`;
        break;
    }
  }

  $: {
    if (inputValue) {
      updateExamples();
    } else {
      currentUrl = '';
      curlCommand = '';
    }
  }
</script>

<div class="app">
  <header>
    <h1>enVoi Naming Service API</h1>
    <nav>
      <button 
        class:active={activeTab === 'docs'} 
        on:click={() => activeTab = 'docs'}>
        Documentation
      </button>
      <button 
        class:active={activeTab === 'playground'} 
        on:click={() => activeTab = 'playground'}>
        API Playground
      </button>
    </nav>
  </header>

  {#if activeTab === 'docs'}
    <div class="container">
      <article class="markdown-body">
        {@html parsedContent}
      </article>
    </div>
  {:else}
    <div class="playground">
      <div class="controls">
        <div class="endpoint-selector">
          <label for="endpoint">Endpoint:</label>
          <select id="endpoint" bind:value={selectedEndpoint}>
            <option value="name">Name Resolution</option>
            <option value="address">Address Resolution</option>
            <option value="search">Name Search</option>
          </select>
        </div>

        <div class="input-group">
          <label for="input">
            {#if selectedEndpoint === 'name'}
              Algorand Address:
            {:else if selectedEndpoint === 'address'}
              VOI Name:
            {:else}
              Search Pattern:
            {/if}
          </label>
          <input 
            id="input"
            type="text"
            bind:value={inputValue}
            placeholder={
              selectedEndpoint === 'name' 
                ? "Enter Algorand address" 
                : selectedEndpoint === 'address'
                ? "Enter .voi name"
                : "Enter search pattern"
            }
          />
        </div>

        {#if inputValue}
          <div class="example-section">
            <div class="example-item">
              <label>URL:</label>
              <div class="code-display">
                <code>{currentUrl}</code>
                <button 
                  class="copy-button" 
                  on:click={() => navigator.clipboard.writeText(currentUrl)}
                  title="Copy URL">
                  📋
                </button>
              </div>
            </div>
            
            <div class="example-item">
              <label>Curl Command:</label>
              <div class="code-display">
                <code>{curlCommand}</code>
                <button 
                  class="copy-button" 
                  on:click={() => navigator.clipboard.writeText(curlCommand)}
                  title="Copy curl command">
                  📋
                </button>
              </div>
            </div>
          </div>
        {/if}

        <button 
          class="test-button" 
          on:click={testEndpoint}
          disabled={isLoading || !inputValue}>
          {isLoading ? 'Testing...' : 'Test Endpoint'}
        </button>
      </div>

      <div class="response">
        <h3>Response:</h3>
        <pre><code class="language-json">{responseData || 'No response yet'}</code></pre>
      </div>
    </div>
  {/if}
</div>

<style>
  .app {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  header {
    background-color: #ffffff;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  header h1 {
    margin: 0 0 1rem 0;
    color: #1a1a1a;
    font-size: 2.5rem;
  }

  nav {
    display: flex;
    gap: 1rem;
  }

  nav button {
    padding: 0.75rem 1.5rem;
    border: none;
    background: none;
    color: #666;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  nav button:hover {
    background-color: #f0f0f0;
  }

  nav button.active {
    color: #000;
    background-color: #e9ecef;
    font-weight: 500;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .playground {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .controls {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .endpoint-selector {
    margin-bottom: 1.5rem;
  }

  .input-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #4a5568;
    font-weight: 500;
  }

  select, input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  select:focus, input:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .test-button {
    background-color: #4299e1;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .test-button:hover:not(:disabled) {
    background-color: #3182ce;
  }

  .test-button:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }

  .response {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .response h3 {
    margin-top: 0;
    color: #4a5568;
  }

  .response pre {
    margin: 0;
    padding: 1rem;
    background-color: #f7fafc;
    border-radius: 4px;
    overflow-x: auto;
  }

  /* GitHub Markdown Styles */
  .markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #24292e;
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .markdown-body :global(h1) {
    padding-bottom: 0.3em;
    font-size: 2em;
    border-bottom: 1px solid #eaecef;
  }

  .markdown-body :global(h2) {
    padding-bottom: 0.3em;
    font-size: 1.5em;
    border-bottom: 1px solid #eaecef;
  }

  .markdown-body :global(h3) {
    font-size: 1.25em;
  }

  .markdown-body :global(pre) {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 6px;
  }

  .markdown-body :global(code) {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  }

  .markdown-body :global(pre code) {
    padding: 0;
    margin: 0;
    font-size: 100%;
    word-break: normal;
    white-space: pre;
    background: transparent;
    border: 0;
  }

  .markdown-body :global(blockquote) {
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
    margin: 0;
  }

  .markdown-body :global(table) {
    border-spacing: 0;
    border-collapse: collapse;
    margin-bottom: 16px;
    width: 100%;
  }

  .markdown-body :global(table th),
  .markdown-body :global(table td) {
    padding: 6px 13px;
    border: 1px solid #dfe2e5;
  }

  .markdown-body :global(table tr:nth-child(2n)) {
    background-color: #f6f8fa;
  }

  .markdown-body :global(img) {
    max-width: 100%;
    box-sizing: content-box;
  }

  .markdown-body :global(p) {
    margin-top: 0;
    margin-bottom: 16px;
  }

  .markdown-body :global(ul),
  .markdown-body :global(ol) {
    padding-left: 2em;
    margin-top: 0;
    margin-bottom: 16px;
  }

  .markdown-body :global(li) {
    margin: 0.25em 0;
  }

  .markdown-body :global(hr) {
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: #e1e4e8;
    border: 0;
  }

  @media (max-width: 768px) {
    .container, .playground {
      padding: 1rem;
    }

    header {
      padding: 1rem;
    }

    header h1 {
      font-size: 2rem;
    }

    .controls, .response {
      padding: 1rem;
    }
  }

  .example-section {
    margin: 1.5rem 0;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  .example-item {
    margin-bottom: 1rem;
  }

  .example-item:last-child {
    margin-bottom: 0;
  }

  .code-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    overflow-x: auto;
  }

  .code-display code {
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    font-size: 0.9rem;
    color: #1a202c;
  }

  .copy-button {
    padding: 0.25rem 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .copy-button:hover {
    opacity: 1;
  }

  @media (max-width: 768px) {
    .code-display {
      flex-direction: column;
      align-items: stretch;
    }

    .copy-button {
      align-self: flex-end;
    }
  }
</style>
