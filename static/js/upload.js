// File Upload Handling
document.addEventListener('DOMContentLoaded', function() {
    // File upload elements
    const fileInput = document.getElementById('file-input');
    const fileDropArea = document.getElementById('file-drop-area');
    const filePreview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const analyzeButton = document.getElementById('analyze-button');
    const analyzingOverlay = document.getElementById('analyzing-overlay');
    const errorMessage = document.getElementById('error-message');
    const uploadForm = document.getElementById('upload-form');

    // Check if we're on the upload page
    if (fileInput && fileDropArea && analyzeButton) {
        // Handle file selection via input
        fileInput.addEventListener('change', function(e) {
            handleFileSelection(e.target.files);
        });

        // Handle drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            fileDropArea.classList.add('highlight');
        }

        function unhighlight() {
            fileDropArea.classList.remove('highlight');
        }

        fileDropArea.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFileSelection(files);
        });

        // Handle click on drop area to trigger file input
        fileDropArea.addEventListener('click', function() {
            fileInput.click();
        });

        // Handle form submission
        if (uploadForm) {
            uploadForm.addEventListener('submit', function(e) {
                // Show loading overlay
                if (analyzingOverlay) {
                    analyzingOverlay.style.display = 'flex';
                }
                
                // Disable the button during upload
                if (analyzeButton) {
                    analyzeButton.disabled = true;
                    analyzeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg> Analyzing...';
                }
            });
        }
    }

    // Function to handle file selection
    function handleFileSelection(files) {
        if (files && files.length > 0) {
            const file = files[0];
            
            // Check file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                showError('Invalid file type. Please upload JPG, JPEG or PNG files.');
                return;
            }
            
            // Check file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                showError('File is too large. Maximum size allowed is 5MB.');
                return;
            }
            
            // Hide the drop area and show the preview
            if (fileDropArea) fileDropArea.style.display = 'none';
            if (filePreview) {
                filePreview.style.display = 'flex';
                if (fileName) fileName.textContent = file.name;
                if (fileSize) fileSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            }
            
            // Enable the analyze button
            if (analyzeButton) {
                analyzeButton.disabled = false;
            }
            
            // Hide any previous error messages
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        }
    }
    
    // Function to show error messages
    function showError(message) {
        if (errorMessage) {
            const errorContent = errorMessage.querySelector('p');
            if (errorContent) {
                errorContent.textContent = message;
            }
            errorMessage.style.display = 'flex';
            
            // Hide after 5 seconds
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
    }
}); 