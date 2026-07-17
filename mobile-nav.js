// LINE 1 & 2: The Hardware Fetch
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNavPanel = document.getElementById('mobileNavPanel');

// LINE 3: The Null Check
if (mobileMenuBtn && mobileNavPanel) {
    
    // LINE 4: The Event Sensor
    mobileMenuBtn.addEventListener('click', () => {
        
        // LINE 5: The State Toggle
        mobileNavPanel.classList.toggle('is-active');
        
    });
}