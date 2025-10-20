import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();
    if (!description || typeof description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
    if (!HUGGINGFACE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'HUGGINGFACE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Generate a calculator JSON object with this exact structure:
{
  "title": "Calculator Title",
  "description": "Brief description",
  "fields": [{"id":"field1","label":"Field Label","type":"number","placeholder":"Enter value","required":true,"defaultValue":0}],
  "formula": "field1 * 2",
  "resultLabel": "Result"
}
Description: ${description}`;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/gpt2', // replace with any HF model
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: `Hugging Face API error: ${text}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    // Hugging Face returns text, we try to parse JSON from it
    let calculatorData;
    try {
      // Some models return plain text; try parsing JSON from first output
      calculatorData = JSON.parse(data[0].generated_text || '{}');
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse calculator JSON from model output' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ calculator: calculatorData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
