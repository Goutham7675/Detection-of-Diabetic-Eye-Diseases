/**
 * form-handlers.js - Frontend form handling
 * This file contains event listeners and handlers for various forms in the application
 */

// Import the API modules from api.js
import { AuthApi, DetectionApi, FeedbackApi } from './api.js';

// Display error or success message
const showMessage = (message, type = 'error') => {
  // Create a flash message element similar to Flask's flash messages
  const flashContainer = document.querySelector('.flash-container') || document.createElement('div');
  if (!document.querySelector('.flash-container')) {
    flashContainer.className = 'flash-container';
    document.body.appendChild(flashContainer);
  }
  
  // Create the message element
  const messageElement = document.createElement('div');
  messageElement.className = `flash-message flash-${type}`;
  messageElement.innerHTML = `
    <span>${message}</span>
    <button class="flash-close">&times;</button>
  `;
  
  // Add to container
  flashContainer.appendChild(messageElement);
  
  // Add close button functionality
  messageElement.querySelector('.flash-close').addEventListener('click', () => {
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateX(100%)';
    setTimeout(() => messageElement.remove(), 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageElement && messageElement.parentNode) {
      messageElement.style.opacity = '0';
      messageElement.style.transform = 'translateX(100%)';
      setTimeout(() => messageElement.remove(), 300);
    }
  }, 5000);
};

// Initialize form handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Login form handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const email = loginForm.querySelector('[name="email"]').value;
        const password = loginForm.querySelector('[name="password"]').value;
        
        // Show loading state
        const submitButton = loginForm.querySelector('[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        const response = await AuthApi.login(email, password);
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect to homepage after successful login
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (error) {
        showMessage(error.message || 'Failed to login. Please check your credentials.');
      } finally {
        // Reset button state
        const submitButton = loginForm.querySelector('[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }
  
  // Registration form handler
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const formData = {
          'first-name': registerForm.querySelector('[name="first-name"]').value,
          'last-name': registerForm.querySelector('[name="last-name"]').value,
          'email': registerForm.querySelector('[name="email"]').value,
          'password': registerForm.querySelector('[name="password"]').value,
          'confirm-password': registerForm.querySelector('[name="confirm-password"]').value,
          'terms': registerForm.querySelector('[name="terms"]').checked
        };
        
        // Validate passwords match
        if (formData.password !== formData['confirm-password']) {
          showMessage('Passwords do not match');
          return;
        }
        
        // Validate terms are accepted
        if (!formData.terms) {
          showMessage('You must agree to the Terms of Service and Privacy Policy');
          return;
        }
        
        // Show loading state
        const submitButton = registerForm.querySelector('[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Creating account...';
        
        const response = await AuthApi.register(formData);
        
        showMessage('Registration successful! Please log in.', 'success');
        
        // Redirect to login page after successful registration
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } catch (error) {
        showMessage(error.message || 'Failed to register. Please try again.');
      } finally {
        // Reset button state
        const submitButton = registerForm.querySelector('[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }
  
  // Image upload form handler
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const fileInput = uploadForm.querySelector('[name="file"]');
        
        // Check if file is selected
        if (!fileInput.files || fileInput.files.length === 0) {
          showMessage('Please select an image to upload');
          return;
        }
        
        // Create FormData object
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        // Show loading state
        const submitButton = uploadForm.querySelector('[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Analyzing image...';
        
        // Show loading animation
        const resultContainer = document.getElementById('result-container');
        if (resultContainer) {
          resultContainer.innerHTML = '<div class="loading-spinner"></div><p>Analyzing your image. This may take a moment...</p>';
          resultContainer.classList.remove('hidden');
        }
        
        const response = await DetectionApi.uploadImage(formData);
        
        // Redirect to results page or display results
        if (response.redirect) {
          window.location.href = response.redirect;
        } else if (resultContainer) {
          // Display results in the container
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
        showMessage(error.message || 'Failed to analyze image. Please try again.');
      } finally {
        // Reset button state
        const submitButton = uploadForm.querySelector('[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }
  
  // Feedback form handler
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const message = feedbackForm.querySelector('[name="message"]').value;
        
        if (!message.trim()) {
          showMessage('Please enter your feedback');
          return;
        }
        
        // Show loading state
        const submitButton = feedbackForm.querySelector('[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        
        const response = await FeedbackApi.submitFeedback(message);
        
        showMessage('Thank you for your feedback!', 'success');
        feedbackForm.reset();
      } catch (error) {
        showMessage(error.message || 'Failed to submit feedback. Please try again.');
      } finally {
        // Reset button state
        const submitButton = feedbackForm.querySelector('[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }
  
  // Contact form handler
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const contactData = {
          name: contactForm.querySelector('[name="name"]').value,
          email: contactForm.querySelector('[name="email"]').value,
          subject: contactForm.querySelector('[name="subject"]').value,
          message: contactForm.querySelector('[name="message"]').value
        };
        
        // Validate required fields
        if (!contactData.name.trim() || !contactData.email.trim() || 
            !contactData.subject.trim() || !contactData.message.trim()) {
          showMessage('Please fill in all required fields');
          return;
        }
        
        // Show loading state
        const submitButton = contactForm.querySelector('[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        const response = await FeedbackApi.submitContact(contactData);
        
        showMessage('Thank you for contacting us! We will get back to you soon.', 'success');
        contactForm.reset();
      } catch (error) {
        showMessage(error.message || 'Failed to send your message. Please try again.');
      } finally {
        // Reset button state
        const submitButton = contactForm.querySelector('[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }
}); 