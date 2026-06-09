import { ChatMessage } from '../stores/chatStore'
import clsx from 'clsx'

interface MessageBubbleProps {
	message: ChatMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
	const isUser = message.role === 'user'

	return (
		<div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
			<div
				className={clsx(
					'max-w-xs sm:max-w-md lg:max-w-lg px-4 py-2 rounded-lg break-words',
					isUser
						? 'bg-primary-600 text-white rounded-bl-lg'
						: 'bg-gray-100 text-gray-900 rounded-br-lg'
				)}
			>
				{message.imageUrl && (
					<img
						src={message.imageUrl}
						alt="Message attachment"
						className="mb-2 rounded-lg max-h-40 max-w-full"
					/>
				)}
				<p className="text-sm whitespace-pre-wrap">{message.content}</p>
				<p
					className={clsx(
						'text-xs mt-1 opacity-70',
						isUser ? 'text-white' : 'text-gray-600'
					)}
				>
					{message.timestamp.toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</p>
			</div>
		</div>
	)
}

export default MessageBubble
