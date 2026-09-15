/**
 * RAKHI MAKEOVERS - LUXURY ADMIN DASHBOARD ENGINE
 */

const API_BASE = '/api';
let authToken = localStorage.getItem('rakhi_admin_token') || '';

// App State
let servicesData = [];
let galleryData = [];
let reviewsData = [];
let pendingDeleteAction = null;

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initSidebarAndTabs();
  initFormListeners();
  initDropzones();
});

/* ==========================================================================
   1. AUTHENTICATION & SESSION MANAGEMENT
   ========================================================================== */
function initAuth() {
  const loginForm = document.getElementById('admin-login-form');
  const togglePwBtn = document.getElementById('toggle-password');
  const logoutBtn = document.getElementById('btn-logout');

  // Password visibility toggle
  if (togglePwBtn) {
    togglePwBtn.addEventListener('click', () => {
      const pwInput = document.getElementById('login-password');
      if (pwInput.type === 'password') {
        pwInput.type = 'text';
        togglePwBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
      } else {
        pwInput.type = 'password';
        togglePwBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
      }
    });
  }

  // Handle Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('btn-login-submit');
      const errorMsg = document.getElementById('login-error-msg');

      errorMsg.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing In...';

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok && data.success && data.token) {
          authToken = data.token;
          localStorage.setItem('rakhi_admin_token', authToken);
          showToast('Welcome back, Master Admin!', 'success');
          showAdminDashboard();
        } else {
          errorMsg.textContent = data.message || 'Invalid username or password';
          errorMsg.style.display = 'block';
        }
      } catch (err) {
        errorMsg.textContent = 'Connection error. Please ensure the server is running.';
        errorMsg.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Dashboard';
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (e) {}

      localStorage.removeItem('rakhi_admin_token');
      authToken = '';
      showToast('You have been logged out safely.', 'success');
      showLoginScreen();
    });
  }

  // Auto-verify existing token
  if (authToken) {
    verifySession();
  } else {
    showLoginScreen();
  }
}

async function verifySession() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      showAdminDashboard();
    } else {
      localStorage.removeItem('rakhi_admin_token');
      authToken = '';
      showLoginScreen();
    }
  } catch (err) {
    // If offline or local dev, gracefully show dashboard if token exists
    showAdminDashboard();
  }
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').style.display = 'none';
}

function showAdminDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display = 'flex';
  loadAllData();
}

/* ==========================================================================
   2. NAVIGATION & TABS
   ========================================================================== */
function initSidebarAndTabs() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      switchTab(targetTab);
      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('open');
      }
    });
  });

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });
}

/* ==========================================================================
   3. DATA LOADING & DASHBOARD STATS
   ========================================================================== */
async function loadAllData() {
  await Promise.all([
    fetchServices(),
    fetchGallery(),
    fetchReviews()
  ]);
  updateDashboardStats();
}

function updateDashboardStats() {
  const statServices = document.getElementById('stat-services-count');
  const statGallery = document.getElementById('stat-gallery-count');
  const statReviews = document.getElementById('stat-reviews-count');

  if (statServices) statServices.textContent = servicesData.length;
  if (statGallery) statGallery.textContent = galleryData.length;
  if (statReviews) statReviews.textContent = reviewsData.length;
}

/* ==========================================================================
   4. SERVICES MANAGER
   ========================================================================== */
async function fetchServices() {
  const container = document.getElementById('services-list-container');
  try {
    const res = await fetch(`${API_BASE}/services`);
    if (res.ok) {
      servicesData = await res.json();
      renderServicesList();
    }
  } catch (err) {
    if (container) container.innerHTML = '<div class="alert-banner alert-error">Failed to load services.</div>';
  }
}

