/**
 * RAKHI MAKEOVERS - LUXURY BRIDAL ARTISTRY INTERACTIVE ENGINE
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initBeforeAfterSlider();
  initServiceFilters();
  initGalleryFilterAndLightbox();
  initBridalPackageEstimator();
  initBookingWizard();
  initFaqAccordion();
  initFloatingActions();
  initNewsletter();
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
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   3. BEFORE & AFTER TRANSFORMATION SLIDER
   ========================================================================== */
function initBeforeAfterSlider() {
  const container = document.querySelector('.comparison-container');
  const afterImg = document.querySelector('.comparison-image.after-img');
  const handle = document.querySelector('.comparison-slider-handle');

  if (!container || !afterImg || !handle) return;

  let isDragging = false;

  function updateSlider(xPos) {
    const rect = container.getBoundingClientRect();
    let percentage = ((xPos - rect.left) / rect.width) * 100;

    // Constrain percentage between 0 and 100
    percentage = Math.max(0, Math.min(100, percentage));

    afterImg.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
    handle.style.left = `${percentage}%`;
  }

  // Mouse Events
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSlider(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  });

  // Touch Events (Mobile/Tablet)
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    updateSlider(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSlider(e.touches[0].clientX);
  }, { passive: true });
}

/* ==========================================================================
   4. SERVICES FILTER TABS
   ========================================================================== */
function initServiceFilters() {
  const filterBtns = document.querySelectorAll('.service-filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  if (!filterBtns.length || !serviceCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      serviceCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue || category.includes(filterValue)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });
}

/* ==========================================================================
   5. BRIDAL LOOKBOOK GALLERY & LIGHTBOX
   ========================================================================== */
function initGalleryFilterAndLightbox() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.querySelector('.lightbox-modal');
  const lightboxImg = document.querySelector('.lightbox-img-wrap img');
  const lightboxTitle = document.querySelector('.lightbox-title');
  const lightboxCategory = document.querySelector('.lightbox-cat');
  const lightboxDesc = document.querySelector('.lightbox-desc');
  const lightboxClose = document.querySelector('.lightbox-close-btn');
  const lightboxBookBtn = document.querySelector('.lightbox-book-btn');

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const itemCat = item.getAttribute('data-category');
        if (filter === 'all' || itemCat === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Lightbox Open
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('.gallery-item-img');
      const title = item.querySelector('.gallery-item-title')?.textContent || 'Bridal Look';
      const category = item.querySelector('.gallery-item-category')?.textContent || 'Rakhi Makeovers';
      const description = item.getAttribute('data-description') || 'Bespoke bridal makeover tailored with international HD luxury cosmetics, custom lashes, and floral styling.';

      if (lightbox && lightboxImg) {
        lightboxImg.src = img.src;
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxCategory) lightboxCategory.textContent = category;
        if (lightboxDesc) lightboxDesc.textContent = description;

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Lightbox Close
  if (lightboxClose && lightbox) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

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
   6. INTERACTIVE BRIDAL PACKAGE ESTIMATOR / CALCULATOR
   ========================================================================== */
function initBridalPackageEstimator() {
  const baseLookBtns = document.querySelectorAll('.calc-base-option');
  const addonItems = document.querySelectorAll('.calc-addon-item');
  const familyCountSelect = document.getElementById('calc-family-count');
  const citySelect = document.getElementById('calc-city');
  const totalPriceDisplay = document.querySelector('.calc-total-price');
  const selectedList = document.querySelector('.calc-selected-items-list');
  const whatsappQuoteBtn = document.querySelector('.calc-whatsapp-btn');

  let state = {
    baseLookName: 'Royal Traditional HD Bridal',
    baseLookPrice: 28000,
    addons: [],
    familyCount: 0,
    familyPricePerHead: 4500,
    travelPrice: 0,
    cityName: 'Bhubaneswar Studio (No Travel Fee)'
  };

  function calculateTotal() {
    let total = state.baseLookPrice;

    // Addons
    state.addons.forEach(add => {
      total += add.price;
    });

    // Family Makeup
    total += state.familyCount * state.familyPricePerHead;

    // Travel
    total += state.travelPrice;

    // Update Display
    if (totalPriceDisplay) {
      totalPriceDisplay.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    // Update Summary List
    if (selectedList) {
      selectedList.innerHTML = `
        <li class="calc-selected-item">
          <span>${state.baseLookName}</span>
          <span class="item-val">₹${state.baseLookPrice.toLocaleString('en-IN')}</span>
        </li>
        ${state.addons.map(a => `
          <li class="calc-selected-item">
            <span>+ ${a.name}</span>
            <span class="item-val">₹${a.price.toLocaleString('en-IN')}</span>
          </li>
        `).join('')}
        ${state.familyCount > 0 ? `
          <li class="calc-selected-item">
            <span>+ Family / Bridesmaids (${state.familyCount} person${state.familyCount > 1 ? 's' : ''})</span>
            <span class="item-val">₹${(state.familyCount * state.familyPricePerHead).toLocaleString('en-IN')}</span>
          </li>
        ` : ''}
        ${state.travelPrice > 0 ? `
          <li class="calc-selected-item">
            <span>+ Travel (${state.cityName})</span>
            <span class="item-val">₹${state.travelPrice.toLocaleString('en-IN')}</span>
          </li>
        ` : ''}
      `;
    }

    // Update WhatsApp pre-filled link
    if (whatsappQuoteBtn) {
      const textMessage = `Hello Rakhi Makeovers! I customized a bridal package on your website:%0A- Package: ${state.baseLookName}%0A- Extra Events / Addons: ${state.addons.map(a => a.name).join(', ') || 'None'}%0A- Family Guests: ${state.familyCount} persons%0A- Location: ${state.cityName}%0A- Estimated Total: ₹${total.toLocaleString('en-IN')}%0A%0AI would like to check date availability and confirm!`;
      whatsappQuoteBtn.href = `https://wa.me/919876543210?text=${textMessage}`;
    }
  }

  // Base Look Selection
  baseLookBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      baseLookBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      state.baseLookName = btn.getAttribute('data-name');
      state.baseLookPrice = parseInt(btn.getAttribute('data-price'), 10);
      calculateTotal();
    });
  });

  // Addon Checkbox toggles
  addonItems.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
      const name = item.getAttribute('data-name');
      const price = parseInt(item.getAttribute('data-price'), 10);

      if (item.classList.contains('checked')) {
        state.addons.push({ name, price });
      } else {
        state.addons = state.addons.filter(a => a.name !== name);
      }
      calculateTotal();
    });
  });

  // Family Count Select
  if (familyCountSelect) {
    familyCountSelect.addEventListener('change', (e) => {
      state.familyCount = parseInt(e.target.value, 10) || 0;
      calculateTotal();
    });
  }

  // City / Travel Select
  if (citySelect) {
    citySelect.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      state.travelPrice = parseInt(selectedOption.getAttribute('data-travel-cost'), 10) || 0;
      state.cityName = selectedOption.textContent;
      calculateTotal();
    });
  }

  // Initial Calculation
  calculateTotal();
}

