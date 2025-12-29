/**
 * Marketing Options Online - Admin JavaScript
 * Handles admin dashboard functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  initSidebar();
  initLogout();
  loadUserInfo();
});

/**
 * Check authentication
 */
function checkAuth() {
  const token = localStorage.getItem('authToken');
  const currentPage = window.location.pathname;

  // If no token and not on login page, redirect to login
  if (!token && !currentPage.includes('login.html')) {
    window.location.href = 'login.html';
    return;
  }

  // If has token and on login page, redirect to dashboard
  if (token && currentPage.includes('login.html')) {
    window.location.href = 'dashboard.html';
    return;
  }
}

/**
 * Load user information
 */
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');

  if (userName && user.name) {
    userName.textContent = user.name;
  }

  if (userAvatar && user.name) {
    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    userAvatar.textContent = initials;
  }
}

/**
 * Initialize sidebar toggle for mobile
 */
function initSidebar() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');

  if (!sidebarToggle || !sidebar) return;

  // Show toggle button on mobile
  if (window.innerWidth <= 1024) {
    sidebarToggle.style.display = 'flex';
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth <= 1024) {
      sidebarToggle.style.display = 'flex';
    } else {
      sidebarToggle.style.display = 'none';
      sidebar.classList.remove('active');
    }
  });

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    sidebarToggle.classList.toggle('active');
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('active');
      sidebarToggle.classList.remove('active');
    }
  });
}

/**
 * Handle logout
 */
function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');

  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Redirect to login
    window.location.href = 'login.html';
  });
}

/**
 * Toast notification
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// Make showToast globally available
window.showToast = showToast;

/**
 * API Helper functions
 */
const api = {
  baseUrl: '/api',

  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  }
};

window.api = api;

/**
 * Delete confirmation
 */
function confirmDelete(id, title) {
  if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
    deletePost(id);
  }
}

async function deletePost(id) {
  try {
    await api.delete(`/posts/${id}`);
    showToast('Post deleted successfully', 'success');
    // Reload page or remove row
    location.reload();
  } catch (error) {
    showToast('Failed to delete post', 'error');
  }
}

window.confirmDelete = confirmDelete;
