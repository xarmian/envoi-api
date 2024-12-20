import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import envoi from '$lib/envoi';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY);
const CACHE_DURATION = 3600; // 1 hour in seconds

// Add POST handler for batch queries
export const POST: RequestHandler = async ({ request }) => {
  const { addresses, ignoreCache = false } = await request.json();

  if (!Array.isArray(addresses)) {
    return json({ error: 'Addresses must be an array' }, { status: 400 });
  }

  if (addresses.length > 50) {
    return json({ error: 'Maximum 50 addresses per request' }, { status: 400 });
  }

  // Validate all addresses
  if (!addresses.every(addr => /^[A-Z2-7]{58}$/.test(addr))) {
    return json({ error: 'Invalid Algorand address format' }, { status: 400 });
  }

  return await processAddresses(addresses, ignoreCache);
};

// Update GET handler to support comma-separated addresses
export const GET: RequestHandler = async ({ params, url }) => {
  const { address } = params;
  const ignoreCache = url.searchParams.get('ignoreCache') === 'true';

  // Check if it's a batch request
  if (address.includes(',')) {
    const addresses = address.split(',');

    if (addresses.length > 50) {
      return json({ error: 'Maximum 50 addresses per request' }, { status: 400 });
    }

    // Validate all addresses
    if (!addresses.every(addr => /^[A-Z2-7]{58}$/.test(addr))) {
      return json({ error: 'Invalid Algorand address format' }, { status: 400 });
    }

    return await processAddresses(addresses, ignoreCache);
  }

  // Single address request
  if (!address) {
    return json({ error: 'Address parameter is required' }, { status: 400 });
  }

  // Validate Algorand address format
  if (!/^[A-Z2-7]{58}$/.test(address)) {
    return json({ error: 'Invalid Algorand address format' }, { status: 400 });
  }

  try {
    // Skip cache check if ignoreCache is true
    if (!ignoreCache) {
      const { data: cacheData, error: cacheError } = await supabase
        .from('address_cache')
        .select('name, updated_at')
        .eq('address', address)
        .single();

      if (cacheData && !cacheError) {
        const cacheAge = Math.floor((Date.now() - new Date(cacheData.updated_at).getTime()) / 1000);
        if (cacheAge < CACHE_DURATION) {
          return json(
            { 
              results: [
                { address, name: cacheData.name, cached: true }
              ]
            },
            {
              status: 200,
              headers: {
                'Cache-Control': `public, max-age=${CACHE_DURATION - cacheAge}`,
                'X-Cache': 'HIT'
              }
            }
          );
        }
      }
    }

    // If not in cache or expired, resolve using envoi
    const resolver = envoi.init();
    const name = await resolver.getNameFromAddress(address);

    if (!name) {
      return json({ error: 'Address not found' }, { status: 404 });
    }

    // Update or insert cache
    const { error: upsertError } = await supabase
      .from('address_cache')
      .upsert(
        { 
          name: name.toLowerCase(),
          address,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'address' }
      );

    if (upsertError) {
      console.error('Error updating cache:', upsertError);
    }

    return json(
      { 
        results: [
          { address, name, cached: false }
        ]
      },
      {
        status: 200,
        headers: {
          'Cache-Control': `public, max-age=${CACHE_DURATION}`,
          'X-Cache': 'MISS'
        }
      }
    );

  } catch (error) {
    console.error('Error resolving address:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// Helper function to process multiple addresses
async function processAddresses(addresses: string[], ignoreCache: boolean) {
  try {
    const results = [];
    const resolver = envoi.init();

    for (const address of addresses) {
      let result = { address, name: null as string | null, cached: false };

      // Check cache if not ignoring
      if (!ignoreCache) {
        const { data: cacheData, error: cacheError } = await supabase
          .from('address_cache')
          .select('name, updated_at')
          .eq('address', address)
          .single();

        if (cacheData && !cacheError) {
          const cacheAge = Math.floor((Date.now() - new Date(cacheData.updated_at).getTime()) / 1000);
          if (cacheAge < CACHE_DURATION) {
            results.push({ address, name: cacheData.name, cached: true });
            continue;
          }
        }
      }

      // Resolve using envoi
      const name = await resolver.getNameFromAddress(address);
      if (name) {
        result.name = name;
        
        // Update cache regardless of ignoreCache setting
        await supabase
          .from('address_cache')
          .upsert(
            { 
              name: name.toLowerCase(),
              address,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'address' }
          );
      }

      results.push(result);
    }

    return json(
      { results },
      {
        headers: {
          'Cache-Control': ignoreCache ? 'no-store' : `public, max-age=${CACHE_DURATION}`,
          'X-Cache': ignoreCache ? 'BYPASS' : 'MIXED'
        }
      }
    );

  } catch (error) {
    console.error('Error resolving addresses:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
} 