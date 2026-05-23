import { Compass, Cloud, Plane, Map, Calendar, Thermometer } from 'lucide-react'

const SUGGESTIONS = [
  { icon: Cloud, label: 'Weather in Tokyo', text: 'What\'s the weather like in Tokyo right now?' },
  { icon: Plane, label: 'Find flights', text: 'Find me flights from New York to Paris next month' },
  { icon: Map, label: 'Plan a trip', text: 'Plan a 7-day trip to Bali for 2 people, mid-range budget' },
  { icon: Thermometer, label: '5-day forecast', text: 'Show me the 5-day weather forecast for Dubai' },
  { icon: Calendar, label: 'Best time to visit', text: 'When is the best time to visit Japan?' },
  { icon: Map, label: 'Destination guide', text: 'Tell me about Paris — highlights, food, tips' },
]

interface WelcomeScreenProps {
  onSuggest: (text: string) => void
}

export function WelcomeScreen({ onSuggest }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 animate-fade-in">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center glow-amber">
          <Compass className="w-8 h-8 text-amber-400" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-gradient-amber mb-2">
            Where to next?
          </h2>
          <p className="text-stone-400 text-sm max-w-md text-center leading-relaxed">
            I'm Atlas — your AI travel concierge. Ask me about weather, flights, hotels,
            or let me plan your perfect trip.
          </p>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
        {SUGGESTIONS.map(({ icon: Icon, label, text }) => (
          <button
            key={label}
            onClick={() => onSuggest(text)}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                       bg-stone-800/40 border border-stone-700/40 hover:border-amber-500/30
                       hover:bg-stone-800/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-700/60 flex items-center justify-center flex-none
                            group-hover:bg-amber-500/10 transition-colors">
              <Icon className="w-4 h-4 text-stone-400 group-hover:text-amber-400 transition-colors" />
            </div>
            <span className="text-stone-300 text-sm font-medium group-hover:text-stone-100 transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-stone-600 text-xs">
        Powered by Claude · Cloudflare Workers · Real-time data
      </p>
    </div>
  )
}
