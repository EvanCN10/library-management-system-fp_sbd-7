// Global variables
let currentUser = null
let authToken = localStorage.getItem("authToken")
let currentPage = 1
let currentSearchQuery = ""

// API base URL
const API_BASE = "/api"

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (authToken) {
    verifyToken()
  }

  // Set up navigation
  setupNavigation()

  // Set up forms
  setupForms()

  // Load initial data
  loadBooks()
  loadCategories()
})

// Navigation setup
function setupNavigation() {
  const navLinks = document.querySelectorAll("nav a")

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href").substring(1)
      showSection(targetId)
    })
  })
}

// Show specific section
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active")
  })

  // Show target section
  const targetSection = document.getElementById(sectionId)
  if (targetSection) {
    targetSection.classList.add("active")

    // Load section-specific data
    switch (sectionId) {
      case "profile":
        if (currentUser) loadProfile()
        break
      case "borrowings":
        if (currentUser) loadBorrowings()
        break
      case "admin":
        if (currentUser && currentUser.role !== "member") {
          loadDashboard()
        }
        break
      case "reports":
        if (currentUser && currentUser.role !== "member") {
          updateReportsTab()
        }
        break
    }
  }
}

// Setup forms
function setupForms() {
  // Login form
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Register form
  const registerForm = document.getElementById("registerForm")
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister)
  }

  // Book form
  const bookForm = document.getElementById("bookForm")
  if (bookForm) {
    bookForm.addEventListener("submit", handleAddBook)
  }

  // Edit book form
  const editBookForm = document.getElementById("editBookForm")
  if (editBookForm) {
    editBookForm.addEventListener("submit", handleEditBook)
  }

  // Category form
  const categoryForm = document.getElementById("categoryForm")
  if (categoryForm) {
    categoryForm.addEventListener("submit", handleAddCategory)
  }
}

// Authentication functions
async function handleLogin(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const loginData = {
    username: formData.get("username"),
    password: formData.get("password"),
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    })

    const result = await response.json()

    if (result.success) {
      localStorage.setItem("authToken", result.data.token)
      authToken = result.data.token
      currentUser = result.data.user

      showAlert("Login successful!", "success")
      updateNavigation()
      showSection("home")
      e.target.reset()
    } else {
      showAlert(result.message || "Login failed", "error")
    }
  } catch (error) {
    console.error("Login error:", error)
    showAlert("Login failed. Please try again.", "error")
  }
}

async function handleRegister(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const registerData = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    })

    const result = await response.json()

    if (result.success) {
      showAlert("Registration successful! Please login.", "success")
      showSection("login")
      e.target.reset()
    } else {
      showAlert(result.message || "Registration failed", "error")
    }
  } catch (error) {
    console.error("Registration error:", error)
    showAlert("Registration failed. Please try again.", "error")
  }
}

async function verifyToken() {
  try {
    const response = await fetch(`${API_BASE}/users/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (response.ok) {
      const result = await response.json()
      currentUser = result.data.user
      updateNavigation()
    } else {
      localStorage.removeItem("authToken")
      authToken = null
      currentUser = null
    }
  } catch (error) {
    console.error("Token verification error:", error)
    localStorage.removeItem("authToken")
    authToken = null
    currentUser = null
  }
}

function updateNavigation() {
  const nav = document.querySelector("nav ul")

  if (currentUser) {
    nav.innerHTML = `
      <li><a href="#home">Home</a></li>
      <li><a href="#books">Books</a></li>
      <li><a href="#profile">Profile</a></li>
      <li><a href="#borrowings">My Borrowings</a></li>
      ${currentUser.role !== "member" ? '<li><a href="#admin">Admin</a></li>' : ""}
      <li><a href="#" onclick="logout()">Logout (${currentUser.username})</a></li>
    `
  } else {
    nav.innerHTML = `
      <li><a href="#home">Home</a></li>
      <li><a href="#books">Books</a></li>
      <li><a href="#login">Login</a></li>
      <li><a href="#register">Register</a></li>
    `
  }

  setupNavigation()
}

function logout() {
  localStorage.removeItem("authToken")
  authToken = null
  currentUser = null
  updateNavigation()
  showSection("home")
  showAlert("Logged out successfully", "success")
}

// Book functions
async function loadBooks(searchQuery = "", page = 1) {
  try {
    let url = `${API_BASE}/books?page=${page}&limit=10`
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`
    }

    const response = await fetch(url)
    const result = await response.json()

    if (result.success) {
      displayBooks(result.data.books)
      displayPagination(result.data.pagination)
      currentPage = page
      currentSearchQuery = searchQuery
    } else {
      showAlert("Failed to load books", "error")
    }
  } catch (error) {
    console.error("Load books error:", error)
    showAlert("Failed to load books", "error")
  }
}

