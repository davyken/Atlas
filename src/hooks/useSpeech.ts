import { useState, useRef, useCallback, useEffect } from 'react'

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T :
  typeof window extends { webkitSpeechRecognition: infer T } ? T : never

export function useSpeechInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition
    if (SpeechRecognition) setSupported(true)
  }, [])

  const start = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'auto' as string  // browser picks language from device locale
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript
      if (transcript.trim()) onResult(transcript.trim())
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [onResult])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (isListening) stop()
    else start()
  }, [isListening, start, stop])

  return { isListening, supported, toggle, stop }
}

export function useSpeechOutput() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel()

    // Strip markdown and emojis for cleaner speech
    const clean = text
      .replace(/[#*_~`>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()

    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = 1.05
    utterance.pitch = 1
    utterance.volume = 1

    // Pick a natural-sounding voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      v.name.includes('Samantha') ||  // iOS
      v.name.includes('Google US English') ||
      v.name.includes('Microsoft Aria') ||
      (v.lang === 'en-US' && v.localService)
    )
    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  return { isSpeaking, speak, stop }
}
