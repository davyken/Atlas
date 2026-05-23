import type { Message } from 'ai/react'
import { Compass, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { WeatherWidget } from '../widgets/WeatherWidget'
import { WeatherForecastWidget } from '../widgets/WeatherChart'
import { FlightResults } from '../widgets/FlightCard'
import { HotelResults } from '../widgets/HotelCard'
import { DestinationCard } from '../widgets/DestinationCard'
import { TripItinerary } from '../widgets/TripItinerary'
import { CurrencyWidget } from '../widgets/CurrencyWidget'
import { MapWidget } from '../widgets/MapWidget'
import { PhotoWidget } from '../widgets/PhotoWidget'
import { ToolLoadingCard } from './ToolLoadingCard'

type ToolInvocation = {
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
  state: 'partial-call' | 'call' | 'result'
  result?: unknown
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 py-3 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-none w-8 h-8 rounded-xl flex items-center justify-center mt-1
        ${isUser
          ? 'bg-stone-700 border border-stone-600'
          : 'bg-amber-500/10 border border-amber-500/20'
        }`}>
        {isUser
          ? <User className="w-4 h-4 text-stone-300" />
          : <Compass className="w-4 h-4 text-amber-400" />
        }
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Text */}
        {message.content && (
          <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="text-amber-400 font-semibold">{children}</strong>,
                em: ({ children }) => <em className="text-stone-300 italic">{children}</em>,
                h1: ({ children }) => <h1 className="text-base font-bold text-amber-400 mt-3 mb-1 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-amber-400 mt-3 mb-1 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-stone-200 mt-2 mb-1 first:mt-0">{children}</h3>,
                ul: ({ children }) => <ul className="mt-1 mb-2 space-y-1 list-none">{children}</ul>,
                ol: ({ children }) => <ol className="mt-1 mb-2 space-y-1 list-none counter-reset-item">{children}</ol>,
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-sm leading-relaxed">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500/70 flex-none" />
                    <span>{children}</span>
                  </li>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors">
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="bg-stone-700/60 text-amber-300 text-xs px-1.5 py-0.5 rounded font-mono">{children}</code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-amber-500/40 pl-3 my-2 text-stone-400 italic text-sm">{children}</blockquote>
                ),
                hr: () => <hr className="border-stone-700 my-3" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Tool results */}
        {(message as Message & { toolInvocations?: ToolInvocation[] }).toolInvocations?.map((tool) => (
          <ToolResult key={tool.toolCallId} invocation={tool} />
        ))}
      </div>
    </div>
  )
}

function ToolResult({ invocation }: { invocation: ToolInvocation }) {
  if (invocation.state !== 'result') {
    return <ToolLoadingCard toolName={invocation.toolName} />
  }

  const data = invocation.result as Record<string, unknown>

  switch (invocation.toolName) {
    case 'getWeather':
      return <WeatherWidget data={data} />
    case 'getWeatherForecast':
      return <WeatherForecastWidget data={data} />
    case 'searchFlights':
      return <FlightResults data={data} />
    case 'searchHotels':
      return <HotelResults data={data} />
    case 'getDestinationInfo':
      return <DestinationCard data={data} />
    case 'planTrip':
      return <TripItinerary data={data} />
    case 'convertCurrency':
      return <CurrencyWidget data={data} />
    case 'showMap':
      return <MapWidget data={data} />
    case 'getDestinationPhotos':
      return <PhotoWidget data={data} />
    default:
      return null
  }
}
