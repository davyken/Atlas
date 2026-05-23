// Local development API server — mirrors the Cloudflare Worker at src/worker.ts
// Runs on port 8787 alongside the Vite dev server (port 5173)
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createChatStream } from './api/core.ts'

const PORT = 8787

const config = {
  groqApiKey: process.env.GROQ_API_KEY || '',
  tavilyApiKey: process.env.TAVILY_API_KEY,
  openweatherApiKey: process.env.OPENWEATHER_API_KEY,
  amadeusClientId: process.env.AMADEUS_CLIENT_ID,
  amadeusClientSecret: process.env.AMADEUS_CLIENT_SECRET,
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

async function handleCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req))
      const { messages } = body

      const stream = await createChatStream(messages, config)
      const response = stream.toDataStreamResponse()

      res.writeHead(response.status, Object.fromEntries(response.headers.entries()))

      if (response.body) {
        const reader = response.body.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
      }
      res.end()
    } catch (err) {
      console.error('[API Error]', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  res.writeHead(404); res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`\x1b[33m[Atlas API]\x1b[0m  Dev server ready at http://localhost:${PORT}`)
  if (!config.groqApiKey) {
    console.warn('\x1b[31m[Atlas API]\x1b[0m  GROQ_API_KEY is not set!')
  }
})
