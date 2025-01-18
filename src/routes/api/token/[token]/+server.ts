import { json } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { transformAvatarUrl } from '$lib/utils';

interface Metadata {
  avatar?: string | null;
  [key: string]: any;
}

interface TokenResult {
  token_id: string;
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
  const { tokens, avatar = 'thumb' } = await request.json();

  if (!Array.isArray(tokens)) {
    return json({ error: 'Tokens must be an array' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (tokens.length > 50) {
    return json({ error: 'Maximum 50 tokens per request' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate all tokens are non-empty strings
  if (!tokens.every(token => typeof token === 'string' && token.length > 0)) {
    return json({ error: 'Invalid token format - must be non-empty strings' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (!['thumb', 'full'].includes(avatar)) {
    return json({ error: 'Avatar must be one of: thumb, full' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const { data, error } = await supabase
      .rpc('envoi_resolve_token', {
        p_token_ids: tokens.join(',')
      });

    if (error) throw error;

    const results = (data || []).map((result: TokenResult) => ({
      ...result,
      metadata: result.metadata ? {
        ...result.metadata,
        avatar: transformAvatarUrl(result.metadata?.avatar, 128, avatar === 'full')
      } : result.metadata
    }));

    return json(
      { results },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error resolving tokens:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
};

// Handle single or comma-separated token lookup
export const GET: RequestHandler = async ({ params, url }) => {
  const tokens = params.token;
  const avatar = url.searchParams.get('avatar') || 'thumb';

  if (!tokens) {
    return json({ error: 'Tokens parameter is required' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Handle comma-separated tokens
  const tokenList = tokens.split(',');

  if (tokenList.length > 50) {
    return json({ error: 'Maximum 50 tokens per request' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate all tokens are non-empty strings
  if (!tokenList.every(token => token.length > 0)) {
    return json({ error: 'Invalid token format - must be non-empty strings' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (!['thumb', 'full'].includes(avatar)) {
    return json({ error: 'Avatar must be one of: thumb, full' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const { data, error } = await supabase
      .rpc('envoi_resolve_token', {
        p_token_ids: tokens
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      return json(
        { results: tokenList.map(token => ({ token, name: null, cached: false })) },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    const results = data.map((result: TokenResult) => ({
      ...result,
      cached: false,
      metadata: result.metadata ? {
        ...result.metadata,
        avatar: transformAvatarUrl(result.metadata?.avatar, 128, avatar === 'full')
      } : result.metadata
    }));

    return json(
      { results },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error resolving tokens:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}; 