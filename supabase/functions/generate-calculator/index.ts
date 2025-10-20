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

    const systemPrompt = `You are a calculator generation AI. Generate a calculator based on the user's description.

Return a JSON object with this exact structure:
{
  "title": "Calculator Title",
  "description": "Brief description",
  "fields": [
    {
      "id": "field1",
      "label": "Field Label",
      "type": "number",
      "placeholder": "Enter value",
      "required": true,
      "defaultValue": 0
    }
  ],
  "formula": "field1 * 2",
  "resultLabel": "Result"
}

Field types can be: "number", "text", "select", "checkbox"
For select fields, include "options": ["Option 1", "Option 2"]
The formula should use JavaScript expressions with field IDs.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: description }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_calculator",
              description: "Generate calculator structure",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  fields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        label: { type: "string" },
                        type: { type: "string" },
                        placeholder: { type: "string" },
                        required: { type: "boolean" },
                        defaultValue: {},
                        options: { type: "array", items: { type: "string" } }
                      },
                      required: ["id", "label", "type"],
                      additionalProperties: false
                    }
                  },
                  formula: { type: "string" },
                  resultLabel: { type: "string" }
                },
                required: ["title", "description", "fields", "formula", "resultLabel"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_calculator" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      const errorMessage = response.status === 429 ? 
        'Rate limit exceeded. Please try again later.' : 
        response.status === 402 ? 
        'Payment required. Please add credits to your workspace.' : 
        'Failed to generate calculator';
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error('No tool call or invalid response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'No tool call in response from Lovable AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const calculatorData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ calculator: calculatorData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-calculator:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
