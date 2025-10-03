import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed, expected POST' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' },
    });
  }

  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Invalid Content-Type, expected application/json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (jsonError: any) {
    return new Response(JSON.stringify({ error: `Error parsing request body: ${jsonError.message}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageData } = requestBody; // Expecting base64 image data

    if (!imageData) {
      return new Response(JSON.stringify({ error: 'Missing required field: imageData (base64 encoded image)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Simulate OCR processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate OCR result with mock data
    const mockCnhData = {
      cnh_number: '12345678901', // Exemplo de número de CNH
      cnh_expiry_date: '2028-12-31', // Exemplo de data de validade (YYYY-MM-DD)
      full_name: 'Nome do Motorista Exemplo', // NEW: Adicionado nome completo
    };

    return new Response(JSON.stringify({ message: 'OCR processado com sucesso (dados simulados).', cnhData: mockCnhData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge Function: Uncaught error:', error.message);
    return new Response(JSON.stringify({ error: `Internal server error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});