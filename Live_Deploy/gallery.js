// gallery.js

document.addEventListener("DOMContentLoaded", function() {
    // Select all images with the correct class name
    const images = document.querySelectorAll(".slideshow-image");
    const imageNameElement = document.getElementById("image-name");

    // Check if there are any images on the page
    if (images.length > 0) {
        let currentImageIndex = 0;

        // The function that handles the image switching
        function showNextImage() {
            // Remove the 'active' class from the currently visible image
            images[currentImageIndex].classList.remove("active");

            // Calculate the index of the next image, looping back to the start
            currentImageIndex = (currentImageIndex + 1) % images.length;

            // Add the 'active' class to the new image to make it visible
            images[currentImageIndex].classList.add("active");

            // Optional: Update the image name in the info box from the image's alt text
            if (imageNameElement) {
                imageNameElement.textContent = images[currentImageIndex].alt;
            }
        }

        // Initially make the first image active
        images[currentImageIndex].classList.add("active");
        if (imageNameElement) {
            imageNameElement.textContent = images[currentImageIndex].alt;
        }

        // Set the slideshow to change images every 5 seconds (5000 milliseconds)
        setInterval(showNextImage, 5000);
    }
});