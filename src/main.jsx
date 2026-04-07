import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PresenceProvider } from './context/PresenceContext.jsx'
import { SiteSettingsProvider } from './context/SiteSettingsContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteSettingsProvider>
      <PresenceProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </PresenceProvider>
    </SiteSettingsProvider>
  </StrictMode>,
)
