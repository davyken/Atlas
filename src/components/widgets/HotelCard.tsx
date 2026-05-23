import { Hotel, Star, MapPin, Wifi, Coffee, Waves, Dumbbell, ChevronRight } from 'lucide-react'

const AMENITY_ICONS: Record<string, React.ElementType> = {
  WiFi: Wifi, Breakfast: Coffee, Pool: Waves, Gym: Dumbbell,
}

interface HotelItem {
  id: string
  name: string
  stars: number
  price: number
  rating: number
  reviews: number
  location: string
  amenities: string[]
  highlights: string
  checkIn: string
  checkOut: string
}

interface HotelData {
  city: string
  hotels: HotelItem[]
  currency: string
  isMock: boolean
}

interface Props {
  data: Record<string, unknown>
}

export function HotelResults({ data }: Props) {
  const hd = data as unknown as HotelData

  return (
    <div className="stone-card-solid overflow-hidden min-w-[320px] max-w-xl w-full animate-slide-up">
      <div className="px-5 py-4 border-b border-stone-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Hotel className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="font-semibold text-stone-100 text-sm">Hotels in {hd.city}</h3>
            <p className="text-stone-500 text-xs">{hd.hotels.length} options found</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-stone-700/30">
        {hd.hotels.map((hotel) => (
          <HotelRow key={hotel.id} hotel={hotel} currency={hd.currency} />
        ))}
      </div>

      {hd.isMock && (
        <p className="text-center text-stone-600 text-[10px] py-2 border-t border-stone-700/30">
          Demo results · Connect Amadeus API for live availability
        </p>
      )}
    </div>
  )
}

function HotelRow({ hotel, currency }: { hotel: HotelItem; currency: string }) {
  const stars = Math.round(hotel.stars)

  return (
    <div className="px-5 py-4 hover:bg-stone-700/20 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-stone-100 text-sm truncate">{hotel.name}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            ))}
            <span className="text-stone-500 text-[10px] ml-1">
              {hotel.rating.toFixed(1)} · {hotel.reviews.toLocaleString()} reviews
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin className="w-3 h-3 text-stone-500 flex-none" />
            <span className="text-xs text-stone-500 truncate">{hotel.location}</span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {hotel.amenities.slice(0, 4).map((amenity) => {
              const Icon = AMENITY_ICONS[amenity]
              return (
                <span key={amenity} className="flex items-center gap-1 text-[10px] text-stone-400 bg-stone-700/40 rounded-md px-1.5 py-0.5">
                  {Icon && <Icon className="w-2.5 h-2.5" />}
                  {amenity}
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex-none text-right">
          <p className="text-lg font-bold text-amber-400">
            {currency === 'USD' ? '$' : currency}{hotel.price}
          </p>
          <p className="text-[10px] text-stone-500">per night</p>
          <button className="mt-2 text-xs text-amber-400 flex items-center gap-1 ml-auto
                             opacity-0 group-hover:opacity-100 transition-opacity">
            Book <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-stone-600">
        {hotel.checkIn} → {hotel.checkOut}
      </div>
    </div>
  )
}