function displayBooks(books) {
  const container = document.getElementById("booksContainer")

  if (books.length === 0) {
    container.innerHTML = "<p class='text-center'>No books found.</p>"
    return
  }

  container.innerHTML = books
    .map(
      (book) => `
    <div class="book-card">
      <h3>${book.title}</h3>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Publisher:</strong> ${book.publisher || "N/A"}</p>
      <p><strong>Year:</strong> ${book.publication_year || "N/A"}</p>
      <p><strong>Category:</strong> ${book.category_name || "Uncategorized"}</p>
      <p><strong>ISBN:</strong> ${book.isbn || "N/A"}</p>
      <p class="${book.available_copies > 0 ? "availability" : "unavailable"}">
        <strong>Available:</strong> ${book.available_copies}/${book.total_copies}
      </p>
      ${book.description ? `<p><strong>Description:</strong> ${book.description}</p>` : ""}
      <div class="book-actions">
        <button onclick="viewBookDetail(${book.id})" class="btn-small btn-view">View Details</button>
        ${
          currentUser && book.available_copies > 0
            ? `<button onclick="borrowBook(${book.id})" class="btn-small btn-borrow">Borrow</button>`
            : ""
        }
        ${
          currentUser && (currentUser.role === "admin" || currentUser.role === "librarian")
            ? `
              <button onclick="editBook(${book.id})" class="btn-small btn-edit">Edit</button>
              ${currentUser.role === "admin" ? `<button onclick="deleteBook(${book.id})" class="btn-small btn-delete">Delete</button>` : ""}
            `
            : ""
        }
      </div>
    </div>
  `,
    )
    .join("")
}

function displayPagination(pagination) {
  const container = document.getElementById("pagination")

  if (pagination.total_pages <= 1) {
    container.innerHTML = ""
    return
  }

  let paginationHTML = ""

  // Previous button
  if (pagination.current_page > 1) {
    paginationHTML += `<button onclick="loadBooks('${currentSearchQuery}', ${pagination.current_page - 1})">Previous</button>`
  }

  // Page numbers
  for (let i = 1; i <= pagination.total_pages; i++) {
    if (i === pagination.current_page) {
      paginationHTML += `<button class="active">${i}</button>`
    } else {
      paginationHTML += `<button onclick="loadBooks('${currentSearchQuery}', ${i})">${i}</button>`
    }
  }

  // Next button
  if (pagination.current_page < pagination.total_pages) {
    paginationHTML += `<button onclick="loadBooks('${currentSearchQuery}', ${pagination.current_page + 1})">Next</button>`
  }

  container.innerHTML = paginationHTML
}

function searchBooks() {
  const searchInput = document.getElementById("searchInput")
  const query = searchInput.value.trim()
  loadBooks(query, 1)
}

function showAdvancedSearch() {
  const panel = document.getElementById("advancedSearchPanel")
  panel.classList.toggle("hidden")
}

async function performAdvancedSearch() {
  const title = document.getElementById("searchTitle").value
  const author = document.getElementById("searchAuthor").value
  const isbn = document.getElementById("searchISBN").value
  const category = document.getElementById("searchCategory").value
  const yearFrom = document.getElementById("searchYearFrom").value
  const yearTo = document.getElementById("searchYearTo").value
  const availableOnly = document.getElementById("availableOnly").checked

  const params = new URLSearchParams()
  if (title) params.append("title", title)
  if (author) params.append("author", author)
  if (isbn) params.append("isbn", isbn)
  if (category) params.append("category", category)
  if (yearFrom) params.append("year_from", yearFrom)
  if (yearTo) params.append("year_to", yearTo)
  if (availableOnly) params.append("available_only", "true")

  try {
    const response = await fetch(`${API_BASE}/search?${params.toString()}`)
    const result = await response.json()

    if (result.success) {
      displayBooks(result.data.books)
      displayPagination(result.data.pagination)
    } else {
      showAlert("Search failed", "error")
    }
  } catch (error) {
    console.error("Advanced search error:", error)
    showAlert("Search failed", "error")
  }
}

