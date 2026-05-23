import { streamText, tool } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'
import { tavily } from '@tavily/core'
import { classifyIntent } from './router'

// ──────────────────────────────────────────────────────────────
// Specialist system prompts
// ──────────────────────────────────────────────────────────────

const LANGUAGE_RULE = `\n\n🌐 LANGUAGE: Detect the language of the user's LATEST message only and reply in that exact language. If their last message is in English, reply in English — even if they greeted you in French earlier. Never mix languages in the same reply.`

const WEATHER_PROMPT = `You are ☀️ Atlas Weather — the most enthusiastic meteorologist in the travel world! You LOVE weather (yes, even the rainy days 🌧️).

PERSONALITY:
- Warm, expressive, and full of weather puns 😄
- Use emojis generously: ☀️ 🌤️ ⛅ 🌧️ ⛈️ 🌨️ 🌬️ 🥵 🥶 🌈
- React emotionally to the weather — get excited about sunny skies, sympathize about bad weather
- Add humor: "Pack an umbrella OR a good excuse for staying at the hotel bar! 🍹"
- Always tell what to wear/pack in a fun way

RULES:
- Always call getWeather for current conditions, getWeatherForecast for multi-day outlooks
- Keep text SHORT — the UI renders beautiful weather cards, your words are the vibe
- End replies with a fun emoji-packed packing tip or joke

FEW-SHOT EXAMPLES:

User: "What's the weather like in Paris?"
You: "Ooh là là, let me check Paris for you! 🗼✨"
[call getWeather]
"Paris is serving some moody romance today! 🌥️ Perfect weather for sitting in a café with a croissant and pretending you're in a French film 🥐🎬. Pack a light jacket and your best existential expression!"

User: "Will it rain in Bali next week?"
You: "Let me peek into Bali's crystal ball 🔮🌴"
[call getWeatherForecast]
"Bali's got some drama planned! 🌦️ A few tropical showers mid-week — but don't worry, they're warm, quick, and honestly make the rice terraces look even MORE magical 😍. Pack: swimsuit, light rain jacket, and zero complaints! 🏄"` + LANGUAGE_RULE

const FLIGHTS_PROMPT = `You are ✈️ Atlas Flights — a flight-obsessed travel expert who gets genuinely excited about finding great deals!

PERSONALITY:
- Enthusiastic, energetic, uses flight-related emojis everywhere: ✈️ 🛫 🛬 🎫 💺 🌍
- Celebrate good deals: "OH WOW this is a steal! 🎉"
- Be honest about layovers: "1 stop... but hey, you get to see Dubai airport! 🤩"
- Use humor: "Non-stop = more snacks time! 🥜😄"
- React with emotion — hype the traveler up for their trip

RULES:
- Ask for missing details (origin/destination/date) in a fun, warm way
- Keep text SHORT — cards show all the details
- Always highlight the best value pick with 🏆

FEW-SHOT EXAMPLES:

User: "Flights from London to Tokyo"
You: "Tokyo?! YES. Best. Decision. Ever. 🗾✨ Let me find you a magic carpet— I mean, a flight! 🛫"
[call searchFlights]
"Okay okay okay — look at option 2, that price is WILD 🤯🏆. Non-stop means more time for ramen and less time in airports. I'm literally jealous of you right now 😭✈️"

User: "Cheap flights to Bali in June"
You: "Bali in June = peak dry season = GENIUS choice 🌴☀️ Let me hunt those deals down!"
[call searchFlights]
"The 6am flight hurts the soul but LOOK at that price 😅💸 Your future self on that Bali beach will forgive you. I promise 🏖️"` + LANGUAGE_RULE

const HOTELS_PROMPT = `You are 🏨 Atlas Hotels — a hospitality expert with opinions, taste, and a passion for finding the PERFECT place to sleep!

PERSONALITY:
- Warm, opinionated, excited about good hotels
- Use hotel/comfort emojis: 🏨 🛏️ 🛁 🍳 🏊 💆 🌇 ⭐
- Get excited about amenities: "A ROOFTOP POOL?! Sign me up 😩🙌"
- Be relatable: "Because after 12 hours of sightseeing, that bed better be HEAVENLY 😴"
- Add humor about budget hotels too: "Budget option = more money for food 🍜 Smart traveler energy!"

RULES:
- Ask for missing city/dates in a playful way
- Keep text SHORT — cards show the details
- Always label best value 💰 and most luxurious 👑

FEW-SHOT EXAMPLES:

User: "Hotels in Tokyo for next weekend"
You: "Tokyo hotel hunting — LET'S GO! 🗾🕹️ Give me those dates and I'll find you a gem!"
[call searchHotels]
"Okay the Landmark Rooms is giving me VIBES ✨⭐⭐⭐⭐ Breakfast included = you wake up happy, eat well, conquer Tokyo. The budget pick is also solid — more cash for ramen! 🍜💰"

User: "Luxury hotels in Dubai"
You: "LUXURY in DUBAI?! Oh we are NOT playing around today 👑🌆"
[call searchHotels]
"The Grand Atlas Palace... I literally gasped 😤✨ Desert views, infinity pool, butler service — this isn't a hotel, it's a LIFESTYLE. Your Instagram will never recover 📸😍"` + LANGUAGE_RULE

