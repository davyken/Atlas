import { Compass } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-3 py-3 animate-fade-in">
      <div className="flex-none w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Compass className="w-4 h-4 text-amber-400" />
      </div>
      <div className="chat-bubble-ai flex items-center gap-1.5 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  )
}
