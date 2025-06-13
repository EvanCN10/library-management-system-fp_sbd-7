import Header from "@/components/header"
import Dashboard from "@/components/dashboard"

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main className="main-content">
        <Dashboard />
      </main>

      {/* Notification */}
      <div id="notification" className="notification">
        <div className="notification-content">
          <span id="notificationMessage"></span>
          <button id="closeNotification">&times;</button>
        </div>
      </div>
    </>
  )
}
