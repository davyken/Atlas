import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Droplets, Wind, Thermometer } from 'lucide-react'

const WEATHER_ICONS: Record<string, string> = {
  Sunny: '☀️', Clear: '☀️', 'Partly Cloudy': '⛅', Clouds: '☁️',
  Rain: '🌧️', 'Light Rain': '🌦️', Thunderstorm: '⛈️', Snow: '❄️',
  Mist: '🌫️', default: '🌤️',
}

interface ForecastData {
  city: string
  country?: string
  days: Array<{
    date: string
    temp: number
    tempMin: number
    tempMax: number
    humidity: number
    conditions: string
    icon?: string
    wind: number
    pop: number
  }>
  units: string
  isMock: boolean
}

interface Props {
  data: Record<string, unknown>
}

export function WeatherForecastWidget({ data }: Props) {
  const forecast = data as unknown as ForecastData
  const tempUnit = forecast.units === 'imperial' ? '°F' : '°C'
  const speedUnit = forecast.units === 'imperial' ? 'mph' : 'm/s'

  const chartData = forecast.days.map((d) => ({
    ...d,
    label: d.date.split(',')[0],
  }))

  return (
    <div className="stone-card-solid overflow-hidden min-w-[320px] max-w-xl w-full animate-slide-up">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-stone-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-stone-100">
              {forecast.city} <span className="text-stone-500 font-normal text-sm">{forecast.country}</span>
            </h3>
            <p className="text-stone-400 text-xs mt-0.5">5-Day Forecast</p>
          </div>
          <Thermometer className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      {/* Day cards row */}
      <div className="grid grid-cols-5 divide-x divide-stone-700/40 border-b border-stone-700/50">
        {forecast.days.map((day, i) => (
          <div key={i} className="flex flex-col items-center py-3 px-1 gap-1">
            <span className="text-[10px] text-stone-500 font-medium">{day.date.split(',')[0]}</span>
            <span className="text-lg">{WEATHER_ICONS[day.conditions] || WEATHER_ICONS.default}</span>
            <span className="text-sm font-semibold text-amber-400">{day.temp}{tempUnit}</span>
            <span className="text-[10px] text-stone-500">{day.tempMin}–{day.tempMax}</span>
          </div>
        ))}
      </div>

      {/* Temperature chart */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Thermometer className="w-3 h-3" /> Temperature Trend
        </p>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tempMinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#78716c" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#78716c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(68,64,60,0.3)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: '#d6d3d1' }}
              itemStyle={{ color: '#f59e0b' }}
              formatter={(v: number) => [`${v}${tempUnit}`, '']}
            />
            <Area type="monotone" dataKey="tempMax" name="High" stroke="#f59e0b" fill="url(#tempGrad)" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="tempMin" name="Low" stroke="#78716c" fill="url(#tempMinGrad)" strokeWidth={1.5} dot={{ fill: '#78716c', r: 2, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Precipitation + Wind chart */}
      <div className="px-4 pt-2 pb-4">
        <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Droplets className="w-3 h-3" /> Rain Chance &amp; Wind ({speedUnit})
        </p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(68,64,60,0.3)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: '#d6d3d1' }}
            />
            <Bar dataKey="pop" name="Rain %" fill="rgba(96,165,250,0.5)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="wind" name={`Wind (${speedUnit})`} fill="rgba(120,113,108,0.5)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!!data.isMock && (
        <p className="text-center text-stone-600 text-[10px] pb-2">
          Demo forecast · Add OpenWeatherMap API key for live data
        </p>
      )}
    </div>
  )
}
