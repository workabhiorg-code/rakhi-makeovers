/**
 * RAKHI MAKEOVERS - LUXURY BRIDAL ARTISTRY INTERACTIVE ENGINE
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initBeforeAfterSlider();
  initServiceFilters();
  initGalleryFilterAndLightbox();
  initTestimonialCarousel();
  initBookingWizard();
  initFloatingActions();
  initNewsletter();
  initDynamicSync();
});

/* ==========================================================================
   1. NAVBAR & NAVIGATION
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle-btn');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky Navbar on Scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // Active Link on Scroll Spy
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const targetLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);

      if (targetLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          targetLink.classList.add('active');
        } else {
          targetLink.classList.remove('active');
        }
      }
    });
  });
}

/* ==========================================================================
   2. SCROLL REVEAL ANIMATIONS
   ========================================================================== */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal-fade-up');
  
  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('active'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   3. BEFORE & AFTER INTERACTIVE SLIDER
   ========================================================================== */
function initBeforeAfterSlider() {
  const container = document.querySelector('.comparison-container');
  const beforeImg = document.querySelector('.before-img');
  const sliderHandle = document.querySelector('.comparison-slider-handle');

  if (!container || !beforeImg || !sliderHandle) return;

  let isDragging = false;

  function setSliderPosition(xPos) {
    const rect = container.getBoundingClientRect();
    let offsetX = xPos - rect.left;

    // Constrain within container bounds
    if (offsetX < 0) offsetX = 0;
    if (offsetX > rect.width) offsetX = rect.width;

    const percentage = (offsetX / rect.width) * 100;

    // Set clip path on before image
    beforeImg.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
    sliderHandle.style.left = `${percentage}%`;
  }

  // Mouse events
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    setSliderPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    setSliderPosition(e.clientX);
  });

  // Touch events for mobile
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    setSliderPosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    setSliderPosition(e.touches[0].clientX);
  }, { passive: true });
}

/* ==========================================================================
   4. SERVICES FILTERING
   ========================================================================== */
