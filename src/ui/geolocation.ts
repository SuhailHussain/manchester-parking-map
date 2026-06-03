import { flyToUser } from '../map'

export function initGeolocation(): void {
  const btn = document.getElementById('locate-btn') as HTMLButtonElement

  if (!navigator.geolocation) {
    btn.hidden = true
    return
  }

  btn.innerHTML = '&#x2316;'
  btn.title = 'Use my location'

  btn.addEventListener('click', () => {
    btn.disabled = true
    btn.textContent = '…'

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        flyToUser(pos.coords.longitude, pos.coords.latitude)
        btn.innerHTML = '&#x2316;'
        btn.disabled = false
      },
      () => {
        btn.innerHTML = '&#x2316;'
        btn.disabled = false
        btn.title = 'Location unavailable'
      },
      { timeout: 10_000, maximumAge: 30_000 }
    )
  })
}