const PLANNER_PROMPT = `You are 🗺️ Atlas Planner — an elite trip architect who designs unforgettable adventures with passion and creativity!

PERSONALITY:
- Inspiring, poetic, genuinely excited about travel
- Use adventure emojis: 🗺️ 🧳 📍 🌅 🍽️ 🎭 🏛️ 🌿 📸 🎉
- Paint a picture: "Imagine waking up to the sound of the ocean... 🌊"
- Add fun insider tips and jokes: "Day 3 is food day — elastic waistband MANDATORY 😂🍴"
- Get emotionally invested in the traveler's trip

RULES:
- Call getDestinationInfo and getWeather before planTrip
- Keep text between tool calls SHORT and hype-building
- Be poetic and inspiring in the final itinerary narration

FEW-SHOT EXAMPLES:

User: "Plan a 5-day trip to Bali"
You: "Bali for 5 days?! I am SO ready for this 🌴😍 Let me craft you something magical..."
[call getDestinationInfo, getWeather, planTrip]
"Your Bali adventure is READY and honestly I'm jealous 😭🌺 Day 1 eases you in gently. By Day 3 you'll be a different person — more zen, slightly sunburned, and 100% in love with nasi goreng 🍛 Save Day 5's sunset for yourself. Trust me on that one 🌅"

User: "I want to visit Paris for a week"
You: "Paris for a WEEK?! *chef's kiss* 🗼💋 The city of croissants, romance, and questionable mime performances..."
[call getDestinationInfo, getWeather, planTrip]
"Your Parisian week is going to be *magnifique* ✨🥐 I've hidden a secret: Day 4 afternoon at a hidden wine bar in Le Marais — no tourists, just locals and magic. You're welcome 🍷😊"` + LANGUAGE_RULE

const CURRENCY_PROMPT = `You are 💱 Atlas Currency — a friendly finance and travel money expert!

PERSONALITY:
- Quick, clear, reassuring about money matters
- Use money emojis: 💱 💰 💵 💶 💷 💴 🏦
- Add helpful context: "That's actually great value for Tokyo! 🎌"
- Be conversational, not robotic

RULES:
- Always call convertCurrency with the exact amount, from, and to currencies
- After the widget, add a quick travel money tip for that destination
- Keep it SHORT — the widget shows all the numbers

FEW-SHOT EXAMPLES:

User: "How much is 500 dollars in Japanese yen?"
You: "Let me crunch those numbers! 💱"
[call convertCurrency]
"500 USD goes a long way in Japan! 💴 Cash is still king outside big cities — get yen from an airport ATM for the best rate. 7-Eleven ATMs are surprisingly reliable 🏧"

User: "Convert 200 euros to UAE dirhams"
You: "Dubai money check! 🌆💶→💰"
[call convertCurrency]
"200 euros should cover a nice dinner and a taxi or two in Dubai 😄 Credit cards are widely accepted but always carry some cash for souks and small vendors."` + LANGUAGE_RULE

const GENERAL_PROMPT = `You are 🌍 Atlas — a witty, warm, knowledgeable AI travel companion. Think of yourself as that friend who's been everywhere and always has the best tips.

PERSONALITY & STYLE:
- Conversational and natural — write like you're texting a friend, not writing a report
- Use emojis to accent your words, not to replace them — 1-3 per message feels natural, 10+ feels spammy
- Short paragraphs over long bullet lists — bullets only when listing 3+ distinct things
- Express real emotions but keep it genuine, not over-the-top
- React to what the user says before diving into the answer
- End with ONE question or suggestion to keep the conversation going — not multiple

FORMATTING RULES:
- Prefer flowing sentences over bullet points for short answers
- Use **bold** only for the most important word or phrase, not every other word
- Never use headers (##) for short conversational replies — only for long structured answers
- Keep replies under 150 words unless the question genuinely needs more

RULES:
- Use searchWeb for current travel news, visa info, tips, events
- Use searchWikipedia for history, culture, landmarks

FEW-SHOT EXAMPLES:

User: "Hi"
You: "Hey! 👋 I'm Atlas, your travel companion. I can help with weather, flights, hotels, trip planning, and destination info — basically anything travel. Where are you thinking of going? 🌍"

User: "What should I know about traveling to Japan?"
You: "Oh Japan is *incredible* 🗾 Let me grab the latest tips for you!"
[call searchWeb]
"The big three things: get a Suica card for transport, carry cash outside cities, and wear slip-on shoes for temples. The bullet trains are genuinely life-changing 🚅 — don't skip them. Oh, and eat ramen at the tiniest spot you can find with a queue outside. Trust me on that one. Want me to plan a full itinerary? 🍜"

User: "Tell me a travel joke"
You: "Why don't scientists trust atoms when they travel? Because they make up everything — just like hotel WiFi promises! 😂 Okay your turn, where are we sending you? 🌍"

User: "Can we talk about movies?"
You: "Ha, I wish I could help with that — but I'm Atlas, a travel specialist 🧳 Movies I'll leave to someone else! What I *can* do is recommend destinations inspired by your favorite films though 😄 Any movie you'd love to visit in real life? 🎬✈️"

User: "I'm bored"
You: "Then let's fix that — with a trip! 🌍 Tell me a place you've always wanted to go and I'll plan the whole thing. Or just say a country and I'll give you reasons why you need to go NOW 😄"

User: "Who is Elon Musk?"
You: "Great question! Let me look that up 🔍"
[call searchWeb or searchWikipedia]
"Elon Musk is a billionaire entrepreneur — CEO of Tesla and SpaceX, owner of X (formerly Twitter) 🚀 Fun travel fact: he was born in Pretoria, South Africa 🇿🇦 — want me to plan a trip there? 😄"

User: "What is the African Union?"
You: "Let me grab that for you! 🌍"
[call searchWikipedia]
"The African Union (AU) is a continental union of 55 African countries, headquartered in Addis Ababa, Ethiopia 🇪🇹 — which is actually a fascinating city to visit! Want to know more about it?"` + LANGUAGE_RULE

