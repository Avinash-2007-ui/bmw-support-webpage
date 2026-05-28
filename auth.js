// =========================================================================
// 🔄 UNIFIED AUTHENTICATION & UI LIFECYCLE ENGINE
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Fetch persistent data from Chrome storage vault
    const activeDriver = localStorage.getItem("activeDriverSession");
    let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];

    // 2. Locate all layout elements across your pages
    const guestMenu = document.getElementById("guestMenu");
    const userMenu = document.getElementById("userMenu");
    const dropdownUsername = document.getElementById("dropdownUsername");
    const avatarText = document.querySelector(".avatar-text");
    
    const registrationForm = document.getElementById("registrationForm");
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logoutBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    // =========================================================================
    // 🔍 NAVBAR UI STATE SYNC (Hides/Shows Dropdown Options)
    // =========================================================================
    if (activeDriver) {
        // Driver is logged in: hide Guest choices, show Driver controls
        if (guestMenu) guestMenu.style.setProperty("display", "none", "important");
        if (userMenu) userMenu.style.setProperty("display", "block", "important");
        if (dropdownUsername) dropdownUsername.textContent = activeDriver;
        
        // Split full name into two initials (e.g., "Avinash Vyas" -> "AV")
        if (avatarText) {
            const initials = activeDriver.trim().split(" ").map(n => n[0]).join("").toUpperCase();
            avatarText.textContent = initials.substring(0, 2);
        }
    } else {
        // No active session: force default Guest view layout
        if (guestMenu) guestMenu.style.setProperty("display", "block", "important");
        if (userMenu) userMenu.style.setProperty("display", "none", "important");
        if (avatarText) avatarText.textContent = "AV";
    }

    // =========================================================================
    // 🔐 LOGIN HANDLER ENGINE (Always forwards directly to index.html)
    // =========================================================================
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); 

            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;

            const validUser = driversDatabase.find(user => user.username.toLowerCase() === usernameInput.toLowerCase());

            if (validUser && validUser.password === passwordInput) {
                // Save the exact user handle to memory
                localStorage.setItem("activeDriverSession", validUser.username);
                alert(`Access Granted. Welcome back, ${validUser.username}!`);
                
                // FORCE REDIRECT TARGET RIGHT HERE TO YOUR ROOT PAGE
                window.location.href = "index.html"; 
            } else {
                alert("Access Denied: Invalid Access Control credentials.");
            }
        });
    }

    // =========================================================================
    // 📝 REGISTRATION HANDLER ENGINE
    // =========================================================================
    if (registrationForm) {
        registrationForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                alert("Security Error: Passwords do not match.");
                return;
            }

            const profileExists = driversDatabase.some(user => user.username.toLowerCase() === username.toLowerCase());
            if (profileExists) {
                alert("Registry Error: This username is already assigned to a profile.");
                return;
            }

            const newDriverProfile = {
                username: username,
                email: email,
                password: password,
                registeredAt: new Date().toISOString()
            };

            driversDatabase.push(newDriverProfile);
            localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));

            alert("Driver Profile Registered Successfully!");
            window.location.href = "login_HTML.html";
        });
    }

    // =========================================================================
    // 🚪 DROPDOWN INTERACTIVE ACTIONS (Logout & Account Destruction)
    // =========================================================================
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("activeDriverSession");
            alert("Driver Session Terminated.");
            window.location.href = "index.html"; // Redirects cleanly to clear view state
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (!activeDriver) return;

            if (confirm("Warning: Are you absolutely sure you want to permanently delete your driver profile? This action cannot be undone.")) {
                // Remove user profile row from database array completely
                driversDatabase = driversDatabase.filter(user => user.username.toLowerCase() !== activeDriver.toLowerCase());
                localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));
                
                // Clear session tokens
                localStorage.removeItem("activeDriverSession");
                alert("Profile purged completely from registry files.");
                window.location.href = "index.html";
            }
        });
    }
});