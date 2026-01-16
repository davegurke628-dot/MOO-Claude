/**
 * Marketing Options Online - Admin JavaScript
 * Handles admin dashboard functionality
 */

document.addEventListener('DOMContentLoaded', function () {
  checkAuth();
  initSidebar();
  initLogout();
  loadUserInfo();

  // Page specific initializations
  const path = window.location.pathname;
  if (path.includes('dashboard.html')) {
    initDashboard();
  } else if (path.includes('posts.html')) {
    initPostsTable();
  }
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

window.confirmDelete = confirmDelete;

/**
 * Dashboard Initialization
 */
async function initDashboard() {
  try {
    const stats = await api.get('/stats');
    if (stats) {
      const statsGrid = document.querySelector('.admin-stats');
      if (statsGrid) {
        const cards = statsGrid.querySelectorAll('.admin-stat-card');
        cards.forEach(card => {
          const labelEl = card.querySelector('.admin-stat-label');
          if (!labelEl) return;
          const label = labelEl.textContent;
          const valueEl = card.querySelector('.admin-stat-value');
          if (label.includes('Total Posts')) valueEl.textContent = stats.totalPosts || 0;
          if (label.includes('Drafts')) valueEl.textContent = stats.draftPosts || 0;
          if (label.includes('Categories')) valueEl.textContent = stats.totalCategories || 0;
          if (label.includes('Leads')) valueEl.textContent = stats.totalLeads || 0;
        });
      }
    }

    // Load recent posts
    const data = await api.get('/posts?limit=5');
    const posts = data.posts || [];
    const recentPostsList = document.getElementById('recentPostsList');
    if (recentPostsList) {
      if (posts.length === 0) {
        recentPostsList.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No posts found</td></tr>';
        return;
      }
      recentPostsList.innerHTML = posts.map(post => `
        <tr>
          <td>
            <div style="font-weight: 500;">${post.title}</div>
            <div style="font-size: 12px; color: var(--admin-text-secondary);">${post.category}</div>
          </td>
          <td>
            <span class="admin-table-status ${post.status.toLowerCase()}">${post.status}</span>
          </td>
          <td>${new Date(post.date).toLocaleDateString()}</td>
          <td>
            <div class="admin-table-actions">
              <a href="post-editor.html?id=${post.id}" class="admin-table-action">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </a>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Dashboard init error:', error);
  }
}

/**
 * Posts Table Initialization
 */
let currentOffset = 0;
const PAGE_LIMIT = 10;

async function initPostsTable(offset = 0) {
  currentOffset = offset;
  try {
    const status = document.getElementById('statusFilter')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';

    const data = await api.get(`/posts?limit=${PAGE_LIMIT}&offset=${offset}&status=${status}&category=${category}`);
    const posts = data.posts || [];
    const total = data.total || 0;

    const stats = await api.get('/stats');
    const tableBody = document.getElementById('postsTableBody');
    const countDisplay = document.getElementById('postCountDisplay');

    if (!tableBody) return;

    if (posts.length === 0 && offset === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No posts found</td></tr>';
      if (countDisplay) countDisplay.textContent = 'No posts found';
      return;
    }

    // Render Posts
    tableBody.innerHTML = posts.map(post => `
      <tr>
        <td>
          <div style="font-weight: 500;">${post.title}</div>
          <div style="font-size: 12px; color: var(--admin-text-secondary);">${post.slug}</div>
        </td>
        <td>${post.category}</td>
        <td>
          <span class="admin-table-status ${post.status.toLowerCase()}">${post.status}</span>
        </td>
        <td>${new Date(post.date).toLocaleDateString()}</td>
        <td>
          <div class="admin-table-actions">
            <a href="post-editor.html?id=${post.id}" class="admin-table-action" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </a>
            <button class="admin-table-action delete" onclick="confirmDelete('${post.id}', '${post.title.replace(/'/g, "\\'")}')" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Update count display
    const start = total === 0 ? 0 : offset + 1;
    const end = Math.min(offset + PAGE_LIMIT, total);
    if (countDisplay) {
      countDisplay.textContent = `Showing ${start}-${end} of ${total} posts`;
    }

    // Update Pagination controls
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    if (prevBtn) prevBtn.disabled = offset === 0;
    if (nextBtn) nextBtn.disabled = end >= total;

    // Add filter listeners if not already added
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    if (statusFilter && !statusFilter.dataset.listenerAdded) {
      statusFilter.addEventListener('change', () => initPostsTable(0));
      statusFilter.dataset.listenerAdded = 'true';
    }

    if (categoryFilter && !categoryFilter.dataset.listenerAdded) {
      categoryFilter.addEventListener('change', () => initPostsTable(0));
      categoryFilter.dataset.listenerAdded = 'true';
    }

  } catch (error) {
    console.error('Posts table init error:', error);
  }
}

// Global hook for pagination
window.changePage = (direction) => {
  const newOffset = direction === 'next' ? currentOffset + PAGE_LIMIT : currentOffset - PAGE_LIMIT;
  initPostsTable(Math.max(0, newOffset));
};
