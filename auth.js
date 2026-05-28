document.addEventListener("DOMContentLoaded", () => {
    
    // Automatically initialize database if blank
    if (!localStorage.getItem("driversDatabase")) {
        localStorage.setItem("driversDatabase", JSON.stringify([]));
    }

    const activeDriver = localStorage.getItem("activeDriverSession");
    let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];

    // Select the wrapper containers
    const guestMenuContainer = document.getElementById("guestMenuContainer");
    const driverMenuContainer = document.getElementById("driverMenuContainer");
    const dropdownUsername = document.getElementById("dropdownUsername");
    const avatarText = document.querySelector(".avatar-text");
    
    // Select form and action triggers
    const registrationForm = document.getElementById("registrationForm");
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logoutBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    // =========================================================================
    // 🎛️ SAFE LIFECYCLE STATE SWITCHER
    // =========================================================================
    if (activeDriver) {
        // Driver logged in: Hide guest view wrapper, display user view wrapper
        if (guestMenuContainer) guestMenuContainer.style.setProperty("display", "none", "important");
        if (driverMenuContainer) driverMenuContainer.style.setProperty("display", "block", "important");
        if (dropdownUsername) dropdownUsername.textContent = activeDriver;
        
        // Render custom driver handle initials
        if (avatarText) {
            const initials = activeDriver.trim().split(" ").map(n => n[0]).join("").toUpperCase();
            avatarText.textContent = initials.substring(0, 2);
        }
    } else {
        // Visitor is guest: Enforce standard default state layouts
        if (guestMenuContainer) guestMenuContainer.style.setProperty("display", "block", "important");
        if (driverMenuContainer) driverMenuContainer.style.setProperty("display", "none", "important");
        if (avatarText) avatarText.textContent = "AV";
    }

    // =========================================================================
    // 🔐 AUTHENTICATION LOGIC SUBSYSTEMS
    // =========================================================================
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); 
            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;
            
            const validUser = driversDatabase.find(user => user.username.toLowerCase() === usernameInput.toLowerCase());

            if (validUser && validUser.password === passwordInput) {
                localStorage.setItem("activeDriverSession", validUser.username);
                alert(`Access Granted. Welcome back, ${validUser.username}!`);
                window.location.href = "index.html"; 
            } else {
                alert("Access Denied: Invalid Access Control credentials.");
            }
        });
    }

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

            if (driversDatabase.some(user => user.username.toLowerCase() === username.toLowerCase())) {
                alert("Registry Error: This username is already assigned to a profile.");
                return;
            }

            driversDatabase.push({ username, email, password, registeredAt: new Date().toISOString() });
            localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));
            alert("Driver Profile Registered Successfully!");
            window.location.href = "login_HTML.html";
        });
    }

    // =========================================================================
    // 🚪 INTERACTIVE TRIGGER HANDLERS
    // =========================================================================
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("activeDriverSession");
            alert("Driver Session Terminated.");
            window.location.href = "index.html"; 
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const currentDriver = localStorage.getItem("activeDriverSession");
            if (!currentDriver) return;

            if (confirm("Warning: Permanently delete your profile? This action cannot be undone.")) {
                let db = JSON.parse(localStorage.getItem("driversDatabase")) || [];
                db = db.filter(user => user.username.toLowerCase() !== currentDriver.toLowerCase());
                localStorage.setItem("driversDatabase", JSON.stringify(db));
                localStorage.removeItem("activeDriverSession");
                alert("Profile purged completely.");
                window.location.href = "index.html";
            }
        });
    }
});