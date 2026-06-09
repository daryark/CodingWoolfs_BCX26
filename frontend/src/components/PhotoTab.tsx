import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, X, Loader } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'
import { createBedrockClient } from '../utils/bedrock'
import MessageBubble from './MessageBubble'
import clsx from 'clsx'

function PhotoTab() {
	const { t } = useTranslation()
	const {
		messages,
		sessionId,
		isLoading,
		error,
		addMessage,
		setLoading,
		setError,
	} = useChatStore()

	const [selectedImage, setSelectedImage] = useState<{
		file: File
		preview: string
	} | null>(null)
	const [caption, setCaption] = useState('')
	const fileInputRef = useRef<HTMLInputElement>(null)
	const cameraInputRef = useRef<HTMLInputElement>(null)
	const bedrockClient = createBedrockClient()

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

	const handleSendPhoto = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!selectedImage) {
			return
		}

		const query =
			caption.trim() ||
			`Please analyze this image and identify any error codes or issues visible. Provide detailed instructions on how to fix them.`

		setLoading(true)
		setError(null)

		try {
			// Convert image to base64
			const reader = new FileReader()
			reader.onload = async () => {
				const base64 = (reader.result as string).split(',')[1]
				const imageFormat = selectedImage.file.type.split('/')[1]

				// Add user message with image
				addMessage('user', query, selectedImage.preview)

				try {
					// Send to Bedrock with image analysis
					const response = await bedrockClient.analyzeImage(
						base64,
						imageFormat,
						query,
						sessionId
					)

					addMessage('assistant', response.responseText)

					// Clear image
					setSelectedImage(null)
					setCaption('')
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image'
					setError(errorMessage)
					addMessage('assistant', `Error: ${errorMessage}`)
				} finally {
					setLoading(false)
				}
			}
			reader.readAsDataURL(selectedImage.file)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to process image'
			setError(errorMessage)
			setLoading(false)
		}
	}

	return (
		<div className="h-full flex flex-col bg-white">
			{/* Messages Container */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 && !selectedImage ? (
					<div className="flex items-center justify-center h-full text-gray-400">
						<div className="text-center">
							<Camera size={48} className="mx-auto mb-4 opacity-50" />
							<p className="text-lg">{t('photo.uploadPhoto')}</p>
							<p className="text-sm mt-2">{t('photo.analyzing')}</p>
						</div>
					</div>
				) : (
					messages.map((message) => (
						<MessageBubble key={message.id} message={message} />
					))
				)}
			</div>

			{/* Error Message */}
			{error && (
				<div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-600">{error}</p>
				</div>
			)}

			{/* Image Upload Area */}
			<div className="border-t border-gray-200 p-4 bg-white space-y-4">
				{/* Image Preview */}
				{selectedImage && (
					<div className="relative inline-block">
						<img
							src={selectedImage.preview}
							alt="Selected"
							className="max-h-40 rounded-lg"
						/>
						<button
							onClick={() => setSelectedImage(null)}
							className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
						>
							<X size={16} />
						</button>
					</div>
				)}

				{/* Caption Input */}
				{selectedImage && (
					<input
						type="text"
						value={caption}
						onChange={(e) => setCaption(e.target.value)}
						placeholder={t('chat.placeholder')}
						disabled={isLoading}
						className={clsx(
							'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors',
							isLoading && 'bg-gray-100 cursor-not-allowed'
						)}
					/>
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

				{/* Buttons */}
				<div className="flex gap-2">
					{selectedImage ? (
						<button
							onClick={handleSendPhoto}
							disabled={isLoading}
							className={clsx(
								'flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
								isLoading
									? 'bg-gray-200 text-gray-500 cursor-not-allowed'
									: 'bg-primary-600 text-white hover:bg-primary-700'
							)}
						>
							{isLoading ? (
								<>
									<Loader size={18} className="animate-spin" />
									<span>{t('photo.analyzing')}</span>
								</>
							) : (
								<>
									<Upload size={18} />
									<span>{t('common.send')}</span>
								</>
							)}
						</button>
					) : (
						<>
							<button
								onClick={() => fileInputRef.current?.click()}
								disabled={isLoading}
								className={clsx(
									'flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
									isLoading
										? 'bg-gray-200 text-gray-500 cursor-not-allowed'
										: 'bg-primary-600 text-white hover:bg-primary-700'
								)}
							>
								<Upload size={18} />
								<span className="hidden sm:inline">{t('photo.selectFile')}</span>
								<span className="sm:hidden">{t('photo.uploadPhoto')}</span>
							</button>

							<button
								onClick={() => cameraInputRef.current?.click()}
								disabled={isLoading}
								className={clsx(
									'flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
									isLoading
										? 'bg-gray-200 text-gray-500 cursor-not-allowed'
										: 'bg-green-600 text-white hover:bg-green-700'
								)}
							>
								<Camera size={18} />
								<span className="hidden sm:inline">{t('photo.takePhoto')}</span>
								<span className="sm:hidden">{t('photo.takePhoto')}</span>
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default PhotoTab
