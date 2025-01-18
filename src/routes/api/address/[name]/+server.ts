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

interface AddressResult {
  name: string;
  address: string | null;
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
  const { names, avatar = 'thumb' } = await request.json();

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

  if (!['thumb', 'small', 'full'].includes(avatar)) {
    return json({ error: 'Avatar must be one of: thumb, small, full' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const { data, error } = await supabase
      .rpc('envoi_resolve_name', {
        p_names: names.join(',')
      });

    if (error) throw error;

    const results = (data || []).map((result: AddressResult) => ({
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
    console.error('Error resolving names:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
};

// Handle single or comma-separated name lookup
export const GET: RequestHandler = async ({ params, url }) => {
  const { name } = params;
  const avatar = url.searchParams.get('avatar') || 'thumb';

  if (!name) {
    return json({ error: 'Name parameter is required' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Handle comma-separated names
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

  if (!['thumb', 'small', 'full'].includes(avatar)) {
    return json({ error: 'Avatar must be one of: thumb, small, full' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const { data, error } = await supabase
      .rpc('envoi_resolve_name', {
        p_names: name
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      return json(
        { results: names.map((n: string) => ({ name: n, address: null, cached: false })) },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    const results = data.map((result: AddressResult) => ({
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
    console.error('Error resolving name:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}; 