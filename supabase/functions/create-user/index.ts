import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin with enhanced permission check
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_role, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced admin check - allow owner, manager, or legacy ADMIN role
    const isAdmin = profile?.user_role === 'owner' || 
                   profile?.user_role === 'manager' || 
                   profile?.role === 'ADMIN';

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized: Admin access required',
          details: `Current role: ${profile?.user_role}, App role: ${profile?.role}`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { username, password, user_role, full_name, email, phone, teacher_id } = await req.json();

    if (!username || !password || !user_role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: username, password, user_role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate user_role - include all valid roles
    const validRoles = ['owner', 'manager', 'space_manager', 'teacher', 'read_only'];
    if (!validRoles.includes(user_role)) {
      return new Response(
        JSON.stringify({ error: `Invalid user_role. Must be one of: ${validRoles.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided email or generate one based on username
    const userEmail = email || `${username}@local.app`;

    // Create user using admin client
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email: userEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: username,
        full_name: full_name || username,
        phone: phone || null
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create profile for the new user using direct insert (bypass RLS)
    if (newUser.user) {
      const { data: newProfile, error: profileCreateError } = await supabaseClient
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: userEmail,
          username: username,
          full_name: full_name || username,
          phone: phone || null,
          user_role: user_role,
          teacher_id: user_role === 'teacher' ? (teacher_id || null) : null,
          role: 'USER', // Default app role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileCreateError) {
        console.error('Error creating profile:', profileCreateError);
        
        // Try to delete the auth user if profile creation failed
        try {
          await supabaseClient.auth.admin.deleteUser(newUser.user.id);
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile', details: profileCreateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: {
            id: newUser.user.id,
            email: userEmail,
            username: username,
            full_name: full_name || username,
            phone: phone || null,
            user_role: user_role,
            teacher_id: user_role === 'teacher' ? (teacher_id || null) : null
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to create user - no user returned' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});