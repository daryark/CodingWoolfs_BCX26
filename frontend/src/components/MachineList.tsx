import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Loader } from 'lucide-react'
import clsx from 'clsx'
import { api, ApiMachine } from '../utils/api'

export interface Machine {
	id: string
	name: string
	status: 'online' | 'offline' | 'error'
	lastUpdate: string
	photo: string
	machineId?: string
	raw?: ApiMachine
}

// Map machineId to a local photo path
const PHOTO_MAP: Record<string, string> = {
	cnc_mazak_01: '/machines/cncmachine1.webp',
	cnc_mazak_02: '/machines/cncmachine2.jpg',
	cnc_fanuc_01: '/machines/cncmachine3.png',
	robotic_kuka_01: '/machines/roboticarm.png',
	press_schuler_01: '/machines/pressmachine.webp',
	conveyor_bosch_01: '/machines/conveyorbelt.jpg',
	inspection_zeiss_01: '/machines/inspectionunit.jpg',
	cnc_mazak_03: '/machines/cncmachine4.webp',
}
const FALLBACK_PHOTO = '/machines/cncmachine1.webp'

function apiToMachine(m: ApiMachine): Machine {
	// Derive status from active events or maintenance overdue
	const hasError = m.maintenanceOverdue === true
	return {
		id: m.machineId,
		name: `${m.brand} ${m.model}`,
		status: hasError ? 'error' : 'online',
		lastUpdate: m.lastMaintenanceDate ? m.lastMaintenanceDate : 'justNow',
		photo: PHOTO_MAP[m.machineId] ?? FALLBACK_PHOTO,
		machineId: m.machineId,
		raw: m,
	}
}

interface MachineListProps {
	selectedMachineId?: string
	onMachineSelect?: (machine: Machine) => void
	mobileFullWidth?: boolean
	onOpenChat?: () => void
}

function MachineList({ selectedMachineId, onMachineSelect, mobileFullWidth, onOpenChat }: MachineListProps) {
	const { t } = useTranslation()
	const [expanded, setExpanded] = useState(true)
	const [machines, setMachines] = useState<Machine[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		api.getMachines()
			.then((data) => {
				setMachines(data.map(apiToMachine))
			})
			.catch(() => {
				// API unavailable — leave empty (could add fallback dummy data here)
			})
			.finally(() => setLoading(false))
	}, [])

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

	const onlineMachines = machines.filter(m => m.status === 'online').length
	const errorMachines  = machines.filter(m => m.status === 'error').length

	const sortedMachines = [...machines].sort((a, b) =>
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
						<span className="text-gray-600">{onlineMachines} {t('machines.working')}</span>
					</div>
					<div className="flex items-center gap-2 text-sm">
						<div className="w-3 h-3 bg-red-500 rounded-full" />
						<span className="text-gray-600">{errorMachines} {t('machines.error')}</span>
					</div>
				</div>

				{/* Machine grid */}
				<div className="flex-1 overflow-y-auto p-3 space-y-2">
					{loading && (
						<div className="flex items-center justify-center py-10 text-gray-400">
							<Loader size={20} className="animate-spin" />
						</div>
					)}
					{!loading && sortedMachines.map((machine) => (
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
								<div className={clsx(
									'relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden ring-2',
									statusRing(machine.status)
								)}>
									<img src={machine.photo} alt={machine.name} className="w-full h-full object-cover" />
									<span className={clsx(
										'absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white',
										statusDot(machine.status)
									)} />
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-2">
										<h3 className="font-medium text-sm text-gray-900 truncate">{machine.name}</h3>
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

				{/* Start Chat button */}
				{onOpenChat && (
					<div className="px-4 py-3 border-t border-gray-100">
						<button
							onClick={onOpenChat}
							className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-sm"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
							</svg>
							{t('machines.startChat')}
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
			<div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
				<div className="flex items-center justify-between mb-3">
					<h2 className={clsx('font-semibold text-gray-900 transition-opacity', !expanded && 'hidden')}>
						{t('machines.title')}
					</h2>
					<button
						onClick={() => setExpanded(!expanded)}
						className="p-1 hover:bg-gray-100 rounded transition-colors"
					>
						<svg
							className={clsx('w-5 h-5 text-gray-600 transition-transform', !expanded && 'rotate-180')}
							fill="none" stroke="currentColor" viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
				</div>
				{expanded && (
					<div className="space-y-2 text-sm">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-500 rounded-full" />
							<span className="text-gray-600">{onlineMachines} {t('machines.working')}</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-red-500 rounded-full" />
							<span className="text-gray-600">{errorMachines} {t('machines.error')}</span>
						</div>
					</div>
				)}
			</div>

			<div className="flex-1 p-2 space-y-1">
				{loading && (
					<div className="flex items-center justify-center py-10 text-gray-400">
						<Loader size={18} className="animate-spin" />
					</div>
				)}
				{!loading && sortedMachines.map((machine) => (
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
								<img src={machine.photo} alt={machine.name} className="w-full h-full object-cover" />
								<span className={clsx(
									'absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
									statusDot(machine.status)
								)} />
							</div>
							{expanded && (
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-1">
										<h3 className="font-medium text-sm text-gray-900 truncate leading-tight">{machine.name}</h3>
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
