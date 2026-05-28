document.addEventListener("DOMContentLoaded", () => {
    
    // Automatically initialize database vault if completely blank
    if (!localStorage.getItem("driversDatabase")) {
        localStorage.setItem("driversDatabase", JSON.stringify([]));
    }

    const activeDriver = localStorage.getItem("activeDriverSession");
    let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase"));

    // Target UI Elements Directly
    const loginLink = document.getElementById("loginLink");
    const registerLink = document.getElementById("registerLink");
    const driverHeader = document.getElementById("driverHeader");
    const settingsLink = document.getElementById("settingsLink");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const avatarText = document.querySelector(".avatar-text");
    
    const registrationForm = document.getElementById("registrationForm");
    const loginForm = document.getElementById("loginForm");

    // =========================================================================
    // 🔍 CORE NAVBAR STATE CONTROLLER
    // =========================================================================
    if (activeDriver) {
        // Hide Guest Interface Nodes
        if (loginLink) loginLink.style.setProperty("display", "none", "important");
        if (registerLink) registerLink.style.setProperty("display", "none", "important");
        
        // Unfold Driver Panel Interface Nodes
        if (driverHeader) driverHeader.style.setProperty("display", "block", "important");
        if (settingsLink) settingsLink.style.setProperty("display", "block", "important");
        if (deleteAccountBtn) deleteAccountBtn.style.setProperty("display", "block", "important");
        if (logoutBtn) logoutBtn.style.setProperty("display", "block", "important");
        
        // Inject Username Text
        const dropdownUsername = document.getElementById("dropdownUsername");
        if (dropdownUsername) dropdownUsername.textContent = activeDriver;
        
        // Generate Driver Initials
        if (avatarText) {
            const initials = activeDriver.trim().split(" ").map(n => n[0]).join("").toUpperCase();
            avatarText.textContent = initials.substring(0, 2);
        }
    } else {
        // Fallback to Standard Guest UI Configuration
        if (loginLink) loginLink.style.setProperty("display", "block", "important");
        if (registerLink) registerLink.style.setProperty("display", "block", "important");
        
        if (driverHeader) driverHeader.style.setProperty("display", "none", "important");
        if (settingsLink) settingsLink.style.setProperty("display", "none", "important");
        if (deleteAccountBtn) deleteAccountBtn.style.setProperty("display", "none", "important");
        if (logoutBtn) logoutBtn.style.setProperty("display", "none", "important");
        
        if (avatarText) avatarText.textContent = "AV";
    }

    // =========================================================================
    // 🔐 AUTHENTICATION SYSTEMS
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

            driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];
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
    // 🚪 INTERACTIVE PANEL INTERACTORS
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