// Authentication Manager - File baru untuk mengelola autentikasi
// Tambahkan ke folder js/ Anda

// Check authentication on page load
document.addEventListener("DOMContentLoaded", () => {
  // Skip auth check for login page
  if (window.location.pathname.includes("login.html")) {
    return
  }

  const savedUser = localStorage.getItem("libraryUser")

  if (!savedUser) {
    // Redirect to login if not authenticated
    window.location.href = "login.html"
    return
  }

  const userData = JSON.parse(savedUser)

  // Add user info to header
  addUserInfoToHeader(userData)

  // Hide buttons based on role
  hideButtonsForUsers(userData.role)
})

function addUserInfoToHeader(userData) {
  const header = document.querySelector(".header .container")
  if (!header) return

  // Create user info element
  const userInfo = document.createElement("div")
  userInfo.className = "user-info"
  userInfo.innerHTML = `
        <div class="user-details">
            <span class="user-name">${userData.name}</span>
            <span class="user-role ${userData.role}">
                ${userData.role === "librarian" ? "Pustakawan" : "Pengguna"}
            </span>
        </div>
        <button class="logout-btn" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i>
            <span>Keluar</span>
        </button>
    `

  // Insert before hamburger menu
  const hamburger = header.querySelector(".hamburger")
  if (hamburger) {
    header.insertBefore(userInfo, hamburger)
  } else {
    header.appendChild(userInfo)
  }
}

function hideButtonsForUsers(role) {
  if (role === "user") {
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
    const addButtons = document.querySelectorAll('button[id*="add"], button[id*="new"]')
    addButtons.forEach((btn) => {
      if (btn.textContent.includes("Tambah") || btn.textContent.includes("Baru")) {
        btn.style.display = "none"
      }
    })
  }
}

function logout() {
  localStorage.removeItem("libraryUser")
  window.location.href = "login.html"
}

function addUserInfoStyles() {
  const styles = `
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
        }
        </style>
    `

  document.head.insertAdjacentHTML("beforeend", styles)
}
