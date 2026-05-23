import { Cloud, Plane, Hotel, Map, Calendar } from 'lucide-react'

const TOOL_META: Record<string, { icon: React.ElementType; label: string }> = {
  getWeather: { icon: Cloud, label: 'Fetching weather data…' },
  getWeatherForecast: { icon: Cloud, label: 'Loading forecast…' },
  searchFlights: { icon: Plane, label: 'Searching flights…' },
  searchHotels: { icon: Hotel, label: 'Browsing hotels…' },
  getDestinationInfo: { icon: Map, label: 'Loading destination…' },
  planTrip: { icon: Calendar, label: 'Building itinerary…' },
}

export function ToolLoadingCard({ toolName }: { toolName: string }) {
  const meta = TOOL_META[toolName] || { icon: Map, label: 'Processing…' }
  const Icon = meta.icon

  return (
    <div className="stone-card px-4 py-3 flex items-center gap-3 min-w-[220px]">
      <div className="w-8 h-8 rounded-lg bg-stone-700/60 flex items-center justify-center flex-none">
        <Icon className="w-4 h-4 text-amber-400" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-stone-400 text-sm">{meta.label}</span>
        <span className="w-3.5 h-3.5 border-2 border-stone-600 border-t-amber-400 rounded-full animate-spin flex-none" />
      </div>
    </div>
  )
}
