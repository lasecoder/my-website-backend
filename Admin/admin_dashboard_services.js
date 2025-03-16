// ----------------------
// Header Section: Services Header Update
// ----------------------
document.getElementById('services-header-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  // Log the form data to check if it's correct
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  try {
    const response = await fetch('http://localhost:3003/api/content/services-header', {
      method: 'PUT',
      body: formData,  // Send FormData directly
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message || 'Services header updated successfully');
    } else {
      alert('Failed to update services header');
    }
  } catch (error) {
    alert('Error occurred while updating services header');
  }
});


// ----------------------
// Default Services Content Update
// ----------------------
document.getElementById('default-services-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const response = await fetch('http://localhost:3003/api/content/services', {
      method: 'PUT',
      body: formData,  // Send FormData directly
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message || 'Default services content updated successfully');
    } else {
      alert('Failed to update default services content');
    }
  } catch (error) {
    alert('Error occurred while updating default services content');
  }
});

// ----------------------
// Service Item 1 Update
// ----------------------
document.getElementById('service-form-1')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const response = await fetch('http://localhost:3003/api/services/1', {
      method: 'PUT',
      body: formData,  // Send FormData directly
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message || 'Service 1 updated successfully');
    } else {
      alert('Failed to update Service 1');
    }
  } catch (error) {
    alert('Error occurred while updating Service 1');
  }
});

// ----------------------
// Service Item 2 Update
// ----------------------
document.getElementById('service-form-2')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const response = await fetch('http://localhost:3003/api/services/2', {
      method: 'PUT',
      body: formData,  // Send FormData directly
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message || 'Service 2 updated successfully');
    } else {
      alert('Failed to update Service 2');
    }
  } catch (error) {
    alert('Error occurred while updating Service 2');
  }
});
// Footer Update
document.getElementById('footer-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();  // Prevent form from submitting normally
  const formData = new FormData(e.target);  // Create FormData object from form
  
  // Log form data to ensure it's correct
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  // Create an object to send as JSON
  const footerData = {
    "footer-text": formData.get("footer-text") // Get the footer text value from the form
  };

  try {
    const response = await fetch('http://localhost:3003/api/content/footer', {
      method: 'PUT',  // Ensure it's a PUT request
      headers: {
        'Content-Type': 'application/json',  // Send data as JSON
      },
      body: JSON.stringify(footerData),  // Convert the footer data to JSON
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message || 'Footer updated successfully');
    } else {
      alert('Failed to update footer');
    }
  } catch (error) {
    alert('Error occurred while updating footer');
  }
});
