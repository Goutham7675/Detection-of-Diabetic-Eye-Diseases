document.addEventListener('DOMContentLoaded', () => {
    
    const animateNavigation = () => {
        const nav = document.querySelector('nav');
        if (!nav) return;

        nav.style.opacity = '0';
        nav.style.transform = 'translateY(-50px)';
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                nav.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                nav.style.opacity = '1';
                nav.style.transform = 'translateY(0)';
            }, 100);
        });

        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach((link, index) => {
            link.style.opacity = '0';
            setTimeout(() => {
                link.style.transition = 'opacity 0.5s ease';
                link.style.opacity = '1';
            }, 300 + index * 150);
        });

        const logo = document.querySelector('.logo');
        if (logo) logo.classList.add('rotate-in');
    };

    // Upload Form Handling
    const setupUploadForm = () => {
        const uploadForm = document.querySelector('#upload-form');
        if (!uploadForm) return;

        const fileInput = document.querySelector('#file-input');
        if (!fileInput) return;

        const previewContainer = document.createElement('div');
        previewContainer.id = 'image-preview';
        Object.assign(previewContainer.style, {
            marginTop: '15px',
            opacity: '0',
            transform: 'translateY(10px)'
        });
        fileInput.insertAdjacentElement('afterend', previewContainer);

        const progressSpan = document.querySelector('.progress span');
        const uploadIcon = document.querySelector('.upload-icon');
        if (uploadIcon) uploadIcon.classList.add('slide-in');

        fileInput.addEventListener('change', handleFileChange);
        uploadForm.addEventListener('submit', handleFormSubmit);

        // Animate form elements
        [fileInput, uploadForm.querySelector('.progress'), uploadForm.querySelector('input[type="submit"]')]
            .filter(Boolean)
            .forEach((el, index) => animateElement(el, 200 + index * 200));
    };

    const handleFileChange = (e) => {
        const fileInput = e.target;
        const previewContainer = document.getElementById('image-preview');
        const progressSpan = document.querySelector('.progress span');
        
        const file = fileInput.files[0];
        if (!file || !file.type.startsWith('image/')) {
            resetPreview(previewContainer, progressSpan);
            return;
        }

        const reader = new FileReader();
        reader.onloadstart = () => progressSpan.textContent = '10%';
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 90) + 10;
                progressSpan.textContent = `${percent}%`;
            }
        };
        reader.onload = (e) => {
            progressSpan.textContent = '100%';
            previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width: 100%; max-width: 300px; height: auto; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">`;
            animateElement(previewContainer);
        };
        reader.onerror = () => {
            alert('Error reading file');
            resetPreview(previewContainer, progressSpan);
        };
        reader.readAsDataURL(file);
    };

    const handleFormSubmit = (e) => {
        const fileInput = document.querySelector('#file-input');
        const file = fileInput.files[0];
        const submitButton = e.target.querySelector('input[type="submit"]');

        if (!validateFile(file)) {
            e.preventDefault();
            return;
        }

        submitButton.disabled = true;
        submitButton.value = 'Analyzing...';
        Object.assign(submitButton.style, {
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: '0.7',
            transform: 'scale(0.95)'
        });
        // Removed loadingOverlay handling
    };

    // Utility Functions
    const animateElement = (element, delay = 0) => {
        if (!element) return;
        element.style.opacity = '0';
        element.style.transform = element.classList.contains('content') ? 'translateY(30px)' : 'translateX(-20px)';
        setTimeout(() => {
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    };

    const resetPreview = (container, progress) => {
        container.style.opacity = '0';
        setTimeout(() => container.innerHTML = '', 500);
        progress.textContent = '0%';
    };

    const validateFile = (file) => {
        if (!file) {
            alert('Please select an eye image.');
            return false;
        }
        const validImageTypes = ['image/jpeg', 'image/png'];
        if (!validImageTypes.includes(file.type)) {
            alert('Please upload a JPEG or PNG image.');
            return false;
        }
        const maxSizeMB = 16;
        if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`File size must be less than ${maxSizeMB}MB.`);
            return false;
        }
        return true;
    };

    // Page-specific animations
    const pageAnimations = {
        'Analysis Results': () => {
            const content = document.querySelector('.content');
            animateElement(content, 100);
            document.querySelector('.result-container')?.classList.add('slide-in');
            document.querySelector('.result-icon')?.classList.add('rotate-in');
            document.querySelectorAll('.button-group .btn')
                .forEach((btn, index) => animateElement(btn, 600 + index * 200));
        },
        'Eye Disease Detection': () => {
            const content = document.querySelector('.content');
            content.style.transform = 'scale(0.9)';
            animateElement(content, 100);
            document.querySelectorAll('.example')
                .forEach((example, index) => animateElement(example, 300 + index * 300));
            animateElement(document.querySelector('.btn'), 900);
        },
        'Provide Feedback': () => {
            const form = document.querySelector('.feedback-form');
            if (form) {
                [form.querySelector('textarea'), form.querySelector('input[type="submit"]')]
                    .forEach((el, index) => animateElement(el, 200 + index * 200));
            }
        },
        'Login': setupAuthForm,
        'Register': setupAuthForm
    };

    const setupAuthForm = () => {
        const form = document.querySelector('.auth-form');
        if (form) {
            form.querySelectorAll('input')
                .forEach((input, index) => animateElement(input, 200 + index * 200));
        }
    };

    // Initialize
    animateNavigation();
    setupUploadForm();
    
    const pageTitle = document.querySelector('.content h1')?.textContent;
    if (pageTitle && pageAnimations[pageTitle]) {
        pageAnimations[pageTitle]();
    }

    // Resize Handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        document.querySelectorAll('.content, nav, .example, .btn, .upload-icon, .result-icon, .result-container, .feedback-form, .auth-form')
            .forEach(el => el.style.transition = 'none');
        resizeTimeout = setTimeout(() => {
            document.querySelectorAll('.content, nav, .example, .btn, .upload-icon, .result-icon, .result-container, .feedback-form, .auth-form')
                .forEach(el => el.style.transition = '');
        }, 100);
    });
});