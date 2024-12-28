import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import envoi from '$lib/envoi';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY);
const CACHE_DURATION = 7200; // 2 hours in seconds

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Handle OPTIONS request for CORS preflight
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    headers: corsHeaders
  });
};

// Add POST handler for batch queries
export const POST: RequestHandler = async ({ request }) => {
  const { names, ignoreCache = false } = await request.json();

  if (!Array.isArray(names)) {
    return json({ error: 'Names must be an array' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (names.length > 50) {
    return json({ error: 'Maximum 50 names per request' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate all names
  if (!names.every(name => name.endsWith('.voi'))) {
    return json({ error: 'Invalid name format. Names must end with .voi' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  return await processNames(names, ignoreCache);
};

// Update GET handler to support comma-separated names
export const GET: RequestHandler = async ({ params, url }) => {
  const { name } = params;
  const ignoreCache = url.searchParams.get('ignoreCache') === 'true';

  // Check if it's a batch request
  if (name.includes(',')) {
    const names = name.split(',');

    if (names.length > 50) {
      return json({ error: 'Maximum 50 names per request' }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate all names
    if (!names.every(n => n.endsWith('.voi'))) {
      return json({ error: 'Invalid name format. Names must end with .voi' }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    return await processNames(names, ignoreCache);
  }

  // Single name request
  if (!name) {
    return json({ error: 'Name parameter is required' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate name format
  if (!name.endsWith('.voi')) {
    return json({ error: 'Invalid name format. Name must end with .voi' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const normalizedName = name.toLowerCase();

    // Skip cache check if ignoreCache is true
    if (!ignoreCache) {
      const { data: cacheData, error: cacheError } = await supabase
        .from('name_cache')
        .select('address, updated_at')
        .eq('name', normalizedName)
        .single();

      if (cacheData && !cacheError) {
        const cacheAge = Math.floor((Date.now() - new Date(cacheData.updated_at).getTime()) / 1000);
        if (cacheAge < CACHE_DURATION) {
          return json(
            { 
              results: [
                { name, address: cacheData.address, cached: true }
              ]
            },
            {
              status: cacheData.address === null ? 404 : 200,
              headers: {
                ...corsHeaders,
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
    const address = await resolver.getAddressFromName(normalizedName);

    // Update or insert name cache regardless of whether address was found
    const { error: upsertError } = await supabase
      .from('name_cache')
      .upsert(
        { 
          name: normalizedName,
          address: address || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'name' }
      );

    if (upsertError) {
      console.error('Error updating cache:', upsertError);
    }

    // Also update the address cache if an address was found
    if (address) {
      const { error: addressUpsertError } = await supabase
        .from('address_cache')
        .upsert(
          { 
            name: normalizedName,
            address,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'address' }
        );

      if (addressUpsertError) {
        console.error('Error updating address cache:', addressUpsertError);
      }
    }

    if (!address) {
      return json(
        { 
          results: [
            { name, address: null, cached: false }
          ]
        },
        { 
          status: 404,
          headers: {
            ...corsHeaders,
            'Cache-Control': `public, max-age=${CACHE_DURATION}`,
            'X-Cache': 'MISS'
          }
        }
      );
    }

    return json(
      { 
        results: [
          { name, address, cached: false }
        ]
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': `public, max-age=${CACHE_DURATION}`,
          'X-Cache': 'MISS'
        }
      }
    );

  } catch (error) {
    console.error('Error resolving name:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
};

// Helper function to process multiple names
async function processNames(names: string[], ignoreCache: boolean) {
  try {
    const results = [];
    const resolver = envoi.init();

    for (const name of names) {
      let result = { name, address: null as string | null, cached: false };
      const normalizedName = name.toLowerCase();

      // Check cache if not ignoring
      if (!ignoreCache) {
        const { data: cacheData, error: cacheError } = await supabase
          .from('name_cache')
          .select('address, updated_at')
          .eq('name', normalizedName)
          .single();

        if (cacheData && !cacheError) {
          const cacheAge = Math.floor((Date.now() - new Date(cacheData.updated_at).getTime()) / 1000);
          if (cacheAge < CACHE_DURATION) {
            results.push({ name, address: cacheData.address, cached: true });
            continue;
          }
        }
      }

      // Resolve using envoi
      const address = await resolver.getAddressFromName(normalizedName);
      
      // Update name cache regardless of whether address was found
      await supabase
        .from('name_cache')
        .upsert(
          { 
            name: normalizedName,
            address: address || null,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'name' }
        );

      // Also update address cache if an address was found
      if (address) {
        await supabase
          .from('address_cache')
          .upsert(
            { 
              name: normalizedName,
              address,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'address' }
          );
      }

      result.address = address;
      results.push(result);
    }

    return json(
      { results },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': ignoreCache ? 'no-store' : `public, max-age=${CACHE_DURATION}`,
          'X-Cache': ignoreCache ? 'BYPASS' : 'MIXED'
        }
      }
    );

  } catch (error) {
    console.error('Error resolving names:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
} 