import { ArrowRight, TrendingUp } from 'lucide-react'

interface CurrencyData {
  amount: number
  from: string
  to: string
  converted: number
  rate: number
  date: string
  error?: string
}

export function CurrencyWidget({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as CurrencyData

  if (d.error) {
    return (
      <div className="rounded-2xl bg-stone-800/60 border border-stone-700/40 p-4 text-stone-400 text-sm">
        {d.error}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-stone-800/60 border border-stone-700/40 overflow-hidden w-full max-w-sm">
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-amber-400" />
        <span className="text-amber-400 text-sm font-semibold">Currency Converter</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-stone-100">{d.amount.toLocaleString()}</p>
            <p className="text-amber-400 font-semibold text-sm mt-0.5">{d.from}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-500 flex-none" />
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-emerald-400">{d.converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="text-emerald-400 font-semibold text-sm mt-0.5">{d.to}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-stone-700/40 flex justify-between text-xs text-stone-500">
          <span>1 {d.from} = {d.rate.toFixed(4)} {d.to}</span>
          <span>{d.date}</span>
        </div>
      </div>
    </div>
  )
}
