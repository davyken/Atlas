import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export type Intent = 'weather' | 'flights' | 'hotels' | 'trip-planning' | 'destination' | 'general'

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

weather     — current weather, temperature, rain, humidity, climate
flights     — searching for flights, airlines, tickets, departure, arrival
hotels      — hotels, accommodation, rooms, places to stay
trip-planning — day-by-day itineraries, what to do, activities, full trip plans
destination — city/country info, highlights, food scene, best time to visit, local tips
general     — greetings, general travel advice, anything else`,
    prompt,
    maxTokens: 10,
  })

  const intent = text.trim().toLowerCase().replace(/[^a-z-]/g, '') as Intent
  const valid: Intent[] = ['weather', 'flights', 'hotels', 'trip-planning', 'destination', 'general']
  return valid.includes(intent) ? intent : 'general'
}
