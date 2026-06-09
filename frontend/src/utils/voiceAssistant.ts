interface VoiceAssistantConfig {
	language?: string
	continuous?: boolean
	interimResults?: boolean
}

type VoiceCallback = (transcript: string, isFinal: boolean) => void
type ErrorCallback = (error: string) => void

declare global {
	interface SpeechRecognitionEvent extends Event {
		readonly resultIndex: number
		readonly results: SpeechRecognitionResultList
	}

	interface SpeechRecognitionErrorEvent extends Event {
		readonly error: string
	}
}

class VoiceAssistant {
	private recognition: any = null
	private isListening = false
	private transcript = ''
	private onTranscript: VoiceCallback | null = null
	private onError: ErrorCallback | null = null

	constructor(config: VoiceAssistantConfig = {}) {
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

		if (SpeechRecognition) {
			this.recognition = new SpeechRecognition()
			this.setupRecognition(config)
		}
	}

	private setupRecognition(config: VoiceAssistantConfig) {
		if (!this.recognition) return

		this.recognition.continuous = config.continuous ?? false
		this.recognition.interimResults = config.interimResults ?? true
		this.recognition.language = config.language ?? 'en-US'

		this.recognition.onstart = () => {
			this.isListening = true
			this.transcript = ''
		}

		this.recognition.onresult = (event: any) => {
			let interim = ''

			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcript = event.results[i][0].transcript
				if (event.results[i].isFinal) {
					this.transcript += transcript + ' '
				} else {
					interim += transcript
				}
			}

			const finalTranscript = this.transcript + interim
			const isFinal = event.results[event.results.length - 1].isFinal

			if (this.onTranscript) {
				this.onTranscript(finalTranscript, isFinal)
			}

			if (isFinal) {
				this.transcript += interim
			}
		}

		this.recognition.onerror = (event: any) => {
			const errorMessage = this.getErrorMessage(event.error)
			if (this.onError) {
				this.onError(errorMessage)
			}
		}

		this.recognition.onend = () => {
			this.isListening = false
		}
	}

	start(language?: string): void {
		if (!this.recognition) {
			if (this.onError) {
				this.onError('Speech recognition not supported')
			}
			return
		}

		if (language) {
			this.recognition.language = language
		}

		this.isListening = true
		this.transcript = ''
		this.recognition.start()
	}

	stop(): string {
		if (!this.recognition) return ''

		this.recognition.stop()
		this.isListening = false
		return this.transcript
	}

	abort(): void {
		if (this.recognition) {
			this.recognition.abort()
			this.isListening = false
		}
	}

	isSupported(): boolean {
		return this.recognition !== null
	}

	getIsListening(): boolean {
		return this.isListening
	}

	setTranscriptCallback(callback: VoiceCallback): void {
		this.onTranscript = callback
	}

	setErrorCallback(callback: ErrorCallback): void {
		this.onError = callback
	}

	private getErrorMessage(error: string): string {
		const errorMessages: Record<string, string> = {
			'no-speech': 'No speech was detected. Please try again.',
			'audio-capture': 'No microphone was found. Ensure it is connected.',
			'not-allowed': 'Microphone permission was denied.',
			'network': 'Network error occurred.',
			'aborted': 'Speech recognition was aborted.',
		}

		return errorMessages[error] || `An error occurred: ${error}`
	}
}

// Text-to-speech functionality
function speak(text: string, language: string = 'en-US'): void {
	const synth = window.speechSynthesis

	if (!synth) return

	// Cancel any ongoing speech
	synth.cancel()

	const utterance = new SpeechSynthesisUtterance(text)
		; (utterance as any).lang = language
	utterance.rate = 0.9
	utterance.pitch = 1
	utterance.volume = 1

	synth.speak(utterance)
}

function stopSpeaking(): void {
	const synth = window.speechSynthesis
	if (synth) {
		synth.cancel()
	}
}

export { VoiceAssistant, speak, stopSpeaking }
export type { VoiceAssistantConfig }
