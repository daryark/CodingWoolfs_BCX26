import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export interface Machine {
	id: string
	name: string
	status: 'online' | 'offline' | 'error'
	lastUpdate: string
	photo: string
}

const DUMMY_MACHINES: Machine[] = [
	{ id: '1', name: 'CNC Machine 1',   status: 'online', lastUpdate: 'Just now',  photo: '/machines/cncmachine1.webp' },
	{ id: '2', name: 'CNC Machine 2',   status: 'online', lastUpdate: '2 min ago', photo: '/machines/cncmachine2.jpg' },
	{ id: '3', name: 'CNC Machine 3',   status: 'online', lastUpdate: '5 min ago', photo: '/machines/cncmachine3.png' },
	{ id: '4', name: 'Robotic Arm 3',   status: 'error',  lastUpdate: '1 min ago', photo: '/machines/roboticarm.png' },
	{ id: '5', name: 'Press Machine 1', status: 'online', lastUpdate: '3 min ago', photo: '/machines/pressmachine.webp' },
	{ id: '6', name: 'Conveyor Belt 2', status: 'online', lastUpdate: '1 min ago', photo: '/machines/conveyorbelt.jpg' },
	{ id: '7', name: 'Inspection Unit', status: 'online', lastUpdate: '4 min ago', photo: '/machines/inspectionunit.jpg' },
	{ id: '8', name: 'CNC Machine 4',   status: 'online', lastUpdate: 'Just now',  photo: '/machines/cncmachine4.webp' },
]

interface MachineListProps {
	selectedMachineId?: string
	onMachineSelect?: (machine: Machine) => void
	/** When true, renders as full-width list (mobile main content) instead of a sidebar */
	mobileFullWidth?: boolean
	/** Callback to open the chat (mobile only) */
	onOpenChat?: () => void
}

function MachineList({ selectedMachineId, onMachineSelect, mobileFullWidth, onOpenChat }: MachineListProps) {
	const [expanded, setExpanded] = useState(true)

	const statusRing = (status: Machine['status']) => {
		switch (status) {
			case 'online':  return 'ring-green-500'
			case 'error':   return 'ring-red-500'
			case 'offline': return 'ring-gray-400'
			default:        return 'ring-gray-400'
		}
	}

	const statusDot = (status: Machine['status']) => {
		switch (status) {
			case 'online':  return 'bg-green-500'
			case 'error':   return 'bg-red-500'
			case 'offline': return 'bg-gray-400'
			default:        return 'bg-gray-400'
		}
	}

	const onlineMachines = DUMMY_MACHINES.filter(m => m.status === 'online').length
	const errorMachines  = DUMMY_MACHINES.filter(m => m.status === 'error').length

	const sortedMachines = [...DUMMY_MACHINES].sort((a, b) =>
		a.status === 'error' ? -1 : b.status === 'error' ? 1 : 0
	)

	// Mobile full-width layout
	if (mobileFullWidth) {
		return (
			<div className="flex flex-col h-full bg-white">
				{/* Stats bar */}
				<div className="px-4 py-3 border-b border-gray-100 flex items-center gap-4">
					<div className="flex items-center gap-2 text-sm">
						<div className="w-3 h-3 bg-green-500 rounded-full" />
						<span className="text-gray-600">{onlineMachines} Working</span>
					</div>
					<div className="flex items-center gap-2 text-sm">
						<div className="w-3 h-3 bg-red-500 rounded-full" />
						<span className="text-gray-600">{errorMachines} Error</span>
					</div>
				</div>

				{/* Machine grid */}
				<div className="flex-1 overflow-y-auto p-3 space-y-2">
					{sortedMachines.map((machine) => (
						<button
							key={machine.id}
							onClick={() => onMachineSelect?.(machine)}
							className={clsx(
								'w-full text-left p-3 rounded-xl transition-all duration-200',
								selectedMachineId === machine.id
									? 'bg-primary-50 border border-primary-300 shadow-sm'
									: 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm'
							)}
						>
							<div className="flex items-center gap-3">
								{/* Thumbnail */}
								<div className={clsx(
									'relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden ring-2',
									statusRing(machine.status)
								)}>
									<img
										src={machine.photo}
										alt={machine.name}
										className="w-full h-full object-cover"
									/>
									<span className={clsx(
										'absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white',
										statusDot(machine.status)
									)} />
								</div>

								{/* Info */}
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-2">
										<h3 className="font-medium text-sm text-gray-900 truncate">
											{machine.name}
										</h3>
										{machine.status === 'error' && (
											<AlertCircle size={16} className="text-red-500 flex-shrink-0" />
										)}
									</div>
									<p className="text-xs text-gray-500 mt-0.5">{machine.lastUpdate}</p>
								</div>
							</div>
						</button>
					))}
				</div>

				{/* Start Chat button — pinned at bottom */}
				{onOpenChat && (
					<div className="px-4 py-3 border-t border-gray-100">
						<button
							onClick={onOpenChat}
							className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-sm"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
							</svg>
							Start Chat
						</button>
					</div>
				)}
			</div>
		)
	}

	// Desktop sidebar layout
	return (
		<aside
			className={clsx(
				'bg-white border-r border-gray-200 shadow-sm transition-all duration-300 overflow-y-auto flex flex-col',
				expanded ? 'w-72' : 'w-16'
			)}
		>
			{/* Header */}
			<div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
				<div className="flex items-center justify-between mb-3">
					<h2 className={clsx('font-semibold text-gray-900 transition-opacity', !expanded && 'hidden')}>
						Machines
					</h2>
					<button
						onClick={() => setExpanded(!expanded)}
						className="p-1 hover:bg-gray-100 rounded transition-colors"
					>
						<svg
							className={clsx('w-5 h-5 text-gray-600 transition-transform', !expanded && 'rotate-180')}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
				</div>

				{expanded && (
					<div className="space-y-2 text-sm">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-500 rounded-full" />
							<span className="text-gray-600">{onlineMachines} Working</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-red-500 rounded-full" />
							<span className="text-gray-600">{errorMachines} Error</span>
						</div>
					</div>
				)}
			</div>

			{/* Machine List */}
			<div className="flex-1 p-2 space-y-1">
				{sortedMachines.map((machine) => (
					<button
						key={machine.id}
						onClick={() => onMachineSelect?.(machine)}
						className={clsx(
							'w-full text-left p-2 rounded-lg transition-all duration-200',
							selectedMachineId === machine.id
								? 'bg-primary-50 border border-primary-300 shadow-sm'
								: 'hover:bg-gray-50 border border-transparent'
						)}
						title={machine.name}
					>
						<div className="flex items-center gap-3">
							<div className={clsx(
								'relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden ring-2',
								statusRing(machine.status)
							)}>
								<img
									src={machine.photo}
									alt={machine.name}
									className="w-full h-full object-cover"
								/>
								<span className={clsx(
									'absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
									statusDot(machine.status)
								)} />
							</div>

							{expanded && (
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-1">
										<h3 className="font-medium text-sm text-gray-900 truncate leading-tight">
											{machine.name}
										</h3>
										{machine.status === 'error' && (
											<AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
										)}
									</div>
									<p className="text-xs text-gray-500 mt-0.5">{machine.lastUpdate}</p>
								</div>
							)}
						</div>
					</button>
				))}
			</div>
		</aside>
	)
}

export default MachineList
