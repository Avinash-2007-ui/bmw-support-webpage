document.addEventListener("DOMContentLoaded", () => {
    console.log("DEBUG: Active Session Status ->", localStorage.getItem("activeDriverSession"));
    
    // Automatically initialize database if blank
    if (!localStorage.getItem("driversDatabase")) {
        localStorage.setItem("driversDatabase", JSON.stringify([]));
    }

    const activeDriver = localStorage.getItem("activeDriverSession");
    let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];

    // Select menu elements
    const loginLink = document.getElementById("loginLink");
    const registerLink = document.getElementById("registerLink");
    const driverHeader = document.getElementById("driverHeader");
    const dropdownUsername = document.getElementById("dropdownUsername");
    const settingsLink = document.getElementById("settingsLink");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const avatarText = document.querySelector(".avatar-text");
    
    // Select form and action triggers
    const registrationForm = document.getElementById("registrationForm");
    const loginForm = document.getElementById("loginForm");

    // =========================================================================
    // 🎛️ UPDATE DROPDOWN MENU BASED ON AUTH STATE
    // =========================================================================
    function updateDropdownMenu() {
        const currentDriver = localStorage.getItem("activeDriverSession");
        
        if (currentDriver) {
            // User is logged in - show authenticated menu
            if (loginLink) loginLink.style.display = "none";
            if (registerLink) registerLink.style.display = "none";
            if (driverHeader) driverHeader.style.display = "block";
            if (settingsLink) settingsLink.style.display = "block";
            if (deleteAccountBtn) deleteAccountBtn.style.display = "block";
            if (logoutBtn) logoutBtn.style.display = "block";
            if (dropdownUsername) dropdownUsername.textContent = currentDriver;
            
            // Update avatar with initials
            if (avatarText) {
                const initials = currentDriver.trim().split(" ").map(n => n[0]).join("").toUpperCase();
                avatarText.textContent = initials.substring(0, 2);
            }
        } else {
            // User is guest - show login/register menu
            if (loginLink) loginLink.style.display = "block";
            if (registerLink) registerLink.style.display = "block";
            if (driverHeader) driverHeader.style.display = "none";
            if (settingsLink) settingsLink.style.display = "none";
            if (deleteAccountBtn) deleteAccountBtn.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (avatarText) avatarText.textContent = "AV";
        }
    }

    // Initialize dropdown on page load
    updateDropdownMenu();

    // =========================================================================
    // 🔐 LOGIN FORM HANDLER
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

    // =========================================================================
    // 📝 REGISTRATION FORM HANDLER
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
    // 🚪 LOGOUT HANDLER
    // =========================================================================
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("activeDriverSession");
            alert("Driver Session Terminated.");
            updateDropdownMenu();
            window.location.href = "index.html"; 
        });
    }

    // =========================================================================
    // ⚠️ DELETE ACCOUNT HANDLER
    // =========================================================================
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