async function viewBookDetail(bookId) {
  try {
    const response = await fetch(`${API_BASE}/books/${bookId}`)
    const result = await response.json()

    if (result.success) {
      const book = result.data.book
      const reviews = result.data.reviews || []

      const modal = document.getElementById("bookDetailModal")
      const content = document.getElementById("bookDetailContent")

      content.innerHTML = `
        <h2>${book.title}</h2>
        <div class="book-detail-grid">
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>Publisher:</strong> ${book.publisher || "N/A"}</p>
          <p><strong>Publication Year:</strong> ${book.publication_year || "N/A"}</p>
          <p><strong>ISBN:</strong> ${book.isbn || "N/A"}</p>
          <p><strong>Category:</strong> ${book.category_name || "Uncategorized"}</p>
          <p><strong>Location:</strong> ${book.location || "N/A"}</p>
          <p><strong>Available:</strong> ${book.available_copies}/${book.total_copies}</p>
        </div>
        ${book.description ? `<p><strong>Description:</strong> ${book.description}</p>` : ""}
        
        <h3>Reviews</h3>
        <div class="reviews-container">
          ${
            reviews.length > 0
              ? reviews
                  .map(
                    (review) => `
            <div class="review-card">
              <div class="review-header">
                <strong>${review.username}</strong>
                <span class="rating">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span>
              </div>
              <p>${review.review}</p>
              <small>${new Date(review.created_at).toLocaleDateString()}</small>
            </div>
          `,
                  )
                  .join("")
              : "<p>No reviews yet.</p>"
          }
        </div>
        
        ${
          currentUser && book.available_copies > 0
            ? `
          <button onclick="borrowBook(${book.id}); closeBookDetail();" class="btn-primary mt-1">Borrow This Book</button>
        `
            : ""
        }
      `

      modal.classList.remove("hidden")
    }
  } catch (error) {
    console.error("View book detail error:", error)
    showAlert("Failed to load book details", "error")
  }
}

function closeBookDetail() {
  document.getElementById("bookDetailModal").classList.add("hidden")
}

async function borrowBook(bookId) {
  if (!currentUser) {
    showAlert("Please login to borrow books", "error")
    return
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14)

  try {
    const response = await fetch(`${API_BASE}/borrow/borrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        book_id: bookId,
        due_date: dueDate.toISOString().split("T")[0],
      }),
    })

    const result = await response.json()

    if (result.success) {
      showAlert("Book borrowed successfully!", "success")
      loadBooks(currentSearchQuery, currentPage)
    } else {
      showAlert(result.message || "Failed to borrow book", "error")
    }
  } catch (error) {
    console.error("Borrow book error:", error)
    showAlert("Failed to borrow book", "error")
  }
}

// Categories
async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE}/categories`)
    const result = await response.json()

    if (result.success) {
      updateCategorySelects(result.data)
    }
  } catch (error) {
    console.error("Load categories error:", error)
  }
}

function updateCategorySelects(categories) {
  const selects = [
    document.getElementById("searchCategory"),
    document.getElementById("bookCategory"),
    document.getElementById("editBookCategory"),
  ]

  selects.forEach((select) => {
    if (select) {
      const currentValue = select.value
      select.innerHTML =
        '<option value="">Select Category</option>' +
        categories.map((cat) => `<option value="${cat.id}">${cat.name}</option>`).join("")
      select.value = currentValue
    }
  })
}

