import { Droplets, Wind, Eye, Gauge, Sunrise, Sunset, Thermometer } from 'lucide-react'

const WEATHER_ICONS: Record<string, string> = {
  Clear: '☀️', Sunny: '☀️', Clouds: '☁️', 'Partly Cloudy': '⛅',
  Rain: '🌧️', 'Light Rain': '🌦️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️',
  Haze: '🌫️', Smoke: '🌫️', default: '🌤️',
}

function getIcon(conditions: string) {
  return WEATHER_ICONS[conditions] || WEATHER_ICONS.default
}

function windDirection(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

interface WeatherWidgetProps {
  data: Record<string, unknown>
}

export function WeatherWidget({ data }: WeatherWidgetProps) {
  const tempUnit = data.units === 'imperial' ? '°F' : '°C'
  const speedUnit = data.units === 'imperial' ? 'mph' : 'm/s'

  return (
    <div className="weather-gradient rounded-2xl overflow-hidden min-w-[280px] max-w-sm animate-slide-up">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-stone-100">{String(data.city)}</h3>
              {!!data.country && data.country !== '–' && (
                <span className="amber-badge">{String(data.country)}</span>
              )}
            </div>
            <p className="text-stone-400 text-sm capitalize mt-0.5">{String(data.description)}</p>
          </div>
          <span className="text-4xl" role="img" aria-label={String(data.conditions)}>
            {getIcon(String(data.conditions))}
          </span>
        </div>

        <div className="mt-3 flex items-end gap-4">
          <div>
            <span className="text-5xl font-light text-amber-400">
              {String(data.temperature)}
            </span>
            <span className="text-2xl text-amber-400/70 font-light">{tempUnit}</span>
          </div>
          <div className="pb-2 text-stone-500 text-sm">
            <div>Feels {String(data.feelsLike)}{tempUnit}</div>
            <div>{String(data.tempMin)}{tempUnit} / {String(data.tempMax)}{tempUnit}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-stone-700/30 border-t border-stone-700/40">
        <Stat icon={Droplets} label="Humidity" value={`${data.humidity}%`} />
        <Stat icon={Wind} label="Wind" value={`${data.windSpeed} ${speedUnit} ${data.windDeg ? windDirection(Number(data.windDeg)) : ''}`} />
        <Stat icon={Eye} label="Visibility" value={`${data.visibility}km`} />
        <Stat icon={Gauge} label="Pressure" value={`${data.pressure}hPa`} />
        <Stat icon={Sunrise} label="Sunrise" value={data.sunrise ? new Date(String(data.sunrise)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '–'} />
        <Stat icon={Sunset} label="Sunset" value={data.sunset ? new Date(String(data.sunset)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '–'} />
      </div>

      {!!data.isMock && (
        <p className="text-center text-stone-600 text-[10px] py-2 bg-stone-900/40">
          Demo data · Add OpenWeatherMap API key for live weather
        </p>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 bg-stone-800/40">
      <Icon className="w-3.5 h-3.5 text-stone-500" />
      <span className="text-[10px] text-stone-500 uppercase tracking-wide">{label}</span>
      <span className="text-xs text-stone-300 font-medium">{value}</span>
    </div>
  )
}
