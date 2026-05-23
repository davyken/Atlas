import { MapPin, Calendar, DollarSign, Globe, Lightbulb, Utensils, Camera } from 'lucide-react'

interface DestinationData {
  name: string
  country: string
  emoji?: string
  tagline: string
  description: string
  highlights: string[]
  cuisine: string[]
  bestSeason: string
  budgetEstimate: string
  language: string
  currency: string
  timezone: string
  tips: string[]
}

interface Props {
  data: Record<string, unknown>
}

export function DestinationCard({ data }: Props) {
  const dest = data as unknown as DestinationData

  return (
    <div className="stone-card-solid overflow-hidden min-w-[300px] max-w-xl w-full animate-slide-up">
      {/* Hero */}
      <div className="px-5 pt-5 pb-4 border-b border-stone-700/50">
        <div className="flex items-start gap-3">
          {dest.emoji && (
            <span className="text-4xl flex-none leading-none" role="img">{dest.emoji}</span>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-xl font-semibold text-stone-100">{dest.name}</h3>
              <span className="amber-badge">{dest.country}</span>
            </div>
            <p className="text-amber-400/80 text-sm italic mt-0.5">{dest.tagline}</p>
          </div>
        </div>
        <p className="text-stone-400 text-sm leading-relaxed mt-3">{dest.description}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Highlights */}
        <Section icon={Camera} label="Top Highlights">
          <div className="flex flex-wrap gap-1.5 mt-2">
            {dest.highlights.map((h) => (
              <span key={h} className="text-xs bg-stone-700/50 text-stone-300 rounded-lg px-2.5 py-1 border border-stone-600/30">
                {h}
              </span>
            ))}
          </div>
        </Section>

        {/* Cuisine */}
        <Section icon={Utensils} label="Must-Eat">
          <div className="flex flex-wrap gap-1.5 mt-2">
            {dest.cuisine.slice(0, 4).map((c) => (
              <span key={c} className="text-xs bg-amber-500/10 text-amber-300/80 rounded-lg px-2.5 py-1 border border-amber-500/20">
                {c}
              </span>
            ))}
          </div>
        </Section>

        {/* Practical info grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <InfoItem icon={Calendar} label="Best Season" value={dest.bestSeason} />
          <InfoItem icon={DollarSign} label="Daily Budget" value={dest.budgetEstimate} />
          <InfoItem icon={Globe} label="Language" value={dest.language} />
          <InfoItem icon={MapPin} label="Timezone" value={dest.timezone} />
        </div>

        {/* Tips */}
        {dest.tips && dest.tips.length > 0 && (
          <Section icon={Lightbulb} label="Travel Tips">
            <ul className="mt-2 space-y-1.5">
              {dest.tips.slice(0, 4).map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-stone-400">
                  <span className="mt-1 w-1 h-1 rounded-full bg-amber-500/50 flex-none" />
                  {tip}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-stone-500" />
        <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      {children}
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-stone-800/60 rounded-xl px-3 py-2.5 border border-stone-700/30">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-stone-500" />
        <span className="text-[10px] text-stone-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xs text-stone-300 font-medium">{value}</p>
    </div>
  )
}