function renderServicesList() {
  const container = document.getElementById('services-list-container');
  if (!container) return;

  if (servicesData.length === 0) {
    container.innerHTML = '<div class="alert-banner" style="grid-column: 1/-1; text-align: center;">No services found. Click "Add New Service" to create one.</div>';
    return;
  }

  container.innerHTML = servicesData.map(service => `
    <div class="admin-item-card glass-panel" data-id="${service.id}">
      <div class="item-card-media">
        <img src="${escapeHtml(service.image || 'assets/images/bridal_traditional.webp')}" alt="${escapeHtml(service.title)}" loading="lazy">
        <span class="item-badge-pill">${escapeHtml(service.category || 'Bridal')}</span>
        <span class="item-duration-pill"><i class="fa-regular fa-clock"></i> ${escapeHtml(service.duration || '2.5 Hours')}</span>
      </div>
      <div class="item-card-body">
        <h3 class="item-card-title">${escapeHtml(service.title)}</h3>
        <p class="item-card-desc">${escapeHtml(service.description || '')}</p>
        <ul class="item-inclusions-preview">
          ${(service.inclusions || []).slice(0, 3).map(inc => `<li><i class="fa-solid fa-check text-gold"></i> ${escapeHtml(inc)}</li>`).join('')}
        </ul>
        <div class="item-card-actions">
          <button class="btn btn-outline-gold btn-sm btn-block" onclick="openServiceModal('${service.id}')">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn btn-danger-ghost btn-sm" onclick="confirmDelete('service', '${service.id}', '${escapeHtml(service.title)}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openServiceModal(serviceId = null) {
  const modal = document.getElementById('modal-service');
  const titleElem = document.getElementById('modal-service-title');
  const idInput = document.getElementById('service-id');
  const titleInput = document.getElementById('service-title');
  const catInput = document.getElementById('service-category');
  const durationInput = document.getElementById('service-duration');
  const imgUrlInput = document.getElementById('service-image-url');
  const descInput = document.getElementById('service-desc');
  const inclusionsInput = document.getElementById('service-inclusions');

  clearServiceImagePreview();

  if (serviceId) {
    const service = servicesData.find(s => s.id === serviceId);
    if (!service) return;
    titleElem.textContent = 'Edit Service';
    idInput.value = service.id;
    titleInput.value = service.title || '';
    catInput.value = service.category || 'bridal';
    durationInput.value = service.duration || '';
    imgUrlInput.value = service.image || '';
    descInput.value = service.description || '';
    inclusionsInput.value = (service.inclusions || []).join('\n');

    if (service.image) {
      showServiceImagePreview(service.image);
    }
  } else {
    titleElem.textContent = 'Add New Service';
    idInput.value = '';
    titleInput.value = '';
    catInput.value = 'bridal';
    durationInput.value = '2.5 Hours';
    imgUrlInput.value = 'assets/images/bridal_traditional.webp';
    descInput.value = '';
    inclusionsInput.value = 'Sweat-Resistant Radiant Base\nClassic Defined Winged Kohl\nRoyal Saree Pleating & Draping';
  }

  openModal('modal-service');
}

/* ==========================================================================
   5. LOOKBOOK GALLERY MANAGER
   ========================================================================== */
async function fetchGallery() {
  const container = document.getElementById('gallery-list-container');
  try {
    const res = await fetch(`${API_BASE}/gallery`);
    if (res.ok) {
      galleryData = await res.json();
      renderGalleryList();
    }
  } catch (err) {
    if (container) container.innerHTML = '<div class="alert-banner alert-error">Failed to load lookbook gallery.</div>';
  }
}

function renderGalleryList() {
  const container = document.getElementById('gallery-list-container');
  if (!container) return;

  if (galleryData.length === 0) {
    container.innerHTML = '<div class="alert-banner" style="grid-column: 1/-1; text-align: center;">No photos found. Click "Upload Lookbook Photo" to add one.</div>';
    return;
  }

  container.innerHTML = galleryData.map(item => `
    <div class="admin-gallery-card glass-panel" data-id="${item.id}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.altText || item.title)}" loading="lazy">
      <div class="gallery-card-overlay">
        <span class="gallery-card-cat">${escapeHtml(item.categoryName || item.category)}</span>
        <h4 class="gallery-card-title">${escapeHtml(item.title)}</h4>
        <div class="gallery-card-actions">
          <button class="btn btn-outline-gold btn-sm btn-block" onclick="openGalleryModal('${item.id}')">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button class="btn btn-danger-ghost btn-sm" onclick="confirmDelete('gallery', '${item.id}', '${escapeHtml(item.title)}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openGalleryModal(galleryId = null) {
  const modal = document.getElementById('modal-gallery');
  const titleElem = document.getElementById('modal-gallery-title');
  const idInput = document.getElementById('gallery-id');
  const titleInput = document.getElementById('gallery-title');
  const catInput = document.getElementById('gallery-category');
  const catNameInput = document.getElementById('gallery-category-name');
  const imgUrlInput = document.getElementById('gallery-image-url');
  const descInput = document.getElementById('gallery-desc');
  const altInput = document.getElementById('gallery-alt');

  clearGalleryImagePreview();

  if (galleryId) {
    const item = galleryData.find(g => g.id === galleryId);
    if (!item) return;
    titleElem.textContent = 'Edit Lookbook Photo';
    idInput.value = item.id;
    titleInput.value = item.title || '';
    catInput.value = item.category || 'traditional';
    catNameInput.value = item.categoryName || 'Traditional Red';
    imgUrlInput.value = item.image || '';
    descInput.value = item.description || '';
    altInput.value = item.altText || '';

    if (item.image) {
      showGalleryImagePreview(item.image);
    }
  } else {
    titleElem.textContent = 'Upload Lookbook Photo';
    idInput.value = '';
    titleInput.value = '';
    catInput.value = 'traditional';
    catNameInput.value = 'Traditional Red';
    imgUrlInput.value = '';
    descInput.value = '';
    altInput.value = '';
  }

  // Sync category name helper
  catInput.onchange = () => {
    const map = {
      'traditional': 'Traditional Red',
      'pastel': 'Pastel & Modern',
      'temple': 'Temple & Nikah',
      'reception': 'Reception & Sangeet'
    };
    catNameInput.value = map[catInput.value] || catInput.value;
  };

  openModal('modal-gallery');
}

/* ==========================================================================
   6. REVIEWS & TESTIMONIALS MANAGER
   ========================================================================== */
async function fetchReviews() {
  const container = document.getElementById('reviews-list-container');
  try {
    const res = await fetch(`${API_BASE}/reviews`);
    if (res.ok) {
      reviewsData = await res.json();
      renderReviewsList();
    }
  } catch (err) {
    if (container) container.innerHTML = '<div class="alert-banner alert-error">Failed to load reviews.</div>';
  }
}

function renderReviewsList() {
  const container = document.getElementById('reviews-list-container');
  if (!container) return;

  if (reviewsData.length === 0) {
    container.innerHTML = '<div class="alert-banner" style="grid-column: 1/-1; text-align: center;">No reviews found. Click "Add New Review" to add one.</div>';
    return;
  }

  container.innerHTML = reviewsData.map(rev => `
    <div class="admin-review-card glass-panel" data-id="${rev.id}">
      <div>
        <div class="review-card-top">
          <img src="${escapeHtml(rev.avatarImage || 'assets/images/bridal_pastel.webp')}" alt="${escapeHtml(rev.authorName)}" class="review-avatar-img">
          <div>
            <div class="review-author-name">${escapeHtml(rev.authorName)}</div>
            <div class="review-meta">${escapeHtml(rev.source || 'Google Review')} &bull; ${escapeHtml(rev.timeAgo || '')}</div>
          </div>
        </div>
        <div class="review-stars">
          ${'★'.repeat(rev.rating || 5)}${'☆'.repeat(5 - (rev.rating || 5))}
        </div>
        <p class="review-quote-text">“${escapeHtml(rev.reviewText)}”</p>
      </div>
      <div class="item-card-actions">
        <button class="btn btn-outline-gold btn-sm btn-block" onclick="openReviewModal('${rev.id}')">
          <i class="fa-solid fa-pen"></i> Edit
        </button>
        <button class="btn btn-danger-ghost btn-sm" onclick="confirmDelete('review', '${rev.id}', '${escapeHtml(rev.authorName)}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function openReviewModal(reviewId = null) {
  const modal = document.getElementById('modal-review');
  const titleElem = document.getElementById('modal-review-title');
  const idInput = document.getElementById('review-id');
  const authorInput = document.getElementById('review-author');
  const ratingInput = document.getElementById('review-rating');
  const sourceInput = document.getElementById('review-source');
  const timeInput = document.getElementById('review-time');
  const urlInput = document.getElementById('review-url');
  const avatarInput = document.getElementById('review-avatar');
  const textInput = document.getElementById('review-text');

  if (reviewId) {
    const rev = reviewsData.find(r => r.id === reviewId);
    if (!rev) return;
    titleElem.textContent = 'Edit Client Review';
    idInput.value = rev.id;
    authorInput.value = rev.authorName || '';
    ratingInput.value = rev.rating || 5;
    sourceInput.value = rev.source || 'Google Verified Review';
    timeInput.value = rev.timeAgo || '';
    urlInput.value = rev.authorProfileUrl || '';
    avatarInput.value = rev.avatarImage || 'assets/images/bridal_pastel.webp';
    textInput.value = rev.reviewText || '';
  } else {
    titleElem.textContent = 'Add Client Review';
    idInput.value = '';
    authorInput.value = '';
    ratingInput.value = '5';
    sourceInput.value = 'Google Verified Review';
    timeInput.value = 'Recently';
    urlInput.value = '';
    avatarInput.value = 'assets/images/bridal_pastel.webp';
    textInput.value = '';
  }

  openModal('modal-review');
}

/* ==========================================================================
   7. FORM SUBMISSIONS & SAVING
   ========================================================================== */
function initFormListeners() {
  // Add/Edit Service Form Submit
  const serviceForm = document.getElementById('form-service');
  if (serviceForm) {
    serviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-service');
      const id = document.getElementById('service-id').value;
      const title = document.getElementById('service-title').value.trim();
      const category = document.getElementById('service-category').value;
      const duration = document.getElementById('service-duration').value.trim();
      const image = document.getElementById('service-image-url').value.trim() || 'assets/images/bridal_traditional.webp';
      const description = document.getElementById('service-desc').value.trim();
      const inclusions = document.getElementById('service-inclusions').value
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = { title, category, duration, image, description, inclusions };

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const url = id ? `${API_BASE}/services/${id}` : `${API_BASE}/services`;
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast(id ? 'Service updated successfully!' : 'New service created!', 'success');
          closeModal('modal-service');
          await fetchServices();
          updateDashboardStats();
        } else {
          showToast(data.message || 'Failed to save service', 'error');
        }
      } catch (err) {
        showToast('Error connecting to server', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Service';
      }
    });
  }

  // Add/Edit Gallery Form Submit
  const galleryForm = document.getElementById('form-gallery');
  if (galleryForm) {
    galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-gallery');
      const id = document.getElementById('gallery-id').value;
      const title = document.getElementById('gallery-title').value.trim();
      const category = document.getElementById('gallery-category').value;
      const categoryName = document.getElementById('gallery-category-name').value.trim();
      const image = document.getElementById('gallery-image-url').value.trim();
      const description = document.getElementById('gallery-desc').value.trim();
      const altText = document.getElementById('gallery-alt').value.trim() || title;

      if (!image) {
        showToast('Please upload or enter an image URL', 'error');
        return;
      }

      const payload = { title, category, categoryName, image, description, altText };

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const url = id ? `${API_BASE}/gallery/${id}` : `${API_BASE}/gallery`;
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast(id ? 'Lookbook photo updated!' : 'New photo added to Lookbook!', 'success');
          closeModal('modal-gallery');
          await fetchGallery();
          updateDashboardStats();
        } else {
          showToast(data.message || 'Failed to save photo', 'error');
        }
      } catch (err) {
        showToast('Error connecting to server', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Photo';
      }
    });
  }

  // Add/Edit Review Form Submit
  const reviewForm = document.getElementById('form-review');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-review');
      const id = document.getElementById('review-id').value;
      const authorName = document.getElementById('review-author').value.trim();
      const rating = parseInt(document.getElementById('review-rating').value, 10) || 5;
      const source = document.getElementById('review-source').value.trim();
      const timeAgo = document.getElementById('review-time').value.trim();
      const authorProfileUrl = document.getElementById('review-url').value.trim();
      const avatarImage = document.getElementById('review-avatar').value.trim() || 'assets/images/bridal_pastel.webp';
      const reviewText = document.getElementById('review-text').value.trim();

      const payload = { authorName, rating, source, timeAgo, authorProfileUrl, avatarImage, reviewText };

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const url = id ? `${API_BASE}/reviews/${id}` : `${API_BASE}/reviews`;
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast(id ? 'Review updated!' : 'Client review added!', 'success');
          closeModal('modal-review');
          await fetchReviews();
          updateDashboardStats();
        } else {
          showToast(data.message || 'Failed to save review', 'error');
        }
      } catch (err) {
        showToast('Error connecting to server', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Review';
      }
    });
  }

  // Change Password Form Submit
  const pwForm = document.getElementById('change-password-form');
  if (pwForm) {
    pwForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const statusMsg = document.getElementById('pw-status-msg');
      const saveBtn = document.getElementById('btn-save-password');

      statusMsg.style.display = 'none';

      if (newPassword !== confirmPassword) {
        statusMsg.className = 'alert-banner alert-error';
        statusMsg.textContent = 'New passwords do not match.';
        statusMsg.style.display = 'block';
        return;
      }

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...';

      try {
        const res = await fetch(`${API_BASE}/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          statusMsg.className = 'alert-banner alert-success';
          statusMsg.textContent = 'Admin password updated successfully!';
          statusMsg.style.display = 'block';
          pwForm.reset();
          showToast('Master password updated!', 'success');
        } else {
          statusMsg.className = 'alert-banner alert-error';
          statusMsg.textContent = data.message || 'Failed to update password.';
          statusMsg.style.display = 'block';
        }
      } catch (err) {
        statusMsg.className = 'alert-banner alert-error';
        statusMsg.textContent = 'Error connecting to server.';
        statusMsg.style.display = 'block';
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-shield-check"></i> Update Password';
      }
    });
  }

  // Delete Confirmation Handler
  const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!pendingDeleteAction) return;

      const { type, id } = pendingDeleteAction;
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = 'Deleting...';

      try {
        let endpoint = '';
        if (type === 'service') endpoint = `${API_BASE}/services/${id}`;
        if (type === 'gallery') endpoint = `${API_BASE}/gallery/${id}`;
        if (type === 'review') endpoint = `${API_BASE}/reviews/${id}`;

        const res = await fetch(endpoint, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Item deleted successfully.', 'success');
          closeModal('modal-delete');
          if (type === 'service') await fetchServices();
          if (type === 'gallery') await fetchGallery();
          if (type === 'review') await fetchReviews();
          updateDashboardStats();
        } else {
          showToast(data.message || 'Delete failed', 'error');
        }
      } catch (err) {
        showToast('Error deleting item', 'error');
      } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Yes, Delete';
        pendingDeleteAction = null;
      }
    });
  }
}

