import type { ParkingFilter } from '../types'

export type FilterChangeCallback = (filter: ParkingFilter) => void

let useNow = true
let currentFilter: ParkingFilter = {
  datetime: new Date(),
  maxCost: null,
  durationMinutes: 60,
}
let onChange: FilterChangeCallback
let refreshTimer: ReturnType<typeof setInterval> | null = null

export function initFilterPanel(callback: FilterChangeCallback): void {
  onChange = callback

  const nowBtn = document.getElementById('now-btn') as HTMLButtonElement
  const customTime = document.getElementById('custom-time') as HTMLDivElement
  const dateInput = document.getElementById('date-input') as HTMLInputElement
  const timeInput = document.getElementById('time-input') as HTMLInputElement
  const costBtns = document.querySelectorAll<HTMLButtonElement>('.cost-btn')
  const durBtns = document.querySelectorAll<HTMLButtonElement>('.dur-btn')
  const statusEl = document.getElementById('current-status')

  // Initialise date/time inputs to now
  const now = new Date()
  dateInput.value = now.toISOString().slice(0, 10)
  timeInput.value = now.toTimeString().slice(0, 5)

  function updateStatus(): void {
    if (!statusEl) return
    const dt = currentFilter.datetime
    const timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const dayStr = dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    statusEl.textContent = useNow ? `Right now · ${timeStr}` : `${dayStr} · ${timeStr}`
  }

  function emit(): void {
    updateStatus()
    onChange({ ...currentFilter })
  }

  // Right Now toggle
  nowBtn.addEventListener('click', () => {
    useNow = !useNow
    nowBtn.classList.toggle('active', useNow)
    customTime.hidden = useNow

    if (useNow) {
      currentFilter.datetime = new Date()
      startAutoRefresh()
    } else {
      stopAutoRefresh()
      applyCustomTime(dateInput.value, timeInput.value)
    }
    emit()
  })

  dateInput.addEventListener('change', () => applyCustomTime(dateInput.value, timeInput.value))
  timeInput.addEventListener('change', () => applyCustomTime(dateInput.value, timeInput.value))

  function applyCustomTime(date: string, time: string): void {
    if (!date || !time) return
    currentFilter.datetime = new Date(`${date}T${time}:00`)
    emit()
  }

  // Cost buttons
  costBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      costBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      const val = btn.dataset.value
      currentFilter.maxCost = val === '' ? null : Number(val)
      emit()
    })
  })

  // Duration buttons
  durBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentFilter.durationMinutes = Number(btn.dataset.value)
      emit()
    })
  })

  startAutoRefresh()
  emit()
}

function startAutoRefresh(): void {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    if (useNow) {
      currentFilter.datetime = new Date()
      onChange({ ...currentFilter })
    }
  }, 60_000)
}

function stopAutoRefresh(): void {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}
