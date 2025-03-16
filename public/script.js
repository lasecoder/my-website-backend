document.addEventListener("DOMContentLoaded", async function () {
    try {
      const response = await fetch("http://localhost:5000/api/content");
      const data = await response.json();
  
      if (data) {
        // Make sure these element IDs match those in your HTML
        document.getElementById("home-header-title").innerText = data.header?.title || '';
        document.getElementById("home-intro-text").innerText = data.intro?.text || '';
        document.getElementById("home-footer-text").innerText = data.footer?.text || '';
  
        // Update logo image if available
        if (data.header?.image) {
          document.getElementById("logo").src = data.header.image;
        }
      }
    } catch (error) {
      console.error("❌ Error fetching content:", error);
    }
  });
  function fetchContent() {
    fetch("http://localhost:5000/api/content")
      .then(response => response.json())
      .then(data => {
        if (data) {
          document.getElementById("home-header-title").innerText = data.header?.title || '';
          document.getElementById("home-intro-text").innerText = data.intro?.text || '';
          document.getElementById("home-footer-text").innerText = data.footer?.text || '';
          if (data.header?.image) {
            document.getElementById("logo").src = data.header.image;
          }
        }
      })
      .catch(error => console.error("Error fetching content:", error));
  }
  
  // Fetch on page load
  document.addEventListener("DOMContentLoaded", fetchContent);
  
  // Poll for updates every 10 seconds (adjust as needed)
  setInterval(fetchContent, 10000);
  