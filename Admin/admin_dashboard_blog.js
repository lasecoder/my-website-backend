// ----------------------
// Blog Header Update
// ----------------------
document.getElementById('blog-header-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const response = await fetch('http://localhost:5000/api/content/blog-header', {
        method: 'PUT',
        body: formData,
      });
      const result = await response.json();
      alert('Blog header updated successfully');
    } catch (error) {
      alert('Failed to update blog header');
    }
  });
  
  // ----------------------
  // Default Blog Content Update
  // ----------------------
  document.getElementById('default-blog-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const response = await fetch('http://localhost:5000/api/content/blog', {
        method: 'PUT',
        body: formData,
      });
      const result = await response.json();
      alert('Default blog content updated successfully');
    } catch (error) {
      alert('Failed to update default blog content');
    }
  });
  
  // ----------------------
  // Blog Post Submission (Add/Edit)
  document.getElementById('blog-post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('blog-post-title').value;
    const description = document.getElementById('blog-post-description').value;
  
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
  
    try {
      // For demonstration, we'll use a generic endpoint to add a new blog post.
      // In a real application, you may differentiate between creating and updating posts.
      const response = await fetch('http://localhost:5000/api/blogs', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        alert('Blog post saved successfully');
        loadBlogPosts();
      } else {
        alert('Failed to save blog post');
      }
    } catch (error) {
      alert('Error saving blog post');
    }
  });
  async function addPost(event) {
    event.preventDefault();
    
    // Get JWT token from where you stored it after login
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      alert('Please login first');
      window.location.href = '/admin_dashboard.html';
      return;
    }
  
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const image = document.getElementById('post-image').files[0];
    const video = document.getElementById('post-video').files[0];
  
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) formData.append('image', image);
    if (video) formData.append('video', video);
  
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`  // Add auth header
        },
        body: formData
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add post');
      }
  
      const result = await response.json();
      alert('Post added successfully!');
      fetchPosts();
      cancelAddPost();
    } catch (error) {
      console.error('Error adding post:', error);
      alert(`Error: ${error.message}`);
    }
  }
  // ----------------------
  // Load and Manage Blog Posts
  async function loadBlogPosts() {
    try {
      const response = await fetch('http://localhost:5000/api/blogs');
      const posts = await response.json();
      const tbody = document.querySelector('#blog-posts tbody');
      tbody.innerHTML = ''; // Clear existing rows
      posts.forEach(post => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${post.title}</td>
          <td>${post.description}</td>
          <td>
            <button onclick="editBlogPost(${post._id})">Edit</button>
            <button onclick="deleteBlogPost(${post._id})">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (error) {
      console.error('Error loading blog posts:', error);
    }
  }
  
  async function editBlogPost(postId) {
    // Implement edit functionality (e.g., load post data into the form for editing)
    alert('Edit functionality is not implemented yet for post: ' + postId);
  }
  
  async function deleteBlogPost(postId) {
    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${postId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        alert('Blog post deleted successfully');
        loadBlogPosts();
      } else {
        alert('Failed to delete blog post');
      }
    } catch (error) {
      alert('Error deleting blog post');
    }
  }
  
  // Initialize blog posts table on page load
  window.onload = loadBlogPosts;
  