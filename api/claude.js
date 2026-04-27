export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY || 'demo-key'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'API request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
