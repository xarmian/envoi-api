import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Handle OPTIONS request for CORS preflight
export const OPTIONS = async () => {
  return new Response(null, {
    headers: corsHeaders
  });
};

// POST handler for name search
export const POST = async ({ request }: RequestEvent) => {
  const { pattern, type = 'contains', limit = 100 } = await request.json();

  if (!pattern) {
    return json({ error: 'Search pattern is required' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (!['contains', 'starts', 'ends'].includes(type)) {
    return json({ error: 'Search type must be one of: contains, starts, ends' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (typeof limit !== 'number' || limit < 1 || limit > 1000) {
    return json({ error: 'Limit must be a number between 1 and 1000' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const { data, error } = await supabase
      .rpc('envoi_search_names', {
        p_search_pattern: pattern,
        p_search_type: type,
        p_limit: limit
      });

    if (error) throw error;

    // Filter out results with the specified address
    const filteredData = data?.filter(item => 
      item.address !== 'BRB3JP4LIW5Q755FJCGVAOA4W3THJ7BR3K6F26EVCGMETLEAZOQRHHJNLQ'
    ) || [];

    return json(
      { results: filteredData },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error searching names:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
};

// GET handler for name search
export const GET = async ({ url }: RequestEvent) => {
  const pattern = url.searchParams.get('pattern');
  const type = url.searchParams.get('type') || 'contains';
  const limit = parseInt(url.searchParams.get('limit') || '100');

  if (!pattern) {
    return json({ error: 'Search pattern is required' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (!['contains', 'starts', 'ends'].includes(type)) {
    return json({ error: 'Search type must be one of: contains, starts, ends' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  if (isNaN(limit) || limit < 1 || limit > 1000) {
    return json({ error: 'Limit must be a number between 1 and 1000' }, { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const { data, error } = await supabase
      .rpc('envoi_search_names', {
        p_search_pattern: pattern,
        p_search_type: type,
        p_limit: limit
      });

    if (error) throw error;

    // Filter out results with the specified address
    const filteredData = data?.filter(item => 
      item.address !== 'BRB3JP4LIW5Q755FJCGVAOA4W3THJ7BR3K6F26EVCGMETLEAZOQRHHJNLQ'
    ) || [];

    return json(
      { results: filteredData },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error searching names:', error);
    return json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}; 