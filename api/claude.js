export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  // Test 1: Vérifier que la clé existe
  const hasKey = !!process.env.ANTHROPIC_API_KEY
  const keyPreview = process.env.ANTHROPIC_API_KEY 
    ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' 
    : 'NO KEY'

  // Test 2: Faire un appel ultra-simple
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    })

    const text = await response.text()
    
    return new Response(JSON.stringify({
      test: 'API route works',
      hasKey,
      keyPreview,
      status: response.status,
      response: text
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      test: 'API route works but fetch failed',
      hasKey,
      keyPreview,
      error: error.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
