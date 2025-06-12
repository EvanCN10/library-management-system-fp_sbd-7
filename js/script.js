document.addEventListener("DOMContentLoaded", () => {
  // Enhanced Navigation: section switching with smooth transitions
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");

  // Navigation functionality
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const target = item.getAttribute("data-section");
      
      // Set active nav with smooth transition
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      
      // Show section with fade effect
      sections.forEach((sec) => {
        if (sec.id === target) {
          sec.classList.add("active");
          // Add entrance animation
          sec.style.opacity = "0";
          sec.style.transform = "translateY(20px)";
          setTimeout(() => {
            sec.style.opacity = "1";
            sec.style.transform = "translateY(0)";
          }, 50);
        } else {
          sec.classList.remove("active");
        }
      });
      
      // Close mobile nav if open
      closeMobileNav();
    });
  });

  // Enhanced Hamburger menu toggle with animation
  function toggleMobileNav() {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("show");
    
    // Prevent body scroll when menu is open
    if (navMenu.classList.contains("show")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  function closeMobileNav() {
    hamburger.classList.remove("active");
    navMenu.classList.remove("show");
    document.body.style.overflow = "";
  }

  hamburger?.addEventListener("click", toggleMobileNav);

  // Close mobile nav when clicking outside
  document.addEventListener("click", (e) => {
    if (!hamburger?.contains(e.target) && !navMenu?.contains(e.target)) {
      closeMobileNav();
    }
  });

  // Close mobile nav on window resize if screen becomes large
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileNav();
    }
    handleResponsiveElements();
  });

  // Enhanced Tab switching with smooth transitions
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      
      // Update buttons active state with animation
      tabButtons.forEach((b) => {
        b.classList.toggle("active", b === btn);
        if (b === btn) {
          b.style.transform = "scale(1.05)";
          setTimeout(() => {
            b.style.transform = "scale(1)";
          }, 150);
        }
      });
      
      // Update panels with fade effect
      tabPanels.forEach((panel) => {
        if (panel.id === tab) {
          panel.classList.add("active");
          panel.style.opacity = "0";
          panel.style.transform = "translateY(10px)";
          setTimeout(() => {
            panel.style.opacity = "1";
            panel.style.transform = "translateY(0)";
          }, 50);
        } else {
          panel.classList.remove("active");
        }
      });
    });
  });

  // Enhanced Modal logic with better accessibility
  function setupModal(openBtnId, modalId, closeSelector) {
    const openBtn = document.getElementById(openBtnId);
    const modal = document.getElementById(modalId);
    const closeBtn = modal?.querySelector(closeSelector);

    function openModal() {
      if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
        
        // Focus management for accessibility
        const firstFocusable = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusable?.focus();
        
        // Add entrance animation
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.style.transform = "scale(0.9) translateY(-20px)";
          modalContent.style.opacity = "0";
          setTimeout(() => {
            modalContent.style.transform = "scale(1) translateY(0)";
            modalContent.style.opacity = "1";
          }, 50);
        }
      }
    }

    function closeModal() {
      if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.style.transform = "scale(0.9) translateY(-20px)";
          modalContent.style.opacity = "0";
        }
        
        setTimeout(() => {
          modal.classList.remove("show");
          document.body.style.overflow = "";
        }, 200);
      }
    }

    openBtn?.addEventListener("click", openModal);
    closeBtn?.addEventListener("click", closeModal);
    
    // Enhanced outside click handling
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Keyboard navigation
    modal?.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    });
  }

  setupModal("addBookBtn", "addBookModal", ".close");
  setupModal("addMemberBtn", "addMemberModal", ".close");
  setupModal("newLoanBtn", "newLoanModal", ".close");

  // Enhanced Notification system
  const notification = document.getElementById("notification");
  const closeNotif = document.getElementById("closeNotification");
  
  closeNotif?.addEventListener("click", () => {
    hideNotification();
  });

  function hideNotification() {
    if (notification) {
      notification.style.transform = "translateX(400px)";
      setTimeout(() => {
        notification.classList.remove("show");
      }, 300);
    }
  }

  // Enhanced notification function (REMOVED AUTO-SHOW)
  window.showNotification = (message, type = "success") => {
    const notif = document.getElementById("notification");
    const msg = document.getElementById("notificationMessage");
    
    if (notif && msg) {
      notif.className = `notification show ${type}`;
      msg.textContent = message;
      
      // Entrance animation
      notif.style.transform = "translateX(400px)";
      setTimeout(() => {
        notif.style.transform = "translateX(0)";
      }, 50);
      
      // Auto-hide with animation
      setTimeout(() => {
        hideNotification();
      }, 4000);
    }
  };

  // Enhanced search functionality with debouncing
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function setupSearch(inputId, tableBodyId) {
    const input = document.getElementById(inputId);
    const tbody = document.getElementById(tableBodyId);
    
    if (input && tbody) {
      const searchFunction = debounce(() => {
        const filter = input.value.toLowerCase().trim();
        const rows = Array.from(tbody.rows);
        let visibleCount = 0;
        
        rows.forEach((row, index) => {
          const text = row.textContent.toLowerCase();
          const shouldShow = text.includes(filter);
          
          if (shouldShow) {
            row.style.display = "";
            row.style.animationDelay = `${index * 50}ms`;
            row.classList.add("fade-in");
            visibleCount++;
          } else {
            row.style.display = "none";
            row.classList.remove("fade-in");
          }
        });
        
        // Show "no results" message if needed
        updateNoResultsMessage(tbody, visibleCount, filter);
      }, 300);
      
      input.addEventListener("input", searchFunction);
    }
  }

  function updateNoResultsMessage(tbody, visibleCount, filter) {
    const existingMsg = tbody.parentElement?.querySelector('.no-results-message');
    
    if (visibleCount === 0 && filter) {
      if (!existingMsg) {
        const noResultsRow = document.createElement('div');
        noResultsRow.className = 'no-results-message';
        noResultsRow.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #666; font-style: italic;">
            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <p>Tidak ada hasil yang ditemukan untuk "${filter}"</p>
          </div>
        `;
        tbody.parentElement?.appendChild(noResultsRow);
      }
    } else if (existingMsg) {
      existingMsg.remove();
    }
  }

  setupSearch("bookSearch", "booksTableBody");
  setupSearch("memberSearch", "membersTableBody");

  // Enhanced filtering with loading states
  const categoryFilter = document.getElementById("categoryFilter");
  const yearFilter = document.getElementById("yearFilter");
  
  function showLoadingState(tbody) {
    tbody.style.opacity = "0.5";
    tbody.style.pointerEvents = "none";
  }
  
  function hideLoadingState(tbody) {
    tbody.style.opacity = "1";
    tbody.style.pointerEvents = "auto";
  }
  
  function filterBooks() {
    const tbody = document.getElementById("booksTableBody");
    if (!tbody) return;
    
    showLoadingState(tbody);
    
    setTimeout(() => {
      const cat = categoryFilter?.value || "";
      const year = yearFilter?.value || "";
      const rows = Array.from(tbody.rows);
      let visibleCount = 0;
      
      rows.forEach((row, index) => {
        const rowCat = row.cells[3]?.textContent || "";
        const rowYear = row.cells[4]?.textContent || "";
        const showCat = !cat || rowCat === cat;
        const showYear = !year || rowYear === year;
        const shouldShow = showCat && showYear;
        
        if (shouldShow) {
          row.style.display = "";
          row.style.animationDelay = `${index * 30}ms`;
          row.classList.add("fade-in");
          visibleCount++;
        } else {
          row.style.display = "none";
          row.classList.remove("fade-in");
        }
      });
      
      updateNoResultsMessage(tbody, visibleCount, cat || year ? "filter criteria" : "");
      hideLoadingState(tbody);
    }, 200);
  }
  
  categoryFilter?.addEventListener("change", filterBooks);
  yearFilter?.addEventListener("change", filterBooks);

  // Responsive elements handler
  function handleResponsiveElements() {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    
    // Adjust table display for mobile
    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
      if (isMobile) {
        table.classList.add('mobile-table');
      } else {
        table.classList.remove('mobile-table');
      }
    });
    
    // Adjust stats grid for different screen sizes
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
      if (isMobile) {
        statsGrid.style.gridTemplateColumns = '1fr';
      } else if (isTablet) {
        statsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      } else {
        statsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
      }
    }
  }

  // Enhanced stats animation
  function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-info h3');
    
    statNumbers.forEach(stat => {
      const finalValue = parseInt(stat.textContent) || 0;
      let currentValue = 0;
      const increment = finalValue / 50;
      const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
          stat.textContent = finalValue.toString();
          clearInterval(timer);
        } else {
          stat.textContent = Math.floor(currentValue).toString();
        }
      }, 30);
    });
  }

  // Initialize stats with animation
  function initializeStats() {
    document.getElementById("totalBooks").textContent = "1250";
    document.getElementById("totalMembers").textContent = "350";
    document.getElementById("borrowedBooks").textContent = "97";
    document.getElementById("overdueBooks").textContent = "12";
    
    // Trigger animation after a short delay
    setTimeout(animateStats, 500);
  }

  // Enhanced recent activities with better formatting
  function initializeActivities() {
    const recentAct = document.getElementById("recentActivities");
    if (!recentAct) return;
    
    const activities = [
      {
        icon: "fa-plus",
        text: 'Buku "Pemrograman Modern" ditambahkan',
        time: "10 menit lalu",
        type: "success"
      },
      {
        icon: "fa-user-plus",
        text: 'Anggota "Budi Santoso" terdaftar',
        time: "1 jam lalu",
        type: "info"
      },
      {
        icon: "fa-exchange-alt",
        text: 'Buku "Algoritma dan Struktur Data" dipinjam oleh Ani',
        time: "2 jam lalu",
        type: "warning"
      },
      {
        icon: "fa-undo",
        text: 'Buku "Database Management" dikembalikan',
        time: "3 jam lalu",
        type: "success"
      },
      {
        icon: "fa-exclamation-triangle",
        text: 'Buku "Web Development" terlambat dikembalikan',
        time: "5 jam lalu",
        type: "danger"
      }
    ];
    
    // Clear existing activities
    recentAct.innerHTML = "";
    
    activities.forEach((act, index) => {
      const div = document.createElement("div");
      div.className = "activity-item";
      div.style.animationDelay = `${index * 100}ms`;
      div.innerHTML = `
        <div class="activity-icon ${act.type}">
          <i class="fas ${act.icon}"></i>
        </div>
        <div class="activity-content">
          <h4>${act.text}</h4>
          <p>Sistem perpustakaan digital</p>
        </div>
        <div class="activity-time">${act.time}</div>
      `;
      recentAct.appendChild(div);
      
      // Add entrance animation
      setTimeout(() => {
        div.classList.add("fade-in-up");
      }, index * 100);
    });
  }

  // Form validation enhancement
  function enhanceFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        // Real-time validation
        input.addEventListener('blur', () => {
          validateField(input);
        });
        
        input.addEventListener('input', () => {
          if (input.classList.contains('error')) {
            validateField(input);
          }
        });
      });
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;
        
        inputs.forEach(input => {
          if (!validateField(input)) {
            isValid = false;
          }
        });
        
        if (isValid) {
          // Show success message
          showNotification('Data berhasil disimpan!', 'success');
          form.reset();
          // Close modal if form is in modal
          const modal = form.closest('.modal');
          if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = "";
          }
        } else {
          showNotification('Mohon periksa kembali data yang dimasukkan', 'error');
        }
      });
    });
  }

  function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Remove existing error styling
    field.classList.remove('error');
    const existingError = field.parentElement?.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Field ini wajib diisi';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Format email tidak valid';
      }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
      const phoneRegex = /^[\d\s\-\+$$$$]+$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        errorMessage = 'Format nomor telepon tidak valid';
      }
    }
    
    if (!isValid) {
      field.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = errorMessage;
      field.parentElement?.appendChild(errorDiv);
    }
    
    return isValid;
  }

  // Keyboard shortcuts
  function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Cari"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
          openModal.classList.remove('show');
          document.body.style.overflow = "";
        }
        closeMobileNav();
      }
    });
  }

  // Performance optimization: Intersection Observer for animations
  function initializeIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    const animateElements = document.querySelectorAll('.stat-card, .card, .activity-item');
    animateElements.forEach(el => observer.observe(el));
  }

  // Initialize all functionality
  function initialize() {
    initializeStats();
    initializeActivities();
    enhanceFormValidation();
    initializeKeyboardShortcuts();
    handleResponsiveElements();
    
    // Initialize intersection observer if supported
    if ('IntersectionObserver' in window) {
      initializeIntersectionObserver();
    }
    
    // REMOVED: Auto-show welcome notification
    // No more automatic welcome message
  }

  // Run initialization
  initialize();

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Refresh data when page becomes visible again
      console.log('Page is now visible - refreshing data...');
    }
  });
});