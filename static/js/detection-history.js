/**
 * detection-history.js
 * Handles fetching and displaying the user's eye disease detection history
 */

import { DetectionApi } from './api.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const historyContainer = document.getElementById('detection-history');
  
  if (historyContainer) {
    loadDetectionHistory(historyContainer);
  }
  
  // Handle filter controls if they exist
  const filterControls = document.getElementById('history-filters');
  if (filterControls) {
    setupFilterListeners(filterControls, historyContainer);
  }
});

/**
 * Loads detection history from API and displays it
 * @param {HTMLElement} container - Container element to display history
 */
async function loadDetectionHistory(container) {
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading your detection history...</p>
      </div>
    `;
    
    // Fetch history data
    const historyData = await DetectionApi.getHistory();
    
    // Handle empty history
    if (!historyData.results || historyData.results.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <h3>No Detection History</h3>
          <p>You haven't performed any eye disease detection scans yet.</p>
          <a href="/upload" class="btn btn-primary">Upload an Image</a>
        </div>
      `;
      return;
    }
    
    // Sort results by date (newest first)
    const sortedResults = historyData.results.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Create HTML for history items
    const historyItems = sortedResults.map(result => {
      // Format date
      const date = new Date(result.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Set status class based on prediction
      let statusClass = 'status-normal';
      if (result.prediction.toLowerCase() !== 'normal') {
        statusClass = 'status-warning';
      }
      
      return `
        <div class="history-item" data-prediction="${result.prediction.toLowerCase()}">
          <div class="history-image">
            <img src="${result.image_path}" alt="Eye scan from ${formattedDate}">
          </div>
          <div class="history-details">
            <div class="history-meta">
              <span class="history-date">${formattedDate}</span>
              <span class="history-prediction ${statusClass}">${result.prediction}</span>
            </div>
            <div class="history-confidence">
              <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${result.confidence * 100}%"></div>
              </div>
              <span class="confidence-text">Confidence: ${(result.confidence * 100).toFixed(1)}%</span>
            </div>
            <div class="history-actions">
              <a href="/results/${result.id}" class="btn btn-sm">View Details</a>
              <button class="btn btn-sm btn-outline share-btn" data-result-id="${result.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Update container with history items
    container.innerHTML = `
      <h2>Your Detection History</h2>
      <div class="history-items">
        ${historyItems}
      </div>
    `;
    
    // Add event listeners to share buttons
    container.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const resultId = btn.getAttribute('data-result-id');
        shareResult(resultId);
      });
    });
    
  } catch (error) {
    console.error('Error loading detection history:', error);
    container.innerHTML = `
      <div class="error-state">
        <h3>Error Loading History</h3>
        <p>There was a problem loading your detection history. Please try again later.</p>
        <button class="btn btn-primary retry-btn">Retry</button>
      </div>
    `;
    
    // Add retry button functionality
    container.querySelector('.retry-btn').addEventListener('click', () => {
      loadDetectionHistory(container);
    });
  }
}

/**
 * Set up event listeners for history filters
 * @param {HTMLElement} filterContainer - Container with filter controls
 * @param {HTMLElement} historyContainer - Container with history items
 */
function setupFilterListeners(filterContainer, historyContainer) {
  const filterButtons = filterContainer.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Get filter value
      const filterValue = button.getAttribute('data-filter');
      
      // Filter history items
      const historyItems = historyContainer.querySelectorAll('.history-item');
      
      historyItems.forEach(item => {
        if (filterValue === 'all') {
          item.style.display = 'flex';
        } else {
          const prediction = item.getAttribute('data-prediction');
          item.style.display = (prediction === filterValue) ? 'flex' : 'none';
        }
      });
      
      // Update empty state if no items visible
      const visibleItems = Array.from(historyItems).filter(item => 
        item.style.display !== 'none'
      );
      
      if (visibleItems.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
          <p>No results found for "${filterValue}" filter.</p>
        `;
        
        // Remove any existing no-results element
        const existingNoResults = historyContainer.querySelector('.no-results');
        if (existingNoResults) {
          existingNoResults.remove();
        }
        
        historyContainer.querySelector('.history-items').appendChild(noResults);
      } else {
        // Remove any existing no-results element
        const existingNoResults = historyContainer.querySelector('.no-results');
        if (existingNoResults) {
          existingNoResults.remove();
        }
      }
    });
  });
}

/**
 * Share a detection result
 * @param {string} resultId - ID of the result to share
 */
function shareResult(resultId) {
  // Create the URL to share
  const shareUrl = `${window.location.origin}/shared-result/${resultId}`;
  
  // Check if Web Share API is supported
  if (navigator.share) {
    navigator.share({
      title: 'EyeCare AI Detection Result',
      text: 'Check out my eye disease detection result from EyeCare AI!',
      url: shareUrl
    })
    .catch(error => {
      console.warn('Error sharing:', error);
      fallbackShare(shareUrl);
    });
  } else {
    fallbackShare(shareUrl);
  }
}

/**
 * Fallback sharing method (copy to clipboard)
 * @param {string} url - URL to share
 */
function fallbackShare(url) {
  // Create temporary input element
  const tempInput = document.createElement('input');
  tempInput.value = url;
  document.body.appendChild(tempInput);
  
  // Select and copy
  tempInput.select();
  document.execCommand('copy');
  
  // Remove temporary element
  document.body.removeChild(tempInput);
  
  // Show success message
  const messageContainer = document.createElement('div');
  messageContainer.className = 'copy-message';
  messageContainer.textContent = 'Link copied to clipboard!';
  
  document.body.appendChild(messageContainer);
  
  // Remove after animation
  setTimeout(() => {
    messageContainer.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(messageContainer);
    }, 300);
  }, 2000);
} 