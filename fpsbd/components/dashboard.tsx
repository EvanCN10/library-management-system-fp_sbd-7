"use client"

import { useEffect, useState } from "react"
import { fetchDashboardStats, fetchRecentActivities } from "@/lib/api-client"
import type { DashboardStats, Activity } from "@/types"

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalMembers: 0,
    borrowedBooks: 0,
    overdueBooks: 0,
  })

  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const statsData = await fetchDashboardStats()
        setStats(statsData)

        const activitiesData = await fetchRecentActivities()
        setActivities(activitiesData)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Animation for counter
  useEffect(() => {
    if (!isLoading) {
      const animateCounter = (element: HTMLElement, start: number, end: number, duration: number) => {
        let startTimestamp: number | null = null

        const step = (timestamp: number) => {
          if (!startTimestamp) startTimestamp = timestamp
          const progress = Math.min((timestamp - startTimestamp) / duration, 1)
          const value = Math.floor(progress * (end - start) + start)
          element.textContent = value.toString()

          if (progress < 1) {
            window.requestAnimationFrame(step)
          }
        }

        window.requestAnimationFrame(step)
      }

      const elements = [
        { id: "totalBooks", value: stats.totalBooks },
        { id: "totalMembers", value: stats.totalMembers },
        { id: "borrowedBooks", value: stats.borrowedBooks },
        { id: "overdueBooks", value: stats.overdueBooks },
      ]

      elements.forEach((item) => {
        const element = document.getElementById(item.id)
        if (element) {
          animateCounter(element, 0, item.value, 1500)
        }
      })
    }
  }, [isLoading, stats])

  return (
    <section id="dashboard" className="section active">
      <div className="container">
        <h1>Dashboard</h1>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-book"></i>
            </div>
            <div className="stat-info">
              <h3 id="totalBooks">{isLoading ? 0 : stats.totalBooks}</h3>
              <p>Total Buku</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <h3 id="totalMembers">{isLoading ? 0 : stats.totalMembers}</h3>
              <p>Total Anggota</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-book-open"></i>
            </div>
            <div className="stat-info">
              <h3 id="borrowedBooks">{isLoading ? 0 : stats.borrowedBooks}</h3>
              <p>Buku Dipinjam</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <h3 id="overdueBooks">{isLoading ? 0 : stats.overdueBooks}</h3>
              <p>Terlambat</p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-content">
          <div className="card">
            <h2>Aktivitas Terbaru</h2>
            <div id="recentActivities" className="activity-list">
              {isLoading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : (
                activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="activity-item fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`activity-icon ${activity.type}`}>
                      <i className={`fas ${activity.icon}`}></i>
                    </div>
                    <div className="activity-content">
                      <h4>{activity.text}</h4>
                      <p>Sistem perpustakaan digital</p>
                    </div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
