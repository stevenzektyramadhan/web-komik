import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { initTheme } from './lib/theme'
import { pruneCache } from './lib/cache'

// Pasang tema tersimpan (gelap/terang) sebelum render agar tidak ada flash.
initTheme();
// Bersihkan cache API yang sudah kedaluwarsa supaya localStorage tidak membengkak.
pruneCache();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

