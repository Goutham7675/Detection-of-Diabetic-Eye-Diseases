/**
 * API Client
 * A simplified client for connecting to the EyeCare AI backend
 */

class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.isAuthenticated = false;
    this.username = null;
    this.email = null;
    this.checkAuthStatus();
  }

  // Core request method
  async request(endpoint, options = {}) {
    const url = this.baseUrl + endpoint;
    const defaultOptions = {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const fetchOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, fetchOptions);
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (!response.ok) {
        const error = new Error(data.error || 'An error occurred');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Check if user is logged in
  async checkAuthStatus() {
    try {
      const response = await this.request('/check_auth');
      this.isAuthenticated = response.authenticated;
      if (response.authenticated) {
        this.username = response.username;
        this.email = response.email;
      }
      return response.authenticated;
    } catch (error) {
      this.isAuthenticated = false;
      return false;
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.success) {
      this.isAuthenticated = true;
      this.username = response.username;
      this.email = response.email;
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    return response;
  }

  async logout() {
    const response = await this.request('/logout?format=json');
    if (response.success) {
      this.isAuthenticated = false;
      this.username = null;
      this.email = null;
    }
    return response;
  }

  // Image upload for detection
  async uploadImage(formData) {
    // Create a custom request without JSON content type
    const url = this.baseUrl + '/upload?format=json';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.error || 'An error occurred');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  }

  // Get detection history
  async getDetectionHistory() {
    return await this.request('/detection_history');
  }

  // Submit feedback
  async submitFeedback(message) {
    return await this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Submit contact form
  async submitContact(contactData) {
    return await this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  }
}

// Create and export a global API client instance
const api = new ApiClient();
window.EyeCareApi = api;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  console.log('API Client initialized');
  
  // Initialize form handlers
  initFormHandlers();
});

// Form handling functionality
function initFormHandlers() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[name="username"]').value; // Using username field for email too
      const password = loginForm.querySelector('[name="password"]').value;
      
      try {
        const response = await api.login(email, password);
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => window.location.href = '/', 1000);
      } catch (error) {
        showToast(error.data?.error || 'Login failed', 'error');
      }
    });
  }
  
  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const userData = {
        'first-name': registerForm.querySelector('[name="first-name"]').value,
        'last-name': registerForm.querySelector('[name="last-name"]').value,
        'email': registerForm.querySelector('[name="email"]').value,
        'password': registerForm.querySelector('[name="password"]').value,
        'confirm-password': registerForm.querySelector('[name="confirm-password"]').value,
        'terms': registerForm.querySelector('[name="terms"]').checked
      };
      
      try {
        const response = await api.register(userData);
        showToast('Registration successful! Please log in.', 'success');
        setTimeout(() => window.location.href = '/login', 1500);
      } catch (error) {
        showToast(error.data?.error || 'Registration failed', 'error');
      }
    });
  }
  
  // Contact form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const contactData = {
        name: contactForm.querySelector('[name="name"]').value,
        email: contactForm.querySelector('[name="email"]').value,
        subject: contactForm.querySelector('[name="subject"]').value,
        message: contactForm.querySelector('[name="message"]').value
      };
      
      try {
        const response = await api.submitContact(contactData);
        showToast('Thank you for contacting us! We will get back to you soon.', 'success');
        contactForm.reset();
      } catch (error) {
        showToast(error.data?.error || 'Failed to send message', 'error');
      }
    });
  }
  
  // Feedback form
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const message = feedbackForm.querySelector('[name="message"]').value;
      
      try {
        const response = await api.submitFeedback(message);
        showToast('Thank you for your feedback!', 'success');
        feedbackForm.reset();
      } catch (error) {
        showToast(error.data?.error || 'Failed to submit feedback', 'error');
      }
    });
  }
  
  // File upload form
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fileInput = uploadForm.querySelector('[name="file"]');
      if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please select an image to upload', 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      
      try {
        const resultContainer = document.getElementById('result-container');
        if (resultContainer) {
          resultContainer.innerHTML = '<div class="loading-spinner"></div><p>Analyzing image...</p>';
          resultContainer.classList.remove('hidden');
        }
        
        const response = await api.uploadImage(formData);
        
        if (resultContainer) {
          resultContainer.innerHTML = `
            <h2>Analysis Results</h2>
            <div class="result-card">
              <div class="result-image">
                <img src="${response.image_url}" alt="Analyzed eye image">
              </div>
              <div class="result-details">
                <h3>Diagnosis: ${response.prediction}</h3>
                <p class="confidence">Confidence: ${(response.confidence * 100).toFixed(2)}%</p>
                <div class="result-description">
                  ${response.description || ''}
                </div>
              </div>
            </div>
          `;
        }
      } catch (error) {
        showToast(error.data?.error || 'Failed to analyze image', 'error');
      }
    });
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span>${message}</span>
      <button class="toast-close">&times;</button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Add close functionality
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
} 