// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'light';
    } else {
        // Default to system preference
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlElement.setAttribute('data-theme', prefersDarkScheme ? 'dark' : 'light');
        themeToggle.checked = !prefersDarkScheme;
    }
    
    // Toggle theme when the toggle is clicked
    themeToggle.addEventListener('change', function() {
        const newTheme = this.checked ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}); 