/**
 * Scripts Marketplace API Routes
 * 
 * CRUD operations, marketplace search, reviews, and purchases
 * for the SyncScript scripts marketplace.
 */

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";

const scriptsRoutes = new Hono();

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

function getUserSupabase(authHeader: string | undefined) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: authHeader || '' } } }
  );
}

// ============================================================
// GET /scripts/marketplace - Browse & search marketplace scripts
// ============================================================
scriptsRoutes.get('/marketplace', async (c) => {
  try {
    const supabase = getSupabase();
    const category = c.req.query('category');
    const search = c.req.query('search');
    const pricing = c.req.query('pricing');
    const complexity = c.req.query('complexity');
    const sort = c.req.query('sort') || 'popular';
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const offset = (page - 1) * limit;
    const hasPhone = c.req.query('has_phone') === 'true';

    let query = supabase
      .from('scripts')
      .select('*', { count: 'exact' })
      .eq('visibility', 'public')
      .not('published_at', 'is', null);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (pricing) {
      query = query.eq('pricing', pricing);
    }
    if (complexity) {
      query = query.eq('complexity', complexity);
    }
    if (search) {
      // Sanitize search input to prevent injection via special PostgREST characters
      const sanitized = search.replace(/[%_\\(),]/g, '');
      if (sanitized.length > 0) {
        query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }
    if (hasPhone) {
      query = query.not('phone_actions', 'eq', '[]');
    }

    switch (sort) {
      case 'popular':
        query = query.order('uses_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating_avg', { ascending: false });
        break;
      case 'newest':
        query = query.order('published_at', { ascending: false });
        break;
      case 'price_low':
        query = query.order('price_cents', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price_cents', { ascending: false });
        break;
      default:
        query = query.order('uses_count', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: scripts, error, count } = await query;
    if (error) throw error;

    return c.json({
      scripts: scripts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('[Scripts API] Marketplace error:', error);
    return c.json({ error: 'Failed to fetch marketplace scripts', details: String(error) }, 500);
  }
});

// ============================================================
// GET /scripts/categories - Get categories with counts
// ============================================================
scriptsRoutes.get('/categories', async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('scripts')
      .select('category')
      .eq('visibility', 'public')
      .not('published_at', 'is', null);

    if (error) throw error;

    const counts: Record<string, number> = {};
    (data || []).forEach((s: { category: string }) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });

    return c.json({ categories: counts, total: data?.length || 0 });
  } catch (error) {
    console.error('[Scripts API] Categories error:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// ============================================================
// IMPORTANT: /my/* routes MUST come before /:id to avoid
// Hono matching "my" as an :id parameter.
// ============================================================

// GET /scripts/my/scripts - Get current user's scripts
scriptsRoutes.get('/my/scripts', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userSupabase = getUserSupabase(authHeader);
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401);

    const supabase = getSupabase();
    const { data: scripts, error } = await supabase
      .from('scripts').select('*').eq('creator_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return c.json({ scripts: scripts || [] });
  } catch (error) {
    console.error('[Scripts API] My scripts error:', error);
    return c.json({ error: 'Failed to fetch your scripts' }, 500);
  }
});

// GET /scripts/my/purchases - Get current user's purchased scripts
scriptsRoutes.get('/my/purchases', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userSupabase = getUserSupabase(authHeader);
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401);

    const supabase = getSupabase();
    const { data: purchases, error } = await supabase
      .from('script_purchases').select('*, scripts(*)').eq('buyer_id', user.id)
      .eq('status', 'completed').order('created_at', { ascending: false });
    if (error) throw error;
    return c.json({ purchases: purchases || [] });
  } catch (error) {
    console.error('[Scripts API] My purchases error:', error);
    return c.json({ error: 'Failed to fetch your purchases' }, 500);
  }
});

// GET /scripts/my/sales - Get creator's sales stats
scriptsRoutes.get('/my/sales', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userSupabase = getUserSupabase(authHeader);
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401);

    const supabase = getSupabase();
    const { data: profile } = await supabase.from('creator_profiles').select('*').eq('user_id', user.id).single();
    const { data: sales } = await supabase.from('script_purchases')
      .select('price_cents, creator_payout_cents, platform_fee_cents, created_at, scripts(name)')
      .eq('creator_id', user.id).eq('status', 'completed').order('created_at', { ascending: false });
    const { data: scripts } = await supabase.from('scripts')
      .select('id, name, uses_count, rating_avg, review_count, price_cents, pricing')
      .eq('creator_id', user.id);

    const totalRevenue = (sales || []).reduce((sum: number, s: { creator_payout_cents: number }) => sum + s.creator_payout_cents, 0);
    return c.json({
      profile: profile || null,
      stats: {
        totalRevenue,
        totalSales: sales?.length || 0,
        totalScripts: scripts?.length || 0,
        totalUses: (scripts || []).reduce((sum: number, s: { uses_count: number }) => sum + s.uses_count, 0),
        avgRating: (scripts || []).reduce((sum: number, s: { rating_avg: number }) => sum + Number(s.rating_avg), 0) / (scripts?.length || 1)
      },
      recentSales: (sales || []).slice(0, 20),
      scripts: scripts || []
    });
  } catch (error) {
    console.error('[Scripts API] My sales error:', error);
    return c.json({ error: 'Failed to fetch sales data' }, 500);
  }
});

