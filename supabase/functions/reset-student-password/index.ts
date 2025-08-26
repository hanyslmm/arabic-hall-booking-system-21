import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current user to verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can reset student passwords');
    }

    // Get request body
    const { student_auth_id, new_password } = await req.json();

    if (!student_auth_id || !new_password) {
      throw new Error('Missing required parameters: student_auth_id and new_password');
    }

    // Update the student's password using the service role client
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      student_auth_id,
      { password: new_password }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`Password reset successful for student auth ID: ${student_auth_id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset successfully' }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error resetting student password:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while resetting the password',
        success: false 
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400,
      }
    );
  }
});