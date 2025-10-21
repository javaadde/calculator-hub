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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
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

Requirements:
- Create a calculator based on: ${description}
- Return ONLY valid JSON, no additional text
- Use meaningful field IDs and labels
- Formula should reference field IDs (e.g., "field1 * field2 + 10")
- Make it practical and user-friendly

JSON:`;

    const response = await fetch(
      'https://lovable-ai-gateway-api.lovable.app/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Lovable AI API error:', response.status, text);
      return new Response(
        JSON.stringify({ error: `AI API error: ${text}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || '';

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
