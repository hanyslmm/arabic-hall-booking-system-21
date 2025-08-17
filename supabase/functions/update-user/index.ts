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

    // Get current user from token - use the JWT directly for validation
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT and get user info
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Token validation error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token', details: userError?.message }),
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

    console.log('Actor info:', { actorUserId: user.id, actorRole: profile?.user_role });

    // Parse request body
    const requestBody = await req.json();
    console.log('Update user request:', requestBody);
    const { userId, password, user_role, full_name, email, phone, teacher_id } = requestBody;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate user_role if provided - include all valid roles including read_only
    if (user_role) {
      const validRoles = ['owner', 'manager', 'space_manager', 'teacher', 'read_only'];
      if (!validRoles.includes(user_role)) {
        return new Response(
          JSON.stringify({ error: `Invalid user_role. Must be one of: ${validRoles.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch target profile to check current state
    const { data: targetProfile, error: targetFetchError } = await supabaseClient
      .from('profiles')
      .select('id, email, role, user_role')
      .eq('id', userId)
      .single();

    if (targetFetchError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Target profile fetched:', { targetUserId: targetProfile.id, currentRole: targetProfile.user_role });

    // Update user using admin client (for password and email changes)
    if (password && password.trim() !== '') {
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        { password: password }
      );

      if (updateError) {
        console.error('Error updating user password:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user password', details: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update email if provided
    if (email && email.trim() !== '' && email !== targetProfile.email) {
      const { error: emailUpdateError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        { email: email }
      );

      if (emailUpdateError) {
        console.error('Error updating user email:', emailUpdateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user email', details: emailUpdateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use the admin_update_user_role function for profile updates
    if (user_role || full_name || phone || teacher_id !== undefined) {
      const { data: updatedProfile, error: profileUpdateError } = await supabaseClient
        .rpc('admin_update_user_role', {
          target_user_id: userId,
          new_user_role: user_role || targetProfile.user_role,
          new_full_name: full_name,
          new_email: email,
          new_phone: phone,
          new_teacher_id: teacher_id
        });

      if (profileUpdateError) {
        console.error('Error updating profile via RPC:', profileUpdateError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update user profile', 
            details: profileUpdateError.message,
            code: profileUpdateError.code
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: updatedProfile
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no profile updates needed, just return the current profile
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: targetProfile
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});