function confirmDelete(type, id, name) {
  pendingDeleteAction = { type, id };
  const msgElem = document.getElementById('delete-confirm-message');
  if (msgElem) {
    msgElem.innerHTML = `Are you sure you want to permanently delete <strong>"${escapeHtml(name)}"</strong>?`;
  }
  openModal('modal-delete');
}

/* ==========================================================================
   8. IMAGE DROPZONE & UPLOAD HANDLERS
   ========================================================================== */
function initDropzones() {
  setupImageDropzone('service-dropzone', 'service-file-input', (url) => {
    document.getElementById('service-image-url').value = url;
    showServiceImagePreview(url);
  });

  setupImageDropzone('gallery-dropzone', 'gallery-file-input', (url) => {
    document.getElementById('gallery-image-url').value = url;
    showGalleryImagePreview(url);
  });
}

function setupImageDropzone(dropzoneId, inputId, onUploaded) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  if (!dropzone || !input) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--color-gold-primary)';
      dropzone.style.background = 'rgba(212, 175, 55, 0.1)';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      dropzone.style.background = '';
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], onUploaded);
    }
  });

  input.addEventListener('change', () => {
    if (input.files && input.files.length > 0) {
      handleFileUpload(input.files[0], onUploaded);
    }
  });
}

async function handleFileUpload(file, onUploaded) {
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (WebP, JPG, PNG).', 'error');
    return;
  }

  showToast('Uploading image...', 'success');

  // Convert to Base64 data URL
  const reader = new FileReader();
  reader.onload = async () => {
    const base64Data = reader.result;

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ data: base64Data, filename: file.name })
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        showToast('Image uploaded successfully!', 'success');
        onUploaded(data.url);
      } else {
        // Fallback to direct base64 data URI if server is in client-only mode
        onUploaded(base64Data);
        showToast('Image processed for preview!', 'success');
      }
    } catch (err) {
      onUploaded(base64Data);
      showToast('Image saved as preview data.', 'success');
    }
  };
  reader.readAsDataURL(file);
}