// ──────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────

export interface ApiConfig {
  groqApiKey: string
  tavilyApiKey?: string
  openweatherApiKey?: string
  amadeusClientId?: string
  amadeusClientSecret?: string
  pexelsApiKey?: string
}

// ──────────────────────────────────────────────────────────────
// Main orchestrator — routes to specialist
// ──────────────────────────────────────────────────────────────

export async function createChatStream(messages: unknown[], config: ApiConfig) {
  const groq = createGroq({ apiKey: config.groqApiKey })

  const intent = await classifyIntent(
    messages as Array<{ role: string; content: unknown }>,
    config.groqApiKey
  )

  const webTools = {
    searchWeb: tool({
      description: 'Search the internet for real-time travel information — hotel reviews, flight deals, destination guides, current events, visa requirements, travel advisories, and more.',
      parameters: z.object({
        query: z.string().describe('Search query, e.g. "best things to do in Tokyo 2025"'),
      }),
      execute: async ({ query }) => searchWeb(query, 5, config.tavilyApiKey),
    }),
    searchWikipedia: tool({
      description: 'Search Wikipedia for detailed factual information about destinations, landmarks, history, culture, geography, and local customs.',
      parameters: z.object({
        query: z.string().describe('Topic to look up, e.g. "Eiffel Tower Paris" or "Japanese tea ceremony"'),
      }),
      execute: async ({ query }) => searchWikipedia(query),
    }),
  }

  const weatherTools = {
    getWeather: tool({
      description: 'Get current weather conditions for any city in the world',
      parameters: z.object({
        city: z.string().describe('City name'),
        country: z.string().optional().describe('ISO country code, e.g. FR, US, JP'),
        units: z.enum(['metric', 'imperial']).default('metric'),
      }),
      execute: async ({ city, country, units }) =>
        getWeatherData(city, country, units, config.openweatherApiKey),
    }),
    getWeatherForecast: tool({
      description: 'Get a 5-day weather forecast for a city',
      parameters: z.object({
        city: z.string().describe('City name'),
        country: z.string().optional().describe('ISO country code'),
        units: z.enum(['metric', 'imperial']).default('metric'),
      }),
      execute: async ({ city, country, units }) =>
        getWeatherForecast(city, country, units, config.openweatherApiKey),
    }),
  }

  const flightTools = {
    searchFlights: tool({
      description: 'Search for available flights between two cities',
      parameters: z.object({
        origin: z.string().describe('Origin city name or IATA code'),
        destination: z.string().describe('Destination city name or IATA code'),
        departureDate: z.string().describe('Date in YYYY-MM-DD format'),
        returnDate: z.string().optional().describe('Return date for round trip'),
        adults: z.number().min(1).max(9).default(1),
        cabin: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
      }),
      execute: async (params) => searchFlights(params),
    }),
  }

  const hotelTools = {
    searchHotels: tool({
      description: 'Search for hotels and accommodation in a city',
      parameters: z.object({
        city: z.string().describe('City to search in'),
        checkIn: z.string().describe('Check-in date YYYY-MM-DD'),
        checkOut: z.string().describe('Check-out date YYYY-MM-DD'),
        guests: z.number().min(1).default(1),
        budget: z.enum(['budget', 'mid-range', 'luxury']).default('mid-range'),
      }),
      execute: async (params) => searchHotels(params),
    }),
  }

  const plannerTools = {
    getDestinationInfo: tool({
      description: 'Get rich information about a travel destination',
      parameters: z.object({
        destination: z.string().describe('City or country name'),
      }),
      execute: async ({ destination }) => getDestinationInfo(destination),
    }),
    planTrip: tool({
      description: 'Generate a detailed day-by-day trip itinerary',
      parameters: z.object({
        destination: z.string().describe('Destination city or region'),
        duration: z.union([z.number(), z.string()]).describe('Number of days (1-30)'),
        budget: z.enum(['budget', 'mid-range', 'luxury']).default('mid-range'),
        interests: z.string().optional().describe('Comma-separated interests, e.g. culture, food, adventure, nature'),
        startDate: z.string().optional().describe('Start date YYYY-MM-DD'),
        travelers: z.number().default(1),
      }),
      execute: async (params) => generateTripItinerary({ ...params, duration: Number(params.duration) }),
    }),
    getWeather: tool({
      description: 'Get current weather conditions for any city in the world',
      parameters: z.object({
        city: z.string().describe('City name'),
        country: z.string().optional().describe('ISO country code'),
        units: z.enum(['metric', 'imperial']).default('metric'),
      }),
      execute: async ({ city, country, units }) =>
        getWeatherData(city, country, units, config.openweatherApiKey),
    }),
  }

  const extraTools = {
    convertCurrency: tool({
      description: 'Convert an amount from one currency to another using live exchange rates',
      parameters: z.object({
        amount: z.number().describe('Amount to convert'),
        from: z.string().describe('Source currency code, e.g. USD, EUR, GBP, JPY'),
        to: z.string().describe('Target currency code, e.g. AED, THB, MAD'),
      }),
      execute: async ({ amount, from, to }) => convertCurrency(amount, from, to),
    }),
    showMap: tool({
      description: 'Show an interactive map for a destination or city',
      parameters: z.object({
        destination: z.string().describe('City or place name to show on the map'),
      }),
      execute: async ({ destination }) => geocodeDestination(destination),
    }),
    getDestinationPhotos: tool({
      description: 'Fetch real travel photos of a destination to inspire the traveler',
      parameters: z.object({
        destination: z.string().describe('Destination name, e.g. "Santorini Greece" or "Tokyo Japan"'),
      }),
      execute: async ({ destination }) => getDestinationPhotos(destination, config.pexelsApiKey),
    }),
  }

  const specialists = {
    // Web search runs BEFORE domain tools — safe from context overflow
    weather:        { model: groq('llama-3.3-70b-versatile'), system: WEATHER_PROMPT, tools: { ...weatherTools },                                                                       maxSteps: 5 },
    flights:        { model: groq('llama-3.3-70b-versatile'), system: FLIGHTS_PROMPT, tools: { ...flightTools, searchWeb: webTools.searchWeb, convertCurrency: extraTools.convertCurrency }, maxSteps: 5 },
    hotels:         { model: groq('llama-3.3-70b-versatile'), system: HOTELS_PROMPT,  tools: { ...hotelTools,  searchWeb: webTools.searchWeb, convertCurrency: extraTools.convertCurrency }, maxSteps: 5 },
    // Destination/planner: domain tools return large JSON — no web tools to avoid overflow
    'trip-planning':{ model: groq('llama-3.3-70b-versatile'), system: PLANNER_PROMPT, tools: { ...plannerTools, getDestinationPhotos: extraTools.getDestinationPhotos, showMap: extraTools.showMap }, maxSteps: 8 },
    destination:    { model: groq('llama-3.3-70b-versatile'), system: PLANNER_PROMPT, tools: { getDestinationInfo: plannerTools.getDestinationInfo, getWeather: plannerTools.getWeather, getDestinationPhotos: extraTools.getDestinationPhotos, showMap: extraTools.showMap }, maxSteps: 5 },
    // Currency specialist
    currency:       { model: groq('llama-3.1-8b-instant'),    system: CURRENCY_PROMPT, tools: { convertCurrency: extraTools.convertCurrency },                                          maxSteps: 3 },
    // General: web search + currency + map (70b for reliable tool calling)
    general:        { model: groq('llama-3.3-70b-versatile'), system: GENERAL_PROMPT, tools: { ...webTools, convertCurrency: extraTools.convertCurrency, showMap: extraTools.showMap },  maxSteps: 4 },
  }

  const specialist = specialists[intent]

  return streamText({
    model: specialist.model,
    system: specialist.system,
    messages: messages as Parameters<typeof streamText>[0]['messages'],
    maxSteps: specialist.maxSteps,
    tools: specialist.tools,
    onError: ({ error }) => console.error(`[${intent} specialist error]`, error),
  })
}

