import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import Appoint from './Clientsidepage/Appoint.jsx'
// import CatalogSidebarLayout from './Clientsidepage/CatalogSideBarLayout.jsx'
// import TeamSideBarLayout from './Clientsidepage/TeamSidebarLayout.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