function initServiceFilters() {
  const filterBtns = document.querySelectorAll('.service-filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active tab button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      serviceCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterVal === 'all' || category === filterVal) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/* ==========================================================================
   5. GALLERY FILTER & LIGHTBOX MODAL
   ========================================================================== */
function initGalleryFilterAndLightbox() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.querySelector('.lightbox-modal');
  const lightboxImg = document.querySelector('.lightbox-img-wrap img');
  const lightboxCat = document.querySelector('.lightbox-cat');
  const lightboxTitle = document.querySelector('.lightbox-title');
  const lightboxDesc = document.querySelector('.lightbox-desc');
  const lightboxClose = document.querySelector('.lightbox-close-btn');
  const lightboxBookBtn = document.querySelector('.lightbox-book-btn');

  // Filter items
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 50);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // Open Lightbox
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const src = item.getAttribute('data-lightbox-src');
      const cat = item.getAttribute('data-lightbox-cat');
      const title = item.getAttribute('data-lightbox-title');
      const desc = item.getAttribute('data-lightbox-desc');

      if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        lightboxImg.alt = title;
        if (lightboxCat) lightboxCat.textContent = cat;
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxDesc) lightboxDesc.textContent = desc;

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Close Lightbox
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  // Lightbox CTA trigger scroll to booking
  if (lightboxBookBtn) {
    lightboxBookBtn.addEventListener('click', () => {
      closeLightbox();
      const bookingSec = document.getElementById('booking');
      if (bookingSec) {
        bookingSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/* ==========================================================================
   6. BOOKING & CONSULTATION WIZARD
   ========================================================================== */
function initBookingWizard() {
  const form = document.getElementById('bridal-booking-form');
  if (!form) return;

  const steps = form.querySelectorAll('.booking-form-step');
  const stepNodes = document.querySelectorAll('.wizard-step-node');
  const nextBtns = form.querySelectorAll('.btn-next-step');
  const prevBtns = form.querySelectorAll('.btn-prev-step');
  const dateInput = document.getElementById('booking-date');

  // Ensure wedding date cannot be in the past
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  // Clear validation red border on input
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => {
      input.style.borderColor = '';
    });
    input.addEventListener('change', () => {
      input.style.borderColor = '';
    });
  });

  let currentStep = 1;

  function goToStep(stepNum) {
    steps.forEach(step => {
      step.style.display = step.getAttribute('data-step') == stepNum ? 'block' : 'none';
    });

    stepNodes.forEach((node, idx) => {
      if (idx + 1 <= stepNum) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    currentStep = stepNum;
  }

  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Validate required inputs in current step
      const currentStepContainer = form.querySelector(`.booking-form-step[data-step="${currentStep}"]`);
      const inputs = currentStepContainer.querySelectorAll('input[required], select[required]');
      let isValid = true;

      inputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = '#FF6B6B';
        } else {
          input.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }
      });

      if (isValid) {
        goToStep(currentStep + 1);
      } else {
        showToast('Please fill in all required fields to proceed.');
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      goToStep(currentStep - 1);
    });
  });

  // Function to process and dispatch booking to WhatsApp
  function handleBookingSubmission() {
    // 1. Cross-validate Step 1 required fields
    const step1Container = form.querySelector('.booking-form-step[data-step="1"]');
    const step1Inputs = step1Container ? step1Container.querySelectorAll('input[required], select[required]') : [];
    for (const input of step1Inputs) {
      if (!input.value.trim()) {
        goToStep(1);
        input.style.borderColor = '#FF6B6B';
        input.focus();
        showToast('Please fill in your ' + (input.previousElementSibling?.textContent?.replace('*', '').trim() || 'required details'));
        return;
      }
    }

    // 2. Cross-validate Step 2 required fields
    const step2Container = form.querySelector('.booking-form-step[data-step="2"]');
    const step2Inputs = step2Container ? step2Container.querySelectorAll('input[required], select[required]') : [];
    for (const input of step2Inputs) {
      if (!input.value.trim()) {
        goToStep(2);
        input.style.borderColor = '#FF6B6B';
        input.focus();
        showToast('Please fill in your ' + (input.previousElementSibling?.textContent?.replace('*', '').trim() || 'event details'));
        return;
      }
    }

    // 3. Extract all 10 booking fields
    const brideName = document.getElementById('booking-name')?.value.trim() || 'Bride';
    const phone = document.getElementById('booking-phone')?.value.trim() || 'Not specified';
    const email = document.getElementById('booking-email')?.value.trim() || 'Not specified';
    const instagram = document.getElementById('booking-instagram')?.value.trim() || 'Not specified';
    const weddingDate = document.getElementById('booking-date')?.value || 'TBD';
    const serviceType = document.getElementById('booking-service')?.value || 'Bridal Makeover';
    const venue = document.getElementById('booking-venue')?.value.trim() || 'Bhubaneswar';
    const readyTime = document.getElementById('booking-readytime')?.value.trim() || 'Flexible / TBD';
    const guests = document.getElementById('booking-guests')?.value || 'Only Bride';
    const notes = document.getElementById('booking-notes')?.value.trim() || 'None';

    // 4. Format professional WhatsApp message with vertical layout and bold labels
    const messageLines = [
      '✨ *NEW BRIDAL CONSULTATION INQUIRY* ✨',
      '*Rakhi Makeovers | Luxury Bridal Studio*',
      '━━━━━━━━━━━━━━━━━━━━',
      '',
      '👰 *Bride Full Name:*',
      brideName,
      '',
      '📞 *WhatsApp / Phone Number:*',
      phone,
      '',
      '✉️ *Email Address:*',
      email,
      '',
      '📸 *Instagram Handle:*',
      instagram,
      '',
      '💍 *Wedding / Event Date:*',
      weddingDate,
      '',
      '💄 *Makeover Service Requested:*',
      serviceType,
      '',
      '📍 *Event City / Venue Name:*',
      venue,
      '',
      '⏰ *Target Ready Time:*',
      readyTime,
      '',
      '👥 *Additional Family Members for Makeup:*',
      guests,
      '',
      '📝 *Special Notes / Preferences / Vision:*',
      notes,
      '',
      '━━━━━━━━━━━━━━━━━━━━',
      '💌 *Client Note:*',
      'I want to know more and check booking date availability!'
    ];

    const fullMessage = messageLines.join('\n');
    const whatsappUrl = `https://wa.me/918249077825?text=${encodeURIComponent(fullMessage)}`;

    showToast(`✨ Thank you, ${brideName}! Opening WhatsApp to connect with Rakhi Makeovers...`);

    // 5. Direct navigation to bypass popup blocker limitations
    try {
      const newWin = window.open(whatsappUrl, '_blank');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        window.location.href = whatsappUrl;
      }
    } catch (err) {
      window.location.href = whatsappUrl;
    }

    // 6. Reset form and return to step 1
    setTimeout(() => {
      form.reset();
      goToStep(1);
    }, 1500);
  }

  // Handle both form submission & explicit submit button click
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleBookingSubmission();
  });

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleBookingSubmission();
    });
  }
}

