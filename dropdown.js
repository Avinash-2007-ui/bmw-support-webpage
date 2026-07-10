// Dropdown toggle functionality
document.addEventListener("DOMContentLoaded", () => {
    const avatarTrigger = document.getElementById("avatarTrigger");
    const avatarDropdown = document.getElementById("avatarDropdown");

    if (avatarTrigger && avatarDropdown) {
        // Toggle dropdown on avatar click
        avatarTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            avatarDropdown.classList.toggle("active");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!avatarTrigger.contains(e.target) && !avatarDropdown.contains(e.target)) {
                avatarDropdown.classList.remove("active");
            }
        });

        // Close dropdown when clicking a link inside it
        const dropdownLinks = avatarDropdown.querySelectorAll("a");
        dropdownLinks.forEach(link => {
            link.addEventListener("click", () => {
                avatarDropdown.classList.remove("active");
            });
        });
    }
});

async function runSystemCheck() {
    const textInput = document.getElementById('userDamageReport').value.trim();
    const outputDiv = document.getElementById('aiOutputView');
    
    if (!textInput) {
        alert("Please describe the damage before running the check.");
        return;
    }
    
    outputDiv.innerText = "Connecting to secure Java gateway...";
    
    try {
        // Safe backend request - no API keys exposed here!
        const response = await fetch('http://localhost:5000/api/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: textInput })
        });
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            outputDiv.innerText = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            outputDiv.innerText = "Backend Error: " + data.error;
        } else {
            outputDiv.innerText = "Received unexpected data format from backend.";
        }
    } catch (err) {
        console.error("Connection failed:", err);
        outputDiv.innerText = "Could not reach the backend server. Make sure the Java terminal is still running!";
    }
}