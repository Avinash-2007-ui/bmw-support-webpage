// =========================================================================
// 🔍 1. THE USER NAV MENU TOGGLE SWITCH (Runs on ALL pages)
// =========================================================================
function syncDriverUIState() {
    const activeDriver = localStorage.getItem("activeDriverSession");
    
    const guestMenu = document.getElementById("guestMenu");
    const userMenu = document.getElementById("userMenu");
    const dropdownUsername = document.getElementById("dropdownUsername");
    const avatarText = document.querySelector(".avatar-text");

    if (activeDriver) {
        // If a valid session ticket is found, hide guest options and show user menu
        if (guestMenu) guestMenu.style.setProperty("display", "none", "important");
        if (userMenu) userMenu.style.setProperty("display", "block", "important");
        if (dropdownUsername) dropdownUsername.textContent = activeDriver;
        
        // Dynamically split initials (e.g., "Avinash Vyas" -> "AV")
        if (avatarText) {
            const initials = activeDriver.trim().split(" ").map(n => n[0]).join("").toUpperCase();
            avatarText.textContent = initials.substring(0, 2);
        }
    } else {
        // If no user session is found, show default guest options
        if (guestMenu) guestMenu.style.setProperty("display", "block", "important");
        if (userMenu) userMenu.style.setProperty("display", "none", "important");
        if (avatarText) avatarText.textContent = "AV";
    }
}

// Fire the menu toggle checking mechanism immediately on load
syncDriverUIState();
document.addEventListener("DOMContentLoaded", syncDriverUIState);


// =========================================================================
// 📝 2. GLOBAL ACTIONS & FORM HANDLERS (Runs safely without throwing errors)
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Shared Database Vault
    let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];

    // --- REGISTRATION PAGE MECHANICS ---
    const registrationForm = document.getElementById("registrationForm");
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

    // --- LOGIN PAGE MECHANICS ---
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;

            const validUser = driversDatabase.find(user => user.username.toLowerCase() === usernameInput.toLowerCase());

            if (validUser && validUser.password === passwordInput) {
                localStorage.setItem("activeDriverSession", validUser.username);
                alert(`Access Granted. Welcome back, ${validUser.username}!`);
                
                // Flexible redirection: checks if you have a custom dashboard or index file
                if (window.location.pathname.includes("G81_HTML.html")) {
                    window.location.href = "G81_HTML.html";
                } else {
                    window.location.href = "index.html";
                }
            } else {
                alert("Access Denied: Invalid Access Control credentials.");
            }
        });
    }

    // --- DROPDOWN BUTTON ACTIONS (Logout & Delete) ---
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("activeDriverSession");
            alert("Driver Session Terminated.");
            window.location.reload();
        });
    }

    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const activeDriver = localStorage.getItem("activeDriverSession");
            if (!activeDriver) return;

            if (confirm("Warning: Are you absolutely sure you want to permanently delete your driver profile? This action cannot be undone.")) {
                driversDatabase = driversDatabase.filter(user => user.username.toLowerCase() !== activeDriver.toLowerCase());
                localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));
                localStorage.removeItem("activeDriverSession");
                alert("Profile purged completely from registry files.");
                window.location.reload();
            }
        });
    }
});