import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PresenceProvider } from './context/PresenceContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PresenceProvider>
      <App />
    </PresenceProvider>
  </StrictMode>,
)
