import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import ChatTab from './components/ChatTab'
import LanguageSwitcher from './components/LanguageSwitcher'
import MachineList, { Machine } from './components/MachineList'
import MachineModal from './components/MachineModal'

function App() {
	const { t } = useTranslation()
	const [selectedMachine, setSelectedMachine] = useState<Machine | undefined>()
	const [modalMachine, setModalMachine] = useState<Machine | undefined>()
	const [mobileShowChat, setMobileShowChat] = useState(false)

	const handleMachineSelect = (machine: Machine) => {
		setModalMachine(machine)
	}

	const handleCloseModal = () => {
		setModalMachine(undefined)
	}

	const handleStartAssistant = (machine: Machine) => {
		setSelectedMachine(machine)
		setModalMachine(undefined)
		setMobileShowChat(true)
	}

	const handleBackToList = () => {
		setMobileShowChat(false)
	}

	return (
		<div className="flex flex-col h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 shadow-sm">
				<div className="px-4 py-4 flex justify-between items-center">
					<div className="flex items-center gap-3">
						{/* Mobile back button — only when chat is showing */}
						{mobileShowChat && (
							<button
								onClick={handleBackToList}
								className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
								aria-label="Back to machines"
							>
								<ArrowLeft size={22} className="text-gray-700" />
							</button>
						)}
						<h1 className="text-2xl font-bold text-primary-600">{t('app.title')}</h1>
					</div>
					<LanguageSwitcher />
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden flex">
				{/* Desktop sidebar — always visible on md+ */}
				<div className="hidden md:flex">
					<MachineList
						selectedMachineId={selectedMachine?.id}
						onMachineSelect={handleMachineSelect}
					/>
				</div>

				{/* Mobile: show either machine list OR chat */}
				{/* Mobile machine list — full width, only when chat is not active */}
				{!mobileShowChat && (
					<div className="flex-1 overflow-y-auto md:hidden">
						<MachineList
							selectedMachineId={selectedMachine?.id}
							onMachineSelect={handleMachineSelect}
							mobileFullWidth
							onOpenChat={() => setMobileShowChat(true)}
						/>
					</div>
				)}

				{/* Chat area — always on desktop, conditionally on mobile */}
				<div className={`flex-1 overflow-hidden flex flex-col ${mobileShowChat ? '' : 'hidden md:flex'}`}>
					<ChatTab />
				</div>
			</main>

			{/* Machine Detail Modal */}
			{modalMachine && (
				<MachineModal
					machine={modalMachine}
					onClose={handleCloseModal}
					onStartAssistant={handleStartAssistant}
				/>
			)}
		</div>
	)
}

export default App
