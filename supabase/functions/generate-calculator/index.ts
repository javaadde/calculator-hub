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

    // Use a better model if available
    const modelName = 'bigscience/bloom'; // Replace with any HF text-generation model

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelName}`,
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
      console.error('Hugging Face API error:', response.status, text);
      return new Response(
        JSON.stringify({ error: `Hugging Face API error: ${text}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const output = data[0]?.generated_text || '';

    // Try to extract JSON object from text
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to extract JSON from model output:', output);
      return new Response(
        JSON.stringify({ error: 'Failed to extract calculator JSON from model output' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let calculatorData;
    try {
      calculatorData = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('JSON parse error:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format from model output' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ calculator: calculatorData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Function error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