// Profile functions
async function loadProfile() {
  if (!currentUser) return

  try {
    const response = await fetch(`${API_BASE}/users/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      const user = result.data.user
      const stats = result.data.statistics

      document.getElementById("profileContent").innerHTML = `
        <div class="profile-info">
          <h3>Personal Information</h3>
          <p><strong>Username:</strong> ${user.username}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Full Name:</strong> ${user.full_name}</p>
          <p><strong>Phone:</strong> ${user.phone || "Not provided"}</p>
          <p><strong>Address:</strong> ${user.address || "Not provided"}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <p><strong>Member Since:</strong> ${new Date(user.membership_date).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${user.status}</p>
        </div>
        
        <div class="profile-stats">
          <h3>Borrowing Statistics</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <h4>Total Borrowed</h4>
              <div class="stat-number">${stats.total_borrowed}</div>
            </div>
            <div class="stat-card">
              <h4>Currently Borrowed</h4>
              <div class="stat-number">${stats.currently_borrowed}</div>
            </div>
            <div class="stat-card">
              <h4>Overdue Books</h4>
              <div class="stat-number">${stats.overdue_books}</div>
            </div>
            <div class="stat-card">
              <h4>Total Fines</h4>
              <div class="stat-number">$${stats.total_fines}</div>
            </div>
          </div>
        </div>
      `
    }
  } catch (error) {
    console.error("Load profile error:", error)
    showAlert("Failed to load profile", "error")
  }
}

// Borrowings functions
async function loadBorrowings() {
  if (!currentUser) return

  const status = document.getElementById("borrowingStatusFilter")?.value || ""

  try {
    let url = `${API_BASE}/borrow/history`
    if (status) {
      url += `?status=${status}`
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      displayBorrowings(result.data.borrowings)
    }
  } catch (error) {
    console.error("Load borrowings error:", error)
    showAlert("Failed to load borrowings", "error")
  }
}

function displayBorrowings(borrowings) {
  const container = document.getElementById("borrowingsContainer")

  if (borrowings.length === 0) {
    container.innerHTML = "<p class='text-center'>No borrowings found.</p>"
    return
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Book</th>
          <th>Author</th>
          <th>Borrow Date</th>
          <th>Due Date</th>
          <th>Return Date</th>
          <th>Status</th>
          <th>Fine</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${borrowings
          .map(
            (borrowing) => `
          <tr>
            <td>${borrowing.title}</td>
            <td>${borrowing.author}</td>
            <td>${new Date(borrowing.borrow_date).toLocaleDateString()}</td>
            <td>${new Date(borrowing.due_date).toLocaleDateString()}</td>
            <td>${borrowing.return_date ? new Date(borrowing.return_date).toLocaleDateString() : "-"}</td>
            <td><span class="status-${borrowing.status}">${borrowing.status}</span></td>
            <td>$${borrowing.fine_amount}</td>
            <td>
              ${
                borrowing.status === "borrowed"
                  ? `
                <button onclick="returnBook(${borrowing.id})" class="btn-small btn-primary">Return</button>
              `
                  : "-"
              }
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

async function returnBook(borrowingId) {
  try {
    const response = await fetch(`${API_BASE}/borrow/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        borrowing_id: borrowingId,
      }),
    })

    const result = await response.json()

    if (result.success) {
      showAlert(result.data.message, "success")
      loadBorrowings()
      loadBooks(currentSearchQuery, currentPage)
    } else {
      showAlert(result.message || "Failed to return book", "error")
    }
  } catch (error) {
    console.error("Return book error:", error)
    showAlert("Failed to return book", "error")
  }
}

// Admin functions
function showAdminTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll(".admin-tab-content").forEach((tab) => {
    tab.classList.remove("active")
  })

  // Remove active class from all tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Show selected tab
  document.getElementById(tabName).classList.add("active")
  event.target.classList.add("active")

  // Load tab-specific data
  switch (tabName) {
    case "dashboard":
      loadDashboard()
      break
    case "manage-books":
      loadAdminBooks()
      break
    case "manage-categories":
      loadAdminCategories()
      break
    case "manage-users":
      loadUsers()
      break
    case "borrowings-admin":
      loadAllBorrowings()
      break
    case "reports":
      updateReportsTab()
      break
  }
}

async function loadDashboard() {
  if (!currentUser || currentUser.role === "member") return

  try {
    const response = await fetch(`${API_BASE}/reports/dashboard`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      const data = result.data

      document.getElementById("dashboardStats").innerHTML = `
        <div class="stat-card">
          <h4>Total Books</h4>
          <div class="stat-number">${data.overview.total_books}</div>
        </div>
        <div class="stat-card">
          <h4>Total Users</h4>
          <div class="stat-number">${data.overview.total_users}</div>
        </div>
        <div class="stat-card">
          <h4>Active Borrowings</h4>
          <div class="stat-number">${data.overview.active_borrowings}</div>
        </div>
        <div class="stat-card">
          <h4>Overdue Books</h4>
          <div class="stat-number">${data.overview.overdue_borrowings}</div>
        </div>
        <div class="stat-card">
          <h4>Pending Fines</h4>
          <div class="stat-number">$${data.overview.pending_fines}</div>
        </div>
      `

      // Display popular books
      if (data.popular_books && data.popular_books.length > 0) {
        document.getElementById("dashboardCharts").innerHTML = `
          <h4>Most Popular Books</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Times Borrowed</th>
              </tr>
            </thead>
            <tbody>
              ${data.popular_books
                .map(
                  (book) => `
                <tr>
                  <td>${book.title}</td>
                  <td>${book.author}</td>
                  <td>${book.borrow_count}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `
      }
    }
  } catch (error) {
    console.error("Load dashboard error:", error)
    showAlert("Failed to load dashboard", "error")
  }
}

// Book management functions
function showAddBookForm() {
  document.getElementById("addBookForm").classList.remove("hidden")
}

function hideAddBookForm() {
  document.getElementById("addBookForm").classList.add("hidden")
  document.getElementById("bookForm").reset()
}

async function handleAddBook(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const bookData = {
    title: formData.get("title"),
    author: formData.get("author"),
    isbn: formData.get("isbn"),
    publisher: formData.get("publisher"),
    publication_year: formData.get("publication_year"),
    category_id: formData.get("category_id"),
    total_copies: Number.parseInt(formData.get("total_copies")),
    location: formData.get("location"),
    description: formData.get("description"),
  }

  try {
    const response = await fetch(`${API_BASE}/books`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(bookData),
    })

    const result = await response.json()

    if (result.success) {
      showAlert("Book added successfully!", "success")
      hideAddBookForm()
      loadAdminBooks()
      loadBooks(currentSearchQuery, currentPage)
    } else {
      showAlert(result.message || "Failed to add book", "error")
    }
  } catch (error) {
    console.error("Add book error:", error)
    showAlert("Failed to add book", "error")
  }
}

async function loadAdminBooks() {
  if (!currentUser || currentUser.role === "member") return

  try {
    const response = await fetch(`${API_BASE}/books?limit=50`)
    const result = await response.json()

    if (result.success) {
      displayAdminBooks(result.data.books)
    }
  } catch (error) {
    console.error("Load admin books error:", error)
    showAlert("Failed to load books", "error")
  }
}

function displayAdminBooks(books) {
  const container = document.getElementById("adminBooksContainer")

  if (books.length === 0) {
    container.innerHTML = "<p class='text-center'>No books found.</p>"
    return
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Author</th>
          <th>ISBN</th>
          <th>Category</th>
          <th>Copies</th>
          <th>Available</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${books
          .map(
            (book) => `
          <tr>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn || "-"}</td>
            <td>${book.category_name || "-"}</td>
            <td>${book.total_copies}</td>
            <td>${book.available_copies}</td>
            <td>
              <button onclick="editBook(${book.id})" class="btn-small btn-edit">Edit</button>
              ${
                currentUser.role === "admin"
                  ? `
                <button onclick="deleteBook(${book.id})" class="btn-small btn-delete">Delete</button>
              `
                  : ""
              }
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

async function editBook(bookId) {
  try {
    const response = await fetch(`${API_BASE}/books/${bookId}`)
    const result = await response.json()

    if (result.success) {
      const book = result.data.book

      // Populate edit form
      document.getElementById("editBookId").value = book.id
      document.getElementById("editBookTitle").value = book.title
      document.getElementById("editBookAuthor").value = book.author
      document.getElementById("editBookISBN").value = book.isbn || ""
      document.getElementById("editBookPublisher").value = book.publisher || ""
      document.getElementById("editBookYear").value = book.publication_year || ""
      document.getElementById("editBookCategory").value = book.category_id || ""
      document.getElementById("editBookCopies").value = book.total_copies
      document.getElementById("editBookLocation").value = book.location || ""
      document.getElementById("editBookDescription").value = book.description || ""

      // Show modal
      document.getElementById("editBookModal").classList.remove("hidden")
    }
  } catch (error) {
    console.error("Edit book error:", error)
    showAlert("Failed to load book details", "error")
  }
}

function closeEditBook() {
  document.getElementById("editBookModal").classList.add("hidden")
}

async function handleEditBook(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const bookId = formData.get("id") || document.getElementById("editBookId").value
  const bookData = {
    title: formData.get("title"),
    author: formData.get("author"),
    isbn: formData.get("isbn"),
    publisher: formData.get("publisher"),
    publication_year: formData.get("publication_year"),
    category_id: formData.get("category_id"),
    total_copies: Number.parseInt(formData.get("total_copies")),
    location: formData.get("location"),
    description: formData.get("description"),
  }

  try {
    const response = await fetch(`${API_BASE}/books/${bookId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(bookData),
    })

    const result = await response.json()

    if (result.success) {
      showAlert("Book updated successfully!", "success")
      closeEditBook()
      loadAdminBooks()
      loadBooks(currentSearchQuery, currentPage)
    } else {
      showAlert(result.message || "Failed to update book", "error")
    }
  } catch (error) {
    console.error("Update book error:", error)
    showAlert("Failed to update book", "error")
  }
}

async function deleteBook(bookId) {
  if (!confirm("Are you sure you want to delete this book?")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE}/books/${bookId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      showAlert("Book deleted successfully!", "success")
      loadAdminBooks()
      loadBooks(currentSearchQuery, currentPage)
    } else {
      showAlert(result.message || "Failed to delete book", "error")
    }
  } catch (error) {
    console.error("Delete book error:", error)
    showAlert("Failed to delete book", "error")
  }
}

// Category management functions
function showAddCategoryForm() {
  document.getElementById("addCategoryForm").classList.remove("hidden")
}

function hideAddCategoryForm() {
  document.getElementById("addCategoryForm").classList.add("hidden")
  document.getElementById("categoryForm").reset()
}

async function handleAddCategory(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const categoryData = {
    name: formData.get("name"),
    description: formData.get("description"),
  }

  try {
    const response = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(categoryData),
    })

    const result = await response.json()

    if (result.success) {
      showAlert("Category added successfully!", "success")
      hideAddCategoryForm()
      loadAdminCategories()
      loadCategories()
    } else {
      showAlert(result.message || "Failed to add category", "error")
    }
  } catch (error) {
    console.error("Add category error:", error)
    showAlert("Failed to add category", "error")
  }
}

async function loadAdminCategories() {
  if (!currentUser || currentUser.role === "member") return

  try {
    const response = await fetch(`${API_BASE}/categories`)
    const result = await response.json()

    if (result.success) {
      displayAdminCategories(result.data)
    }
  } catch (error) {
    console.error("Load admin categories error:", error)
    showAlert("Failed to load categories", "error")
  }
}

function displayAdminCategories(categories) {
  const container = document.getElementById("categoriesContainer")

  if (categories.length === 0) {
    container.innerHTML = "<p class='text-center'>No categories found.</p>"
    return
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Books Count</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${categories
          .map(
            (category) => `
          <tr>
            <td>${category.name}</td>
            <td>${category.description || "-"}</td>
            <td>${category.book_count}</td>
            <td>
              ${
                currentUser.role === "admin"
                  ? `
                <button onclick="deleteCategory(${category.id})" class="btn-small btn-delete">Delete</button>
              `
                  : "-"
              }
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

async function deleteCategory(categoryId) {
  if (!confirm("Are you sure you want to delete this category?")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      showAlert("Category deleted successfully!", "success")
      loadAdminCategories()
      loadCategories()
    } else {
      showAlert(result.message || "Failed to delete category", "error")
    }
  } catch (error) {
    console.error("Delete category error:", error)
    showAlert("Failed to delete category", "error")
  }
}

// User management functions
async function loadUsers() {
  if (!currentUser || currentUser.role === "member") return

  const role = document.getElementById("userRoleFilter")?.value || ""
  const status = document.getElementById("userStatusFilter")?.value || ""
  const search = document.getElementById("userSearchInput")?.value || ""

  try {
    let url = `${API_BASE}/users?`
    if (role) url += `role=${role}&`
    if (status) url += `status=${status}&`
    if (search) url += `search=${encodeURIComponent(search)}&`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      displayUsers(result.data.users)
    }
  } catch (error) {
    console.error("Load users error:", error)
    showAlert("Failed to load users", "error")
  }
}

function displayUsers(users) {
  const container = document.getElementById("usersContainer")

  if (users.length === 0) {
    container.innerHTML = "<p class='text-center'>No users found.</p>"
    return
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Full Name</th>
          <th>Role</th>
          <th>Status</th>
          <th>Member Since</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (user) => `
          <tr>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.full_name}</td>
            <td>${user.role}</td>
            <td><span class="status-${user.status}">${user.status}</span></td>
            <td>${new Date(user.membership_date).toLocaleDateString()}</td>
            <td>
              ${
                currentUser.role === "admin" && user.id !== currentUser.id
                  ? `
                <select onchange="updateUserStatus(${user.id}, this.value)">
                  <option value="active" ${user.status === "active" ? "selected" : ""}>Active</option>
                  <option value="inactive" ${user.status === "inactive" ? "selected" : ""}>Inactive</option>
                  <option value="suspended" ${user.status === "suspended" ? "selected" : ""}>Suspended</option>
                </select>
              `
                  : "-"
              }
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

async function updateUserStatus(userId, status) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status }),
    })

    const result = await response.json()

    if (result.success) {
      showAlert("User status updated successfully!", "success")
      loadUsers()
    } else {
      showAlert(result.message || "Failed to update user status", "error")
    }
  } catch (error) {
    console.error("Update user status error:", error)
    showAlert("Failed to update user status", "error")
  }
}

