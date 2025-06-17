// Authentication and role management
class AuthManager {
  constructor() {
    this.currentUser = null
    this.init()
  }

  init() {
    // Check if user is logged in
    const savedUser = localStorage.getItem("libraryUser")
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser)
      this.updateUIForRole()
    } else {
      // Redirect to login if not logged in
      if (window.location.pathname !== "/login.html") {
        window.location.href = "login.html"
      }
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  isLibrarian() {
    return this.currentUser && this.currentUser.role === "librarian"
  }

  isUser() {
    return this.currentUser && this.currentUser.role === "user"
  }

  logout() {
    localStorage.removeItem("libraryUser")
    window.location.href = "login.html"
  }

  updateUIForRole() {
    if (!this.currentUser) return

    // Update header with user info
    this.updateHeader()

    // Hide/show buttons based on role
    this.updateButtonsVisibility()
  }

  updateHeader() {
    // Add user info to header
    const header = document.querySelector(".header .container")
    if (header && !document.querySelector(".user-info")) {
      const userInfo = document.createElement("div")
      userInfo.className = "user-info"
      userInfo.innerHTML = `
                <div class="user-details">
                    <span class="user-name">${this.currentUser.name}</span>
                    <span class="user-role ${this.currentUser.role}">${this.currentUser.role === "librarian" ? "Pustakawan" : "Pengguna"}</span>
                </div>
                <button class="logout-btn" onclick="authManager.logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Keluar</span>
                </button>
            `

      // Insert before hamburger menu
      const hamburger = header.querySelector(".hamburger")
      header.insertBefore(userInfo, hamburger)
    }
  }

  updateButtonsVisibility() {
    // Hide add buttons for regular users
    if (this.isUser()) {
      // Hide "Tambah Buku" button
      const addBookBtn = document.getElementById("addBookBtn")
      if (addBookBtn) {
        addBookBtn.style.display = "none"
      }

      // Hide "Tambah Anggota" button
      const addMemberBtn = document.getElementById("addMemberBtn")
      if (addMemberBtn) {
        addMemberBtn.style.display = "none"
      }

      // Hide other add buttons
      const addButtons = document.querySelectorAll('.btn-primary[id*="add"], .btn-primary[id*="new"]')
      addButtons.forEach((btn) => {
        if (btn.textContent.includes("Tambah") || btn.textContent.includes("Baru")) {
          btn.style.display = "none"
        }
      })
    }
  }
}

// Initialize auth manager
const authManager = new AuthManager()

// Add styles for user info
const userInfoStyles = `
<style>
.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;
    margin-right: 1rem;
}

.user-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
}

.user-name {
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
}

.user-role {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.user-role.librarian {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
}

.user-role.user {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
}

.logout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.85rem;
}

.logout-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

@media (max-width: 768px) {
    .user-info {
        display: none;
    }
    
    .user-info.mobile-visible {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 1rem;
        background: rgba(26, 26, 26, 0.95);
        border-radius: 12px;
        margin-top: 1rem;
    }
    
    .user-details {
        align-items: flex-start;
        width: 100%;
        margin-bottom: 1rem;
    }
    
    .logout-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
`

// Add styles to head
document.head.insertAdjacentHTML("beforeend", userInfoStyles)
