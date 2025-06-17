document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const userNameInput = document.getElementById("userName");
  const userRoleSelect = document.getElementById("userRole");
  const roleDescription = document.getElementById("roleDescription");
  const loginBtn = document.getElementById("loginBtn");
  const btnText = loginBtn.querySelector(".btn-text");
  const loading = loginBtn.querySelector(".loading");

  // Role descriptions
  const roleDescriptions = {
    user: {
      icon: "👤",
      title: "Pengguna Biasa",
      description:
        "Dapat melihat koleksi buku, anggota, dan laporan. Tidak dapat menambah data baru.",
    },
    librarian: {
      icon: "👥",
      title: "Pustakawan",
      description:
        "Akses penuh ke semua fitur termasuk menambah buku, anggota, dan mengelola sistem.",
    },
  };

  // Update role description
  function updateRoleDescription(role) {
    const roleInfo = roleDescriptions[role];
    const roleIcon = roleDescription.querySelector(".role-icon");
    const roleTitle = roleDescription.querySelector(".role-text h4");
    const roleDesc = roleDescription.querySelector(".role-text p");

    roleIcon.textContent = roleInfo.icon;
    roleTitle.textContent = roleInfo.title;
    roleDesc.textContent = roleInfo.description;
  }

  // Role change handler
  userRoleSelect.addEventListener("change", function () {
    updateRoleDescription(this.value);
  });

  // Form submit handler
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userName = userNameInput.value.trim();
    const userRole = userRoleSelect.value;

    if (!userName) {
      alert("Mohon masukkan nama lengkap Anda");
      userNameInput.focus();
      return;
    }

    // Show loading
    loginBtn.disabled = true;
    btnText.style.display = "none";
    loading.style.display = "flex";

    // Simulate login process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Save user data
    const userData = {
      name: userName,
      role: userRole,
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem("libraryUser", JSON.stringify(userData));

    // Redirect to main system
    window.location.href = "index.html";
  });

  // Check if already logged in
  const savedUser = localStorage.getItem("libraryUser");
  if (savedUser) {
    window.location.href = "index.html";
  }

  // Initialize with default role
  updateRoleDescription("user");
});
