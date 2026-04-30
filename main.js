document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Scroll animation for sections
    const fadeElements = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.05,
        rootMargin: "0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    fadeElements.forEach(element => {
        appearOnScroll.observe(element);
    });

    // Fallback: si después de 800ms algún elemento sigue invisible, lo muestra
    setTimeout(() => {
        fadeElements.forEach(el => el.classList.add('visible'));
    }, 800);

    // Navbar scroll shadow
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 40);
        }, { passive: true });
    }

    // Hero Carousel
    const slides = document.querySelectorAll('.carousel-slide');
    const dots   = document.querySelectorAll('.carousel-dot');
    if (slides.length > 1) {
        let current = 0;
        let timer;

        function goTo(idx) {
            slides[current].classList.remove('active');
            dots[current]?.classList.remove('active');
            current = (idx + slides.length) % slides.length;
            slides[current].classList.add('active');
            dots[current]?.classList.add('active');
        }

        function next() { goTo(current + 1); }
        function prev() { goTo(current - 1); }

        function startTimer() {
            clearInterval(timer);
            timer = setInterval(next, 5000);
        }

        document.querySelector('.carousel-next')?.addEventListener('click', () => { next(); startTimer(); });
        document.querySelector('.carousel-prev')?.addEventListener('click', () => { prev(); startTimer(); });
        dots.forEach(dot => {
            dot.addEventListener('click', () => { goTo(+dot.dataset.idx); startTimer(); });
        });

        startTimer();
    }
});
