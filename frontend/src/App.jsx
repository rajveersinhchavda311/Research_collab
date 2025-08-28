import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Projects from "./pages/Projects"
import "./index.css"

function HomeRedirect() {
  const { isAuthed } = useAuth()
  return <Navigate to={isAuthed ? "/projects" : "/login"} replace />
}

function AppContent() {
  const { logout } = useAuth()
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    document.documentElement.setAttribute("data-theme", savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <a href="/" className="logo">
            ResearchHub
          </a>
          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <div className="user-menu">
              <div className="user-avatar">RC</div>
              <div className="user-dropdown">
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}
