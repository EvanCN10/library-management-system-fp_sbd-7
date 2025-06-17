// Import auth manager
document.head.insertAdjacentHTML("beforeend", '<script src="js/auth.js"></script>')

document.addEventListener("DOMContentLoaded", () => {
  // Check authentication before initializing
  if (!localStorage.getItem("libraryUser") && window.location.pathname !== "/login.html") {
    window.location.href = "login.html"
  }

  // ===== AUTHENTICATION CHECK FIRST =====
  // Skip auth check for login page
  if (!window.location.pathname.includes("login.html")) {
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
  }

  // ===== ORIGINAL FUNCTIONALITY =====
  // Get DOM elements
  const navItems = document.querySelectorAll(".nav-item")
  const sections = document.querySelectorAll(".section")
  const hamburger = document.getElementById("hamburger")
  const navMenu = document.getElementById("navMenu")

  // Performance optimization - Store DOM queries
  const body = document.body
  const html = document.documentElement

  // Intersection Observer for lazy loading
  const lazyLoadObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.dataset.src) {
            entry.target.src = entry.target.dataset.src
            entry.target.removeAttribute("data-src")
          }
          lazyLoadObserver.unobserve(entry.target)
        }
      })
    },
    { rootMargin: "100px" },
  )

  // Apply lazy loading to images
  document.querySelectorAll("img[data-src]").forEach((img) => {
    lazyLoadObserver.observe(img)
  })

  // Navigation functionality with improved performance
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      const target = item.getAttribute("data-section")

      // Set active nav - use classList toggle with second parameter for better performance
      navItems.forEach((i) => i.classList.toggle("active", i === item))

      // Show section - use classList toggle with second parameter for better performance
      sections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === target)
      })

      // Close mobile nav if open
      if (window.innerWidth <= 991) {
        closeNavMenu()
      }
    })
  })

  // Hamburger menu toggle with improved animation
  function toggleNavMenu() {
    if (navMenu.classList.contains("show")) {
      closeNavMenu()
    } else {
      openNavMenu()
    }
  }

  function openNavMenu() {
    hamburger.classList.add("active")
    navMenu.classList.add("show")
    body.style.overflow = "hidden" // Prevent scrolling

    // Add animation classes
    navMenu.querySelectorAll(".nav-item").forEach((item, index) => {
      item.style.animationDelay = `${index * 0.05}s`
      item.classList.add("fade-in-up")
    })
  }

  function closeNavMenu() {
    hamburger.classList.remove("active")
    navMenu.classList.remove("show")
    body.style.overflow = "" // Allow scrolling

    // Remove animation classes
    navMenu.querySelectorAll(".nav-item").forEach((item) => {
      item.style.animationDelay = ""
      item.classList.remove("fade-in-up")
    })
  }

  // Add event listener to hamburger button
  if (hamburger) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation() // Prevent event bubbling
      toggleNavMenu()
    })
  }

  // Close menu when clicking outside - use event delegation for better performance
  document.addEventListener("click", (e) => {
    if (navMenu && navMenu.classList.contains("show")) {
      if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        closeNavMenu()
      }
    }
  })

  // Handle window resize with debounce for better performance
  let resizeTimer
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const windowWidth = window.innerWidth

      // Update hamburger visibility based on screen size
      if (windowWidth > 991) {
        // Desktop: Hide hamburger, close mobile menu
        closeNavMenu()
        hamburger.style.display = "none"
      } else {
        // Tablet/Mobile: Show hamburger
        hamburger.style.display = "flex"
      }

      // Update responsive tables
      setupResponsiveTables()
    }, 100)
  })

  // Enhanced Tab switching with event delegation
  const tabsContainer = document.querySelector(".tabs")
  if (tabsContainer) {
    tabsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn")
      if (!btn) return

      const tab = btn.getAttribute("data-tab")
      const tabButtons = tabsContainer.querySelectorAll(".tab-btn")
      const tabPanels = document.querySelectorAll(".tab-panel")

      // Update buttons active state
      tabButtons.forEach((b) => {
        b.classList.toggle("active", b === btn)
      })

      // Update panels
      tabPanels.forEach((panel) => {
        panel.classList.toggle("active", panel.id === tab)
      })
    })
  }

  // Modal functionality with improved performance
  function setupModal(openBtnId, modalId, closeSelector) {
    const openBtn = document.getElementById(openBtnId)
    const modal = document.getElementById(modalId)
    if (!modal || !openBtn) return

    const closeBtn = modal.querySelector(closeSelector)

    function openModal() {
      modal.classList.add("show")
      body.style.overflow = "hidden"

      // Focus trap for accessibility
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusableElements.length) {
        focusableElements[0].focus()
      }
    }

    function closeModal() {
      modal.classList.remove("show")
      body.style.overflow = ""
    }

    openBtn.addEventListener("click", openModal)
    closeBtn?.addEventListener("click", closeModal)

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal()
      }
    })

    // Close on Escape key
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal()
      }
    })
  }

  // Setup modals
  setupModal("addBookBtn", "addBookModal", ".close")
  setupModal("addMemberBtn", "addMemberModal", ".close")
  setupModal("newLoanBtn", "newLoanModal", ".close")

  // Notification system with improved animation
  const notification = document.getElementById("notification")
  const closeNotif = document.getElementById("closeNotification")

  closeNotif?.addEventListener("click", () => {
    hideNotification()
  })

  function hideNotification() {
    if (notification) {
      notification.classList.remove("show")
    }
  }

  window.showNotification = (message, type = "success") => {
    const notif = document.getElementById("notification")
    const msg = document.getElementById("notificationMessage")

    if (notif && msg) {
      // Reset any existing animations
      notif.style.animation = "none"
      notif.offsetHeight // Trigger reflow
      notif.style.animation = ""

      notif.className = `notification show ${type}`
      msg.textContent = message

      // Auto-hide after 4 seconds
      setTimeout(() => {
        hideNotification()
      }, 4000)
    }
  }

  // Search functionality with debounce for better performance
  function setupSearch(inputId, tableBodyId) {
    const input = document.getElementById(inputId)
    const tbody = document.getElementById(tableBodyId)
    if (!input || !tbody) return

    let searchTimeout
    input.addEventListener("input", () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        const filter = input.value.toLowerCase().trim()
        const rows = Array.from(tbody.rows)

        rows.forEach((row) => {
          const text = row.textContent.toLowerCase()
          row.style.display = text.includes(filter) ? "" : "none"
        })
      }, 200)
    })
  }

  setupSearch("bookSearch", "booksTableBody")
  setupSearch("memberSearch", "membersTableBody")

  // Filter functionality with improved performance
  const categoryFilter = document.getElementById("categoryFilter")
  const yearFilter = document.getElementById("yearFilter")

  function filterBooks() {
    const tbody = document.getElementById("booksTableBody")
    if (!tbody) return

    const cat = categoryFilter?.value || ""
    const year = yearFilter?.value || ""

    // Use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
      const rows = Array.from(tbody.rows)
      rows.forEach((row) => {
        const rowCat = row.cells[3]?.textContent || ""
        const rowYear = row.cells[4]?.textContent || ""
        const showCat = !cat || rowCat === cat
        const showYear = !year || rowYear === year
        row.style.display = showCat && showYear ? "" : "none"
      })
    })
  }

  categoryFilter?.addEventListener("change", filterBooks)
  yearFilter?.addEventListener("change", filterBooks)

  // Initialize stats with animation
  function initializeStats() {
    const statElements = [
      { id: "totalBooks", value: 1250 },
      { id: "totalMembers", value: 350 },
      { id: "borrowedBooks", value: 97 },
      { id: "overdueBooks", value: 12 },
    ]

    statElements.forEach((stat) => {
      const element = document.getElementById(stat.id)
      if (!element) return

      // Animate the counter
      animateCounter(element, 0, stat.value, 1500)
    })
  }

  // Counter animation function
  function animateCounter(element, start, end, duration) {
    let startTimestamp = null
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const value = Math.floor(progress * (end - start) + start)
      element.textContent = value
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }

  // Initialize activities with staggered animation
  function initializeActivities() {
    const recentAct = document.getElementById("recentActivities")
    if (!recentAct) return

    const activities = [
      {
        icon: "fa-plus",
        text: 'Buku "Pemrograman Modern" ditambahkan',
        time: "10 menit lalu",
        type: "success",
      },
      {
        icon: "fa-user-plus",
        text: 'Anggota "Budi Santoso" terdaftar',
        time: "1 jam lalu",
        type: "info",
      },
      {
        icon: "fa-exchange-alt",
        text: 'Buku "Algoritma dan Struktur Data" dipinjam oleh Ani',
        time: "2 jam lalu",
        type: "warning",
      },
      {
        icon: "fa-undo",
        text: 'Buku "Database Management" dikembalikan',
        time: "3 jam lalu",
        type: "success",
      },
      {
        icon: "fa-exclamation-triangle",
        text: 'Buku "Web Development" terlambat dikembalikan',
        time: "5 jam lalu",
        type: "danger",
      },
    ]

    // Clear existing activities
    recentAct.innerHTML = ""

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment()

    activities.forEach((act, index) => {
      const div = document.createElement("div")
      div.className = "activity-item"
      div.style.animationDelay = `${index * 0.1}s`
      div.classList.add("fade-in-up")

      div.innerHTML = `
        <div class="activity-icon ${act.type}">
          <i class="fas ${act.icon}"></i>
        </div>
        <div class="activity-content">
          <h4>${act.text}</h4>
          <p>Sistem perpustakaan digital</p>
        </div>
        <div class="activity-time">${act.time}</div>
      `

      fragment.appendChild(div)
    })

    recentAct.appendChild(fragment)
  }

  // Form validation with improved feedback
  function enhanceFormValidation() {
    const forms = document.querySelectorAll("form")

    forms.forEach((form) => {
      // Live validation
      form.querySelectorAll("input, select, textarea").forEach((field) => {
        field.addEventListener("blur", () => {
          validateField(field)
        })

        field.addEventListener("input", () => {
          if (field.classList.contains("error")) {
            validateField(field)
          }
        })
      })

      form.addEventListener("submit", (e) => {
        e.preventDefault()

        // Validate all fields
        let isValid = true
        form.querySelectorAll("input, select, textarea").forEach((field) => {
          if (!validateField(field)) {
            isValid = false
          }
        })

        if (isValid) {
          window.showNotification("Data berhasil disimpan!", "success")
          form.reset()

          // Close modal if form is in modal
          const modal = form.closest(".modal")
          if (modal) {
            modal.classList.remove("show")
            body.style.overflow = ""
          }
        } else {
          window.showNotification("Mohon lengkapi semua field yang wajib diisi", "error")

          // Focus first error field
          const firstError = form.querySelector(".error")
          if (firstError) {
            firstError.focus()
          }
        }
      })
    })

    function validateField(field) {
      // Remove existing error message
      const existingError = field.parentElement.querySelector(".error-message")
      if (existingError) existingError.remove()

      let isValid = true

      // Required validation
      if (field.hasAttribute("required") && !field.value.trim()) {
        isValid = false
        field.classList.add("error")

        // Add error message
        const errorMsg = document.createElement("div")
        errorMsg.className = "error-message"
        errorMsg.textContent = "Field ini wajib diisi"
        field.parentElement.appendChild(errorMsg)
      } else {
        field.classList.remove("error")
      }

      // Email validation
      if (field.type === "email" && field.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(field.value.trim())) {
          isValid = false
          field.classList.add("error")

          // Add error message
          const errorMsg = document.createElement("div")
          errorMsg.className = "error-message"
          errorMsg.textContent = "Format email tidak valid"
          field.parentElement.appendChild(errorMsg)
        }
      }

      return isValid
    }
  }

  // Initialize responsive state with improved detection
  function initializeResponsiveState() {
    const windowWidth = window.innerWidth

    // Only show hamburger on tablet and mobile (≤ 991px)
    if (windowWidth <= 991) {
      // Tablet/Mobile: Show hamburger
      if (hamburger) hamburger.style.display = "flex"
    } else {
      // Desktop: Hide hamburger
      if (hamburger) hamburger.style.display = "none"
    }
  }

  // Handle responsive tables
  function setupResponsiveTables() {
    const tables = document.querySelectorAll(".data-table")
    const windowWidth = window.innerWidth

    tables.forEach((table) => {
      if (windowWidth <= 768) {
        table.classList.add("mobile-table")
      } else {
        table.classList.remove("mobile-table")
      }
    })
  }

  // Keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Escape key closes modals and mobile menu
      if (e.key === "Escape") {
        // Close any open modal
        const openModal = document.querySelector(".modal.show")
        if (openModal) {
          openModal.classList.remove("show")
          body.style.overflow = ""
        }

        // Close mobile menu if open
        if (navMenu && navMenu.classList.contains("show")) {
          closeNavMenu()
        }
      }

      // Ctrl/Cmd + K focuses search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        const searchInput = document.querySelector(".search-box input")
        if (searchInput) {
          searchInput.focus()
        }
      }
    })
  }

  // Remove white box popup
  function removeWhiteBox() {
    // Find and remove any white box elements
    const whiteBoxes = document.querySelectorAll(".popup-box, .white-box")
    whiteBoxes.forEach((box) => {
      box.style.display = "none"
    })

    // Add close buttons to any popup elements
    document.querySelectorAll(".popup, .modal-like").forEach((popup) => {
      const closeBtn = document.createElement("button")
      closeBtn.className = "close-button"
      closeBtn.innerHTML = "&times;"
      closeBtn.addEventListener("click", () => {
        popup.style.display = "none"
      })
      popup.appendChild(closeBtn)
    })
  }

  // Add touch gestures for mobile
  function setupTouchGestures() {
    let touchStartX = 0
    let touchEndX = 0

    // Detect swipe right to open menu
    document.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX
      },
      { passive: true },
    )

    document.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX
        handleSwipe()
      },
      { passive: true },
    )

    function handleSwipe() {
      const swipeThreshold = 100

      // Right swipe (from left edge) to open menu
      if (touchEndX - touchStartX > swipeThreshold && touchStartX < 50) {
        if (navMenu && !navMenu.classList.contains("show")) {
          openNavMenu()
        }
      }

      // Left swipe to close menu
      if (touchStartX - touchEndX > swipeThreshold) {
        if (navMenu && navMenu.classList.contains("show")) {
          closeNavMenu()
        }
      }
    }
  }

  // Improve font contrast
  function improveFontContrast() {
    // Add text-white class to important headings
    document.querySelectorAll("h1, h2, h3, .stat-info p").forEach((el) => {
      if (!el.classList.contains("text-gradient")) {
        el.classList.add("text-white")
      }
    })

    // Add text-light class to paragraph text
    document.querySelectorAll("p, td, label").forEach((el) => {
      el.classList.add("text-light")
    })
  }

  // ===== AUTHENTICATION FUNCTIONS =====
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

  // Make logout function global
  window.logout = () => {
    localStorage.removeItem("libraryUser")
    window.location.href = "login.html"
  }

  // Initialize all functionality
  function initialize() {
    initializeStats()
    initializeActivities()
    enhanceFormValidation()
    initializeResponsiveState()
    setupResponsiveTables()
    setupKeyboardShortcuts()
    removeWhiteBox()
    setupTouchGestures()
    improveFontContrast()
  }

  // Run initialization
  initialize()

  // Handle orientation change for mobile devices
  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      initializeResponsiveState()
      setupResponsiveTables()
    }, 100)
  })

  // Add page load performance metrics
  window.addEventListener("load", () => {
    setTimeout(() => {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      console.log(`Page load time: ${pageLoadTime}ms`)
    }, 0)
  })
})

