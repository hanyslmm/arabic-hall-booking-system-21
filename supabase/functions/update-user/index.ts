import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, email, full_name, phone, user_role, password } = await req.json()

    console.log('Updating user with data:', { user_id, email, full_name, phone, user_role })

    // Update user profile in profiles table
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        email,
        full_name,
        phone,
        user_role,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()

    if (profileError) {
      console.error('Profile update error:', profileError)
      return new Response(
        JSON.stringify({ error: profileError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update auth user if email or password changed
    const authUpdates: any = {
      user_metadata: {
        full_name,
        phone,
        user_role
      }
    }

    if (email) {
      authUpdates.email = email
    }

    if (password) {
      authUpdates.password = password
    }

    const { data: authData, error: authError } = await supabaseClient.auth.admin.updateUserById(
      user_id,
      authUpdates
    )

    if (authError) {
      console.error('Auth update error:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user, 
        profile: profileData[0] 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in update-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})