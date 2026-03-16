document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const scrollElements = document.querySelectorAll('.fade-in-on-scroll');
    scrollElements.forEach(el => observer.observe(el));

    // Starry Background Animation
    const canvas = document.getElementById('stars-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let stars = [];

        function initCanvas() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            createStars();
        }

        function createStars() {
            stars = [];
            const numStars = Math.floor(width * height / 3000); // Density of stars
            for (let i = 0; i < numStars; i++) {
                const baseVx = Math.floor(Math.random() * 50) - 25;
                const baseVy = Math.floor(Math.random() * 50) - 25;
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1.5 + 0.5,
                    vx: baseVx,
                    vy: baseVy,
                    baseVx: baseVx,
                    baseVy: baseVy
                });
            }
        }

        function animateStars() {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();

                // Gradually return to base velocity
                star.vx += (star.baseVx - star.vx) * 0.05;
                star.vy += (star.baseVy - star.vy) * 0.05;

                star.x += star.vx / 100;
                star.y += star.vy / 100;

                // Wrap around edges
                if (star.x < 0) star.x = width;
                if (star.x > width) star.x = 0;
                if (star.y < 0) star.y = height;
                if (star.y > height) star.y = 0;
            });

            requestAnimationFrame(animateStars);
        }

        window.addEventListener('click', (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const repelRadius = 100;
            const repelForce = 1500;

            stars.forEach(star => {
                const dx = star.x - mouseX;
                const dy = star.y - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < repelRadius && distance > 0) {
                    const force = (repelRadius - distance) / repelRadius;
                    star.vx += (dx / distance) * force * repelForce;
                    star.vy += (dy / distance) * force * repelForce;
                }
            });
        });

        window.addEventListener('resize', initCanvas);
        initCanvas();
        animateStars();
    }
});