/* ==========================================================================
   7. FLOATING ACTIONS (BACK TO TOP & WHATSAPP)
   ========================================================================== */
function initFloatingActions() {
  const topBtn = document.querySelector('.float-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      topBtn?.classList.add('visible');
    } else {
      topBtn?.classList.remove('visible');
    }
  });

  topBtn?.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ==========================================================================
   8. NEWSLETTER & TOAST NOTIFICATION
   ========================================================================== */
function initNewsletter() {
  const newsletterForm = document.querySelector('.footer-newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        showToast('✨ Thank you! Your 6-Month Bridal Beauty Checklist has been sent to your email.');
        input.value = '';
      }
    });
  }
}

function showToast(message) {
  let toast = document.querySelector('.toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="fa-solid fa-sparkles text-gold"></i> <span>${message}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}

/* ==========================================================================
   9. REAL BRIDES TESTIMONIALS AUTO-SLIDER (3-Second Cycle)
   ========================================================================== */
function initTestimonialCarousel() {
  const track = document.getElementById('testimonials-track');
  const wrapper = document.querySelector('.testimonials-slider-wrapper');
  const prevBtn = document.querySelector('.slider-prev-btn');
  const nextBtn = document.querySelector('.slider-next-btn');
  const dotsContainer = document.getElementById('testimonial-dots');
  
  if (!track || !wrapper) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const totalCards = cards.length;
  if (totalCards === 0) return;

  let currentIndex = 0;
  let autoSlideTimer = null;
  let isPaused = false;

  // Dynamically generate navigation dots matching number of unique reviews
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    cards.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `View review ${idx + 1}`);
      dot.addEventListener('click', () => {
        goToSlide(idx);
        restartTimer();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function getVisibleCards() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function updateSliderPosition() {
    const visibleCards = getVisibleCards();
    const maxIndex = Math.max(0, totalCards - visibleCards);

    if (currentIndex > maxIndex) {
      currentIndex = 0;
    } else if (currentIndex < 0) {
      currentIndex = maxIndex;
    }

    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 28;
    const offset = currentIndex * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;

    // Update active dot
    const dots = dotsContainer?.querySelectorAll('.slider-dot') || [];
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  function nextSlide() {
    const visibleCards = getVisibleCards();
    const maxIndex = Math.max(0, totalCards - visibleCards);
    if (currentIndex >= maxIndex) {
      currentIndex = 0;
    } else {
      currentIndex++;
    }
    updateSliderPosition();
  }

  function prevSlide() {
    const visibleCards = getVisibleCards();
    const maxIndex = Math.max(0, totalCards - visibleCards);
    if (currentIndex <= 0) {
      currentIndex = maxIndex;
    } else {
      currentIndex--;
    }
    updateSliderPosition();
  }

  function goToSlide(index) {
    currentIndex = index;
    updateSliderPosition();
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(() => {
      if (!isPaused) {
        nextSlide();
      }
    }, 3000);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  function restartTimer() {
    stopAutoSlide();
    startAutoSlide();
  }

  // Prev / Next button listeners
  prevBtn?.addEventListener('click', () => {
    prevSlide();
    restartTimer();
  });

  nextBtn?.addEventListener('click', () => {
    nextSlide();
    restartTimer();
  });

  // Pause on mouse hover & resume on leave
  wrapper.addEventListener('mouseenter', () => { isPaused = true; });
  wrapper.addEventListener('mouseleave', () => { isPaused = false; });

  // Touch Swipe gestures for Mobile
  let startX = 0;
  let isSwiping = false;

  wrapper.addEventListener('touchstart', (e) => {
    isPaused = true;
    startX = e.touches[0].clientX;
    isSwiping = true;
  }, { passive: true });

  wrapper.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;
    isPaused = false;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      restartTimer();
    }
  });

  // Resize handler to recalculate dimensions
  window.addEventListener('resize', () => {
    updateSliderPosition();
  });

  // Start 3-second auto-slide
  setTimeout(() => {
    updateSliderPosition();
    startAutoSlide();
  }, 100);
}

/* ==========================================================================
   10. REAL-TIME DATA HYDRATION (FROM ADMIN / API)
   ========================================================================== */
function initDynamicSync() {
  fetchServicesSync();
  fetchGallerySync();
  fetchReviewsSync();
}

async function fetchServicesSync() {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) return;
    const services = await res.json();
    if (!Array.isArray(services) || services.length === 0) return;

    const grid = document.querySelector('.services-cards-grid');
    if (!grid) return;

    grid.innerHTML = services.map(s => `
      <div class="service-card reveal-fade-up active" data-category="${s.category || 'bridal'}">
        <div class="service-card-media">
          <img src="${s.image || 'assets/images/bridal_traditional.webp'}" alt="${s.title}" class="service-card-img" width="400" height="220" loading="lazy" decoding="async">
        </div>
        <div class="service-card-content">
          <h3 class="service-card-title">${s.title}</h3>
          <p class="service-card-desc">${s.description || ''}</p>
          <ul class="service-inclusions-list">
            ${(s.inclusions || []).map(inc => `<li><i class="fa-solid fa-check text-rose"></i> ${inc}</li>`).join('')}
          </ul>
          <div class="service-card-footer">
            <span class="service-duration"><i class="fa-regular fa-clock"></i> ${s.duration || '2.5 Hours'}</span>
            <a href="#booking" class="btn btn-sm btn-primary">Book Look</a>
          </div>
        </div>
      </div>
    `).join('');

    initServiceFilters();
  } catch (e) {
    // Graceful fallback to initial HTML
  }
}

