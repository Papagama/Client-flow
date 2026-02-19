import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './services/storageDb'
import App from './App.tsx'
import { ToastProvider } from './shared/ui/Toast'

// Restore theme on load
if (localStorage.getItem('app_theme') === 'dark') {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
