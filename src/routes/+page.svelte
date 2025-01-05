<script lang="ts">
  import { marked } from 'marked';
  import { markedHighlight } from 'marked-highlight';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/github.css';
  import 'highlight.js/styles/github-dark.css';
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
  let isDarkMode = false;

  onMount(async () => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    isDarkMode = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Apply initial theme to code blocks
    document.documentElement.classList.toggle('dark-theme', isDarkMode);
    
    const response = await fetch('/README.md');
    readme = await response.text();
    updateParsedContent();
  });

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-theme', isDarkMode);
  }

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

<svelte:head>
  <title>enVoi Naming Service API</title>
  <style>
    /* Light theme (default) code highlighting */
    pre code.hljs {
      background: var(--code-bg);
      color: var(--text-primary);
    }
    
    /* Dark theme code highlighting */
    :root.dark-theme pre code.hljs {
      background: var(--code-bg);
      color: var(--text-primary);
    }

    /* Hide the default GitHub theme in dark mode */
    :root.dark-theme .hljs-comment,
    :root.dark-theme .hljs-quote {
      color: #8b949e;
    }

    :root.dark-theme .hljs-keyword,
    :root.dark-theme .hljs-selector-tag,
    :root.dark-theme .hljs-type {
      color: #ff7b72;
    }

    :root.dark-theme .hljs-string,
    :root.dark-theme .hljs-doctag {
      color: #a5d6ff;
    }

    :root.dark-theme .hljs-title,
    :root.dark-theme .hljs-section {
      color: #d2a8ff;
    }

    :root.dark-theme .hljs-number,
    :root.dark-theme .hljs-literal,
    :root.dark-theme .hljs-boolean {
      color: #79c0ff;
    }

    :root.dark-theme .hljs-property {
      color: #79c0ff;
    }
  </style>
</svelte:head>

<div class="app" class:dark={isDarkMode}>
  <header>
    <div class="header-content">
      <h1>enVoi Naming Service API</h1>
      <div class="header-right">
        <button 
          class="theme-toggle" 
          on:click={toggleTheme}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
          {isDarkMode ? '☀️' : '🌙'}
        </button>
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
      </div>
    </div>
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
  /* Base theme variables */
  .app {
    --bg-primary: #f8f9fa;
    --bg-secondary: #ffffff;
    --text-primary: #1a1a1a;
    --text-secondary: #4a5568;
    --border-color: #e2e8f0;
    --code-bg: #f6f8fa;
    --highlight-color: #4299e1;
    --shadow-color: rgba(0, 0, 0, 0.1);
    --button-bg: #4299e1;
    --button-hover: #3182ce;
    --button-disabled: #a0aec0;
  }

  /* Dark theme variables */
  .app.dark {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #a0aec0;
    --border-color: #404040;
    --code-bg: #161b22;
    --highlight-color: #63b3ed;
    --shadow-color: rgba(0, 0, 0, 0.3);
    --button-bg: #63b3ed;
    --button-hover: #4299e1;
    --button-disabled: #4a5568;
  }

  .app {
    min-height: 100vh;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .theme-toggle {
    padding: 0.5rem;
    font-size: 1.25rem;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .theme-toggle:hover {
    opacity: 1;
  }

  header {
    background-color: var(--bg-secondary);
    padding: 2rem;
    box-shadow: 0 1px 3px var(--shadow-color);
    margin-bottom: 2rem;
  }

  header h1 {
    margin: 0;
    color: var(--text-primary);
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
    color: var(--text-secondary);
    font-size: 1rem;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  nav button:hover {
    background-color: var(--code-bg);
  }

  nav button.active {
    color: var(--text-primary);
    background-color: var(--code-bg);
    font-weight: 500;
  }

  .container, .playground {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .markdown-body {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
  }

  /* API Playground Styles */
  .controls {
    background-color: var(--bg-secondary);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
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
    color: var(--text-secondary);
    font-weight: 500;
  }

  select, input {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 1rem;
    margin-bottom: 0.5rem;
    transition: all 0.2s;
  }

  select:focus, input:focus {
    outline: none;
    border-color: var(--highlight-color);
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .test-button {
    width: 100%;
    background-color: var(--button-bg);
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .test-button:hover:not(:disabled) {
    background-color: var(--button-hover);
  }

  .test-button:disabled {
    background-color: var(--button-disabled);
    cursor: not-allowed;
  }

  .example-section {
    margin: 1.5rem 0;
    padding: 1.5rem;
    background-color: var(--bg-primary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
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
    padding: 1rem;
    background-color: var(--code-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow-x: auto;
  }

  .code-display code {
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    font-size: 0.9rem;
    color: var(--text-primary);
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

  .response {
    background-color: var(--bg-secondary);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
  }

  .response h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--text-secondary);
  }

  .response pre {
    margin: 0;
    padding: 1rem;
    background-color: var(--code-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    overflow-x: auto;
  }

  .response pre code {
    background-color: transparent !important;
    color: var(--text-primary) !important;
  }

  /* Markdown Styles */
  .markdown-body :global(pre) {
    background-color: var(--code-bg) !important;
    border: 1px solid var(--border-color);
    margin: 1rem 0;
  }

  .markdown-body :global(code) {
    background-color: var(--code-bg) !important;
    color: var(--text-primary) !important;
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }

  .markdown-body :global(pre code) {
    background-color: transparent !important;
    padding: 0;
  }

  .markdown-body :global(h1),
  .markdown-body :global(h2) {
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--border-color);
  }

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  .markdown-body :global(th),
  .markdown-body :global(td) {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
  }

  .markdown-body :global(tr:nth-child(2n)) {
    background-color: var(--bg-primary);
  }

  /* Responsive Styles */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .header-right {
      flex-direction: column;
      align-items: stretch;
    }

    nav {
      display: flex;
      gap: 0.5rem;
    }

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

    .code-display {
      flex-direction: column;
      align-items: stretch;
    }

    .copy-button {
      align-self: flex-end;
    }
  }
</style>