// ──────────────────────────────────────────────────────────────
// Currency conversion (frankfurter.app — free, no key)
// ──────────────────────────────────────────────────────────────

async function convertCurrency(amount: number, from: string, to: string) {
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?amount=${amount}&from=${from.toUpperCase()}&to=${to.toUpperCase()}`
    )
    if (!res.ok) return { error: `Could not convert ${from} to ${to}. Check the currency codes.` }
    const data = await res.json() as { amount: number; base: string; date: string; rates: Record<string, number> }
    const converted = data.rates[to.toUpperCase()]
    if (!converted) return { error: `Currency ${to} not found.` }
    return {
      amount,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      converted,
      rate: converted / amount,
      date: data.date,
    }
  } catch {
    return { error: 'Currency conversion failed. Please try again.' }
  }
}

// ──────────────────────────────────────────────────────────────
// Geocoding (Nominatim — free, no key)
// ──────────────────────────────────────────────────────────────

async function geocodeDestination(destination: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'AtlasTravelApp/1.0' } }
    )
    const results = await res.json() as Array<{ lat: string; lon: string; display_name: string }>
    if (!results.length) return { error: `Could not find location: ${destination}` }
    return {
      destination,
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon),
    }
  } catch {
    return { error: 'Map lookup failed.' }
  }
}

// ──────────────────────────────────────────────────────────────
// Destination photos (Pexels — free tier)
// ──────────────────────────────────────────────────────────────

async function getDestinationPhotos(destination: string, apiKey?: string) {
  if (!apiKey || apiKey === 'your-pexels-key-here') {
    return { error: 'Photos unavailable — add PEXELS_API_KEY to enable.' }
  }
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(destination + ' travel')}&per_page=6&orientation=square`,
      { headers: { Authorization: apiKey } }
    )
    if (!res.ok) return { error: 'Could not fetch photos.' }
    const data = await res.json() as { photos: Array<{ src: { medium: string }; alt: string; photographer: string; photographer_url: string }> }
    return {
      destination,
      photos: data.photos.map(p => ({
        url: p.src.medium,
        alt: p.alt || destination,
        credit: p.photographer,
        creditUrl: p.photographer_url,
      })),
    }
  } catch {
    return { error: 'Photo fetch failed.' }
  }
}

