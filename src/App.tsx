import { ReactNode } from 'react'
import { HashRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Home from './views/Home'
import CalendarView from './views/CalendarView'
import Agenda from './views/Agenda'
import Gallery from './views/Gallery'
import TaskDetail from './views/TaskDetail'
import EventDetail from './views/EventDetail'
import Account from './views/Account'
import Tools from './views/Tools'
import Toaster from './components/Toaster'
import AuthGate from './auth/AuthGate'

export default function App() {
  return (
    <AuthGate>
      <HashRouter>
        <div className="app">
          <TopBar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/schedule" element={<Agenda />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/task/:id" element={<TaskDetail />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/account" element={<Account />} />
              <Route path="/tools" element={<Tools />} />
            </Routes>
          </main>
          <nav className="tabbar">
            <Tab to="/" label="Today" icon="◉" />
            <Tab to="/schedule" label="Schedule" icon="☰" />
            <Tab to="/calendar" label="Calendar" icon="▦" />
            <Tab to="/gallery" label="Gallery" icon="❏" />
            <Tab to="/tools" label="Tools" icon={<ToolsIcon />} />
          </nav>
          <Toaster />
        </div>
      </HashRouter>
    </AuthGate>
  )
}

function TopBar() {
  const navigate = useNavigate()
  return (
    <header className="topbar">
      <span className="topbar__brand">My First Baby</span>
      <button className="topbar__avatar" onClick={() => navigate('/account')} aria-label="Account">
        <PersonIcon />
      </button>
    </header>
  )
}

function Tab({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink to={to} className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')} end={to === '/'}>
      <span className="tab__icon">{icon}</span>
      <span className="tab__label">{label}</span>
    </NavLink>
  )
}

// Simple person outline; uses currentColor so it matches the surrounding color.
function PersonIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

// Wrench — "tools".
function ToolsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2l-5.3 5.3a1.5 1.5 0 0 0 2.1 2.1l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-1.8-.4-.4-1.8 2.5-2.5z" />
    </svg>
  )
}
