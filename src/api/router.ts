import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export type Intent = 'weather' | 'flights' | 'hotels' | 'trip-planning' | 'destination' | 'currency' | 'general'

export async function classifyIntent(
  messages: Array<{ role: string; content: unknown }>,
  groqApiKey: string
): Promise<Intent> {
  const groq = createGroq({ apiKey: groqApiKey })
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content
  const prompt = typeof lastUserMessage === 'string' ? lastUserMessage : ''

  const { text } = await generateText({
    model: groq('llama-3.1-8b-instant'),
    system: `Classify the user's travel message into exactly one category. Reply with only the category name, nothing else.

weather       — current weather, temperature, rain, humidity, climate, forecast
flights       — searching for flights, airlines, tickets, departure, arrival
hotels        — hotels, accommodation, rooms, places to stay, Airbnb
trip-planning — day-by-day itineraries, what to do, activities, full trip plans
destination   — city/country info, highlights, food scene, best time to visit, local tips, maps
currency      — currency exchange, money conversion, how much is X in Y currency
general       — greetings, general travel advice, photos, visa info, anything else`,
    prompt,
    maxTokens: 10,
  })

  const intent = text.trim().toLowerCase().replace(/[^a-z-]/g, '') as Intent
  const valid: Intent[] = ['weather', 'flights', 'hotels', 'trip-planning', 'destination', 'currency', 'general']
  return valid.includes(intent) ? intent : 'general'
}
