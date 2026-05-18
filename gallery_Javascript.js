document.addEventListener('DOMContentLoaded', () => {

    // --- Slideshow functionality ---
    const images = document.querySelectorAll('.slideshow-image');
    const infoBox = document.getElementById('imageInfo');
    let currentIndex = 0;
    const displayTime = 5000; // time in ms for each image to display

    function showNextImage() {
        // Fade out the current active image
        images[currentIndex].classList.remove('active');
        
        // Update index to the next image
        currentIndex = (currentIndex + 1) % images.length;
        
        // Fade in the new active image
        images[currentIndex].classList.add('active');

        // Update the info text based on the new active image's data attribute
        infoBox.textContent = images[currentIndex].getAttribute('data-info');
    }

    // Show the first image's info on load
    infoBox.textContent = images[currentIndex].getAttribute('data-info');
    
    // Set up the automatic slideshow timer
    setInterval(showNextImage, displayTime);

    // --- Back button functionality ---
    const backButton = document.getElementById('backButton');
    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        // This command tells the browser to go back to the previous page in its history
        history.back();
    });
});
