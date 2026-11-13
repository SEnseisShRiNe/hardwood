import React from 'react'
import ReactDOM from 'react-dom/client'
import HardwoodGame from './HardwoodGame'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <HardwoodGame />
)

// Inside the iOS app only: white status-bar text over the dark strip at the
// top of the screen. Loaded on demand, so the website never downloads it.
if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
  import('@capacitor/status-bar')
    .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: Style.Dark }))
    .catch(() => {})
}
