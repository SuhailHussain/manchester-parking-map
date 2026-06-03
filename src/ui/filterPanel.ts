import type { ParkingFilter } from '../types'
import { BANK_HOLIDAYS } from '../zones/zoneDefinitions'

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

  const handle    = document.getElementById('sheet-handle') as HTMLElement
  const panel     = document.getElementById('filter-panel') as HTMLElement
  const sheetBody = document.getElementById('sheet-body') as HTMLElement
  const nowBtn    = document.getElementById('now-btn') as HTMLButtonElement
  const customTime = document.getElementById('custom-time') as HTMLDivElement
  const dateInput = document.getElementById('date-input') as HTMLInputElement
  const timeInput = document.getElementById('time-input') as HTMLInputElement
  const statusEl  = document.getElementById('current-status')
  const costBtns  = document.querySelectorAll<HTMLButtonElement>('.cost-btn')
  const durBtns   = document.querySelectorAll<HTMLButtonElement>('.dur-btn')

  // Initialise date/time inputs to now
  const now = new Date()
  dateInput.value = now.toISOString().slice(0, 10)
  timeInput.value = now.toTimeString().slice(0, 5)

  // ── Sheet collapse / expand (mobile only) ────────────────
  function setSheetOpen(open: boolean): void {
    panel.classList.toggle('open', open)
    handle.setAttribute('aria-expanded', String(open))
    handle.setAttribute('aria-label', open ? 'Hide parking filters' : 'Show parking filters')
    sheetBody.setAttribute('aria-hidden', String(!open))
  }

  handle.addEventListener('click', () => {
    const isOpen = panel.classList.contains('open')
    setSheetOpen(!isOpen)
  })

  handle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handle.click()
    }
  })

  // ── Status text ───────────────────────────────────────────
  function updateStatus(): void {
    if (!statusEl) return
    const dt = currentFilter.datetime

    if (!useNow) {
      const dayStr  = dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      const timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      statusEl.textContent = `${dayStr} · ${timeStr}`
      return
    }

    const iso         = dt.toISOString().slice(0, 10)
    const isBankHol   = BANK_HOLIDAYS.has(iso)
    const hours       = dt.getHours() + dt.getMinutes() / 60
    const isRestricted = !isBankHol && hours >= 8 && hours < 20

    if (isRestricted) {
      statusEl.innerHTML =
        `<span class="status-chip paid" aria-label="Paid parking">Paid</span> parking until 8:00 PM`
    } else if (isBankHol) {
      statusEl.innerHTML =
        `<span class="status-chip free" aria-label="Free parking">Free</span> — bank holiday`
    } else if (hours < 8) {
      statusEl.innerHTML =
        `<span class="status-chip free" aria-label="Free parking">Free</span> until 8:00 AM`
    } else {
      statusEl.innerHTML =
        `<span class="status-chip free" aria-label="Free parking">Free</span> from 8:00 PM`
    }
  }

  function setPressed(btn: HTMLButtonElement, pressed: boolean): void {
    btn.classList.toggle('active', pressed)
    btn.setAttribute('aria-pressed', String(pressed))
  }

  function emit(): void {
    updateStatus()
    onChange({ ...currentFilter })
  }

  // ── Right Now toggle ──────────────────────────────────────
  nowBtn.addEventListener('click', () => {
    useNow = !useNow
    setPressed(nowBtn, useNow)
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

  // ── Cost buttons ──────────────────────────────────────────
  costBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      costBtns.forEach(b => setPressed(b, false))
      setPressed(btn, true)
      const val = btn.dataset.value
      currentFilter.maxCost = val === '' ? null : Number(val)
      emit()
    })
  })

  // ── Duration buttons ──────────────────────────────────────
  durBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durBtns.forEach(b => setPressed(b, false))
      setPressed(btn, true)
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
