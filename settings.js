document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 1. Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active-panel'));

            // 2. Add active class to the clicked button
            button.classList.add('active');

            // 3. Find the target panel and show it
            const targetId = button.getAttribute('data-target');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active-panel');
            }
        });
    });

    // Avatar Selection Logic
const avatars = document.querySelectorAll('.avatar-option');
let selectedAvatarPath = 'm-logo.png'; // Default fallback

avatars.forEach(avatar => {
    avatar.addEventListener('click', () => {
        // Remove active class from all
        avatars.forEach(a => a.classList.remove('active-avatar'));
        // Add to the clicked one
        avatar.classList.add('active-avatar');
        // Store the chosen filename
        selectedAvatarPath = avatar.getAttribute('data-avatar');
    });
});
}); 