async function fetchGallerySync() {
  try {
    const res = await fetch('/api/gallery');
    if (!res.ok) return;
    const gallery = await res.json();
    if (!Array.isArray(gallery) || gallery.length === 0) return;

    const grid = document.querySelector('.gallery-masonry-grid');
    if (!grid) return;

    grid.innerHTML = gallery.map(item => `
      <div class="gallery-item reveal-fade-up active" data-category="${item.category || 'traditional'}" data-lightbox-src="${item.image}" data-lightbox-cat="${item.categoryName || 'Bridal Look'}" data-lightbox-title="${item.title}" data-lightbox-desc="${item.description || ''}">
        <img src="${item.image}" alt="${item.altText || item.title}" class="gallery-item-img" width="400" height="500" loading="lazy" decoding="async">
        <div class="gallery-item-overlay">
          <span class="gallery-item-category">${item.categoryName || 'Bridal Look'}</span>
          <h3 class="gallery-item-title">${item.title}</h3>
          <div class="gallery-item-view-btn"><span>View Look Details</span> <i class="fa-solid fa-arrow-right"></i></div>
        </div>
      </div>
    `).join('');

    initGalleryFilterAndLightbox();
  } catch (e) {
    // Graceful fallback to initial HTML
  }
}

async function fetchReviewsSync() {
  try {
    const res = await fetch('/api/reviews');
    if (!res.ok) return;
    const reviews = await res.json();
    if (!Array.isArray(reviews) || reviews.length === 0) return;

    const track = document.getElementById('testimonials-track');
    if (!track) return;

    track.innerHTML = reviews.map(rev => `
      <div class="testimonial-card">
        <div class="testi-quote-icon"><i class="fa-solid fa-quote-left"></i></div>
        <div class="testi-stars">
          ${Array(rev.rating || 5).fill('<i class="fa-solid fa-star"></i>').join('')}
        </div>
        <p class="testi-text">“${rev.reviewText}”</p>
        <div class="testi-author">
          <img src="${rev.avatarImage || 'assets/images/bridal_pastel.webp'}" alt="${rev.authorName}" class="author-avatar" width="50" height="50" loading="lazy" decoding="async">
          <div class="author-info">
            <h4>
              ${rev.authorProfileUrl ? `
                <a href="${rev.authorProfileUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">
                  ${rev.authorName} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; color: var(--color-gold-primary); margin-left: 0.2rem;"></i>
                </a>
              ` : rev.authorName}
            </h4>
            <p><i class="fa-brands fa-google" style="color: #EA4335; margin-right: 0.25rem;"></i> ${rev.source || 'Google Verified Review'} ${rev.timeAgo ? `(${rev.timeAgo})` : ''}</p>
          </div>
        </div>
      </div>
    `).join('');

    initTestimonialCarousel();
  } catch (e) {
    // Graceful fallback to initial HTML
  }
}

