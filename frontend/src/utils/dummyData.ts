// ─── Shared dummy data ────────────────────────────────────────────────────────

export interface LogEntry {
  id: string
  time: string
  level: 'info' | 'warn' | 'error'
  message: string
  reportId?: string // links to a LogReport if one exists
}

export interface LogReport {
  id: string
  title: string
  issue: string
  tried: string[]
  solution: string
  resolvedAt?: string
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export const DUMMY_REPORTS: Record<string, LogReport> = {
  'report-001': {
    id: 'report-001',
    title: 'Vibration threshold exceeded — emergency stop',
    issue:
      'Axis Z vibration sensor readings climbed from 4.2 mm/s to 6.8 mm/s over ~5 minutes, breaching the 6.0 mm/s safety threshold. The PLC triggered an emergency stop and engaged the safety interlock. Motor drive logged an over-current fault on axis Z immediately after.',
    tried: [
      'Remote diagnostic run — no loose fasteners detected by sensor sweep.',
      'PLC fault log reviewed; over-current confirmed as secondary symptom, not root cause.',
      'Attempted soft-reset of axis Z drive controller — vibration persisted at restart.',
      'Reduced feed-rate to 60 % and re-homed all axes — vibration reoccurred within 2 minutes.',
    ],
    solution:
      'On-site inspection revealed a worn spindle bearing (left front). Bearing replaced (part #SB-Z-4412). Drive controller firmware updated to v3.7.1 which includes improved vibration damping coefficients. Full calibration run completed; vibration nominal at 1.1 mm/s. Machine returned to service.',
    resolvedAt: '2026-06-09 16:45:00',
  },
  'report-002': {
    id: 'report-002',
    title: 'Coolant temperature elevation',
    issue:
      'Coolant temperature rose to 78 °C, approaching the 80 °C warning threshold during a continuous production run. No immediate shutdown was triggered, but the anomaly was logged for review.',
    tried: [
      'Checked coolant flow rate — within spec at 12 L/min.',
      'Inspected coolant filter — slight clogging found, filter cleaned.',
    ],
    solution:
      'Cleaning the coolant filter restored normal thermal dissipation. Temperature stabilised at 74 °C. Maintenance interval for coolant filter reduced from 30 days to 21 days to prevent recurrence.',
    resolvedAt: '2026-06-09 15:10:00',
  },
  'report-003': {
    id: 'report-003',
    title: 'Safety interlock engaged — manual inspection',
    issue:
      'Following the emergency stop event, the safety interlock remained engaged and blocked any restart attempt. Operator acknowledgement was not received within the expected 15-minute window.',
    tried: [
      'Sent automated alert to floor supervisor — no response for 15 minutes.',
      'Escalated alert to shift manager via SMS gateway.',
    ],
    solution:
      'Shift manager acknowledged the alert and dispatched a technician. Interlock was released after physical inspection confirmed the area was clear and the root cause (bearing replacement) had been resolved.',
    resolvedAt: '2026-06-09 16:50:00',
  },
}

// ─── Log sets ─────────────────────────────────────────────────────────────────

export const LOGS_HEALTHY: LogEntry[] = [
  { id: 'h1', time: '2026-06-09 14:32:11', level: 'info', message: 'System boot completed successfully.',                              reportId: 'report-002' },
  { id: 'h2', time: '2026-06-09 14:33:05', level: 'info', message: 'Calibration check passed. All axes nominal.',                      reportId: 'report-002' },
  { id: 'h3', time: '2026-06-09 14:35:22', level: 'info', message: 'Production cycle started. Batch #4812.',                           reportId: 'report-002' },
  { id: 'h4', time: '2026-06-09 14:40:01', level: 'info', message: 'Output rate: 142 units/min — within target range.',                reportId: 'report-002' },
  { id: 'h5', time: '2026-06-09 14:45:18', level: 'warn', message: 'Coolant temperature slightly elevated: 78°C (threshold 80°C).',   reportId: 'report-002' },
  { id: 'h6', time: '2026-06-09 14:50:33', level: 'info', message: 'Coolant temperature normalised: 74°C.',                            reportId: 'report-002' },
  { id: 'h7', time: '2026-06-09 14:55:47', level: 'info', message: 'Scheduled maintenance reminder in 3 days.',                        reportId: 'report-002' },
  { id: 'h8', time: '2026-06-09 15:00:00', level: 'info', message: 'Heartbeat OK.',                                                    reportId: 'report-002' },
]

export const LOGS_ERROR: LogEntry[] = [
  { id: 'e1',  time: '2026-06-09 13:10:04', level: 'info',  message: 'System boot completed successfully.',                                                    reportId: 'report-001' },
  { id: 'e2',  time: '2026-06-09 13:15:30', level: 'info',  message: 'Calibration check passed.',                                                              reportId: 'report-001' },
  { id: 'e3',  time: '2026-06-09 13:20:11', level: 'warn',  message: 'Vibration sensor reading above baseline: 4.2 mm/s.',                                    reportId: 'report-001' },
  { id: 'e4',  time: '2026-06-09 13:22:45', level: 'warn',  message: 'Vibration persists: 5.1 mm/s. Monitoring.',                                             reportId: 'report-001' },
  { id: 'e5',  time: '2026-06-09 13:25:03', level: 'error', message: 'CRITICAL: Vibration threshold exceeded (6.8 mm/s). Emergency stop triggered.',          reportId: 'report-001' },
  { id: 'e6',  time: '2026-06-09 13:25:04', level: 'error', message: 'Motor drive fault — over-current detected on axis Z.',                                  reportId: 'report-001' },
  { id: 'e7',  time: '2026-06-09 13:25:05', level: 'error', message: 'Safety interlock engaged. Manual inspection required before restart.',                   reportId: 'report-003' },
  { id: 'e8',  time: '2026-06-09 13:26:00', level: 'warn',  message: 'Awaiting operator acknowledgement.',                                                     reportId: 'report-003' },
  { id: 'e9',  time: '2026-06-09 13:40:00', level: 'warn',  message: 'No operator response. Alert escalated.',                                                 reportId: 'report-003' },
  { id: 'e10', time: '2026-06-09 14:00:00', level: 'error', message: 'Machine remains in fault state. Production halted.',                                     reportId: 'report-001' },
]
