import { createRoot } from 'react-dom/client'
import App from './App.jsx'

function syncVisualViewport() {
  const root = document.documentElement
  const vv = window.visualViewport
  if (vv) {
    const top = Math.round(vv.offsetTop)
    const height = Math.round(vv.height)
    const bottomGap = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
    root.style.setProperty('--vv-top', `${top}px`)
    root.style.setProperty('--vv-height', `${height}px`)
    root.style.setProperty('--vv-bottom-gap', `${bottomGap}px`)
    root.style.setProperty('--app-height', `${height}px`)
  } else {
    const height = Math.round(window.innerHeight)
    root.style.setProperty('--vv-top', '0px')
    root.style.setProperty('--vv-height', `${height}px`)
    root.style.setProperty('--vv-bottom-gap', '0px')
    root.style.setProperty('--app-height', `${height}px`)
  }
}

syncVisualViewport()
window.addEventListener('resize', syncVisualViewport)
window.addEventListener('orientationchange', syncVisualViewport)
window.visualViewport?.addEventListener('resize', syncVisualViewport)
window.visualViewport?.addEventListener('scroll', syncVisualViewport)
window.addEventListener('pageshow', syncVisualViewport)
requestAnimationFrame(syncVisualViewport)

createRoot(document.getElementById('root')).render(<App />)