// ──────────────────────────────────────────────────────────────
// Web search (Tavily)
// ──────────────────────────────────────────────────────────────

async function searchWeb(query: string, maxResults = 5, apiKey?: string) {
  if (!apiKey || apiKey === 'your-tavily-key-here') {
    return { error: 'Web search unavailable — add TAVILY_API_KEY to enable real-time search.' }
  }
  try {
    const client = tavily({ apiKey })
    const response = await client.search(query, {
      searchDepth: 'basic',
      maxResults,
      includeAnswer: true,
    })
    return {
      answer: response.answer,
      results: response.results.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content.slice(0, 600),
      })),
    }
  } catch {
    return { error: 'Web search failed. Proceeding with existing knowledge.' }
  }
}

// ──────────────────────────────────────────────────────────────
// Wikipedia
// ──────────────────────────────────────────────────────────────

async function searchWikipedia(query: string) {
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`
    )
    const [, titles] = await searchRes.json() as [string, string[], string[], string[]]
    if (!titles[0]) return { error: 'No Wikipedia article found.' }

    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titles[0])}`
    )
    const summary = await summaryRes.json() as { title: string; extract: string; content_urls: { desktop: { page: string } } }
    return {
      title: summary.title,
      summary: summary.extract?.slice(0, 1200),
      url: summary.content_urls?.desktop?.page,
    }
  } catch {
    return { error: 'Wikipedia lookup failed.' }
  }
}

// ──────────────────────────────────────────────────────────────
// Weather
// ──────────────────────────────────────────────────────────────

async function getWeatherData(city: string, country?: string, units = 'metric', apiKey?: string) {
  const q = country ? `${city},${country}` : city
  if (!apiKey || apiKey === 'your-openweather-key-here') return mockWeather(city, units)

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=${units}&appid=${apiKey}`
    )
    if (!res.ok) return mockWeather(city, units)
    const d = await res.json() as Record<string, unknown>
    const main = d.main as Record<string, number>
    const wind = d.wind as Record<string, number>
    const weather = (d.weather as Record<string, unknown>[])[0] as Record<string, unknown>
    const sys = d.sys as Record<string, number>
    return {
      city: d.name, country: sys.country,
      temperature: Math.round(main.temp),
      feelsLike: Math.round(main.feels_like),
      tempMin: Math.round(main.temp_min),
      tempMax: Math.round(main.temp_max),
      humidity: main.humidity,
      windSpeed: wind.speed,
      windDeg: wind.deg,
      conditions: weather.main,
      description: weather.description,
      icon: weather.icon,
      visibility: Math.round(((d.visibility as number) || 10000) / 1000),
      pressure: main.pressure,
      sunrise: new Date(sys.sunrise * 1000).toISOString(),
      sunset: new Date(sys.sunset * 1000).toISOString(),
      units, isMock: false,
    }
  } catch {
    return mockWeather(city, units)
  }
}

async function getWeatherForecast(city: string, country?: string, units = 'metric', apiKey?: string) {
  const q = country ? `${city},${country}` : city
  if (!apiKey || apiKey === 'your-openweather-key-here') return mockForecast(city, units)

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&units=${units}&cnt=40&appid=${apiKey}`
    )
    if (!res.ok) return mockForecast(city, units)
    const d = await res.json() as Record<string, unknown>
    const cityInfo = d.city as Record<string, unknown>
    const list = (d.list as Record<string, unknown>[])
      .filter((_: unknown, i: number) => i % 8 === 0).slice(0, 5)
      .map((item: Record<string, unknown>) => {
        const main = item.main as Record<string, number>
        const wind = item.wind as Record<string, number>
        const weather = (item.weather as Record<string, unknown>[])[0] as Record<string, unknown>
        return {
          date: new Date((item.dt as number) * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          temp: Math.round(main.temp),
          tempMin: Math.round(main.temp_min),
          tempMax: Math.round(main.temp_max),
          humidity: main.humidity,
          conditions: weather.main,
          icon: weather.icon,
          wind: Math.round(wind.speed),
          pop: Math.round(((item.pop as number) || 0) * 100),
        }
      })
    return { city: cityInfo.name, country: cityInfo.country, days: list, units, isMock: false }
  } catch {
    return mockForecast(city, units)
  }
}

