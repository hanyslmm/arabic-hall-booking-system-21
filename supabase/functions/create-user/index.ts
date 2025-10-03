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

    const { email, password, full_name, phone, user_role, username, teacher_id } = await req.json()

    console.log('Creating user with data:', { email, full_name, phone, user_role })

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        user_role
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User created in auth:', authData.user?.id)

    // Create or update the user profile (handle possible triggers creating profile already)
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .upsert([
        {
          id: authData.user?.id,
          email,
          full_name,
          phone,
          user_role: user_role || 'space_manager',
          role: 'user',
          username: username ?? null,
          teacher_id: user_role === 'teacher' ? (teacher_id ?? null) : null
        }
      ], { onConflict: 'id' })
      .select()
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      // If profile creation fails, we should clean up the auth user
      await supabaseClient.auth.admin.deleteUser(authData.user?.id || '')
      
      return new Response(
        JSON.stringify({ error: profileError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Profile created:', profileData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user, 
        profile: profileData 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})