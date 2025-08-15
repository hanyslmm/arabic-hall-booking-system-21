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

    // Validate user_role if provided - include all valid roles
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
    const updateData: any = {};
    if (password && password.trim() !== '') {
      updateData.password = password;
    }
    if (email && email.trim() !== '') {
      updateData.email = email;
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

    // Update the user's profile using direct database update (bypass RLS)
    const profileUpdateData: any = {};

    if (user_role !== undefined) {
      profileUpdateData.user_role = user_role;
    }
    if (full_name !== undefined) {
      profileUpdateData.full_name = full_name;
    }
    if (email !== undefined) {
      profileUpdateData.email = email;
    }
    if (phone !== undefined) {
      profileUpdateData.phone = phone;
    }

    // Handle teacher_id linkage
    if (teacher_id !== undefined) {
      const effectiveRole = profileUpdateData.user_role ?? targetProfile.user_role;
      profileUpdateData.teacher_id = (effectiveRole === 'teacher') ? teacher_id : null;
    }

    if (Object.keys(profileUpdateData).length > 0) {
      profileUpdateData.updated_at = new Date().toISOString();
      
      console.log('Updating profile with data:', profileUpdateData);
      
      // Use direct update with service role privileges
      const { data: updatedProfile, error: profileUpdateError } = await supabaseClient
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId)
        .select()
        .single();

      if (profileUpdateError) {
        console.error('Error updating profile:', {
          message: profileUpdateError.message,
          code: profileUpdateError.code,
          details: profileUpdateError.details,
          hint: profileUpdateError.hint
        });
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update user profile', 
            details: profileUpdateError.message,
            code: profileUpdateError.code,
            db_details: profileUpdateError.details,
            hint: profileUpdateError.hint
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Profile updated successfully');
    }

    // Get updated profile
    const { data: finalProfile, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch updated profile', details: fetchError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: finalProfile
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