import { useChat } from 'ai/react'
import { useEffect, useRef, useState } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { WelcomeScreen } from './WelcomeScreen'
import { Compass, Bookmark, X, MapPin, Calendar, Trash2 } from 'lucide-react'

interface SavedTrip {
  destination: string
  duration: number
  budget: string
  startDate: string
  savedAt: string
}

function SavedTripsPanel({ onClose }: { onClose: () => void }) {
  const [trips, setTrips] = useState<SavedTrip[]>(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('atlas_trip_'))
    return keys.map(k => JSON.parse(localStorage.getItem(k) || '{}')).filter(Boolean)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  })

  const remove = (trip: SavedTrip) => {
    const key = `atlas_trip_${trip.destination}_${trip.startDate}`
    localStorage.removeItem(key)
    setTrips(prev => prev.filter(t => !(t.destination === trip.destination && t.startDate === trip.startDate)))
  }

  return (
    <div className="absolute inset-0 z-20 bg-stone-950/95 backdrop-blur-xl flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400" />
          <h2 className="text-stone-100 font-semibold">Saved Trips</h2>
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{trips.length}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {trips.length === 0 ? (
          <div className="text-center py-16 text-stone-500">
            <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No saved trips yet.</p>
            <p className="text-xs mt-1">Plan a trip and tap "Save trip" to keep it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip, i) => (
              <div key={i} className="bg-stone-800/60 border border-stone-700/40 rounded-xl p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-stone-100 font-medium text-sm">{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{trip.startDate}</span>
                    <span>{trip.duration} days · {trip.budget}</span>
                  </div>
                </div>
                <button onClick={() => remove(trip)} className="p-1.5 text-stone-600 hover:text-red-400 transition-colors rounded-lg hover:bg-stone-700/40">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
  })

  const bottomRef = useRef<HTMLDivElement>(null)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSuggest = (text: string) => {
    append({ role: 'user', content: text })
  }

  return (
    <div className="relative flex flex-col h-screen">
      {showSaved && <SavedTripsPanel onClose={() => setShowSaved(false)} />}

      {/* Header */}
      <header className="flex-none flex items-center gap-3 px-6 py-4 border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-xl z-10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Compass className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="font-display font-semibold text-stone-100 leading-none tracking-wide text-lg">
            Atlas
          </h1>
          <p className="text-stone-500 text-xs mt-0.5">AI Travel Concierge</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowSaved(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800/60 transition-colors text-xs"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Saved</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span className="text-stone-500 text-xs hidden sm:inline">Online</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggest={handleSuggest} />
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* Input */}
      <div className="flex-none border-t border-stone-800/60 bg-stone-950/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