function searchUsers() {
  loadUsers()
}

// Borrowings admin functions
async function loadAllBorrowings() {
  if (!currentUser || currentUser.role === "member") return

  const status = document.getElementById("adminBorrowingStatusFilter")?.value || ""
  const dateFrom = document.getElementById("borrowingDateFrom")?.value || ""
  const dateTo = document.getElementById("borrowingDateTo")?.value || ""

  try {
    let url = `${API_BASE}/borrow/all?`
    if (status) url += `status=${status}&`
    if (dateFrom) url += `start_date=${dateFrom}&`
    if (dateTo) url += `end_date=${dateTo}&`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      displayAllBorrowings(result.data.borrowings)
    }
  } catch (error) {
    console.error("Load all borrowings error:", error)
    showAlert("Failed to load borrowings", "error")
  }
}

function displayAllBorrowings(borrowings) {
  const container = document.getElementById("allBorrowingsContainer")

  if (borrowings.length === 0) {
    container.innerHTML = "<p class='text-center'>No borrowings found.</p>"
    return
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>User</th>
          <th>Book</th>
          <th>Author</th>
          <th>Borrow Date</th>
          <th>Due Date</th>
          <th>Return Date</th>
          <th>Status</th>
          <th>Fine</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${borrowings
          .map(
            (borrowing) => `
          <tr>
            <td>${borrowing.username}</td>
            <td>${borrowing.title}</td>
            <td>${borrowing.author}</td>
            <td>${new Date(borrowing.borrow_date).toLocaleDateString()}</td>
            <td>${new Date(borrowing.due_date).toLocaleDateString()}</td>
            <td>${borrowing.return_date ? new Date(borrowing.return_date).toLocaleDateString() : "-"}</td>
            <td>
              <select onchange="updateBorrowingStatus(${borrowing.id}, this.value)">
                <option value="borrowed" ${borrowing.status === "borrowed" ? "selected" : ""}>Borrowed</option>
                <option value="returned" ${borrowing.status === "returned" ? "selected" : ""}>Returned</option>
                <option value="overdue" ${borrowing.status === "overdue" ? "selected" : ""}>Overdue</option>
              </select>
            </td>
            <td>$${borrowing.fine_amount}</td>
            <td>
              ${
                borrowing.status === "borrowed"
                  ? `
                <button onclick="adminReturnBook(${borrowing.id})" class="btn-small btn-primary">Mark Returned</button>
              `
                  : "-"
              }
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

async function updateBorrowingStatus(borrowingId, status) {
  try {
    const response = await fetch(`${API_BASE}/borrow/${borrowingId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status }),
    })

    const result = await response.json()

    if (result.success) {
      showAlert("Borrowing status updated successfully!", "success")
      loadAllBorrowings()
    } else {
      showAlert(result.message || "Failed to update borrowing status", "error")
    }
  } catch (error) {
    console.error("Update borrowing status error:", error)
    showAlert("Failed to update borrowing status", "error")
  }
}

