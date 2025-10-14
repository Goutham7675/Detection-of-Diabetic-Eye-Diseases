// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('show');
      document.body.classList.toggle('no-scroll');
    });
  }
  
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
  
  if (themeToggle || mobileThemeToggle) {
    // Set initial state based on localStorage or default to dark
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Set both toggles to match the current theme
    if (themeToggle) {
      themeToggle.checked = currentTheme === 'light';
    }
    
    if (mobileThemeToggle) {
      mobileThemeToggle.checked = currentTheme === 'light';
    }

    // Add event listeners to both toggles
    if (themeToggle) {
      themeToggle.addEventListener('change', function() {
        const theme = this.checked ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Keep mobile toggle in sync
        if (mobileThemeToggle) {
          mobileThemeToggle.checked = this.checked;
        }
      });
    }
    
    if (mobileThemeToggle) {
      mobileThemeToggle.addEventListener('change', function() {
        const theme = this.checked ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Keep desktop toggle in sync
        if (themeToggle) {
          themeToggle.checked = this.checked;
        }
      });
    }
  }
  
  // Set current year
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
  
  // File upload preview
  const fileInput = document.getElementById('image');
  const fileLabel = document.querySelector('.file-label');
  const fileName = document.querySelector('.file-name');
  const fileSize = document.querySelector('.file-size');
  const analyzeBtn = document.querySelector('.analyze-btn');
  const uploadOverlay = document.querySelector('.upload-overlay');
  
  if (fileInput && fileName && fileSize) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        fileName.textContent = file.name;
        fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
        fileLabel.classList.add('has-file');
        
        if (analyzeBtn) {
          analyzeBtn.disabled = false;
        }
      }
    });
  }
  
  // Drag and drop
  const dropArea = document.querySelector('.upload-container');
  
  if (dropArea) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
      dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
      dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      
      if (fileInput && files.length > 0) {
        fileInput.files = files;
        
        // Trigger change event
        const event = new Event('change');
        fileInput.dispatchEvent(event);
      }
    }
  }
  
  // Form submission overlay
  const uploadForm = document.getElementById('upload-form');
  
  if (uploadForm && uploadOverlay) {
    uploadForm.addEventListener('submit', () => {
      uploadOverlay.classList.add('active');
    });
  }
  
  // Scroll animations
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  });
});
