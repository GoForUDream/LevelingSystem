import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import '@fontsource/oxanium/400.css'
import '@fontsource/oxanium/500.css'
import '@fontsource/oxanium/600.css'
import '@fontsource/oxanium/700.css'
import '@fontsource/oxanium/800.css'
import './index.css'
import './i18n'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
