import type { ChangeEvent, FormEvent } from 'react'
import { ArrowUp, Mic, Paperclip } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) {
        const form = e.currentTarget.closest('form')
        if (form) form.requestSubmit()
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="flex items-end gap-2 rounded-2xl bg-stone-800/80 border border-stone-700/60
                      focus-within:border-stone-600 transition-colors px-4 py-3
                      shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <textarea
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about weather, flights, hotels, or plan a trip…"
          rows={1}
          className="flex-1 bg-transparent text-stone-100 placeholder-stone-500 text-base md:text-sm
                     resize-none outline-none leading-relaxed min-h-[24px] max-h-40
                     overflow-y-auto scrollbar-thin"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          disabled={isLoading}
        />
        <div className="flex items-center gap-2 flex-none">
          <button
            type="button"
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-700/60 transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed
                       bg-amber-500 hover:bg-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.3)]
                       disabled:bg-stone-700 disabled:shadow-none"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 text-stone-950 font-bold" />
            )}
          </button>
        </div>
      </div>
      <p className="text-center text-stone-600 text-[10px] mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </form>
  )
}
