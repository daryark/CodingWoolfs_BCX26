import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Mic, Camera } from 'lucide-react'
import ChatTab from './components/ChatTab'
import VoiceTab from './components/VoiceTab'
import PhotoTab from './components/PhotoTab'
import LanguageSwitcher from './components/LanguageSwitcher'

type TabType = 'chat' | 'voice' | 'photo'

function App() {
	const { t } = useTranslation()
	const [activeTab, setActiveTab] = useState<TabType>('chat')

	return (
		<div className="flex flex-col h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 shadow-sm">
				<div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-primary-600">{t('app.title')}</h1>
						<p className="text-sm text-gray-600">{t('app.subtitle')}</p>
					</div>
					<LanguageSwitcher />
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden">
				<div className="h-full max-w-6xl mx-auto w-full">
					{activeTab === 'chat' && <ChatTab />}
					{activeTab === 'voice' && <VoiceTab />}
					{activeTab === 'photo' && <PhotoTab />}
				</div>
			</main>

			{/* Navigation Tabs - Mobile at bottom, Desktop at top */}
			<nav className="bg-white border-t border-gray-200 shadow-lg md:border-t-0 md:border-b">
				<div className="max-w-6xl mx-auto flex">
					<button
						onClick={() => setActiveTab('chat')}
						className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat'
								? 'bg-primary-50 text-primary-600 border-b-2 md:border-b-0 md:border-t-2 border-primary-600'
								: 'text-gray-600 hover:bg-gray-50'
							}`}
					>
						<MessageCircle size={20} />
						<span className="hidden sm:inline text-sm font-medium">{t('nav.chat')}</span>
					</button>

					<button
						onClick={() => setActiveTab('voice')}
						className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${activeTab === 'voice'
								? 'bg-primary-50 text-primary-600 border-b-2 md:border-b-0 md:border-t-2 border-primary-600'
								: 'text-gray-600 hover:bg-gray-50'
							}`}
					>
						<Mic size={20} />
						<span className="hidden sm:inline text-sm font-medium">{t('nav.voice')}</span>
					</button>

					<button
						onClick={() => setActiveTab('photo')}
						className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${activeTab === 'photo'
								? 'bg-primary-50 text-primary-600 border-b-2 md:border-b-0 md:border-t-2 border-primary-600'
								: 'text-gray-600 hover:bg-gray-50'
							}`}
					>
						<Camera size={20} />
						<span className="hidden sm:inline text-sm font-medium">{t('nav.photo')}</span>
					</button>
				</div>
			</nav>
		</div>
	)
}

export default App
