import { createClient, format } from './deps.ts'

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // Adicionado para pré-verificação CORS
      },
    })
  }

  const { headers } = req
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: headers.get('Authorization')! } } }
  )

  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('incident_number, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const currentDate = new Date()
    const currentMonth = format(currentDate, 'MM')
    const currentYear = format(currentDate, 'yyyy')

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last incident number:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Add CORS header
        },
        status: 500,
      })
    }

    let sequentialNumber = 1

    if (data) {
      const lastIncidentNumber = data.incident_number
      const lastIncidentCreatedAt = new Date(data.created_at)
      const lastIncidentMonth = format(lastIncidentCreatedAt, 'MM')
      const lastIncidentYear = format(lastIncidentCreatedAt, 'yyyy')

      if (lastIncidentNumber && lastIncidentNumber.startsWith('OC')) {
        const parts = lastIncidentNumber.split('OC')[1].split('-')
        const seqNum = parseInt(parts[0], 10)
        const monthYear = parts[1]

        if (monthYear) {
          const lastMonth = monthYear.substring(0, 2)
          const lastYear = monthYear.substring(2, 6)

          if (lastMonth === currentMonth && lastYear === currentYear) {
            sequentialNumber = seqNum + 1
          } else {
            sequentialNumber = 1
          }
        }
      }
    }

    const formattedSequentialNumber = String(sequentialNumber).padStart(3, '0')
    const nextIncidentNumber = `OC${formattedSequentialNumber}-${currentMonth}${currentYear}`

    return new Response(JSON.stringify({ nextIncidentNumber }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Add CORS header
      },
      status: 200,
    })
  } catch (error: unknown) {
    console.error('Unhandled error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Add CORS header
      },
      status: 500,
    })
  }
})