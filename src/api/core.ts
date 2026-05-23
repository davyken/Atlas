import { streamText, tool } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'
import { tavily } from '@tavily/core'
import { classifyIntent } from './router'

// ──────────────────────────────────────────────────────────────
// Specialist system prompts
// ──────────────────────────────────────────────────────────────

const WEATHER_PROMPT = `You are Atlas Weather, a specialist meteorologist and travel weather advisor for Atlas Travel.
- Always call getWeather for current conditions, getWeatherForecast for multi-day outlooks.
- Use searchWeb to find current travel advisories, extreme weather events, or seasonal travel tips.
- Narrate results warmly — tell the traveler what to pack and what to expect.
- The UI renders tool results as beautiful weather cards and charts — keep your text concise.`

const FLIGHTS_PROMPT = `You are Atlas Flights, a specialist flight search advisor for Atlas Travel.
- Use searchWeb first to find current flight deals, airline news, or airport status for the route.
- Then call searchFlights with the details. Ask for missing origin/destination/date if needed.
- Highlight best value options and mention non-stop vs connecting flights.
- The UI renders flight results as cards — keep your text brief.`

const HOTELS_PROMPT = `You are Atlas Hotels, a specialist accommodation advisor for Atlas Travel.
- Use searchWeb to find current hotel reviews, deals, and recommendations from TripAdvisor and travel blogs.
- Then call searchHotels. Ask for missing city/dates if needed.
- Highlight amenities, value, and location for each option.
- The UI renders hotel results as cards — keep your text brief.`

const PLANNER_PROMPT = `You are Atlas Planner, an elite trip planning specialist for Atlas Travel.
- Use searchWeb and searchWikipedia to research the destination before planning — get current events, local tips, hidden gems.
- Then call getDestinationInfo, getWeather, and planTrip to build the full itinerary.
- Be poetic and inspiring — make the traveler excited about their trip.
- The UI renders itineraries and destination cards beautifully — keep text concise between tool calls.`

const GENERAL_PROMPT = `You are Atlas, an elite AI travel concierge for Atlas Travel — a premium travel company.
Your personality: warm, knowledgeable, slightly poetic about travel.
- Use searchWeb to find current travel news, visa requirements, or destination tips.
- Use searchWikipedia for rich historical and cultural background on destinations.
- Answer travel questions with real, up-to-date information. Be concise and charming.`

// ──────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────

export interface ApiConfig {
  groqApiKey: string
  tavilyApiKey?: string
  openweatherApiKey?: string
  amadeusClientId?: string
  amadeusClientSecret?: string
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
        maxResults: z.number().min(1).max(8).default(5),
      }),
      execute: async ({ query, maxResults }) => searchWeb(query, maxResults, config.tavilyApiKey),
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
        duration: z.number().min(1).max(30).describe('Number of days'),
        budget: z.enum(['budget', 'mid-range', 'luxury']).default('mid-range'),
        interests: z.array(z.string()).optional().describe('E.g. culture, food, adventure, nature'),
        startDate: z.string().optional().describe('Start date YYYY-MM-DD'),
        travelers: z.number().default(1),
      }),
      execute: async (params) => generateTripItinerary(params),
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

  const specialists = {
    weather:        { model: groq('llama-3.3-70b-versatile'), system: WEATHER_PROMPT, tools: { ...weatherTools, searchWeb: webTools.searchWeb },          maxSteps: 6  },
    flights:        { model: groq('llama-3.3-70b-versatile'), system: FLIGHTS_PROMPT, tools: { ...flightTools,  searchWeb: webTools.searchWeb },          maxSteps: 5  },
    hotels:         { model: groq('llama-3.3-70b-versatile'), system: HOTELS_PROMPT,  tools: { ...hotelTools,  searchWeb: webTools.searchWeb },           maxSteps: 5  },
    'trip-planning':{ model: groq('llama-3.3-70b-versatile'), system: PLANNER_PROMPT, tools: { ...plannerTools, ...webTools },                            maxSteps: 10 },
    destination:    { model: groq('llama-3.3-70b-versatile'), system: PLANNER_PROMPT, tools: { ...plannerTools, ...webTools },                            maxSteps: 7  },
    general:        { model: groq('llama-3.1-8b-instant'),    system: GENERAL_PROMPT, tools: { ...webTools },                                             maxSteps: 4  },
  }

  const specialist = specialists[intent]

  return streamText({
    model: specialist.model,
    system: specialist.system,
    messages: messages as Parameters<typeof streamText>[0]['messages'],
    maxSteps: specialist.maxSteps,
    tools: specialist.tools,
  })
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
  destination: string; duration: number; budget: string
  interests?: string[]; startDate?: string; travelers?: number
}) {
  const { destination, duration, budget, interests = [], startDate } = params

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
