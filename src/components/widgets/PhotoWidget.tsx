import { Camera } from 'lucide-react'

interface Photo {
  url: string
  alt: string
  credit: string
  creditUrl: string
}

interface PhotoData {
  destination: string
  photos: Photo[]
  error?: string
}

export function PhotoWidget({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as PhotoData

  if (d.error || !d.photos?.length) return null

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-700/40 w-full">
      <div className="bg-stone-800/60 border-b border-stone-700/40 px-4 py-2.5 flex items-center gap-2">
        <Camera className="w-4 h-4 text-amber-400" />
        <span className="text-stone-200 text-sm font-medium">Photos — {d.destination}</span>
      </div>
      <div className="grid grid-cols-3 gap-0.5 bg-stone-900">
        {d.photos.slice(0, 6).map((photo, i) => (
          <a key={i} href={photo.creditUrl} target="_blank" rel="noopener noreferrer"
            className="relative aspect-square overflow-hidden group">
            <img
              src={photo.url}
              alt={photo.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-end p-1.5 opacity-0 group-hover:opacity-100">
              <span className="text-white text-[9px] truncate">{photo.credit}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
