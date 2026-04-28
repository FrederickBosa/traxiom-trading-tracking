import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './scss/main.scss'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    primary: { main: '#7c3aed' },
  },
  typography: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
