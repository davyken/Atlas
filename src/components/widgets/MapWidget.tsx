import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

interface MapData {
  destination: string
  lat: number
  lon: number
  error?: string
}

export function MapWidget({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as MapData
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || d.error || !d.lat) return
    if (mapInstance.current) return

    import('leaflet').then((L) => {
      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false })
        .setView([d.lat, d.lon], 11)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      L.marker([d.lat, d.lon])
        .addTo(map)
        .bindPopup(`<b>${d.destination}</b>`)
        .openPopup()

      mapInstance.current = map
    })

    return () => {
      if (mapInstance.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapInstance.current as any).remove()
        mapInstance.current = null
      }
    }
  }, [d.lat, d.lon, d.destination, d.error])

  if (d.error) return null

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-700/40 w-full">
      <div className="bg-stone-800/60 border-b border-stone-700/40 px-4 py-2.5 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-amber-400" />
        <span className="text-stone-200 text-sm font-medium">{d.destination}</span>
      </div>
      <div ref={mapRef} className="h-56 w-full" />
    </div>
  )
}
