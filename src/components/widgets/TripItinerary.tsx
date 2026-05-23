import { MapPin, Calendar, DollarSign, Users, Coffee, Sun, Moon, Lightbulb, Luggage } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface TripDay {
  day: number
  date: string
  theme: string
  morning: string
  afternoon: string
  evening: string
  tip: string
}

interface TripData {
  destination: string
  duration: number
  budget: string
  travelers: number
  startDate: string
  interests: string[]
  estimatedBudgetPerDay: string
  days: TripDay[]
  packingTips: string[]
  isMock: boolean
}

const RADAR_DATA = [
  { subject: 'Culture', value: 85 },
  { subject: 'Food', value: 90 },
  { subject: 'Nature', value: 70 },
  { subject: 'Adventure', value: 60 },
  { subject: 'Nightlife', value: 75 },
  { subject: 'Relaxation', value: 80 },
]

interface Props {
  data: Record<string, unknown>
}

export function TripItinerary({ data }: Props) {
  const trip = data as unknown as TripData

  return (
    <div className="stone-card-solid overflow-hidden min-w-[320px] max-w-2xl w-full animate-slide-up">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-stone-700/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-stone-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              {trip.destination}
            </h3>
            <p className="text-stone-400 text-sm mt-1">
              {trip.duration}-day {trip.budget} trip · {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <span className="amber-badge text-sm">{trip.estimatedBudgetPerDay}/day</span>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 mt-3">
          <MetaChip icon={Calendar} value={trip.startDate} />
          <MetaChip icon={Users} value={`${trip.travelers} traveler${trip.travelers !== 1 ? 's' : ''}`} />
          <MetaChip icon={DollarSign} value={`${trip.budget.charAt(0).toUpperCase()}${trip.budget.slice(1)}`} />
        </div>

        {trip.interests && trip.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {trip.interests.map((i) => (
              <span key={i} className="text-[10px] bg-stone-700/40 text-stone-400 px-2 py-0.5 rounded-full capitalize">
                {i}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Split: itinerary + radar */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* Days */}
        <div className="md:col-span-2 divide-y divide-stone-700/30">
          {trip.days.map((day) => (
            <DayCard key={day.day} day={day} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="border-t md:border-t-0 md:border-l border-stone-700/50 p-4 space-y-4">
          {/* Radar chart */}
          <div>
            <p className="text-[10px] text-stone-500 uppercase tracking-wide mb-2">Trip Vibe</p>
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="60%">
                <PolarGrid stroke="rgba(68,64,60,0.5)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#78716c' }} />
                <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
                <Tooltip contentStyle={{ background: '#1c1917', border: '1px solid #44403c', fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Packing */}
          <div>
            <p className="text-[10px] text-stone-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Luggage className="w-3 h-3" /> Pack List
            </p>
            <ul className="space-y-1">
              {trip.packingTips.map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-xs text-stone-400">
                  <span className="w-1 h-1 rounded-full bg-amber-500/50 flex-none" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {trip.isMock && (
        <p className="text-center text-stone-600 text-[10px] py-2 border-t border-stone-700/30">
          AI-generated itinerary · Personalised to your preferences
        </p>
      )}
    </div>
  )
}

function DayCard({ day }: { day: TripDay }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-none">
          <span className="text-amber-400 text-xs font-bold">{day.day}</span>
        </div>
        <div>
          <p className="text-stone-100 text-sm font-medium leading-none">{day.theme}</p>
          <p className="text-stone-500 text-[10px] mt-0.5">{day.date}</p>
        </div>
      </div>

      <div className="space-y-2 ml-9">
        <TimeSlot icon={Coffee} time="Morning" activity={day.morning} />
        <TimeSlot icon={Sun} time="Afternoon" activity={day.afternoon} />
        <TimeSlot icon={Moon} time="Evening" activity={day.evening} />
        <div className="flex items-start gap-1.5 mt-1.5">
          <Lightbulb className="w-3 h-3 text-amber-400/60 flex-none mt-0.5" />
          <p className="text-[10px] text-stone-500 italic">{day.tip}</p>
        </div>
      </div>
    </div>
  )
}

function TimeSlot({ icon: Icon, time, activity }: { icon: React.ElementType; time: string; activity: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3 h-3 text-stone-600 flex-none mt-0.5" />
      <div>
        <span className="text-[10px] text-stone-600 uppercase tracking-wide mr-1.5">{time}</span>
        <span className="text-xs text-stone-300">{activity}</span>
      </div>
    </div>
  )
}

function MetaChip({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-stone-400 bg-stone-800/60 px-2.5 py-1 rounded-lg">
      <Icon className="w-3 h-3" />
      {value}
    </div>
  )
}
