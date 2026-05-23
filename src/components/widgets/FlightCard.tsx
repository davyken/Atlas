import { Plane, Clock, Users, ChevronRight, Zap } from 'lucide-react'

interface Flight {
  id: string
  airline: string
  flightNumber: string
  origin: string
  destination: string
  departure: string
  arrival: string
  duration: string
  stops: string
  price: number
  cabin: string
  seatsLeft: number
}

interface FlightData {
  origin: string
  destination: string
  date: string
  adults: number
  flights: Flight[]
  currency: string
  isMock: boolean
}

interface Props {
  data: Record<string, unknown>
}

export function FlightResults({ data }: Props) {
  const fd = data as unknown as FlightData

  return (
    <div className="stone-card-solid overflow-hidden min-w-[320px] max-w-xl w-full animate-slide-up">
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="font-semibold text-stone-100 text-sm">
              {fd.origin} → {fd.destination}
            </h3>
            <p className="text-stone-500 text-xs">{fd.date} · {fd.adults} passenger{fd.adults !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className="amber-badge">{fd.flights.length} results</span>
      </div>

      {/* Flights */}
      <div className="divide-y divide-stone-700/30">
        {fd.flights.map((flight) => (
          <FlightRow key={flight.id} flight={flight} currency={fd.currency} />
        ))}
      </div>

      {fd.isMock && (
        <p className="text-center text-stone-600 text-[10px] py-2 border-t border-stone-700/30">
          Demo results · Connect Amadeus API for real flights
        </p>
      )}
    </div>
  )
}

function FlightRow({ flight, currency }: { flight: Flight; currency: string }) {
  return (
    <div className="px-5 py-4 hover:bg-stone-700/20 transition-colors group">
      <div className="flex items-center justify-between gap-4">
        {/* Airline + number */}
        <div className="flex-none">
          <div className="w-8 h-8 rounded-lg bg-stone-700/60 flex items-center justify-center mb-1">
            <Plane className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <p className="text-[10px] text-stone-500">{flight.flightNumber}</p>
        </div>

        {/* Route */}
        <div className="flex-1 flex items-center gap-2">
          <div className="text-center">
            <p className="text-base font-semibold text-stone-100">{flight.departure}</p>
            <p className="text-xs text-stone-500">{flight.origin}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-stone-600 text-[10px]">
              <Clock className="w-2.5 h-2.5" />
              {flight.duration}
            </div>
            <div className="w-full flex items-center gap-1">
              <div className="h-px flex-1 bg-stone-700" />
              {flight.stops === 'Non-stop'
                ? <Zap className="w-2.5 h-2.5 text-emerald-500" />
                : <div className="w-1.5 h-1.5 rounded-full bg-stone-600" />
              }
              <div className="h-px flex-1 bg-stone-700" />
            </div>
            <p className="text-[10px] text-stone-500">{flight.stops}</p>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-stone-100">{flight.arrival}</p>
            <p className="text-xs text-stone-500">{flight.destination}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex-none text-right">
          <p className="text-lg font-bold text-amber-400">
            {currency === 'USD' ? '$' : currency}{flight.price}
          </p>
          <p className="text-[10px] text-stone-500">{flight.cabin.replace('_', ' ')}</p>
          {flight.seatsLeft <= 5 && (
            <p className="text-[10px] text-red-400 mt-0.5">{flight.seatsLeft} left!</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-stone-500">{flight.airline}</span>
        <button className="text-xs text-amber-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Select <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
