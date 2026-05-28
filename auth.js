document.addEventListener("DOMContentLoaded", () => {
    
    // =========================================================================
    // 🔍 PERSISTENCE & SESSION LAYER (Checking who is currently visiting)
    // =========================================================================
    
    // Get active driver session token and the master driver account array from memory
    const activeDriver = localStorage.getItem("activeDriverSession");
    let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];

    // Elements inside your navbar dropdown layout
    const guestMenu = document.getElementById("guestMenu");
    const userMenu = document.getElementById("userMenu");
    const dropdownUsername = document.getElementById("dropdownUsername");
    const avatarText = document.querySelector(".avatar-text");

    // Dynamic UI State Sync: Toggle menu layout choices based on session state
    if (activeDriver) {
        // If a driver is logged in: Show user controls, hide guest login options
        if (guestMenu) guestMenu.style.display = "none";
        if (userMenu) userMenu.style.display = "block";
        
        // Inject their custom driver handle into the dashboard dropdown text
        if (dropdownUsername) dropdownUsername.textContent = activeDriver;
        
        // Personalization Easter Egg: Update avatar text to show driver's initials
        if (avatarText && activeDriver.length >= 2) {
            avatarText.textContent = activeDriver.substring(0, 2).toUpperCase();
        }
    } else {
        // If no driver is detected: Enforce standard Guest UI view configuration
        if (guestMenu) guestMenu.style.display = "block";
        if (userMenu) userMenu.style.display = "none";
        if (avatarText) avatarText.textContent = "AV";
    }

    // =========================================================================
    // 📝 REGISTRATION MECHANICS ENGINE
    // =========================================================================
    const registrationForm = document.getElementById("registrationForm");

    if (registrationForm) {
        registrationForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Blocks browser page refresh behavior

            // Gather values entered by user in the text boxes
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            // Security Shield 1: Validate passwords match perfectly
            if (password !== confirmPassword) {
                alert("Security Error: Passwords do not match.");
                return;
            }

            // Security Shield 2: Prevent duplicate driver profiles from registering
            const profileExists = driversDatabase.some(user => user.username.toLowerCase() === username.toLowerCase());
            if (profileExists) {
                alert("Registry Error: This username is already assigned to a profile.");
                return;
            }

            // Construct clean JSON profile data row object mapping
            const newDriverProfile = {
                username: username,
                email: email,
                password: password, // Store password string matching database layout
                registeredAt: new Date().toISOString()
            };

            // Push profile object into database array and commit changes to storage
            driversDatabase.push(newDriverProfile);
            localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));

            alert("Driver Profile Registered Successfully!");
            window.location.href = "login_HTML.html"; // Forward driver to authentication page
        });
    }

    // =========================================================================
    // 🔐 LOGIN AUTHENTICATION MECHANICS ENGINE
    // =========================================================================
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Blocks browser page refresh behavior

            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;

            // Search database registry array to locate matching profile credentials
            const validUser = driversDatabase.find(user => user.username.toLowerCase() === usernameInput.toLowerCase());

            if (validUser && validUser.password === passwordInput) {
                // Establish active session token credential in memory vault
                localStorage.setItem("activeDriverSession", validUser.username);
                
                alert(`Access Granted. Welcome back, ${validUser.username}!`);
                window.location.href = "index.html"; // Forward driver deep into home dash
            } else {
                alert("Access Denied: Invalid Access Control credentials.");
            }
        });
    }

    // =========================================================================
    // 🚪 PROFILE TERMINATION & DE-AUTHENTICATION ACTIONS
    // =========================================================================
    const logoutBtn = document.getElementById("logoutBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    // Action A: Log Out Driver Session
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("activeDriverSession"); // Evict session token
            alert("Driver Session Terminated.");
            window.location.reload(); // Refresh viewport to restore Guest state UI
        });
    }

    // Action B: Delete Profile Permanently From Memory Array
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            if (confirm("Warning: Are you absolutely sure you want to permanently delete your driver profile? This action cannot be undone.")) {
                // Filter out the currently active user row from the database array tracking list
                driversDatabase = driversDatabase.filter(user => user.username.toLowerCase() !== activeDriver.toLowerCase());
                
                // Save updated array list back to storage memory and clear active key
                localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));
                localStorage.removeItem("activeDriverSession");
                
                alert("Profile purged completely from registry files.");
                window.location.reload(); // Reload viewport to clear visual footprint
            }
        });
    }
});