import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Create client with user's auth to verify they're an admin
    const authHeader = req.headers.get('Authorization')!
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the requester is an admin
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: roleData } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can create employees' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, password, fullName, permissions } = await req.json()

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Create user via admin API (bypasses email confirmation)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = newUser.user.id
    console.log('User created successfully:', userId)

    // Wait briefly for the trigger to create default role
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Delete any existing roles (e.g., 'customer' from handle_new_user trigger)
    const { error: deleteRoleError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (deleteRoleError) {
      console.error('Error deleting existing roles:', deleteRoleError)
    }

    // Insert the sales_staff role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: userId, role: 'sales_staff' })

    if (roleError) {
      console.error('Error inserting role:', roleError)
      return new Response(
        JSON.stringify({ error: 'Failed to set employee role: ' + roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('Role set to sales_staff for user:', userId)

    // Add employee permissions
    const { error: permError } = await adminClient
      .from('employee_permissions')
      .insert({
        user_id: userId,
        ...permissions
      })

    if (permError) {
      console.error('Error adding permissions:', permError)
      // Non-critical - continue anyway
    }
    console.log('Employee permissions set for user:', userId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: userId, 
          email: newUser.user.email,
          full_name: fullName
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
