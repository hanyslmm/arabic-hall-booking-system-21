import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, email, password, full_name, phone, user_role, username, teacher_id, confirm_email } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Updating user:', user_id, { email, full_name, user_role })

    // Update auth user if email or password changed
    const authUpdateData: any = {}
    if (email) authUpdateData.email = email
    if (password) authUpdateData.password = password
    // Always confirm email when admin updates user to avoid login blocks
    if (email || password) authUpdateData.email_confirm = true

    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } = await supabaseClient.auth.admin.updateUserById(
        user_id,
        authUpdateData
      )

      if (authError) {
        console.error('Auth update error:', authError)
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else if (confirm_email) {
      const { error: authError } = await supabaseClient.auth.admin.updateUserById(
        user_id,
        { email_confirm: true }
      )
      if (authError) {
        console.error('Auth update error (confirm only):', authError)
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Update profile
    const profileUpdateData: any = { updated_at: new Date().toISOString() }
    if (full_name !== undefined) profileUpdateData.full_name = full_name
    if (phone !== undefined) profileUpdateData.phone = phone
    if (email !== undefined) profileUpdateData.email = email
    if (user_role !== undefined) profileUpdateData.user_role = user_role
    if (username !== undefined) profileUpdateData.username = username
    if (teacher_id !== undefined) profileUpdateData.teacher_id = teacher_id

    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', user_id)
      .select()
      .single()

    if (profileError) {
      console.error('Profile update error:', profileError)
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User updated successfully:', profileData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: profileData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in update-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
