import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export interface Machine {
	id: string
	name: string
	status: 'online' | 'offline' | 'error'
	lastUpdate: string
}

const DUMMY_MACHINES: Machine[] = [
	{ id: '1', name: 'CNC Machine 1', status: 'online', lastUpdate: 'Just now' },
	{ id: '2', name: 'Welding Unit A', status: 'online', lastUpdate: '2 min ago' },
	{ id: '3', name: 'Assembly Line B', status: 'online', lastUpdate: '5 min ago' },
	{ id: '4', name: 'Robotic Arm 3', status: 'error', lastUpdate: '1 min ago' },
	{ id: '5', name: 'Press Machine 1', status: 'online', lastUpdate: '3 min ago' },
	{ id: '6', name: 'Conveyor Belt 2', status: 'online', lastUpdate: '1 min ago' },
	{ id: '7', name: 'Inspection Unit', status: 'online', lastUpdate: '4 min ago' },
	{ id: '8', name: 'Packaging Station', status: 'online', lastUpdate: 'Just now' },
]

interface MachineListProps {
	selectedMachineId?: string
	onMachineSelect?: (machine: Machine) => void
}

function MachineList({ selectedMachineId, onMachineSelect }: MachineListProps) {
	const [expanded, setExpanded] = useState(true)

	const getStatusDot = (status: Machine['status']) => {
		switch (status) {
			case 'online':
				return 'bg-green-500'
			case 'error':
				return 'bg-red-500'
			case 'offline':
				return 'bg-gray-400'
			default:
				return 'bg-gray-400'
		}
	}

	const onlineMachines = DUMMY_MACHINES.filter(m => m.status === 'online').length
	const errorMachines = DUMMY_MACHINES.filter(m => m.status === 'error').length

	return (
		<aside
			className={clsx(
				'bg-white border-r border-gray-200 shadow-sm transition-all duration-300 overflow-y-auto hidden md:flex md:flex-col',
				expanded ? 'md:w-72' : 'md:w-16'
			)}
		>
			{/* Header */}
			<div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
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

				{/* Stats */}
				{expanded && (
					<div className="space-y-2 text-sm">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-500 rounded-full"></div>
							<span className="text-gray-600">{onlineMachines} Online</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-red-500 rounded-full"></div>
							<span className="text-gray-600">{errorMachines} Error</span>
						</div>
					</div>
				)}
			</div>

			{/* Machine List */}
			<div className="flex-1 p-2 space-y-1">
				{DUMMY_MACHINES.map((machine) => (
					<button
						key={machine.id}
						onClick={() => onMachineSelect?.(machine)}
						className={clsx(
							'w-full text-left p-3 rounded-lg transition-all duration-200',
							selectedMachineId === machine.id
								? 'bg-primary-50 border border-primary-300 shadow-sm'
								: 'hover:bg-gray-50 border border-transparent'
						)}
						title={machine.name}
					>
						<div className="flex items-start gap-3">
							{/* Status Dot */}
							<div className={clsx('w-3 h-3 rounded-full mt-1.5 flex-shrink-0', getStatusDot(machine.status))}></div>

							{/* Content */}
							{expanded && (
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-2">
										<h3 className="font-medium text-sm text-gray-900 truncate">{machine.name}</h3>
										{machine.status === 'error' && (
											<AlertCircle size={16} className="text-red-500 flex-shrink-0" />
										)}
									</div>
									<p className="text-xs text-gray-500 mt-1">{machine.lastUpdate}</p>
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