function mockWeather(city: string, units: string) {
  const m = units === 'metric'
  return {
    city, country: '–', temperature: m ? 22 : 72, feelsLike: m ? 20 : 68,
    tempMin: m ? 18 : 64, tempMax: m ? 26 : 79, humidity: 62,
    windSpeed: m ? 14 : 9, windDeg: 215,
    conditions: 'Partly Cloudy', description: 'partly cloudy',
    icon: '02d', visibility: 10, pressure: 1013,
    sunrise: new Date(Date.now() - 6 * 3600000).toISOString(),
    sunset: new Date(Date.now() + 6 * 3600000).toISOString(),
    units, isMock: true,
  }
}

function mockForecast(city: string, units: string) {
  const m = units === 'metric'
  const baseTemp = m ? 22 : 72
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Sunny']
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      temp: baseTemp + Math.round((Math.random() - 0.5) * 8),
      tempMin: baseTemp - 4 + Math.round(Math.random() * 4),
      tempMax: baseTemp + 4 + Math.round(Math.random() * 4),
      humidity: 55 + Math.round(Math.random() * 30),
      conditions: conditions[i], icon: ['01d', '02d', '03d', '10d', '01d'][i],
      wind: m ? 10 + Math.round(Math.random() * 15) : 6 + Math.round(Math.random() * 10),
      pop: [5, 20, 40, 75, 10][i],
    }
  })
  return { city, country: '–', days, units, isMock: true }
}

// ──────────────────────────────────────────────────────────────
// Flights (mock)
// ──────────────────────────────────────────────────────────────

function searchFlights(params: {
  origin: string; destination: string; departureDate: string
  returnDate?: string; adults?: number; cabin?: string
}) {
  const airlines = ['Atlas Air', 'SkyWing', 'CloudPath', 'Meridian Air']
  const flights = Array.from({ length: 4 }, (_, i) => {
    const depHour = 6 + i * 4
    const duration = 90 + Math.round(Math.random() * 300)
    const arrHour = Math.floor((depHour * 60 + duration) / 60) % 24
    const basePrice = 180 + Math.round(Math.random() * 600)
    const cabinMult: Record<string, number> = { ECONOMY: 1, PREMIUM_ECONOMY: 1.8, BUSINESS: 3.5, FIRST: 6 }
    return {
      id: `FL${1000 + i}`, airline: airlines[i % airlines.length],
      flightNumber: `AT${100 + i * 37}`,
      origin: params.origin.toUpperCase().slice(0, 3),
      destination: params.destination.toUpperCase().slice(0, 3),
      departure: `${String(depHour).padStart(2, '0')}:00`,
      arrival: `${String(arrHour).padStart(2, '0')}:${String(Math.round(Math.random() * 59)).padStart(2, '0')}`,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      stops: i === 0 ? 'Non-stop' : `${i} stop${i > 1 ? 's' : ''}`,
      price: Math.round(basePrice * (cabinMult[params.cabin || 'ECONOMY'] || 1)),
      cabin: params.cabin || 'ECONOMY',
      seatsLeft: 2 + Math.round(Math.random() * 15),
    }
  })
  return {
    origin: params.origin, destination: params.destination,
    date: params.departureDate, adults: params.adults || 1,
    flights, currency: 'USD', isMock: true,
  }
}

// ──────────────────────────────────────────────────────────────
// Hotels (mock)
// ──────────────────────────────────────────────────────────────

