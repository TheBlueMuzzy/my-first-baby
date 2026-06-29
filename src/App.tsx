import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './views/Home'
import CalendarView from './views/CalendarView'
import Agenda from './views/Agenda'
import Gallery from './views/Gallery'
import TaskDetail from './views/TaskDetail'
import AuthGate from './auth/AuthGate'

export default function App() {
  return (
    <AuthGate>
      <HashRouter>
        <div className="app">
          <main className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/schedule" element={<Agenda />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/task/:id" element={<TaskDetail />} />
            </Routes>
          </main>
          <nav className="tabbar">
            <Tab to="/" label="Today" icon="◉" />
            <Tab to="/calendar" label="Calendar" icon="▦" />
            <Tab to="/schedule" label="Schedule" icon="☰" />
            <Tab to="/gallery" label="Gallery" icon="❏" />
          </nav>
        </div>
      </HashRouter>
    </AuthGate>
  )
}

function Tab({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')} end={to === '/'}>
      <span className="tab__icon">{icon}</span>
      <span className="tab__label">{label}</span>
    </NavLink>
  )
}
