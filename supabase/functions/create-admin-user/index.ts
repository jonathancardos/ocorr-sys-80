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

  console.log('Edge Function: Request received.');
  console.log('Edge Function: Request method:', req.method);
  console.log('Edge Function: Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
  console.log('Edge Function: Content-Length header:', req.headers.get('content-length')); // Log Content-Length

  // Ensure it's a POST request
  if (req.method !== 'POST') {
    console.error('Edge Function: Method Not Allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method Not Allowed, expected POST' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' },
    });
  }

  // Ensure Content-Type is application/json
  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.error('Edge Function: Invalid Content-Type header:', contentType);
    return new Response(JSON.stringify({ error: 'Invalid Content-Type, expected application/json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let requestBody;
  try {
    requestBody = await req.json();
    console.log('Edge Function: Successfully parsed JSON body.');
  } catch (jsonError: any) {
    console.error('Edge Function: Error parsing JSON body:', jsonError.message);
    if (jsonError instanceof SyntaxError && jsonError.message.includes('Unexpected end of JSON input')) {
      console.error('Edge Function: The request body was likely empty or incomplete JSON.');
      return new Response(JSON.stringify({ error: 'Request body is empty or malformed JSON.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: `Error parsing request body: ${jsonError.message}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, password, username, full_name, role } = requestBody;
    console.log('Edge Function: Extracted fields from body:', { email, username, full_name, role });

    // full_name agora é opcional na validação inicial
    if (!email || !password || !username || !role) {
      console.error('Edge Function: Missing required fields after parsing.');
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, username, role' }), {
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
    console.log('Edge Function: Supabase admin client created.');

    // 1. Check if user already exists in auth.users
    console.log(`Edge Function: Checking if user with email ${email} already exists.`);
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      email: email,
    });

    if (listError) {
      console.error('Edge Function: Error listing users:', listError.message);
      return new Response(JSON.stringify({ error: `Error listing users: ${listError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingUsers && existingUsers.users.length > 0) {
      const existingAuthUser = existingUsers.users[0];
      console.log(`Edge Function: Admin user with email ${email} already exists in auth.users with ID: ${existingAuthUser.id}.`);

      // Check if a profile exists for this user in public.profiles
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', existingAuthUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Edge Function: Error checking for existing admin profile:', profileError.message);
        return new Response(JSON.stringify({ error: `Error checking admin profile: ${profileError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (existingProfile) {
        // User and profile exist, check email confirmation status
        if (!existingAuthUser.email_confirmed_at) {
          const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            existingAuthUser.id,
            { email_confirm: true }
          );
          if (confirmError) {
            console.error('Edge Function: Error confirming existing admin user\'s email:', confirmError.message);
            return new Response(JSON.stringify({ error: `Failed to confirm existing admin user's email: ${confirmError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        console.log('Edge Function: Admin profile already exists for this user. Returning success.');
        return new Response(JSON.stringify({ message: 'Admin user already exists and has a profile.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // User exists in auth.users but profile is missing. Create profile.
        console.log('Edge Function: Admin user exists in auth.users but profile is missing. Attempting to create profile.');
        // Attempt to create the profile in public.profiles
        const { error: insertProfileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: existingAuthUser.id,
            username: username || email, // Fallback to email if username is empty
            full_name: full_name || username || email, // Fallback to username, then email if full_name is empty
            role: role,
            email: email, // Adicionado: email
            // department, position, phone, is_active, avatar_url are not passed to create-admin-user, so they will be null/default
          });

        if (insertProfileError) {
          console.error('Edge Function: Error creating missing admin profile:', insertProfileError.message);
          return new Response(JSON.stringify({ error: `Admin user exists, but failed to create missing profile: ${insertProfileError.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // Also confirm email if not already confirmed
        if (!existingAuthUser.email_confirmed_at) {
          const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            existingAuthUser.id,
            { email_confirm: true }
          );
          if (confirmError) {
            console.error('Edge Function: Error confirming existing admin user\'s email after profile creation: ', confirmError.message);
            return new Response(JSON.stringify({ error: `Failed to confirm existing admin user's email after profile creation: ${confirmError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        console.log('Edge Function: Missing admin profile successfully created for existing user.');
        return new Response(JSON.stringify({ message: 'Admin user already exists, missing profile created.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. If user does not exist, create it
    console.log('Edge Function: Admin user does not exist, attempting to create.');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Changed to true to immediately confirm email
      user_metadata: {
        username: username || email, // Fallback to email if username is empty
        full_name: full_name || username || email, // Fallback to username, then email if full_name is empty
        role,
      },
    });

    if (error) {
      console.error('Edge Function: Error creating user:', error.message);
      // Check for specific error indicating user already exists
      if (error.message.includes('User already registered') || error.message.includes('A user with this email address has already been registered')) {
        console.warn(`Edge Function: Attempted to create admin user with existing email ${email}.`);
        // Re-fetch the user to get their ID
        const { data: existingAuthUserAfterCreateAttempt, error: fetchExistingError } = await supabaseAdmin.auth.admin.listUsers({ email: email });
        if (fetchExistingError || !existingAuthUserAfterCreateAttempt?.users.length) {
          console.error('Edge Function: Failed to fetch existing admin user after create attempt:', fetchExistingError?.message);
          return new Response(JSON.stringify({ error: `Error creating admin user: ${error.message}. Also failed to verify existing user.` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const existingAuthUser = existingAuthUserAfterCreateAttempt.users[0];

        // Check if a profile exists for this user in public.profiles
        const { data: existingProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', existingAuthUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Edge Function: Error checking for existing admin profile after create attempt:', profileError.message);
          return new Response(JSON.stringify({ error: `Admin user exists, but error checking profile: ${profileError.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (existingProfile) {
          // User and profile exist, check email confirmation status
          if (!existingAuthUser.email_confirmed_at) {
            const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              { email_confirm: true }
            );
            if (confirmError) {
              console.error('Edge Function: Error confirming existing admin user\'s email (post-create attempt):', confirmError.message);
              return new Response(JSON.stringify({ error: `Failed to confirm existing admin user's email (post-create attempt): ${confirmError.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
          console.log('Edge Function: Admin user already exists and profile found. Returning success.');
          return new Response(JSON.stringify({ message: 'Admin user with this email already exists and has a profile.' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.log('Edge Function: Admin user exists but profile is missing. Attempting to create profile.');
          const { error: insertProfileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: existingAuthUser.id,
              username: username || email, // Fallback to email if username is empty
              full_name: full_name || username || email, // Fallback to username, then email if full_name is empty
              role: role,
              email: email, // Adicionado: email
            });

          if (insertProfileError) {
            console.error('Edge Function: Error creating missing admin profile after create attempt:', insertProfileError.message);
            return new Response(JSON.stringify({ error: `Admin user exists, but failed to create missing profile: ${insertProfileError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          // Also confirm email if not already confirmed
          if (!existingAuthUser.email_confirmed_at) {
            const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              { email_confirm: true }
            );
            if (confirmError) {
              console.error('Edge Function: Error confirming existing admin user\'s email after profile creation (post-create attempt): ', confirmError.message);
              return new Response(JSON.stringify({ error: `Failed to confirm existing admin user's email after profile creation (post-create attempt): ${confirmError.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
          console.log('Edge Function: Missing admin profile successfully created for existing user after create attempt.');
          return new Response(JSON.stringify({ message: 'Admin user already exists, missing profile created.' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // Other types of errors during user creation
        return new Response(JSON.stringify({ error: `Error creating user: ${error.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('Edge Function: Admin user created successfully. Returning user data.');
    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge Function: Uncaught error in main logic:', error.message);
    return new Response(JSON.stringify({ error: `Internal server error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});