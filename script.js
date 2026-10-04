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

  // 1. Scroll Indicator Click Handler
  const scrollIndicatorBtn = document.getElementById('scrollIndicatorBtn');
  const stickyNavbar = document.getElementById('stickyNavbar');
  const skillsSection = document.getElementById('skills');

  if (scrollIndicatorBtn) {
    scrollIndicatorBtn.addEventListener('click', () => {
      if (skillsSection) {
        skillsSection.scrollIntoView({ behavior: 'smooth' });
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

  // 4. Smooth Anchor Scrolling adjustment for Sticky Navbar height
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navbarHeight = stickyNavbar ? stickyNavbar.offsetHeight : 70;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - (targetId === '#hero' ? 0 : navbarHeight);
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // 5. Scroll Snap Assist — hero only (no snapping once navbar reaches top or below)
  let isSnapping = false;
  let snapTimeout = null;

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
      return;
    }

    if (isSnapping) return;

    const snapThreshold = heroHeight * 0.30;

    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(() => {
      const scrolledNow = window.pageYOffset || document.documentElement.scrollTop;

      // Guard: strictly ignore if user has reached or passed the hero/navbar
      if (scrolledNow >= heroHeight - 5) {
        return;
      }

      isSnapping = true;
      if (scrolledNow >= snapThreshold) {
        // 30%+ scrolled within hero → snap down to position navbar at top
        window.scrollTo({ top: heroHeight, behavior: 'smooth' });
        setTimeout(() => { isSnapping = false; }, 700);
      } else if (scrolledNow > 0) {
        // < 30% scrolled → snap back to top of hero
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { isSnapping = false; }, 700);
      } else {
        isSnapping = false;
      }
    }, 140);
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

});