function showServiceImagePreview(src) {
  const previewBox = document.getElementById('service-img-preview');
  const dropContent = document.querySelector('#service-dropzone .dropzone-content');
  if (previewBox && dropContent) {
    previewBox.querySelector('img').src = src;
    previewBox.style.display = 'block';
    dropContent.style.display = 'none';
  }
}

function clearServiceImagePreview() {
  const previewBox = document.getElementById('service-img-preview');
  const dropContent = document.querySelector('#service-dropzone .dropzone-content');
  const imgInput = document.getElementById('service-image-url');
  if (previewBox && dropContent) {
    previewBox.style.display = 'none';
    dropContent.style.display = 'block';
  }
  if (imgInput) imgInput.value = '';
}

function showGalleryImagePreview(src) {
  const previewBox = document.getElementById('gallery-img-preview');
  const dropContent = document.querySelector('#gallery-dropzone .dropzone-content');
  if (previewBox && dropContent) {
    previewBox.querySelector('img').src = src;
    previewBox.style.display = 'block';
    dropContent.style.display = 'none';
  }
}

function clearGalleryImagePreview() {
  const previewBox = document.getElementById('gallery-img-preview');
  const dropContent = document.querySelector('#gallery-dropzone .dropzone-content');
  const imgInput = document.getElementById('gallery-image-url');
  if (previewBox && dropContent) {
    previewBox.style.display = 'none';
    dropContent.style.display = 'block';
  }
  if (imgInput) imgInput.value = '';
}

/* ==========================================================================
   9. MODAL & TOAST HELPERS
   ========================================================================== */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// Close modal on escape or backdrop click
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.admin-modal.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = 'auto';
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.closest('.admin-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
  toast.innerHTML = `<i class="${icon}"></i> <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
