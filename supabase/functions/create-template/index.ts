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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const template = await req.json();

    // First, insert the template
    const { data: newTemplate, error: templateError } = await supabase
      .from('progress_templates')
      .insert({
        name: template.name,
        description: template.description
      })
      .select()
      .single();

    if (templateError) throw templateError;
    if (!newTemplate) throw new Error('Failed to create template');

    // Then, insert all steps
    const stepsToInsert = template.steps.map(step => ({
      template_id: newTemplate.id,
      title: step.title,
      description: step.description,
      order_number: step.order_number
    }));

    const { data: steps, error: stepsError } = await supabase
      .from('progress_steps')
      .insert(stepsToInsert)
      .select();

    if (stepsError) throw stepsError;

    // Return the complete template with steps
    return new Response(
      JSON.stringify({
        ...newTemplate,
        steps: steps || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-template function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});