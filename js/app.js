// Enhanced script.js with API integration
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication before initializing
  if (!localStorage.getItem("libraryUser") && window.location.pathname !== "/login.html") {
    window.location.href = "login.html"
  }

  // Skip auth check for login page
  if (!window.location.pathname.includes("login.html")) {
    const savedUser = localStorage.getItem("libraryUser")

    if (!savedUser) {
      window.location.href = "login.html"
      return
    }

    const userData = JSON.parse(savedUser)
    addUserInfoToHeader(userData)
    hideButtonsForUsers(userData.role)
  }

  // Get DOM elements
  const navItems = document.querySelectorAll(".nav-item")
  const sections = document.querySelectorAll(".section")
  const hamburger = document.getElementById("hamburger")
  const navMenu = document.getElementById("navMenu")
  const body = document.body

  // Navigation functionality
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      const target = item.getAttribute("data-section")

      navItems.forEach((i) => i.classList.toggle("active", i === item))
      sections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === target)
      })

      // Load section data when switching
      loadSectionData(target)

      if (window.innerWidth <= 991) {
        closeNavMenu()
      }
    })
  })

  // Load section data based on active section
  async function loadSectionData(section) {
    try {
      switch (section) {
        case 'dashboard':
          await loadDashboardData()
          break
        case 'books':
          await loadBooksData()
          break
        case 'members':
          await loadMembersData()
          break
        case 'circulation':
          await loadLoansData()
          break
        case 'reservations':
          await loadReservationsData()
          break
      }
    } catch (error) {
      console.error(`Error loading ${section} data:`, error)
      showNotification(`Gagal memuat data ${section}`, 'error')
    }
  }

  // Dashboard data loading
  async function loadDashboardData() {
    try {
      // Load stats
      const stats = await API.getDashboardStats()
      updateStatsDisplay(stats)

      // Load activities
      const activities = await API.getRecentActivities()
      updateActivitiesDisplay(activities)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      showNotification('Gagal memuat data dashboard', 'error')
    }
  }

  function updateStatsDisplay(stats) {
    animateCounter(document.getElementById('totalBooks'), 0, stats.totalBooks, 1500)
    animateCounter(document.getElementById('totalMembers'), 0, stats.totalMembers, 1500)
    animateCounter(document.getElementById('borrowedBooks'), 0, stats.borrowedBooks, 1500)
    animateCounter(document.getElementById('overdueBooks'), 0, stats.overdueBooks, 1500)
  }

  function updateActivitiesDisplay(activities) {
    const container = document.getElementById('recentActivities')
    if (!container) return

    container.innerHTML = ''

    activities.forEach((activity, index) => {
      const div = document.createElement('div')
      div.className = 'activity-item'
      div.style.animationDelay = `${index * 0.1}s`
      div.classList.add('fade-in-up')

      div.innerHTML = `
        <div class="activity-icon ${activity.type}">
          <i class="fas ${activity.icon}"></i>
        </div>
        <div class="activity-content">
          <h4>${activity.text}</h4>
          <p>Sistem perpustakaan digital</p>
        </div>
        <div class="activity-time">${activity.time}</div>
      `

      container.appendChild(div)
    })
  }

  // Books data loading
  async function loadBooksData() {
    try {
      const books = await API.getBooks()
      updateBooksTable(books)
    } catch (error) {
      console.error('Error loading books data:', error)
      showNotification('Gagal memuat data buku', 'error')
    }
  }

  function updateBooksTable(books) {
    const tbody = document.getElementById('booksTableBody')
    if (!tbody) return

    tbody.innerHTML = ''

    books.forEach(book => {
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.isbn}</td>
        <td><span class="status-badge status-borrowed">${book.category}</span></td>
        <td>${book.year}</td>
        <td>${book.copies}</td>
        <td><span class="status-badge ${book.available > 0 ? 'status-active' : 'status-inactive'}">${book.available}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="viewBook('${book.id}')">Detail</button>
          <button class="btn btn-sm btn-primary" onclick="editBook('${book.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteBook('${book.id}')">Hapus</button>
        </td>
      `
      tbody.appendChild(row)
    })
  }

  // Members data loading
  async function loadMembersData() {
    try {
      const members = await API.getMembers()
      updateMembersTable(members)
    } catch (error) {
      console.error('Error loading members data:', error)
      showNotification('Gagal memuat data anggota', 'error')
    }
  }

  function updateMembersTable(members) {
    const tbody = document.getElementById('membersTableBody')
    if (!tbody) return

    tbody.innerHTML = ''

    members.forEach(member => {
      const row = document.createElement('tr')
      const joinDate = new Date(member.join_date).toLocaleDateString('id-ID')
      
      row.innerHTML = `
        <td>${member.name}</td>
        <td>${member.email}</td>
        <td>${member.phone}</td>
        <td>${joinDate}</td>
        <td><span class="status-badge ${member.status === 'active' ? 'status-active' : 'status-inactive'}">${member.status === 'active' ? 'Aktif' : 'Tidak Aktif'}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="viewMember('${member.id}')">Detail</button>
          <button class="btn btn-sm btn-primary" onclick="editMember('${member.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteMember('${member.id}')">Hapus</button>
        </td>
      `
      tbody.appendChild(row)
    })
  }

  // Loans data loading
  async function loadLoansData() {
    try {
      const loans = await API.getLoans()
      updateLoansTable(loans)
    } catch (error) {
      console.error('Error loading loans data:', error)
      showNotification('Gagal memuat data peminjaman', 'error')
    }
  }

  function updateLoansTable(loans) {
    const borrowedBody = document.getElementById('borrowedBooksBody')
    const returnedBody = document.getElementById('returnedBooksBody')
    const overdueBody = document.getElementById('overdueBooksBody')

    if (borrowedBody) borrowedBody.innerHTML = ''
    if (returnedBody) returnedBody.innerHTML = ''
    if (overdueBody) overdueBody.innerHTML = ''

    loans.forEach(loan => {
      const borrowDate = new Date(loan.borrow_date).toLocaleDateString('id-ID')
      const dueDate = new Date(loan.due_date).toLocaleDateString('id-ID')
      const returnDate = loan.return_date ? new Date(loan.return_date).toLocaleDateString('id-ID') : '-'

      if (loan.status === 'borrowed' && borrowedBody) {
        const row = document.createElement('tr')
        row.innerHTML = `
          <td>${loan.member_name}</td>
          <td>${loan.book_title}</td>
          <td>${borrowDate}</td>
          <td>${dueDate}</td>
          <td><span class="status-badge status-borrowed">Dipinjam</span></td>
          <td>
            <button class="btn btn-sm btn-success" onclick="returnBook('${loan.id}')">Kembalikan</button>
          </td>
        `
        borrowedBody.appendChild(row)
      } else if (loan.status === 'returned' && returnedBody) {
        const row = document.createElement('tr')
        row.innerHTML = `
          <td>${loan.member_name}</td>
          <td>${loan.book_title}</td>
          <td>${borrowDate}</td>
          <td>${returnDate}</td>
          <td>Rp ${loan.fine || 0}</td>
        `
        returnedBody.appendChild(row)
      } else if (loan.status === 'overdue' && overdueBody) {
        const daysLate = Math.ceil((new Date() - new Date(loan.due_date)) / (1000 * 60 * 60 * 24))
        const row = document.createElement('tr')
        row.innerHTML = `
          <td>${loan.member_name}</td>
          <td>${loan.book_title}</td>
          <td>${dueDate}</td>
          <td>${daysLate} hari</td>
          <td>Rp ${daysLate * 1000}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="returnBook('${loan.id}')">Kembalikan</button>
          </td>
        `
        overdueBody.appendChild(row)
      }
    })
  }

  // Reservations data loading
  async function loadReservationsData() {
    try {
      const reservations = await API.getReservations()
      updateReservationsTable(reservations)
    } catch (error) {
      console.error('Error loading reservations data:', error)
      showNotification('Gagal memuat data reservasi', 'error')
    }
  }

  function updateReservationsTable(reservations) {
    const tbody = document.getElementById('reservationsTableBody')
    if (!tbody) return

    tbody.innerHTML = ''

    reservations.forEach(reservation => {
      const reservationDate = new Date(reservation.reservation_date).toLocaleDateString('id-ID')
      const row = document.createElement('tr')
      
      row.innerHTML = `
        <td>${reservation.member_name}</td>
        <td>${reservation.book_title}</td>
        <td>${reservationDate}</td>
        <td><span class="status-badge ${getReservationStatusClass(reservation.status)}">${getReservationStatusText(reservation.status)}</span></td>
        <td>
          ${reservation.status === 'pending' ? `
            <button class="btn btn-sm btn-success" onclick="fulfillReservation('${reservation.id}')">Pinjamkan</button>
            <button class="btn btn-sm btn-danger" onclick="cancelReservation('${reservation.id}')">Batal</button>
          ` : '-'}
        </td>
      `
      tbody.appendChild(row)
    })
  }

  function getReservationStatusClass(status) {
    switch (status) {
      case 'pending': return 'status-available'
      case 'fulfilled': return 'status-active'
      case 'cancelled': return 'status-inactive'
      default: return 'status-available'
    }
  }

  function getReservationStatusText(status) {
    switch (status) {
      case 'pending': return 'Menunggu'
      case 'fulfilled': return 'Dipenuhi'
      case 'cancelled': return 'Dibatalkan'
      default: return 'Menunggu'
    }
  }

  // Global functions for button actions
  window.viewBook = async (id) => {
    try {
      const book = await API.getBook(id)
      alert(`Detail Buku:\nJudul: ${book.title}\nPenulis: ${book.author}\nISBN: ${book.isbn}\nDeskripsi: ${book.description || 'Tidak ada deskripsi'}`)
    } catch (error) {
      showNotification('Gagal memuat detail buku', 'error')
    }
  }

  window.editBook = async (id) => {
    // Implement edit book functionality
    showNotification('Fitur edit buku akan segera tersedia', 'warning')
  }

  window.deleteBook = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
      try {
        await API.deleteBook(id)
        showNotification('Buku berhasil dihapus', 'success')
        loadBooksData()
      } catch (error) {
        showNotification(error.message || 'Gagal menghapus buku', 'error')
      }
    }
  }

  window.viewMember = async (id) => {
    try {
      const member = await API.getMember(id)
      alert(`Detail Anggota:\nNama: ${member.name}\nEmail: ${member.email}\nTelepon: ${member.phone}\nAlamat: ${member.address || 'Tidak ada alamat'}`)
    } catch (error) {
      showNotification('Gagal memuat detail anggota', 'error')
    }
  }

  window.editMember = async (id) => {
    showNotification('Fitur edit anggota akan segera tersedia', 'warning')
  }

  window.deleteMember = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
      try {
        await API.deleteMember(id)
        showNotification('Anggota berhasil dihapus', 'success')
        loadMembersData()
      } catch (error) {
        showNotification(error.message || 'Gagal menghapus anggota', 'error')
      }
    }
  }

  window.returnBook = async (loanId) => {
    if (confirm('Konfirmasi pengembalian buku?')) {
      try {
        await API.returnBook(loanId)
        showNotification('Buku berhasil dikembalikan', 'success')
        loadLoansData()
        loadDashboardData() // Refresh dashboard stats
      } catch (error) {
        showNotification(error.message || 'Gagal mengembalikan buku', 'error')
      }
    }
  }

  window.fulfillReservation = async (id) => {
    try {
      await API.updateReservationStatus(id, 'fulfilled')
      showNotification('Reservasi berhasil dipenuhi', 'success')
      loadReservationsData()
    } catch (error) {
      showNotification(error.message || 'Gagal memenuhi reservasi', 'error')
    }
  }

  window.cancelReservation = async (id) => {
    if (confirm('Apakah Anda yakin ingin membatalkan reservasi ini?')) {
      try {
        await API.updateReservationStatus(id, 'cancelled')
        showNotification('Reservasi berhasil dibatalkan', 'success')
        loadReservationsData()
      } catch (error) {
        showNotification(error.message || 'Gagal membatalkan reservasi', 'error')
      }
    }
  }

  // Form handling for adding new items
  setupFormHandlers()

  function setupFormHandlers() {
    // Add Book Form
    const addBookForm = document.getElementById('addBookForm')
    if (addBookForm) {
      addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const formData = new FormData(addBookForm)
        const bookData = {
          title: document.getElementById('bookTitle').value,
          author: document.getElementById('bookAuthor').value,
          isbn: document.getElementById('bookISBN').value,
          publisher: document.getElementById('bookPublisher').value,
          category: document.getElementById('bookCategory').value,
          year: parseInt(document.getElementById('bookYear').value),
          copies: parseInt(document.getElementById('bookCopies').value),
          description: document.getElementById('bookDescription').value
        }

        try {
          await API.createBook(bookData)
          showNotification('Buku berhasil ditambahkan', 'success')
          addBookForm.reset()
          document.getElementById('addBookModal').classList.remove('show')
          body.style.overflow = ''
          loadBooksData()
          loadDashboardData()
        } catch (error) {
          showNotification(error.message || 'Gagal menambahkan buku', 'error')
        }
      })
    }

    // Add Member Form
    const addMemberForm = document.getElementById('addMemberForm')
    if (addMemberForm) {
      addMemberForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const memberData = {
          name: document.getElementById('memberName').value,
          email: document.getElementById('memberEmail').value,
          phone: document.getElementById('memberPhone').value,
          address: document.getElementById('memberAddress').value
        }

        try {
          await API.createMember(memberData)
          showNotification('Anggota berhasil ditambahkan', 'success')
          addMemberForm.reset()
          document.getElementById('addMemberModal').classList.remove('show')
          body.style.overflow = ''
          loadMembersData()
          loadDashboardData()
        } catch (error) {
          showNotification(error.message || 'Gagal menambahkan anggota', 'error')
        }
      })
    }

    // New Loan Form
    const newLoanForm = document.getElementById('newLoanForm')
    if (newLoanForm) {
      // Populate member and book dropdowns
      populateDropdowns()
      
      newLoanForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const loanData = {
          member_id: document.getElementById('loanMember').value,
          book_id: document.getElementById('loanBook').value,
          due_date: document.getElementById('loanDueDate').value
        }

        try {
          await API.createLoan(loanData)
          showNotification('Peminjaman berhasil dibuat', 'success')
          newLoanForm.reset()
          document.getElementById('newLoanModal').classList.remove('show')
          body.style.overflow = ''
          loadLoansData()
          loadDashboardData()
        } catch (error) {
          showNotification(error.message || 'Gagal membuat peminjaman', 'error')
        }
      })
    }
  }

  async function populateDropdowns() {
    try {
      // Populate members dropdown
      const members = await API.getMembers()
      const memberSelect = document.getElementById('loanMember')
      if (memberSelect) {
        memberSelect.innerHTML = '<option value="">Pilih Anggota</option>'
        members.forEach(member => {
          if (member.status === 'active') {
            const option = document.createElement('option')
            option.value = member.id
            option.textContent = member.name
            memberSelect.appendChild(option)
          }
        })
      }

      // Populate books dropdown
      const books = await API.getBooks()
      const bookSelect = document.getElementById('loanBook')
      if (bookSelect) {
        bookSelect.innerHTML = '<option value="">Pilih Buku</option>'
        books.forEach(book => {
          if (book.available > 0) {
            const option = document.createElement('option')
            option.value = book.id
            option.textContent = `${book.title} (${book.available} tersedia)`
            bookSelect.appendChild(option)
          }
        })
      }
    } catch (error) {
      console.error('Error populating dropdowns:', error)
    }
  }

  // Search functionality
  function setupSearch(inputId, loadDataFunction) {
    const input = document.getElementById(inputId)
    if (!input) return

    let searchTimeout
    input.addEventListener('input', () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(async () => {
        const searchTerm = input.value.trim()
        if (inputId === 'bookSearch') {
          const books = await API.getBooks({ search: searchTerm })
          updateBooksTable(books)
        } else if (inputId === 'memberSearch') {
          const members = await API.getMembers({ search: searchTerm })
          updateMembersTable(members)
        }
      }, 300)
    })
  }

  setupSearch('bookSearch', loadBooksData)
  setupSearch('memberSearch', loadMembersData)

  // Filter functionality for books
  const categoryFilter = document.getElementById('categoryFilter')
  const yearFilter = document.getElementById('yearFilter')

  async function filterBooks() {
    const params = {}
    if (categoryFilter?.value) params.category = categoryFilter.value
    if (yearFilter?.value) params.year = yearFilter.value
    
    const books = await API.getBooks(params)
    updateBooksTable(books)
  }

  categoryFilter?.addEventListener('change', filterBooks)
  yearFilter?.addEventListener('change', filterBooks)

  // Rest of the original functionality (hamburger menu, modals, etc.)
  setupHamburgerMenu()
  setupModals()
  setupTabs()
  setupNotifications()
  setupKeyboardShortcuts()

  // Load initial data
  loadSectionData('dashboard')

  // Authentication functions
  function addUserInfoToHeader(userData) {
    const header = document.querySelector(".header .container")
    if (!header || header.querySelector('.user-info')) return

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

    const hamburger = header.querySelector(".hamburger")
    if (hamburger) {
      header.insertBefore(userInfo, hamburger)
    } else {
      header.appendChild(userInfo)
    }
  }

  function hideButtonsForUsers(role) {
    if (role === "user") {
      const buttonsToHide = ['addBookBtn', 'addMemberBtn', 'newLoanBtn', 'newReservationBtn']
      buttonsToHide.forEach(btnId => {
        const btn = document.getElementById(btnId)
        if (btn) btn.style.display = 'none'
      })
    }
  }

  window.logout = () => {
    localStorage.removeItem("libraryUser")
    window.location.href = "login.html"
  }

  // Utility functions
  function animateCounter(element, start, end, duration) {
    if (!element) return
    
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

  function setupHamburgerMenu() {
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
      body.style.overflow = "hidden"
    }

    function closeNavMenu() {
      hamburger.classList.remove("active")
      navMenu.classList.remove("show")
      body.style.overflow = ""
    }

    if (hamburger) {
      hamburger.addEventListener("click", (e) => {
        e.stopPropagation()
        toggleNavMenu()
      })
    }

    document.addEventListener("click", (e) => {
      if (navMenu && navMenu.classList.contains("show")) {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
          closeNavMenu()
        }
      }
    })
  }

  function setupModals() {
    function setupModal(openBtnId, modalId, closeSelector) {
      const openBtn = document.getElementById(openBtnId)
      const modal = document.getElementById(modalId)
      if (!modal || !openBtn) return

      const closeBtn = modal.querySelector(closeSelector)

      function openModal() {
        modal.classList.add("show")
        body.style.overflow = "hidden"
      }

      function closeModal() {
        modal.classList.remove("show")
        body.style.overflow = ""
      }

      openBtn.addEventListener("click", openModal)
      closeBtn?.addEventListener("click", closeModal)

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeModal()
        }
      })
    }

    setupModal("addBookBtn", "addBookModal", ".close")
    setupModal("addMemberBtn", "addMemberModal", ".close")
    setupModal("newLoanBtn", "newLoanModal", ".close")
  }

  function setupTabs() {
    const tabsContainer = document.querySelector(".tabs")
    if (tabsContainer) {
      tabsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".tab-btn")
        if (!btn) return

        const tab = btn.getAttribute("data-tab")
        const tabButtons = tabsContainer.querySelectorAll(".tab-btn")
        const tabPanels = document.querySelectorAll(".tab-panel")

        tabButtons.forEach((b) => {
          b.classList.toggle("active", b === btn)
        })

        tabPanels.forEach((panel) => {
          panel.classList.toggle("active", panel.id === tab)
        })
      })
    }
  }

  function setupNotifications() {
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
        notif.className = `notification show ${type}`
        msg.textContent = message

        setTimeout(() => {
          hideNotification()
        }, 4000)
      }
    }
  }

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const openModal = document.querySelector(".modal.show")
        if (openModal) {
          openModal.classList.remove("show")
          body.style.overflow = ""
        }

        if (navMenu && navMenu.classList.contains("show")) {
          navMenu.classList.remove("show")
          hamburger.classList.remove("active")
          body.style.overflow = ""
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        const searchInput = document.querySelector(".search-box input")
        if (searchInput) {
          searchInput.focus()
        }
      }
    })
  }
})