// PUT /scripts/my/profile - Update creator profile
scriptsRoutes.put('/my/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userSupabase = getUserSupabase(authHeader);
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const supabase = getSupabase();
    const { data: profile, error } = await supabase.from('creator_profiles')
      .upsert({ user_id: user.id, display_name: body.displayName || user.email?.split('@')[0] || 'Creator', bio: body.bio || null, avatar_url: body.avatarUrl || null }, { onConflict: 'user_id' })
      .select().single();
    if (error) throw error;
    return c.json({ profile });
  } catch (error) {
    console.error('[Scripts API] Update profile error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ============================================================
// GET /scripts/:id - Get a single script with full details
// ============================================================
scriptsRoutes.get('/:id', async (c) => {
  try {
    const supabase = getSupabase();
    const id = c.req.param('id');

    const { data: script, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !script) {
      return c.json({ error: 'Script not found' }, 404);
    }

    // Fetch creator profile
    let creator = null;
    if (script.creator_id) {
      const { data } = await supabase
        .from('creator_profiles')
        .select('display_name, bio, avatar_url, is_verified, total_sales')
        .eq('user_id', script.creator_id)
        .single();
      creator = data;
    }

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('script_reviews')
      .select('*')
      .eq('script_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return c.json({ script, creator, reviews: reviews || [] });
  } catch (error) {
    console.error('[Scripts API] Get script error:', error);
    return c.json({ error: 'Failed to fetch script' }, 500);
  }
});

// ============================================================
// POST /scripts - Create a new script
// ============================================================
scriptsRoutes.post('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userSupabase = getUserSupabase(authHeader);

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const supabase = getSupabase();

    // Ensure creator profile exists
    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      await supabase.from('creator_profiles').insert({
        user_id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        avatar_url: user.user_metadata?.avatar_url || null,
      });
    }

    const scriptData = {
      creator_id: user.id,
      name: body.name,
      description: body.description || '',
      full_description: body.fullDescription || '',
      category: body.category || 'task-management',
      pricing: body.pricing || 'free',
      price_cents: body.priceCents || 0,
      complexity: body.complexity || 'beginner',
      tags: body.tags || [],
      required_integrations: body.requiredIntegrations || [],
      time_saved_estimate: body.timeSavedEstimate || null,
      tasks: body.tasks || [],
      goals: body.goals || [],
      events: body.events || [],
      phone_actions: body.phoneActions || [],
      adaptable_params: body.adaptableParams || [],
      resources: body.resources || [],
      visibility: body.visibility || 'private',
      published_at: body.publish ? new Date().toISOString() : null,
    };

    const { data: script, error } = await supabase
      .from('scripts')
      .insert(scriptData)
      .select()
      .single();

    if (error) throw error;

    return c.json({ script }, 201);
  } catch (error) {
    console.error('[Scripts API] Create script error:', error);
    return c.json({ error: 'Failed to create script', details: String(error) }, 500);
  }
});

// ============================================================
// PUT /scripts/:id - Update a script
// ============================================================
scriptsRoutes.put('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userSupabase = getUserSupabase(authHeader);

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabase();

    // Verify ownership
    const { data: existing } = await supabase
      .from('scripts')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existing || existing.creator_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'description', 'full_description', 'category', 'pricing',
      'price_cents', 'complexity', 'tags', 'required_integrations',
      'time_saved_estimate', 'tasks', 'goals', 'events', 'phone_actions',
      'adaptable_params', 'resources', 'visibility'
    ];

    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (body[camelField] !== undefined) {
        updateData[field] = body[camelField];
      } else if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.publish && !body.published_at) {
      updateData.published_at = new Date().toISOString();
      updateData.visibility = 'public';
    }

    const { data: script, error } = await supabase
      .from('scripts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return c.json({ script });
  } catch (error) {
    console.error('[Scripts API] Update script error:', error);
    return c.json({ error: 'Failed to update script', details: String(error) }, 500);
  }
});

// ============================================================
// DELETE /scripts/:id - Delete a script
// ============================================================
scriptsRoutes.delete('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userSupabase = getUserSupabase(authHeader);

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const supabase = getSupabase();

    // Verify ownership
    const { data: existing } = await supabase
      .from('scripts')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existing || existing.creator_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('[Scripts API] Delete script error:', error);
    return c.json({ error: 'Failed to delete script' }, 500);
  }
});

// ============================================================
// POST /scripts/:id/use - Increment uses count (auth required)
// ============================================================
scriptsRoutes.post('/:id/use', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userSupabase = getUserSupabase(authHeader);
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabase();
    const id = c.req.param('id');

    await supabase.rpc('increment_script_uses', { script_uuid: id });

    return c.json({ success: true });
  } catch (error) {
    console.error('[Scripts API] Increment use error:', error);
    return c.json({ error: 'Failed to increment uses' }, 500);
  }
});

// ============================================================
// GET /scripts/:id/reviews - Get reviews for a script
// ============================================================
scriptsRoutes.get('/:id/reviews', async (c) => {
  try {
    const supabase = getSupabase();
    const id = c.req.param('id');
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    const { data: reviews, error, count } = await supabase
      .from('script_reviews')
      .select('*', { count: 'exact' })
      .eq('script_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return c.json({
      reviews: reviews || [],
      pagination: { page, limit, total: count || 0 }
    });
  } catch (error) {
    console.error('[Scripts API] Get reviews error:', error);
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// ============================================================
// POST /scripts/:id/reviews - Create a review
// ============================================================
scriptsRoutes.post('/:id/reviews', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userSupabase = getUserSupabase(authHeader);

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const scriptId = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabase();

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }

    const { data: review, error } = await supabase
      .from('script_reviews')
      .upsert({
        script_id: scriptId,
        user_id: user.id,
        rating: body.rating,
        comment: body.comment || null,
      }, { onConflict: 'script_id,user_id' })
      .select()
      .single();

    if (error) throw error;

    return c.json({ review }, 201);
  } catch (error) {
    console.error('[Scripts API] Create review error:', error);
    return c.json({ error: 'Failed to create review', details: String(error) }, 500);
  }
});

export default scriptsRoutes;
