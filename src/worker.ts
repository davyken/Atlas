// Cloudflare Workers entry point — production deployment
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createChatStream, type ApiConfig } from './api/core'

interface Env {
  ASSETS: Fetcher
  GROQ_API_KEY: string
  TAVILY_API_KEY?: string
  OPENWEATHER_API_KEY?: string
  AMADEUS_CLIENT_ID?: string
  AMADEUS_CLIENT_SECRET?: string
  PEXELS_API_KEY?: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.post('/api/chat', async (c) => {
  const { messages } = await c.req.json()

  const config: ApiConfig = {
    groqApiKey: c.env.GROQ_API_KEY,
    tavilyApiKey: c.env.TAVILY_API_KEY,
    openweatherApiKey: c.env.OPENWEATHER_API_KEY,
    amadeusClientId: c.env.AMADEUS_CLIENT_ID,
    amadeusClientSecret: c.env.AMADEUS_CLIENT_SECRET,
    pexelsApiKey: c.env.PEXELS_API_KEY,
  }

  const stream = await createChatStream(messages, config)
  return stream.toDataStreamResponse()
})

app.all('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
