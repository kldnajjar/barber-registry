import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LocaleProvider } from './context/LocaleContext'
import { ScheduleProvider } from './context/ScheduleContext'
import App from './App'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || 'placeholder.apps.googleusercontent.com'}>
      <LocaleProvider>
        <ScheduleProvider>
          <App />
        </ScheduleProvider>
      </LocaleProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
