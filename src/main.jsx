import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PresenceProvider } from './context/PresenceContext.jsx'
import { SiteSettingsProvider } from './context/SiteSettingsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteSettingsProvider>
      <PresenceProvider>
        <App />
      </PresenceProvider>
    </SiteSettingsProvider>
  </StrictMode>,
)
