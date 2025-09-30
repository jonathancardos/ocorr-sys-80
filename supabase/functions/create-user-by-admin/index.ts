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

  console.log('Edge Function: Request received for create-user-by-admin.');
  console.log('Edge Function: Request method:', req.method);
  console.log('Edge Function: Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
  console.log('Edge Function: Content-Length header:', req.headers.get('content-length'));

  if (req.method !== 'POST') {
    console.error('Edge Function: Method Not Allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method Not Allowed, expected POST' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' },
    });
  }

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
    const { email, password, username, full_name, role, department, position, phone, is_active } = requestBody;
    console.log('Edge Function: Extracted fields from body:', { email, username, full_name, role });

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

    // Check if user already exists in auth.users
    console.log(`Edge Function: Checking if user with email "${email}" already exists in auth.users.`);
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      email: email,
    });

    if (listError) {
      console.error('Edge Function: Error checking for existing user:', listError.message);
      return new Response(JSON.stringify({ error: `Error checking for existing user: ${listError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Edge Function: listUsers result - found ${existingUsers?.users.length} user(s).`);
    if (existingUsers && existingUsers.users.length > 0) {
      const existingAuthUser = existingUsers.users[0];
      console.log(`Edge Function: User with email "${email}" already exists in auth.users with ID: ${existingAuthUser.id}.`);

      // Check if a profile exists for this user in public.profiles
      console.log(`Edge Function: Checking for profile for user ID: ${existingAuthUser.id} in public.profiles.`);
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', existingAuthUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Edge Function: Error checking for existing profile:', profileError.message);
        return new Response(JSON.stringify({ error: `Error checking profile: ${profileError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log(`Edge Function: existingProfile data: ${existingProfile ? JSON.stringify(existingProfile) : 'null (profile not found)'}`);

      if (existingProfile) {
        // User and profile exist, check email confirmation status
        if (!existingAuthUser.email_confirmed_at) {
          // Email not confirmed, confirm it now
          const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            existingAuthUser.id,
            { email_confirm: true }
          );
          if (confirmError) {
            console.error('Edge Function: Error confirming existing user\'s email:', confirmError.message);
            return new Response(JSON.stringify({ error: `Failed to confirm existing user's email: ${confirmError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        console.log('Edge Function: Profile already exists for this user. Returning success with message: "User with this email already exists and has a profile."');
        return new Response(JSON.stringify({ message: 'User with this email already exists and has a profile.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // User exists in auth.users but profile is missing. Create profile.
        console.log('Edge Function: User exists in auth.users but profile is missing. Attempting to create profile.');
        const { error: insertProfileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: existingAuthUser.id,
            username: username || email, // Fallback to email if username is empty
            full_name: full_name || username || email, // Fallback to username, then email if full_name is empty
            role: role, // Use provided role
            department: department || null,
            position: position || null,
            phone: phone || null,
            is_active: is_active ?? true,
            avatar_url: null, // Default to null
            email: email, // Adicionado: email
          });

        if (insertProfileError) {
          console.error('Edge Function: Error creating missing profile:', insertProfileError.message);
          return new Response(JSON.stringify({ error: `User exists, but failed to create missing profile: ${insertProfileError.message}` }), {
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
            console.error('Edge Function: Error confirming existing user\'s email after profile creation: ', confirmError.message);
            return new Response(JSON.stringify({ error: `Failed to confirm existing user's email after profile creation: ${confirmError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        console.log('Edge Function: Missing profile successfully created for existing user. Returning success with message: "User already exists, missing profile created."');
        return new Response(JSON.stringify({ message: 'User already exists, missing profile created.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // If user does not exist, create it
    console.log(`Edge Function: User with email "${email}" does not exist. Attempting to create new user.`);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Changed to true to immediately confirm email
      user_metadata: {
        username: username || email, // Fallback to email if username is empty
        full_name: full_name || username || email, // Fallback to username, then email if full_name is empty
        role,
        department: department || null,
        position: position || null,
        phone: phone || null,
        is_active: is_active ?? true,
      },
    });

    if (error) {
      console.error('Edge Function: Error creating user:', error.message);
      console.error('Edge Function: Full error object from createUser:', JSON.stringify(error)); // ADDED THIS LOG
      // Check for specific error indicating user already exists
      if (error.message.includes('User already registered') || error.message.includes('A user with this email address has already been registered')) {
        console.warn(`Edge Function: Attempted to create user with existing email "${email}". Re-checking for existing user and profile.`);
        // Re-fetch the user to get their ID
        const { data: existingAuthUserAfterCreateAttempt, error: fetchExistingError } = await supabaseAdmin.auth.admin.listUsers({ email: email });
        if (fetchExistingError || !existingAuthUserAfterCreateAttempt?.users.length) {
          console.error('Edge Function: Failed to fetch existing user after create attempt:', fetchExistingError?.message);
          return new Response(JSON.stringify({ error: `Error creating user: ${error.message}. Also failed to verify existing user.` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const existingAuthUser = existingAuthUserAfterCreateAttempt.users[0];

        // Check if a profile exists for this user in public.profiles
        console.log(`Edge Function: Checking for profile for user ID: ${existingAuthUser.id} in public.profiles after create attempt.`);
        const { data: existingProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', existingAuthUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Edge Function: Error checking for existing profile after create attempt:', profileError.message);
          return new Response(JSON.stringify({ error: `User exists, but error checking profile: ${profileError.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log(`Edge Function: existingProfile data after create attempt: ${existingProfile ? JSON.stringify(existingProfile) : 'null (profile not found)'}`);

        if (existingProfile) {
          // User and profile exist, check email confirmation status
          if (!existingAuthUser.email_confirmed_at) {
            const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              { email_confirm: true }
            );
            if (confirmError) {
              console.error('Edge Function: Error confirming existing user\'s email after create attempt:', confirmError.message);
              return new Response(JSON.stringify({ error: `Failed to confirm existing user's email after create attempt: ${confirmError.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
          console.log('Edge Function: User already exists and profile found after create attempt. Returning success.');
          return new Response(JSON.stringify({ message: 'User with this email already exists and has a profile.' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.log('Edge Function: User exists but profile is missing after create attempt. Attempting to create profile.');
          const { error: insertProfileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: existingAuthUser.id,
              username: username || email, // Fallback to email if username is empty
              full_name: full_name || username || email, // Fallback to username, then email if full_name is empty
              role: role,
              department: department || null,
              position: position || null,
              is_active: is_active ?? true,
              phone: phone || null,
              avatar_url: null,
              email: email, // Adicionado: email
            });

          if (insertProfileError) {
            console.error('Edge Function: Error creating missing profile after create attempt:', insertProfileError.message);
            return new Response(JSON.stringify({ error: `User exists, but failed to create missing profile: ${insertProfileError.message}` }), {
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
              console.error('Edge Function: Error confirming existing user\'s email after profile creation (post-create attempt): ', confirmError.message);
              return new Response(JSON.stringify({ error: `Failed to confirm existing user's email after profile creation (post-create attempt): ${confirmError.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
          console.log('Edge Function: Missing profile successfully created for existing user after create attempt.');
          return new Response(JSON.stringify({ message: 'User already exists, missing profile created.' }), {
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

    console.log('Edge Function: New user created successfully. Returning user data.');
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