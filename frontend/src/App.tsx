import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ChatTab from './components/ChatTab'
import LanguageSwitcher from './components/LanguageSwitcher'
import MachineList, { Machine } from './components/MachineList'

function App() {
	const { t } = useTranslation()
	const [selectedMachine, setSelectedMachine] = useState<Machine | undefined>()

	return (
		<div className="flex flex-col h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 shadow-sm">
				<div className="px-4 py-4 flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-primary-600">{t('app.title')}</h1>
					</div>
					<LanguageSwitcher />
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden flex">
				{/* Machine List Sidebar */}
				<MachineList selectedMachineId={selectedMachine?.id} onMachineSelect={setSelectedMachine} />

				{/* Content Area */}
				<div className="flex-1 overflow-hidden flex flex-col">
					<ChatTab />
				</div>
			</main></div>
	)
}

export default App