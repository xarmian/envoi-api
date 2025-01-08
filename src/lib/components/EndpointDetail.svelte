<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let endpoint: {
    title: string;
    path: string;
    description: string;
    method: string;
    endpoint: string;
    parameters?: Array<{
      name: string;
      type: string;
      description: string;
      required?: boolean;
      default?: string;
    }>;
    example?: {
      request: string;
      response: string;
    };
  };

  let showDetails = false;
</script>

<div class="endpoint-card">
  <button 
    class="endpoint-header" 
    on:click={() => showDetails = !showDetails}
    aria-expanded={showDetails}>
    <div class="header-content">
      <h3>{endpoint.title}</h3>
      <code>{endpoint.method} {endpoint.path}</code>
      <p>{endpoint.description}</p>
    </div>
    <span class="details-toggle">
      {showDetails ? '▼' : '▶'}
    </span>
  </button>

  {#if showDetails}
    <div class="endpoint-details">
      {#if endpoint.parameters && endpoint.parameters.length > 0}
        <div class="parameters">
          <h4>Parameters</h4>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Required</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {#each endpoint.parameters as param}
                <tr>
                  <td><code>{param.name}</code></td>
                  <td>{param.type}</td>
                  <td>{param.description}</td>
                  <td>{param.required ? '✓' : ''}</td>
                  <td>{param.default || ''}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      {#if endpoint.example}
        {#if endpoint.example.request && endpoint.example.response}
          <div class="examples">
            <h4>Example</h4>
            <div class="example-section">
              <h5>Request</h5>
              <div class="code-block">
                <pre><code>{endpoint.example.request}</code></pre>
                <button 
                  class="copy-button" 
                  on:click={() => navigator.clipboard.writeText(endpoint.example?.request || '')}
                  title="Copy to clipboard"
                  aria-label="Copy request example">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
              </div>
            </div>
            <div class="example-section">
              <h5>Response</h5>
              <div class="code-block">
                <pre><code>{endpoint.example.response}</code></pre>
                <button 
                  class="copy-button" 
                  on:click={() => navigator.clipboard.writeText(endpoint.example?.response || '')}
                  title="Copy to clipboard"
                  aria-label="Copy response example">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
  
  <div class="endpoint-footer">
    <button 
      class="try-button"
      on:click={() => dispatch('try', endpoint.endpoint)}
      title="Try this endpoint">
      Try it
    </button>
  </div>
</div>

<style>
  .endpoint-card {
    background: var(--bg-secondary);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    position: relative;
  }

  .endpoint-header {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    color: var(--text-primary);
  }

  .endpoint-header h3 {
    margin: 0 0 1rem 0;
  }

  .endpoint-header code {
    display: block;
    background: var(--code-bg);
    padding: 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
  }

  .details-toggle {
    padding: 0.5rem;
    color: var(--text-secondary);
  }

  .endpoint-details {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  .parameters {
    margin-bottom: 2rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  th {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .examples {
    display: grid;
    gap: 1.5rem;
  }

  .example-section pre {
    margin: 0;
    background: var(--code-bg);
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    line-height: 1.5;
  }

  .example-section code {
    display: block;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--text-primary);
  }

  h4 {
    margin: 0 0 1rem 0;
    color: var(--text-secondary);
  }

  h5 {
    margin: 0 0 0.5rem 0;
    color: var(--text-secondary);
  }

  .code-block {
    position: relative;
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

  .header-content {
    flex: 1;
  }

  .endpoint-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  .try-button {
    padding: 0.5rem 1rem;
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: opacity 0.2s;
  }

  .try-button:hover {
    opacity: 0.9;
  }
</style> 