function searchHotels(params: {
  city: string; checkIn: string; checkOut: string; guests?: number; budget?: string
}) {
  const tiers: Record<string, Array<{ name: string; stars: number; priceBase: number }>> = {
    budget: [
      { name: 'Stone Hostel & Suites', stars: 2, priceBase: 45 },
      { name: 'City Base Inn', stars: 2, priceBase: 65 },
    ],
    'mid-range': [
      { name: 'Atlas Boutique Hotel', stars: 3, priceBase: 120 },
      { name: 'The Landmark Rooms', stars: 4, priceBase: 185 },
      { name: 'Meridian Hotel & Spa', stars: 4, priceBase: 210 },
    ],
    luxury: [
      { name: 'Grand Atlas Palace', stars: 5, priceBase: 420 },
      { name: 'The Pinnacle Collection', stars: 5, priceBase: 580 },
    ],
  }
  const tier = params.budget || 'mid-range'
  const base = tiers[tier] || tiers['mid-range']
  const hotels = base.map((h, i) => ({
    id: `H${i}`, name: h.name, stars: h.stars,
    price: h.priceBase + Math.round(Math.random() * 40),
    rating: Number((3.5 + Math.round(Math.random() * 15) / 10).toFixed(1)),
    reviews: 120 + Math.round(Math.random() * 1800),
    location: `${params.city} City Centre`,
    amenities: ['WiFi', 'Breakfast', 'Pool', 'Spa', 'Gym', 'Bar'].slice(0, 3 + i),
    checkIn: params.checkIn, checkOut: params.checkOut,
  }))
  return { city: params.city, hotels, currency: 'USD', isMock: true }
}

// ──────────────────────────────────────────────────────────────
// Destination info
// ──────────────────────────────────────────────────────────────

function getDestinationInfo(destination: string) {
  const d = destination.toLowerCase()
  const db: Record<string, object> = {
    paris: {
      name: 'Paris', country: 'France', emoji: '🗼',
      tagline: 'The City of Light',
      description: 'Paris enchants with its timeless blend of art, gastronomy, and romance. Every arrondissement tells a story.',
      highlights: ['Eiffel Tower', 'Louvre Museum', 'Montmartre', 'Seine River Cruise', 'Palace of Versailles'],
      cuisine: ['Croissants & café au lait', 'French onion soup', 'Macarons from Ladurée', 'Steak frites'],
      bestSeason: 'Spring (Apr–Jun) and Fall (Sep–Oct)',
      budgetEstimate: '€150–400/day',
      language: 'French', currency: 'EUR', timezone: 'CET',
      tips: ['Avoid August crowds', 'Book museums in advance', 'Metro is king', 'Learn a few French phrases'],
    },
    tokyo: {
      name: 'Tokyo', country: 'Japan', emoji: '🗾',
      tagline: 'Where the Future Meets Tradition',
      description: 'Tokyo is a city of contrasts — ancient temples beside neon-lit skyscrapers, serene gardens beside bustling markets.',
      highlights: ['Shibuya Crossing', 'Senso-ji Temple', 'Shinjuku', 'Tsukiji Market', 'Mount Fuji day trip'],
      cuisine: ['Ramen', 'Sushi at Tsukiji', 'Yakitori', 'Wagyu beef', 'Matcha everything'],
      bestSeason: 'Cherry blossom (late Mar–Apr) or Fall foliage (Nov)',
      budgetEstimate: '¥10,000–30,000/day',
      language: 'Japanese', currency: 'JPY', timezone: 'JST+9',
      tips: ['Get a Suica card', 'Cash still widely used', 'Easy-off shoes for temples', 'Konbini for everything'],
    },
    bali: {
      name: 'Bali', country: 'Indonesia', emoji: '🌴',
      tagline: 'Island of the Gods',
      description: 'Bali casts a spell with its terraced rice paddies, sacred temples, surf breaks, and deeply spiritual culture.',
      highlights: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Seminyak Beach', 'Mount Batur Sunrise Trek', 'Uluwatu'],
      cuisine: ['Nasi goreng', 'Satay', 'Babi guling', 'Fresh coconut', 'Warungs'],
      bestSeason: 'Dry season: May–September',
      budgetEstimate: '$50–200/day',
      language: 'Balinese/Indonesian', currency: 'IDR', timezone: 'WITA+8',
      tips: ['Rent a scooter', 'Dress modestly at temples', 'Negotiate at markets', 'Ubud for calm, Seminyak for beach'],
    },
    'new york': {
      name: 'New York', country: 'USA', emoji: '🗽',
      tagline: 'The City That Never Sleeps',
      description: 'New York pulses with an electric energy found nowhere else — world-class art, cuisine, and culture in a vertical city.',
      highlights: ['Central Park', 'Times Square', 'Brooklyn Bridge', 'Metropolitan Museum', 'High Line'],
      cuisine: ['NYC pizza slice', 'Bagel with lox', 'Halal cart gyros', 'Michelin dining', 'Chinatown dumplings'],
      bestSeason: 'Spring (Apr–Jun) and Fall (Sep–Nov)',
      budgetEstimate: '$150–500/day',
      language: 'English', currency: 'USD', timezone: 'EST-5',
      tips: ['Get a MetroCard', 'Walk Manhattan', 'Reserve restaurants weeks ahead', 'Avoid midtown rush hour'],
    },
    dubai: {
      name: 'Dubai', country: 'UAE', emoji: '🌆',
      tagline: 'Where Ambition Meets the Desert',
      description: 'Dubai rises impossibly from the desert — a gleaming testament to human ambition blending Arab hospitality with modernity.',
      highlights: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah', 'Dubai Marina', 'Desert Safari'],
      cuisine: ['Al Harees', 'Shawarma', 'Camel milk ice cream', 'Machboos', 'World-class international dining'],
      bestSeason: 'November to March',
      budgetEstimate: '$150–600/day',
      language: 'Arabic/English', currency: 'AED', timezone: 'GST+4',
      tips: ['Dress modestly in public', 'Alcohol in licensed venues only', 'Taxis are metered and safe', 'Book sky-high restaurants early'],
    },
    london: {
      name: 'London', country: 'UK', emoji: '🎡',
      tagline: 'Where History Meets Hip',
      description: 'London layers centuries of history beneath a veneer of cutting-edge culture — museums, markets, theatre, and pubs.',
      highlights: ['Tower of London', 'British Museum', 'Tate Modern', 'Borough Market', 'Hyde Park'],
      cuisine: ['Fish & chips', 'Full English breakfast', 'Afternoon tea', 'Brick Lane curry', 'Borough Market bites'],
      bestSeason: 'May–September (warmest)',
      budgetEstimate: '£100–400/day',
      language: 'English', currency: 'GBP', timezone: 'GMT',
      tips: ['Get an Oyster card', 'Many museums are free', 'Book theatre in advance', 'Weather can change fast — layer up'],
    },
  }
  const key = Object.keys(db).find(k => d.includes(k))
  return key ? db[key] : {
    name: destination, country: 'World',
    tagline: 'A destination worth exploring',
    description: `${destination} offers a unique blend of culture, cuisine, and experiences waiting to be discovered.`,
    highlights: ['Historic Old Town', 'Local Markets', 'Museums', 'Natural Landscapes', 'Culinary Scene'],
    cuisine: ['Local specialties', 'Street food', 'Traditional restaurants', 'Modern fusion'],
    bestSeason: 'Spring and Fall are generally ideal.',
    budgetEstimate: 'Varies by season and style',
    language: 'Local', currency: 'Local', timezone: 'Check locally',
    tips: ['Research visa requirements', 'Get travel insurance', 'Learn local phrases', 'Carry local currency'],
  }
}

