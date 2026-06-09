import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'

function LanguageSwitcher() {
	const { i18n } = useTranslation()
	const { setLanguage } = useChatStore()

	const handleLanguageChange = (lang: 'en' | 'de') => {
		i18n.changeLanguage(lang)
		setLanguage(lang)
	}

	return (
		<div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
			<Globe size={18} className="text-gray-600" />
			<button
				onClick={() => handleLanguageChange('en')}
				className={`px-3 py-1 rounded transition-colors font-medium text-sm ${i18n.language === 'en'
						? 'bg-white text-primary-600 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
					}`}
			>
				EN
			</button>
			<button
				onClick={() => handleLanguageChange('de')}
				className={`px-3 py-1 rounded transition-colors font-medium text-sm ${i18n.language === 'de'
						? 'bg-white text-primary-600 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
					}`}
			>
				DE
			</button>
		</div>
	)
}

export default LanguageSwitcher
