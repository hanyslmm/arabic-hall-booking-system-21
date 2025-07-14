
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, user_role')
      .eq('id', user.id)
      .single();

    if (profileError || (profile?.role !== 'ADMIN' && profile?.user_role !== 'owner')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, password, user_role } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role if provided
    if (user_role) {
      const validRoles = ['owner', 'manager', 'space_manager'];
      if (!validRoles.includes(user_role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role. Must be one of: owner, manager, space_manager' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update user using admin client
    const updateData: any = {};
    if (password) {
      updateData.password = password;
    }

    let updatedUser = null;
    if (Object.keys(updateData).length > 0) {
      const { data: authUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        updateData
      );

      if (updateError) {
        console.error('Error updating user:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user', details: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updatedUser = authUser.user;
    }

    // Update the user's profile with the specified role if provided
    if (user_role) {
      const { error: profileUpdateError } = await supabaseClient
        .from('profiles')
        .update({ user_role: user_role })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user role', details: profileUpdateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get updated profile
    const { data: updatedProfile, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: updatedProfile
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
