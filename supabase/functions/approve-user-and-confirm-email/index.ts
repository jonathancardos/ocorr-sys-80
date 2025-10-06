import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed, expected POST' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' },
    });
  }

  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Invalid Content-Type, expected application/json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (jsonError: any) {
    return new Response(JSON.stringify({ error: `Error parsing request body: ${jsonError.message}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { userId } = requestBody;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing required field: userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Update public.profiles to set is_active to true
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileUpdateError) {
      console.error('Edge Function: Error updating profile is_active:', profileUpdateError.message);
      return new Response(JSON.stringify({ error: `Failed to activate user profile: ${profileUpdateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Update auth.users to set email_confirmed_at
    const { data: userUpdateData, error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true } // This sets email_confirmed_at to current timestamp
    );

    if (authUpdateError) {
      console.error('Edge Function: Error confirming user email:', authUpdateError.message);
      return new Response(JSON.stringify({ error: `Failed to confirm user email: ${authUpdateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'User approved and email confirmed successfully.', user: userUpdateData.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge Function: Uncaught error:', error.message);
    return new Response(JSON.stringify({ error: `Internal server error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});