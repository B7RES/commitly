
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'

const STORAGE_KEY = 'commitly:spa:redirect'
const BASE_PATH = '/commitly/'

try {
  const raw = sessionStorage.getItem(STORAGE_KEY)

  if (raw) {
    sessionStorage.removeItem(STORAGE_KEY)

    const payload = JSON.parse(raw) as {
      pathname?: string
      search?: string
      hash?: string
    }

    const pathname = payload.pathname || '/'
    const search = payload.search || ''
    const hash = payload.hash || ''

    const isValidPath =
      pathname.startsWith('/') &&
      !pathname.startsWith('//') &&
      !pathname.includes('\\')

    if (isValidPath) {
      const target = pathname === '/'
        ? BASE_PATH
        : `${BASE_PATH.replace(/\/$/, '')}${pathname}`

      window.history.replaceState(null, '', `${target}${search}${hash}`)
    }
  }
} catch {
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/commitly">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
