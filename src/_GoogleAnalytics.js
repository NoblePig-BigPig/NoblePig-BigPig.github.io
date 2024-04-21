// Define a function to load the Google Analytics script
function loadGoogleAnalytics() {
    // Create a new script element
    var script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-T4WJPF1W2E';

    // Append the script to the document body
    document.body.appendChild(script);

    // Once the script is loaded, initialize Google Analytics
    script.onload = function () {
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-T4WJPF1W2E');
    }
}

// Call the function to load Google Analytics
loadGoogleAnalytics();