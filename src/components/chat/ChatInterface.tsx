import { useChat } from 'ai/react'
import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { WelcomeScreen } from './WelcomeScreen'
import { Compass } from 'lucide-react'

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
  })

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSuggest = (text: string) => {
    append({ role: 'user', content: text })
  }

  return (
    <div className="flex flex-col h-screen">
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
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          <span className="text-stone-500 text-xs">Online</span>
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
