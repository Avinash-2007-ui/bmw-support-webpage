document.addEventListener("DOMContentLoaded", () => {
    // 🔍 1. Identify which page is currently open in the browser
    const loginForm = document.getElementById("loginForm"); // Assumes your login form tag has id="loginForm"
    const registrationForm = document.getElementById("registrationForm");

    // =========================================================
    // 📝 REGISTRATION MECHANICS
    // =========================================================
    if (registrationForm) {
        registrationForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Prevents the browser from reloading the page

            // Extract the user values from your input field IDs
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            // Validation Shield: Ensure passwords match perfectly
            if (password !== confirmPassword) {
                alert("Security Error: Passwords do not match. Please verify your typing.");
                return;
            }

            // Fetch existing users from LocalStorage vault, or initialize an empty array if empty
            let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];

            // Validation Shield: Prevent duplicate handles
            const userExists = driversDatabase.some(user => user.username.toLowerCase() === username.toLowerCase());
            if (userExists) {
                alert("Registry Error: This username is already assigned to a driver profile.");
                return;
            }

            // Package the data into a clean object structure
            const newDriverProfile = {
                username: username,
                email: email,
                password: password, // In a real live server, this would be encrypted/hashed
                registeredAt: new Date().toISOString()
            };

            // Commit to the array and stringify back into standard JSON format
            driversDatabase.push(newDriverProfile);
            localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));

            alert("Driver Registry Successful! Redirecting to Authenticator...");
            
            // Redirect smoothly back to your login interface
            window.location.href = "login_HTML.html"; 
        });
    }

    // =========================================================
    // 🔐 LOGIN AUTHENTICATION MECHANICS
    // =========================================================
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;

            // Fetch the stored registry array
            let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];

            // Query the database array to find a matching username match
            const validUser = driversDatabase.find(user => user.username.toLowerCase() === usernameInput.toLowerCase());

            if (validUser && validUser.password === passwordInput) {
                alert(`Access Granted. Welcome back, ${validUser.username}!`);
                
                // Redirect user deep into your main index dashboard page
                window.location.href = "index.html"; 
            } else {
                alert("Access Denied: Invalid Access Control credentials.");
            }
        });
    }
});