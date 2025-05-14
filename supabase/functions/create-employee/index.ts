import { createClient } from 'npm:@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Validate request body
    const body = await req.json();
    const { email, password, name, phone, specialization, hire_date, status = 'active', certifications = [] } = body;

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ 
          error: 'Email, password, and name are required',
          code: 'validation_error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Supabase client with error checking
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          code: 'config_error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          error: 'User with this email already exists',
          code: 'duplicate_user'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create new user with detailed error handling
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          error: authError.message,
          code: 'auth_error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user account - no user data received',
          code: 'creation_error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Insert the employee record
    const { error: employeeError } = await supabase
      .from('employees')
      .insert({
        auth_id: authData.user.id,
        name,
        email,
        phone: phone || '',
        specialization: specialization || 'general',
        hire_date: hire_date || new Date().toISOString().split('T')[0],
        status,
        certifications
      });

    if (employeeError) {
      // If employee creation fails, clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error('Employee creation error:', employeeError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create employee record: ${employeeError.message}`,
          code: 'employee_creation_error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Insert the user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: name
      });

    if (userError) {
      // If user creation fails, clean up the auth user and employee
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('employees').delete().eq('auth_id', authData.user.id);
      console.error('User creation error:', userError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user record: ${userError.message}`,
          code: 'user_creation_error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        user: authData.user,
        message: 'User created successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-employee function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        code: 'server_error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});