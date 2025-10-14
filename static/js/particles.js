// Particles animation
document.addEventListener('DOMContentLoaded', function() {
  const particles = document.getElementById('particles');
  const heroParticles = document.getElementById('hero-particles');
  function createParticles(container, count) {
    if (!container) return;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      // Random position
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      
      // Random size
      const size = Math.random() * 5 + 1;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      
      // Random animation duration
      particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
      
      // Random animation delay
      particle.style.animationDelay = (Math.random() * 5) + 's';
      
      container.appendChild(particle);
    }
  }
  
  if (particles) {
    createParticles(particles, 30);
  }

  if (heroParticles) {
    createParticles(heroParticles, 50);
  }
});