/* ==========================================================================
   7. BOOKING & CONSULTATION WIZARD
   ========================================================================== */
function initBookingWizard() {
  const form = document.getElementById('bridal-booking-form');
  if (!form) return;

  const steps = form.querySelectorAll('.booking-form-step');
  const stepNodes = document.querySelectorAll('.wizard-step-node');
  const nextBtns = form.querySelectorAll('.btn-next-step');
  const prevBtns = form.querySelectorAll('.btn-prev-step');

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
      // Validate inputs in current step
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

  // Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const brideName = document.getElementById('booking-name')?.value || 'Bride';
    const weddingDate = document.getElementById('booking-date')?.value || 'Upcoming Date';
    const serviceType = document.getElementById('booking-service')?.value || 'Bridal Makeover';
    const phone = document.getElementById('booking-phone')?.value || '';

    showToast(`Thank you, ${brideName}! Your bridal consultation request has been received. Our team will contact you shortly.`);

    // Optional direct WhatsApp ping
    setTimeout(() => {
      const confirmMsg = `Hi Rakhi Makeovers, I just submitted an appointment request on your website:%0A- Name: ${brideName}%0A- Wedding Date: ${weddingDate}%0A- Service: ${serviceType}%0A- Phone: ${phone}%0A%0APlease confirm my booking slot!`;
      window.open(`https://wa.me/919876543210?text=${confirmMsg}`, '_blank');
      form.reset();
      goToStep(1);
    }, 1500);
  });
}

/* ==========================================================================
   8. FAQS ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other FAQs
      faqItems.forEach(other => other.classList.remove('active'));

      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   9. FLOATING ACTIONS (BACK TO TOP & WHATSAPP)
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
   10. NEWSLETTER & TOAST NOTIFICATION
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
