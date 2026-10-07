/* ==========================================================================
   ANUBHAV PORTFOLIO - INTERACTIVE SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // -1. Hero Image Preloader & Loading Animation
  const heroLoader = document.getElementById('heroLoader');
  if (heroLoader) {
    function getHeroImageSrc() {
      const width = window.innerWidth;
      if (width <= 300) return './images/2/300px phone.png';
      if (width <= 600) return './images/2/phone.png';
      if (width <= 900) return './images/2/900px.png';
      if (width <= 1060) return './images/2/tab.png';
      return './images/2/1st home page.png';
    }

    const heroImg = new Image();
    heroImg.src = getHeroImageSrc();

    let dismissed = false;
    const hideHeroLoader = () => {
      if (dismissed) return;
      dismissed = true;
      heroLoader.classList.add('fade-out');
      setTimeout(() => {
        heroLoader.style.display = 'none';
      }, 520);
    };

    if (heroImg.complete) {
      hideHeroLoader();
    } else {
      heroImg.addEventListener('load', hideHeroLoader);
      heroImg.addEventListener('error', hideHeroLoader);
      // Fallback timeout so loader never hangs
      setTimeout(hideHeroLoader, 4000);
    }
  }

  // 0. Theme Toggle (Dark theme by default)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const storedTheme = localStorage.getItem('portfolio-theme');
  const initialTheme = storedTheme ? storedTheme : 'dark'; // Dark theme default

  document.documentElement.setAttribute('data-theme', initialTheme);
  updateThemeToggleUi(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('portfolio-theme', next);
      updateThemeToggleUi(next);
    });
  }

  function updateThemeToggleUi(theme) {
    if (!themeToggleBtn) return;
    const isDark = theme === 'dark';
    themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    themeToggleBtn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  // 1. Navigation & Scroll Snapping State Variables
  let isSnapping = false;
  let lastScrollTop = 0;
  let snapTimeout = null;

  const stickyNavbar = document.getElementById('stickyNavbar');
  const scrollIndicatorBtn = document.getElementById('scrollIndicatorBtn');
  const skillsSection = document.getElementById('skills');
  const navBrand = document.querySelector('.nav-brand');

  // Haptic vibration matching the playful "tun tunnn" cadence
  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        // [40ms tap for "tun", 60ms brief pause, 85ms pulse for "tunnn"]
        navigator.vibrate([40, 60, 85]);
      }
    } catch (e) {
      // Graceful fallback if haptics are unsupported or disabled
    }
  };

  // Web Audio API: Playful sad "tun tunnn" / fail sound effect
  let failAudioCtx = null;

  const playFailSound = () => {
    // Trigger haptic vibration on devices with vibration support
    triggerHaptic();

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!failAudioCtx) {
        failAudioCtx = new AudioCtx();
      }
      if (failAudioCtx.state === 'suspended') {
        failAudioCtx.resume();
      }

      const now = failAudioCtx.currentTime;

      // Master volume (gentle and subtle)
      const master = failAudioCtx.createGain();
      master.gain.setValueAtTime(0.18, now);
      master.connect(failAudioCtx.destination);

      // --- Note 1: "Tun" (short, slight drop) ---
      const osc1 = failAudioCtx.createOscillator();
      const gain1 = failAudioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.exponentialRampToValueAtTime(190, now + 0.12);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.75, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc1.connect(gain1);
      gain1.connect(master);
      osc1.start(now);
      osc1.stop(now + 0.16);

      // --- Note 2: "Tunnn..." (lower, comedic sad downward droop) ---
      const t2 = now + 0.15;
      const osc2 = failAudioCtx.createOscillator();
      const gain2 = failAudioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(160, t2);
      osc2.frequency.exponentialRampToValueAtTime(125, t2 + 0.38);

      gain2.gain.setValueAtTime(0.001, t2);
      gain2.gain.linearRampToValueAtTime(0.8, t2 + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.42);

      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start(t2);
      osc2.stop(t2 + 0.45);
    } catch (e) {
      // Audio context graceful fallback if blocked by browser policy
    }
  };

  // Expose on window for easy testing in console: window.playFailSound() and window.triggerHaptic()
  window.playFailSound = playFailSound;
  window.triggerHaptic = triggerHaptic;

  // Trigger subtle "already here" feedback animation on any nav button or element
  const triggerAlreadyHereAnimation = (el) => {
    const targetEl = el || navBrand;
    if (!targetEl) return;
    targetEl.classList.remove('already-top');
    void targetEl.offsetWidth; // Force reflow to re-trigger if clicked repeatedly
    targetEl.classList.add('already-top');

    // Play playful "tun tunnn" fail sound
    playFailSound();

    if (targetEl._alreadyTopTimer) {
      clearTimeout(targetEl._alreadyTopTimer);
    }
    targetEl._alreadyTopTimer = setTimeout(() => {
      targetEl.classList.remove('already-top');
    }, 550);
  };

  const triggerAlreadyTopAnimation = () => triggerAlreadyHereAnimation(navBrand);

  // Function to smoothly scroll above the navbar to the very top (Hero landing)
  const scrollToTop = (callback) => {
    isSnapping = true;
    if (snapTimeout) {
      clearTimeout(snapTimeout);
      snapTimeout = null;
    }

    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (currentScroll <= 15) {
      isSnapping = false;
      triggerAlreadyTopAnimation();
      if (typeof callback === 'function') callback();
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    const startTime = Date.now();
    const checkArrival = setInterval(() => {
      const current = window.pageYOffset || document.documentElement.scrollTop;
      if (current <= 2 || Date.now() - startTime > 1200) {
        isSnapping = false;
        lastScrollTop = 0;
        clearInterval(checkArrival);
        if (current <= 2 && typeof callback === 'function') {
          callback();
        }
      }
    }, 40);
  };

  // Function to smoothly scroll to any section target without being hijacked by hero scroll snap
  const smoothScrollToTarget = (targetElement) => {
    if (!targetElement) return;

    isSnapping = true;
    if (snapTimeout) {
      clearTimeout(snapTimeout);
      snapTimeout = null;
    }

    const navbarHeight = stickyNavbar ? stickyNavbar.offsetHeight : 70;
    const elementRect = targetElement.getBoundingClientRect();
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const targetPosition = Math.max(0, Math.round(elementRect.top + currentScroll - navbarHeight));

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    const startTime = Date.now();
    const checkArrival = setInterval(() => {
      const current = window.pageYOffset || document.documentElement.scrollTop;
      if (Math.abs(current - targetPosition) <= 4 || Date.now() - startTime > 1400) {
        isSnapping = false;
        lastScrollTop = current;
        clearInterval(checkArrival);
      }
    }, 40);
  };

  if (scrollIndicatorBtn) {
    scrollIndicatorBtn.addEventListener('click', () => {
      if (skillsSection) {
        const navbarHeight = stickyNavbar ? stickyNavbar.offsetHeight : 70;
        const elementRect = skillsSection.getBoundingClientRect();
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        const targetPosition = Math.max(0, Math.round(elementRect.top + currentScroll - navbarHeight));
        if (Math.abs(currentScroll - targetPosition) <= 35) {
          triggerAlreadyHereAnimation(scrollIndicatorBtn);
          return;
        }
        smoothScrollToTarget(skillsSection);
      }
    });
  }

  // 2. Intersection Observer for Dynamic Sticky Navbar Multi-Section Highlighting
  const navLinks = document.querySelectorAll('.nav-link');
  const activeSections = new Set();
  
  const targetMap = [
    { id: 'skills', key: 'skills' },
    { id: 'education', key: 'education' },
    { id: 'co-curricular', key: 'co-curricular' },
    { id: 'interests', key: 'interests' },
    { id: 'contact', key: 'contact' }
  ];

  function updateActiveNavLinks() {
    navLinks.forEach(link => {
      const sectionKey = link.getAttribute('data-section');
      if (activeSections.has(sectionKey)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  const observerOptions = {
    root: null,
    rootMargin: '-5% 0px -15% 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const targetId = entry.target.getAttribute('id');
      const targetObj = targetMap.find(item => item.id === targetId);
      
      if (targetObj) {
        if (entry.isIntersecting) {
          activeSections.add(targetObj.key);
        } else {
          activeSections.delete(targetObj.key);
        }
      }
    });
    updateActiveNavLinks();
  }, observerOptions);

  // Observe all target section elements
  targetMap.forEach(target => {
    const el = document.getElementById(target.id);
    if (el) {
      observer.observe(el);
    }
  });

  // 3. Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Close menu when link clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // 4. Smooth Anchor Scrolling adjustment for Sticky Navbar height with "Already Here" feedback
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      if (targetId === '#hero') {
        e.preventDefault();
        if (currentScroll <= 15) {
          triggerAlreadyHereAnimation(this);
          if (navBrand && this !== navBrand) triggerAlreadyHereAnimation(navBrand);
          return;
        }
        scrollToTop();
        return;
      }

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navbarHeight = stickyNavbar ? stickyNavbar.offsetHeight : 70;
        const elementRect = targetElement.getBoundingClientRect();
        const targetPosition = Math.max(0, Math.round(elementRect.top + currentScroll - navbarHeight));
        const distanceToTarget = Math.abs(currentScroll - targetPosition);

        // If user is already at this section (within 35px of target top):
        if (distanceToTarget <= 35) {
          triggerAlreadyHereAnimation(this);
          return;
        }

        smoothScrollToTarget(targetElement);
      }
    });
  });

  // Explicit click handler: clicking the name / logo anywhere in navbar scrolls to the top or triggers subtle animation if already there
  if (navBrand) {
    navBrand.addEventListener('click', function (e) {
      e.preventDefault();
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const hero = document.getElementById('hero');
      const heroHeight = hero ? hero.offsetHeight : window.innerHeight;

      // If already at or very near the top of the hero section
      if (currentScroll <= 15) {
        triggerAlreadyTopAnimation();
        return;
      }

      // If within upper hero section, smoothly snap to 0 and trigger feedback on arrival
      if (currentScroll < heroHeight * 0.45) {
        scrollToTop(() => {
          triggerAlreadyTopAnimation();
        });
        return;
      }

      scrollToTop();
    });
  }

  // Brand Logo Helper (Option 1: 'signature' [30%], Option 2: 'hollow' [70%])
  // Allows testing or manual switching in DevTools via window.setBrandLogo('signature') or window.setBrandLogo('hollow')
  window.setBrandLogo = function (mode) {
    if (navBrand && (mode === 'signature' || mode === 'hollow')) {
      navBrand.setAttribute('data-brand-mode', mode);
      console.log(`[Brand Logo] Switched to: ${mode} (${mode === 'signature' ? 'Option 1: Calligraphy Signature (30%)' : 'Option 2: Hollow Outlined Text (70%)'})`);
    }
  };

  // Ensure attribute is set in case inline script was skipped
  if (navBrand && !navBrand.hasAttribute('data-brand-mode')) {
    const isSignature = Math.random() < 0.3;
    navBrand.setAttribute('data-brand-mode', isSignature ? 'signature' : 'hollow');
  }

  // 5. Scroll Snap Assist — hero only (no snapping once navbar reaches top or below)

  window.addEventListener('scroll', () => {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const hero = document.getElementById('hero');
    const heroHeight = hero ? hero.offsetHeight : window.innerHeight;

    // Below hero or navbar at the top: NEVER snap!
    if (currentScrollTop >= heroHeight - 5) {
      if (snapTimeout) {
        clearTimeout(snapTimeout);
        snapTimeout = null;
      }
      lastScrollTop = currentScrollTop;
      return;
    }

    if (isSnapping) {
      lastScrollTop = currentScrollTop;
      return;
    }

    const isScrollingDown = currentScrollTop > lastScrollTop;
    const snapThreshold = heroHeight * 0.45; // Halfway mark between top and navbar

    // Immediate snap on halfway scroll downwards (0 wait time)
    if (isScrollingDown && currentScrollTop >= snapThreshold) {
      if (snapTimeout) {
        clearTimeout(snapTimeout);
        snapTimeout = null;
      }
      isSnapping = true;
      window.scrollTo({ top: heroHeight, behavior: 'smooth' });
      setTimeout(() => { isSnapping = false; }, 600);
      lastScrollTop = currentScrollTop;
      return;
    }

    // Immediate snap on halfway scroll upwards towards top (0 wait time)
    if (!isScrollingDown && currentScrollTop <= snapThreshold && currentScrollTop > 0 && lastScrollTop > snapThreshold) {
      if (snapTimeout) {
        clearTimeout(snapTimeout);
        snapTimeout = null;
      }
      isSnapping = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => { isSnapping = false; }, 600);
      lastScrollTop = currentScrollTop;
      return;
    }

    // 0 wait time fallback once user releases/pauses scroll before threshold
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(() => {
      const scrolledNow = window.pageYOffset || document.documentElement.scrollTop;

      // Guard: strictly ignore if user has reached or passed the hero/navbar
      if (scrolledNow >= heroHeight - 5 || isSnapping) {
        return;
      }

      isSnapping = true;
      if (scrolledNow >= snapThreshold) {
        // Halfway or more scrolled within hero -> snap down to position navbar at top
        window.scrollTo({ top: heroHeight, behavior: 'smooth' });
      } else if (scrolledNow > 0) {
        // Less than halfway -> snap back to top of hero
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        isSnapping = false;
        return;
      }
      setTimeout(() => { isSnapping = false; }, 600);
    }, 0);

    lastScrollTop = currentScrollTop;
  }, { passive: true });

  // 6. Certificate Pop-up Lightbox Modal
  const certModal = document.getElementById('certificateModal');
  const certImg = document.getElementById('certificateImg');
  const certCloseBtn = document.getElementById('certificateCloseBtn');
  const certBackdrop = document.getElementById('certificateBackdrop');
  const certButtons = document.querySelectorAll('.btn-certificate');
  let lastFocusedElement = null;

  function openCertificate(imageSrc, altText) {
    if (!certModal || !certImg) return;
    lastFocusedElement = document.activeElement;
    certImg.src = imageSrc;
    certImg.alt = altText || 'Certificate Preview';
    certModal.classList.add('active');
    certModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (certCloseBtn) {
      certCloseBtn.focus();
    }
  }

  function closeCertificate() {
    if (!certModal) return;
    certModal.classList.remove('active');
    certModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  certButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const certSrc = btn.getAttribute('data-certificate') || './images/5/internico.jpg';
      const certTitle = btn.getAttribute('data-title') || 'Certificate';
      openCertificate(certSrc, certTitle);
    });
  });

  if (certCloseBtn) {
    certCloseBtn.addEventListener('click', closeCertificate);
  }

  if (certBackdrop) {
    certBackdrop.addEventListener('click', closeCertificate);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && certModal && certModal.classList.contains('active')) {
      closeCertificate();
    }
  });



  // --------------------------------------------------------------------------
  // 7. Scroll-Based Reveal Animations (Reversible on Scroll Up)
  // --------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('.scroll-reveal');
  
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        } else {
          // Reverses animation when scrolling up/out of view
          entry.target.classList.remove('is-revealed');
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.12
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // --------------------------------------------------------------------------
  // 8. Sticky Navbar Scroll Reading Progress Bar
  // --------------------------------------------------------------------------
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  if (scrollProgressBar) {
    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
  }

});
