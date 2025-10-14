document.addEventListener('DOMContentLoaded', function() {
  // Login form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Here we would normally validate and send to the server
      if (email && password) {
        loginForm.submit();
      } else {
        alert('Please enter both email and password');
      }
    });
  }
  
  // Register form submission
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Here we would normally validate and send to the server
      if (username && email && password) {
        registerForm.submit();
      } else {
        alert('Please fill in all required fields');
      }
    });
  }
  
  // Password strength meter
  const passwordInput = document.getElementById('password');
  const strengthIndicator = document.getElementById('strength-indicator');
  
  if (passwordInput && strengthIndicator) {
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      let strength = 0;
      
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      
      // Update the strength indicator
      switch(strength) {
        case 0:
        case 1:
          strengthIndicator.className = 'weak';
          strengthIndicator.textContent = 'Weak';
          break;
        case 2:
        case 3:
          strengthIndicator.className = 'medium';
          strengthIndicator.textContent = 'Medium';
          break;
        case 4:
          strengthIndicator.className = 'strong';
          strengthIndicator.textContent = 'Strong';
          break;
      }
    });
  }
});
