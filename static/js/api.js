/**
 * api.js - Frontend-Backend Connectivity
 * This file contains utility functions for making API calls to the Flask backend
 */

// API error handler
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Main API class for handling backend requests
const Api = {
  /**
   * Base function to make API requests
   * @param {string} url - The endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise} - Promise with response data
   */
  async request(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin', // Include cookies
    };

    const fetchOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // Handle non-JSON responses (like file downloads)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          throw new ApiError(response.status, data.message || 'An error occurred');
        }
        
        return data;
      } else {
        if (!response.ok) {
          const text = await response.text();
          throw new ApiError(response.status, text || 'An error occurred');
        }
        
        return response;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error(`Network error: ${error.message}`);
    }
  },

  /**
   * GET request
   * @param {string} url - The endpoint URL
   * @returns {Promise} - Promise with response data
   */
  get(url) {
    return this.request(url);
  },

  /**
   * POST request with JSON data
   * @param {string} url - The endpoint URL
   * @param {Object} data - The data to send
   * @returns {Promise} - Promise with response data
   */
  post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * POST request with FormData (for file uploads)
   * @param {string} url - The endpoint URL
   * @param {FormData} formData - The FormData object
   * @returns {Promise} - Promise with response data
   */
  postFormData(url, formData) {
    return this.request(url, {
      method: 'POST',
      headers: {}, // Let the browser set the content type with boundary
      body: formData,
    });
  },

  /**
   * PUT request
   * @param {string} url - The endpoint URL
   * @param {Object} data - The data to send
   * @returns {Promise} - Promise with response data
   */
  put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   * @param {string} url - The endpoint URL
   * @returns {Promise} - Promise with response data
   */
  delete(url) {
    return this.request(url, {
      method: 'DELETE',
    });
  }
};

// User authentication functions
const AuthApi = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Promise with user data
   */
  login(email, password) {
    return Api.post('/login', { email, password });
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Promise with user data
   */
  register(userData) {
    return Api.post('/register', userData);
  },

  /**
   * Logout user
   * @returns {Promise} - Promise with logout result
   */
  logout() {
    return Api.get('/logout');
  },

  /**
   * Check if user is logged in
   * @returns {Promise} - Promise with user status
   */
  checkAuth() {
    return Api.get('/check_auth');
  }
};

// Eye disease detection functions
const DetectionApi = {
  /**
   * Upload image for detection
   * @param {FormData} formData - Form data with image
   * @returns {Promise} - Promise with detection results
   */
  uploadImage(formData) {
    return Api.postFormData('/upload', formData);
  },

  /**
   * Get detection history for current user
   * @returns {Promise} - Promise with detection history
   */
  getHistory() {
    return Api.get('/detection_history');
  }
};

// Feedback and contact functions
const FeedbackApi = {
  /**
   * Submit feedback
   * @param {string} message - Feedback message
   * @returns {Promise} - Promise with feedback result
   */
  submitFeedback(message) {
    return Api.post('/feedback', { message });
  },

  /**
   * Submit contact form
   * @param {Object} contactData - Contact form data
   * @returns {Promise} - Promise with contact submission result
   */
  submitContact(contactData) {
    return Api.post('/contact', contactData);
  }
};

// Export all API modules
export { Api, AuthApi, DetectionApi, FeedbackApi }; 