import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Trash2, Mic, Camera, X, Loader, StopCircle } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'
import { createBedrockClient } from '../utils/bedrock'
import { VoiceAssistant } from '../utils/voiceAssistant'
import MessageBubble from './MessageBubble'
import clsx from 'clsx'

function ChatTab() {
	const { t } = useTranslation()
	const {
		messages,
		sessionId,
		currentLanguage,
		isLoading,
		error,
		addMessage,
		clearMessages,
		setLoading,
		setError,
	} = useChatStore()

	const [inputValue, setInputValue] = useState('')
	const [selectedImage, setSelectedImage] = useState<{
		file: File
		preview: string
	} | null>(null)
	const [isListening, setIsListening] = useState(false)
	const [currentTranscript, setCurrentTranscript] = useState('')
	const [voiceAssistant, setVoiceAssistant] = useState<VoiceAssistant | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const cameraInputRef = useRef<HTMLInputElement>(null)
	const bedrockClient = createBedrockClient()

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	// Initialize voice assistant
	useEffect(() => {
		const assistant = new VoiceAssistant({
			language: currentLanguage === 'de' ? 'de-DE' : 'en-US',
			interimResults: true,
		})

		assistant.setTranscriptCallback((transcript, isFinal) => {
			setCurrentTranscript(transcript)

			if (isFinal) {
				setInputValue(transcript)
				setIsListening(false)
			}
		})

		assistant.setErrorCallback((error) => {
			setError(error)
			setIsListening(false)
		})

		setVoiceAssistant(assistant)
	}, [currentLanguage, setError])

	const toggleVoiceInput = () => {
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

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			processImageFile(file)
		}
	}

	const processImageFile = (file: File) => {
		if (!file.type.startsWith('image/')) {
			setError('Please select a valid image file')
			return
		}

		const reader = new FileReader()
		reader.onload = (e) => {
			const preview = e.target?.result as string
			setSelectedImage({ file, preview })
			setError(null)
		}
		reader.readAsDataURL(file)
	}

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!inputValue.trim() && !selectedImage) {
			return
		}

		let userMessage = inputValue.trim() || 'Please analyze this image'
		setInputValue('')

		addMessage('user', userMessage, selectedImage?.preview)
		setSelectedImage(null)
		setLoading(true)
		setError(null)

		try {
			if (selectedImage) {
				// Send with image
				const reader = new FileReader()
				reader.onload = async () => {
					const base64 = (reader.result as string).split(',')[1]
					const imageFormat = selectedImage.file.type.split('/')[1]

					try {
						const response = await bedrockClient.analyzeImage(
							base64,
							imageFormat,
							userMessage,
							sessionId
						)
						addMessage('assistant', response.responseText)
					} catch (err) {
						const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image'
						setError(errorMessage)
						addMessage('assistant', `Error: ${errorMessage}`)
					} finally {
						setLoading(false)
					}
				}
				reader.readAsDataURL(selectedImage.file)
			} else {
				// Send text message
				const response = await bedrockClient.sendMessage(userMessage, sessionId)
				addMessage('assistant', response.responseText)
				setLoading(false)
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to get response'
			setError(errorMessage)
			addMessage('assistant', `Error: ${errorMessage}`)
			setLoading(false)
		}
	}

	const handleClearHistory = () => {
		if (confirm(t('chat.clearHistory') + '?')) {
			clearMessages()
		}
	}

	return (
		<div className="h-full flex flex-col bg-white">
			{/* Messages Container */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 ? (
					<div className="flex items-center justify-center h-full text-gray-400">
						<div className="text-center">
							<p className="text-lg">{t('chat.noMessages')}</p>
						</div>
					</div>
				) : (
					<>
						{messages.map((message) => (
							<MessageBubble key={message.id} message={message} />
						))}
						{isLoading && (
							<div className="flex justify-start">
								<div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
									<div className="flex gap-1">
										<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
										<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
										<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{/* Error Message */}
			{error && (
				<div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-600">{error}</p>
				</div>
			)}

			{/* Input Area */}
			<div className="border-t border-gray-200 p-4 bg-white space-y-3">
				{/* Image Preview */}
				{selectedImage && (
					<div className="flex gap-3 items-start">
						<div className="relative inline-block">
							<img
								src={selectedImage.preview}
								alt="Selected"
								className="max-h-24 rounded-lg"
							/>
							<button
								onClick={() => setSelectedImage(null)}
								className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
							>
								<X size={14} />
							</button>
						</div>
					</div>
				)}

				{/* Transcript Display */}
				{currentTranscript && (
					<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-sm text-blue-900">{currentTranscript}</p>
					</div>
				)}

				{/* File Input (hidden) */}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileSelect}
					className="hidden"
				/>

				<input
					ref={cameraInputRef}
					type="file"
					accept="image/*"
					capture="environment"
					onChange={handleFileSelect}
					className="hidden"
				/>

				{/* Input Form */}
				<form onSubmit={handleSendMessage} className="space-y-2">
					<div className="flex gap-2">
						{/* Left side buttons - upload left of mic */}
						<div className="flex items-center gap-2">
							{/* Camera/Upload Button (left) */}
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={isLoading || !!selectedImage}
								className={clsx(
									'p-2 rounded-lg transition-colors',
									selectedImage
										? 'bg-gray-300 text-gray-600 cursor-not-allowed'
										: 'bg-primary-600 hover:bg-primary-700 text-white',
									isLoading && 'opacity-50 cursor-not-allowed'
								)}
								title={t('photo.uploadPhoto')}
							>
								<Camera size={20} />
							</button>

							{/* Voice Button (right) */}
							<button
								type="button"
								onClick={toggleVoiceInput}
								disabled={isLoading}
								className={clsx(
									'p-2 rounded-lg transition-colors',
									isListening
										? 'bg-red-600 hover:bg-red-700 text-white'
										: 'bg-primary-600 hover:bg-primary-700 text-white',
									isLoading && 'opacity-50 cursor-not-allowed'
								)}
								title={t('voice.startListening')}
							>
								{isListening ? (
									<StopCircle size={20} />
								) : (
									<Mic size={20} />
								)}
							</button>
						</div>

						{/* Input field and send button */}
						<div className="flex-1 flex gap-2">
							<input
								type="text"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								placeholder={t('chat.placeholder')}
								disabled={isLoading}
								className={clsx(
									'flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors',
									isLoading && 'bg-gray-100 cursor-not-allowed'
								)}
							/>
							<button
								type="submit"
								disabled={isLoading || (!inputValue.trim() && !selectedImage)}
								className={clsx(
									'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
									isLoading || (!inputValue.trim() && !selectedImage)
										? 'bg-gray-200 text-gray-500 cursor-not-allowed'
										: 'bg-primary-600 text-white hover:bg-primary-700'
								)}
							>
								{isLoading ? (
									<Loader size={18} className="animate-spin" />
								) : (
									<Send size={18} />
								)}
							</button>
						</div>
					</div>

					{/* Clear History Button */}
					<div className="flex gap-2">
						<button
							type="button"
							onClick={handleClearHistory}
							disabled={messages.length === 0 || isLoading}
							className={clsx(
								'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm',
								messages.length === 0 || isLoading
									? 'bg-gray-100 text-gray-400 cursor-not-allowed'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							)}
						>
							<Trash2 size={16} />
							<span>{t('chat.clearHistory')}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default ChatTab
