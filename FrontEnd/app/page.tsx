"use client"

import { useState, useEffect } from "react"
import LoginForm from "@/components/login-form"
import LibraryDashboard from "@/components/library-dashboard"

export default function Home() {
  const [user, setUser] = useState<{ role: "user" | "librarian"; name: string } | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem("libraryUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData: { role: "user" | "librarian"; name: string }) => {
    setUser(userData)
    localStorage.setItem("libraryUser", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("libraryUser")
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return <LibraryDashboard user={user} onLogout={handleLogout} />
}
