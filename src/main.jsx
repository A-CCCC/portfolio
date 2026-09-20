import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { warmFramesWhenIdle } from './components/frame-store'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Once this page has finished loading, fetch the frames for the scrubbed
// animations in the background, so those pages play rather than buffer.
warmFramesWhenIdle()
