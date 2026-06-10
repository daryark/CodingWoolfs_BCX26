// ─── API client for the FastAPI backend ──────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

// ─── Types mirroring the Pydantic models ──────────────────────────────────────

export interface ApiMachine {
  id: string
  machineId: string
  brand: string
  model: string
  machineType: string
  controller: string
  serialNumber: string
  installYear: number
  plant: string
  line: string
  maintenanceIntervalDays: number
  notes?: string
  lastMaintenanceDate?: string
  nextMaintenanceDue?: string
  daysSinceLastMaintenance?: number
  maintenanceOverdue?: boolean
  createdAt: string
}

export interface ApiEventError {
  nativeCode: string
  conditionType: string
  conditionState: string
  description: string
  causes: string[]
  fixHint: string
}

export interface ApiEvent {
  id: string
  timestamp: string
  machine: { id: string; name: string; manufacturer: string; controller: string }
  error: ApiEventError
  status: string
  resolvedAt?: string
  durationSeconds?: number
  shift: string
  plant: string
}

export interface ApiResolutionAttempt {
  action: string
  result: string
  durationMinutes?: number
}

export interface ApiResolution {
  id: string
  machineId: string
  controller: string
  nativeCode: string
  errorDescription?: string
  timestamp: string
  resolvedAt?: string
  downtimeMinutes?: number
  successfulFix?: string
  partsReplaced: string[]
  workedFirstTime?: boolean
  attempts: ApiResolutionAttempt[]
  attemptCount?: number
  verifiedBy?: string
  shift?: string
  ragSummary?: string
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const api = {
  getMachines: ()                            => apiFetch<ApiMachine[]>('/get-machines'),
  getMachineEvents: (machineId: string)      => apiFetch<ApiEvent[]>(`/get-machines/${machineId}/events`),
  getMachineResolutions: (machineId: string) => apiFetch<ApiResolution[]>(`/get-machines/${machineId}/resolutions`),
}