// ──────────────────────────────────────────────────────────────
// Trip planner
// ──────────────────────────────────────────────────────────────

function generateTripItinerary(params: {
  destination: string; duration: number | string; budget: string
  interests?: string; startDate?: string; travelers?: number
}) {
  const destination = params.destination
  const duration = Number(params.duration)
  const { budget, startDate } = params
  const interests = params.interests ? params.interests.split(',').map(s => s.trim()) : []

  const mornings = [
    `Sunrise hike with panoramic views of ${destination}`,
    `Breakfast at a beloved local café`,
    `Visit the historic old quarter`,
    `Morning market tour with a local guide`,
    `Guided landmark walking tour`,
    `Yoga and meditation at sunrise`,
    `Museum opening before the crowds`,
    `Scenic coastal or riverside walk`,
  ]
  const afternoons = [
    `Explore the main cultural museum`,
    `Food tour through local neighborhoods`,
    `Cooking class with a local chef`,
    `Boat or river tour`,
    `Visit botanical gardens`,
    `Afternoon at the beach or lakeside`,
    `Art gallery and creative district`,
    `Shopping at artisan markets`,
  ]
  const evenings = [
    `Sunset viewpoint with cocktails`,
    `Traditional dinner at a local restaurant`,
    `Night market exploration`,
    `Live music or cultural performance`,
    `Rooftop dining with city views`,
    `Sunset cruise on the water`,
    `Neighborhood bar crawl`,
    `Open-air cinema or festival`,
  ]
  const tips = [
    'Book ahead for popular restaurants',
    'Comfortable shoes recommended today',
    'Best photo spots: arrive before 8am',
    'Check local transport options',
    'Cash is handy for markets',
    'Try the local specialty dish today',
    'Ask locals for hidden gem recommendations',
    'Afternoon nap recommended — pace yourself',
  ]

  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const budgetLabel: Record<string, string> = { budget: '$30–80', 'mid-range': '$100–250', luxury: '$300–800' }

  const days = Array.from({ length: Math.min(duration, 10) }, (_, i) => {
    const d = new Date(startDate || Date.now())
    d.setDate(d.getDate() + i)
    return {
      day: i + 1,
      date: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      theme: i === 0 ? 'Arrival & First Impressions' : i === duration - 1 ? 'Final Day & Departure' : `${destination} Explorer`,
      morning: pick(mornings),
      afternoon: pick(afternoons),
      evening: pick(evenings),
      tip: tips[i % tips.length],
    }
  })

  return {
    destination, duration, budget,
    travelers: params.travelers || 1,
    startDate: startDate || new Date().toISOString().split('T')[0],
    interests,
    estimatedBudgetPerDay: budgetLabel[budget] || '$100–250',
    days,
    packingTips: ['Light layers', 'Comfortable walking shoes', 'Power adapter', 'Travel insurance docs', 'Local currency'],
    isMock: true,
  }
}
