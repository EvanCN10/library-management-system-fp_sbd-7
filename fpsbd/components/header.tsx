"use client"

import { useState } from "react"
import Link from "next/link"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleNavClick = (section: string) => {
    setActiveSection(section)
    if (window.innerWidth <= 991) {
      setIsMenuOpen(false)
    }
  }

  return (
    <header className="header">
      <div className="container">
        <div className="nav-brand">
          <i className="fas fa-book"></i>
          <span>LMS7</span>
        </div>
        <nav className={`nav-menu ${isMenuOpen ? "show" : ""}`} id="navMenu">
          <Link
            href="#dashboard"
            className={`nav-item ${activeSection === "dashboard" ? "active" : ""}`}
            data-section="dashboard"
            onClick={() => handleNavClick("dashboard")}
          >
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </Link>
          <Link
            href="#books"
            className={`nav-item ${activeSection === "books" ? "active" : ""}`}
            data-section="books"
            onClick={() => handleNavClick("books")}
          >
            <i className="fas fa-book"></i> Koleksi Buku
          </Link>
          <Link
            href="#members"
            className={`nav-item ${activeSection === "members" ? "active" : ""}`}
            data-section="members"
            onClick={() => handleNavClick("members")}
          >
            <i className="fas fa-users"></i> Anggota
          </Link>
          <Link
            href="#circulation"
            className={`nav-item ${activeSection === "circulation" ? "active" : ""}`}
            data-section="circulation"
            onClick={() => handleNavClick("circulation")}
          >
            <i className="fas fa-exchange-alt"></i> Sirkulasi
          </Link>
          <Link
            href="#reservations"
            className={`nav-item ${activeSection === "reservations" ? "active" : ""}`}
            data-section="reservations"
            onClick={() => handleNavClick("reservations")}
          >
            <i className="fas fa-bookmark"></i> Reservasi
          </Link>
          <Link
            href="#reports"
            className={`nav-item ${activeSection === "reports" ? "active" : ""}`}
            data-section="reports"
            onClick={() => handleNavClick("reports")}
          >
            <i className="fas fa-chart-bar"></i> Laporan
          </Link>
        </nav>
        <div className={`hamburger ${isMenuOpen ? "active" : ""}`} id="hamburger" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </header>
  )
}
