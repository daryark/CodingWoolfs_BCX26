import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Trash2 } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'
import { createBedrockClient } from '../utils/bedrock'
import MessageBubble from './MessageBubble'
import clsx from 'clsx'

function ChatTab() {
	const { t } = useTranslation()
	const {
		messages,
		sessionId,
		isLoading,
		error,
		addMessage,
		clearMessages,
		setLoading,
		setError,
	} = useChatStore()

	const [inputValue, setInputValue] = useState('')
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const bedrockClient = createBedrockClient()

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!inputValue.trim()) {
			return
		}

		const userMessage = inputValue.trim()
		setInputValue('')

		addMessage('user', userMessage)
		setLoading(true)
		setError(null)

		try {
			// Send to Bedrock AgentCore
			const response = await bedrockClient.sendMessage(userMessage, sessionId)
			addMessage('assistant', response.responseText)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to get response'
			setError(errorMessage)
			addMessage('assistant', `Error: ${errorMessage}`)
		} finally {
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
			<div className="border-t border-gray-200 p-4 bg-white">
				<form onSubmit={handleSendMessage} className="space-y-3">
					<div className="flex gap-2">
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
							disabled={isLoading || !inputValue.trim()}
							className={clsx(
								'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
								isLoading || !inputValue.trim()
									? 'bg-gray-200 text-gray-500 cursor-not-allowed'
									: 'bg-primary-600 text-white hover:bg-primary-700'
							)}
						>
							<Send size={18} />
							<span className="hidden sm:inline">{t('common.send')}</span>
						</button>
					</div>

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
