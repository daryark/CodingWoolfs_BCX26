import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, StopCircle, Volume2 } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'
import { VoiceAssistant, speak } from '../utils/voiceAssistant'
import { createBedrockClient } from '../utils/bedrock'
import MessageBubble from './MessageBubble'
import clsx from 'clsx'

function VoiceTab() {
	const { t } = useTranslation()
	const {
		messages,
		sessionId,
		currentLanguage,
		isLoading,
		addMessage,
		setLoading,
		setError,
	} = useChatStore()

	const [voiceAssistant, setVoiceAssistant] = useState<VoiceAssistant | null>(null)
	const [isListening, setIsListening] = useState(false)
	const [currentTranscript, setCurrentTranscript] = useState('')
	const [isSpeaking, setIsSpeaking] = useState(false)

	const bedrockClient = createBedrockClient()

	useEffect(() => {
		const assistant = new VoiceAssistant({
			language: currentLanguage === 'de' ? 'de-DE' : 'en-US',
			interimResults: true,
		})

		assistant.setTranscriptCallback((transcript, isFinal) => {
			setCurrentTranscript(transcript)

			if (isFinal) {
				handleVoiceInput(transcript)
			}
		})

		assistant.setErrorCallback((error) => {
			setError(error)
			setIsListening(false)
		})

		setVoiceAssistant(assistant)
	}, [currentLanguage])

	const handleVoiceInput = async (transcript: string) => {
		if (!transcript.trim() || isLoading) return

		setIsListening(false)
		addMessage('user', transcript)
		setLoading(true)
		setError(null)

		try {
			const response = await bedrockClient.sendVoiceTranscript(transcript, sessionId)
			addMessage('assistant', response.responseText)

			// Speak the response
			const language = currentLanguage === 'de' ? 'de-DE' : 'en-US'
			setIsSpeaking(true)
			speak(response.responseText, language)

			setTimeout(() => {
				setIsSpeaking(false)
			}, 3000)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to process voice input'
			setError(errorMessage)
		} finally {
			setLoading(false)
			setCurrentTranscript('')
		}
	}

	const toggleListening = () => {
		if (!voiceAssistant) {
			setError(t('voice.notSupported'))
			return
		}

		if (isListening) {
			voiceAssistant.stop()
			setIsListening(false)
		} else {
			voiceAssistant.start(currentLanguage === 'de' ? 'de-DE' : 'en-US')
			setIsListening(true)
		}
	}

	if (!voiceAssistant || !voiceAssistant.isSupported()) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">{t('voice.notSupported')}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="h-full flex flex-col bg-white">
			{/* Messages Container */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 ? (
					<div className="flex items-center justify-center h-full text-gray-400">
						<div className="text-center">
							<Mic size={48} className="mx-auto mb-4 opacity-50" />
							<p className="text-lg">{t('voice.startListening')}</p>
						</div>
					</div>
				) : (
					messages.map((message) => (
						<MessageBubble key={message.id} message={message} />
					))
				)}
			</div>

			{/* Voice Input Area */}
			<div className="border-t border-gray-200 p-4 bg-white space-y-4">
				{/* Current Transcript */}
				{currentTranscript && (
					<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-sm text-blue-900">{currentTranscript}</p>
					</div>
				)}

				{/* Status */}
				<div className="text-center">
					{isLoading && <p className="text-sm text-gray-600">{t('common.loading')}</p>}
					{isListening && (
						<p className="text-sm text-primary-600 font-medium animate-pulse">
							{t('voice.listening')}
						</p>
					)}
					{isSpeaking && (
						<p className="text-sm text-green-600 font-medium">{t('voice.processing')}</p>
					)}
				</div>

				{/* Listen Button */}
				<div className="flex gap-3">
					<button
						onClick={toggleListening}
						disabled={isLoading || isSpeaking}
						className={clsx(
							'flex-1 py-4 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
							isListening
								? 'bg-red-600 hover:bg-red-700 text-white'
								: 'bg-primary-600 hover:bg-primary-700 text-white',
							(isLoading || isSpeaking) && 'opacity-50 cursor-not-allowed'
						)}
					>
						{isListening ? (
							<>
								<StopCircle size={20} />
								<span>{t('voice.stopListening')}</span>
							</>
						) : (
							<>
								<Mic size={20} />
								<span>{t('voice.startListening')}</span>
							</>
						)}
					</button>

					{isSpeaking && (
						<button
							disabled
							className="flex items-center justify-center gap-2 px-4 py-4 bg-green-100 text-green-700 rounded-lg"
						>
							<Volume2 size={20} className="animate-pulse" />
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

export default VoiceTab
