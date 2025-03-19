document.addEventListener("DOMContentLoaded", function () {
  // Fetch and load existing contact page content
  fetch("http://localhost:5000/contact-content")
      .then(response => response.json())
      .then(data => {
          data.forEach(item => {
              if (item.section === "header-title") {
                  document.getElementById("contact-header-title").value = item.content;
              }
              if (item.section === "header-desc") {
                  document.getElementById("contact-header-desc").value = item.content;
              }
              if (item.section === "footer-text") {
                  document.getElementById("contact-footer-text").value = item.content;
              }
          });
      })
      .catch(error => console.error("❌ Error loading content:", error));

  // Update Content
  document.getElementById("contact-header-form").addEventListener("submit", function (event) {
      event.preventDefault();
      updateContent("header-title", document.getElementById("contact-header-title").value);
      updateContent("header-desc", document.getElementById("contact-header-desc").value);
  });

  document.getElementById("contact-footer-form").addEventListener("submit", function (event) {
      event.preventDefault();
      updateContent("footer-text", document.getElementById("contact-footer-text").value);
  });

  function updateContent(section, content) {
    fetch("http://localhost:5000/update-contact-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, content })
    })
    .then(response => response.json()) // ✅ Ensure response is JSON
    .then(data => console.log("✅ Success:", data))
    .catch(error => console.error("❌ Fetch error:", error));
  }
});
