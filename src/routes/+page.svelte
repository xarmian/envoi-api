<script lang="ts">
  import { onMount } from 'svelte';
  import EndpointDetail from '$lib/components/EndpointDetail.svelte';
  import ApiPlayground from '$lib/components/ApiPlayground.svelte';

  let isDarkMode = false;
  let activeTab = 'docs';
  let selectedEndpoint: string | null = null;

  function goToPlayground(endpoint: string) {
    activeTab = 'playground';
    selectedEndpoint = endpoint;
  }

  const endpoints = [
    {
      title: 'Name Resolution',
      path: '/api/name/[address]',
      method: 'GET',
      description: 'Get the VOI name for a given address.',
      endpoint: 'name',
      parameters: [
        {
          name: 'address',
          type: 'string',
          description: 'The Voi address to resolve',
          required: true
        },
        {
          name: 'avatar',
          type: 'string',
          description: 'Avatar URL format (thumb or full)',
          default: 'thumb'
        }
      ],
      example: {
        request: 'GET /api/name/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        response: `{
  "results": [{
    "address": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "name": "example.voi",
    "metadata": {
      "url": "https://example.com",
      "avatar": "https://example.com/avatar.webp",
      "com.twitter": "example",
      "com.github": "example"
    },
    "cached": false
  }]
}`
      }
    },
    {
      title: 'Address Resolution',
      path: '/api/address/[name]',
      method: 'GET',
      description: 'Get the address for a given VOI name.',
      parameters: [
        {
          name: 'name',
          type: 'string',
          description: 'The VOI name to resolve (must end in .voi)',
          required: true
        },
        {
          name: 'avatar',
          type: 'string',
          description: 'Avatar URL format (thumb or full)',
          default: 'thumb'
        }
      ],
      example: {
        request: 'GET /api/address/example.voi',
        response: `{
  "results": [{
    "address": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "name": "example.voi",
    "metadata": {
      "url": "https://example.com",
      "avatar": "https://example.com/avatar.webp",
      "com.twitter": "example",
      "com.github": "example"
    },
    "cached": false
  }]
}`
      }
    },
    {
      title: 'Name Search',
      path: '/api/search',
      method: 'GET',
      description: 'Search for VOI names using a pattern.',
      parameters: [
        {
          name: 'pattern',
          type: 'string',
          description: 'The search pattern to match against names',
          required: true
        },
        {
          name: 'type',
          type: 'string',
          description: 'Search type (contains, starts, or ends)',
          default: 'contains'
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results',
          default: '100'
        },
        {
          name: 'avatar',
          type: 'string',
          description: 'Avatar URL format (thumb or full)',
          default: 'thumb'
        }
      ],
      example: {
        request: 'GET /api/search?pattern=test&type=starts&limit=50',
        response: `{
  "results": [{
    "address": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "name": "test.voi",
    "metadata": {
      "url": "https://example.com",
      "avatar": "https://example.com/avatar.webp",
      "com.twitter": "example",
      "com.github": "example"
    },
    "cached": false
  }]
}`
      }
    }
  ];

  onMount(() => {
    const savedTheme = localStorage.getItem('theme');
    isDarkMode = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark-theme', isDarkMode);
  });

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-theme', isDarkMode);
  }
</script>

<svelte:head>
  <title>enVoi Naming Service API</title>
  <meta name="description" content="A resolver service for VOI (.voi) names and addresses." />
</svelte:head>

<div class="app">
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
            Try It
          </button>
        </nav>
      </div>
    </div>
  </header>

  <main class="container">
    {#if activeTab === 'docs'}
      <div class="docs">
        <section>
          <h2>Quick Start</h2>
          <p>The enVoi API allows you to resolve VOI names and addresses, and search the VOI naming system.</p>
          
          <div class="changes">
            <div class="version">
              <h3>Recent Changes</h3>
              <ul>
                <li>2025-01-07: Added support for avatar image size control through the <code>avatar</code> parameter. Supported URLs will be transformed to a 128x128px thumbnail by default. You can specify <code>avatar=full</code> for full-size avatar images. See <b>Try It</b> tab for example.</li>
              </ul>
            </div>
          </div>

          <div class="endpoints">
            {#each endpoints as endpoint}
              <EndpointDetail 
                {endpoint} 
                on:try={(e) => goToPlayground(e.detail)} />
            {/each}
          </div>
        </section>
      </div>
    {:else}
      <ApiPlayground {selectedEndpoint} />
    {/if}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
  }
  :global(:root) {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --border-color: #e5e5e5;
    --code-bg: #f1f3f5;
    --accent-color: #4CAF50;
  }

  :global(.dark-theme) {
    --bg-primary: #1a1a1a;
    --bg-secondary: #242424;
    --text-primary: #ffffff;
    --text-secondary: #a0aec0;
    --border-color: #404040;
    --code-bg: #2d2d2d;
  }

  .app {
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  header {
    background: var(--bg-secondary);
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .header-content {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .theme-toggle {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
  }

  nav button {
    padding: 0.5rem 1rem;
    border: none;
    background: none;
    color: var(--text-secondary);
    font-size: 0.9rem;
    cursor: pointer;
    border-radius: 4px;
  }

  nav button:hover {
    background: var(--bg-hover);
  }

  nav button.active {
    color: var(--text-primary);
    background: var(--bg-hover);
    font-weight: 500;
  }

  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }

  .endpoints {
    display: grid;
    gap: 2rem;
    margin: 2rem 0;
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .container {
      padding: 1rem;
    }
  }

  .changes {
    margin: 2rem 0;
  }

  .version {
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .version h3 {
    margin: 0 0 0.5rem 0;
    color: var(--accent-color);
  }

  .version ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .version li {
    margin: 0.5rem 0;
    line-height: 1.5;
  }

  .version code {
    background: var(--code-bg);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.9em;
  }
</style>