// Reports functions
async function generateOverdueReport() {
  if (!currentUser || currentUser.role === "member") return

  try {
    const response = await fetch(`${API_BASE}/reports/overdue`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      const container = document.getElementById("overdueReport")

      if (result.data.length === 0) {
        container.innerHTML = "<p>No overdue books found.</p>"
        return
      }

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Book</th>
              <th>Due Date</th>
              <th>Days Overdue</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            ${result.data
              .map(
                (item) => `
              <tr>
                <td>${item.full_name}</td>
                <td>${item.title}</td>
                <td>${new Date(item.due_date).toLocaleDateString()}</td>
                <td>${item.days_overdue}</td>
                <td>${item.email}<br>${item.phone || "No phone"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    }
  } catch (error) {
    console.error("Generate overdue report error:", error)
    showAlert("Failed to generate overdue report", "error")
  }
}

async function generatePopularBooksReport() {
  if (!currentUser || currentUser.role === "member") return

  try {
    const response = await fetch(`${API_BASE}/reports/dashboard`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success && result.data.popular_books) {
      const container = document.getElementById("popularBooksReport")

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Times Borrowed</th>
            </tr>
          </thead>
          <tbody>
            ${result.data.popular_books
              .map(
                (book) => `
              <tr>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.borrow_count}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    }
  } catch (error) {
    console.error("Generate popular books report error:", error)
    showAlert("Failed to generate popular books report", "error")
  }
}

async function generateUserActivityReport() {
  if (!currentUser || currentUser.role === "member") return

  try {
    const response = await fetch(`${API_BASE}/reports/user-activity`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      const container = document.getElementById("userActivityReport")

      if (result.data.length === 0) {
        container.innerHTML = "<p>No activity logs found.</p>"
        return
      }

      container.innerHTML = `
        <div style="max-height: 400px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Action</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${result.data
                .slice(0, 50)
                .map(
                  (log) => `
                <tr>
                  <td>${log.user_id}</td>
                  <td>${log.action}</td>
                  <td>${JSON.stringify(log.details)}</td>
                  <td>${new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
    }
  } catch (error) {
    console.error("Generate user activity report error:", error)
    showAlert("Failed to generate user activity report", "error")
  }
}

async function generateFinesReport() {
  if (!currentUser || currentUser.role === "member") return

  try {
    const response = await fetch(`${API_BASE}/reports/fines`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      const container = document.getElementById("finesReport")

      if (result.data.fines.length === 0) {
        container.innerHTML = "<p>No fines found.</p>"
        return
      }

      container.innerHTML = `
        <div class="fines-summary">
          <h5>Summary</h5>
          <p><strong>Total Fines:</strong> $${result.data.summary.total_amount}</p>
          <p><strong>Paid:</strong> $${result.data.summary.paid_amount}</p>
          <p><strong>Pending:</strong> $${result.data.summary.pending_amount}</p>
        </div>
        
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Book</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${result.data.fines
              .map(
                (fine) => `
              <tr>
                <td>${fine.full_name}</td>
                <td>${fine.title}</td>
                <td>$${fine.amount}</td>
                <td>${fine.reason}</td>
                <td><span class="status-${fine.status}">${fine.status}</span></td>
                <td>${new Date(fine.created_at).toLocaleDateString()}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    }
  } catch (error) {
    console.error("Generate fines report error:", error)
    showAlert("Failed to generate fines report", "error")
  }
}

// Manual overdue check (Admin only)
async function runOverdueCheck() {
  if (!currentUser || currentUser.role !== "admin") {
    showAlert("Only admin can run overdue check", "error")
    return
  }

  if (!confirm("Run overdue check? This will update all overdue statuses and apply fines.")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE}/reports/check-overdue`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      showAlert(
        `Overdue check completed! Updated ${result.data.overdue_status_updated} records, applied ${result.data.new_fines_applied} new fines.`,
        "success",
      )
      // Refresh reports if we're on the reports tab
      if (document.getElementById("reports").classList.contains("active")) {
        generateOverdueReport()
        generateFinesReport()
      }
    } else {
      showAlert(result.message || "Failed to run overdue check", "error")
    }
  } catch (error) {
    console.error("Run overdue check error:", error)
    showAlert("Failed to run overdue check", "error")
  }
}

// Update the reports tab content to include the overdue check button
function updateReportsTab() {
  const reportsTab = document.getElementById("reports")
  if (reportsTab && currentUser && currentUser.role === "admin") {
    const existingButton = document.getElementById("overdueCheckButton")
    if (!existingButton) {
      const button = document.createElement("button")
      button.id = "overdueCheckButton"
      button.className = "btn-primary mb-2"
      button.textContent = "🔄 Run Overdue Check"
      button.onclick = runOverdueCheck

      const reportsGrid = reportsTab.querySelector(".reports-grid")
      if (reportsGrid) {
        reportsTab.insertBefore(button, reportsGrid)
      }
    }
  }
}

// Utility functions
function showAlert(message, type) {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll(".alert")
  existingAlerts.forEach((alert) => alert.remove())

  // Create new alert
  const alert = document.createElement("div")
  alert.className = `alert alert-${type}`
  alert.textContent = message

  // Insert at the top of the main content
  const main = document.querySelector("main")
  main.insertBefore(alert, main.firstChild)

  // Auto remove after 5 seconds
  setTimeout(() => {
    alert.remove()
  }, 5000)
}

// Add search on Enter key
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchBooks()
      }
    })
  }
})

// Close modals when clicking outside
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.add("hidden")
  }
})

// Update showAdminTab function to call updateReportsTab
const originalShowAdminTab = showAdminTab
showAdminTab = function (tabName) {
  originalShowAdminTab.call(this, tabName)
  if (tabName === "reports") {
    updateReportsTab()
  }
}
