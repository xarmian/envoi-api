import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { transformAvatarUrl } from '$lib/utils';

interface Metadata {
  avatar?: string | null;
  [key: string]: any;
}

interface NameResult {
  address: string;
  name: string | null;
  metadata?: Metadata;
  cached: boolean;
}

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

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
  const { addresses, avatar = 'thumb' } = await request.json();

  if (!Array.isArray(addresses)) {
    return json({ error: 'Addresses must be an array' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (addresses.length > 50) {
    return json({ error: 'Maximum 50 addresses per request' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate all addresses
  if (!addresses.every(addr => addr && addr.length <= 100)) {
    return json({ error: 'Invalid identifier format - must be non-empty and <= 100 characters' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (!['thumb', 'small', 'full'].includes(avatar)) {
    return json({ error: 'Avatar must be one of: thumb, small, full' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const { data, error } = await supabase
      .rpc('envoi_resolve_address', {
        p_addresses: addresses.join(',')
      });

    if (error) throw error;

    const results = (data || []).map((result: NameResult) => ({
      ...result,
      metadata: result.metadata ? {
        ...result.metadata,
        avatar: transformAvatarUrl(result.metadata?.avatar, (avatar === 'small' ? 384 : 128), avatar === 'full')
      } : result.metadata
    }));

    return json(
      { results },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error resolving addresses:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
};

// Handle single or comma-separated address lookup
export const GET: RequestHandler = async ({ params, url }) => {
  const { address } = params;
  const avatar = url.searchParams.get('avatar') || 'thumb';

  if (!address) {
    return json({ error: 'Address parameter is required' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Handle comma-separated addresses
  const addresses = address.split(',');

  if (addresses.length > 50) {
    return json({ error: 'Maximum 50 addresses per request' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate all addresses
  if (!addresses.every(addr => addr && addr.length <= 100)) {
    return json({ error: 'Invalid identifier format - must be non-empty and <= 100 characters' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (!['thumb', 'small', 'full'].includes(avatar)) {
    return json({ error: 'Avatar must be one of: thumb, small, full' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const { data, error } = await supabase
      .rpc('envoi_resolve_address', {
        p_addresses: address
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      return json(
        { results: addresses.map(addr => ({ address: addr, name: null, cached: false })) },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    const results = data.map((result: NameResult) => ({
      ...result,
      cached: false,
      metadata: result.metadata ? {
        ...result.metadata,
        avatar: transformAvatarUrl(result.metadata?.avatar, (avatar === 'small' ? 384 : 128), avatar === 'full')
      } : result.metadata
    }));

    return json(
      { results },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error resolving address:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}; 