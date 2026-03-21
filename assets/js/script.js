document.addEventListener('DOMContentLoaded', () => {
    console.log('Hey! If you are already here, check the source code ;)')

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
            const scrollY = window.scrollY;
            
            stars.forEach(star => {
                // Parallax effect based on star radius (smaller/further = slower)
                const parallaxOffset = scrollY * (star.radius * 0.3);
                let drawY = star.y - parallaxOffset;
                
                // Wrap visual position within canvas
                drawY = ((drawY % height) + height) % height;

                ctx.beginPath();
                ctx.arc(star.x, drawY, star.radius, 0, Math.PI * 2);
                ctx.fill();

                // Gradually return to base velocity
                star.vx += (star.baseVx - star.vx) * 0.05;
                star.vy += (star.baseVy - star.vy) * 0.05;

                star.x += star.vx / 100;
                star.y += star.vy / 100;

                // Wrap actual coordinates
                if (star.x < 0) star.x += width;
                if (star.x > width) star.x -= width;
                if (star.y < 0) star.y += height;
                if (star.y > height) star.y -= height;
            });

            requestAnimationFrame(animateStars);
        }

        window.addEventListener('click', (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const repelRadius = 100;
            const repelForce = 1500;
            const scrollY = window.scrollY;

            stars.forEach(star => {
                const parallaxOffset = scrollY * (star.radius * 0.3);
                let drawY = star.y - parallaxOffset;
                drawY = ((drawY % height) + height) % height;

                const dx = star.x - mouseX;
                const dy = drawY - mouseY;
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

    function initPostShareActions() {
        const pageTitle = document.querySelector('h1')?.textContent?.trim() || document.title || '';
        const pageUrl = window.location.href;
        const encodedUrl = encodeURIComponent(pageUrl);
        const encodedTitle = encodeURIComponent(pageTitle);

        const linkedin = document.getElementById('share-linkedin');
        if (linkedin) {
            linkedin.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`;
        }

        const whatsapp = document.getElementById('share-whatsapp');
        if (whatsapp) {
            whatsapp.href = `https://wa.me/?text=${encodeURIComponent(`${pageTitle} - ${pageUrl}`)}`;
        }

        const telegram = document.getElementById('share-telegram');
        if (telegram) {
            telegram.href = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        }

        const copyBtn = document.getElementById('copy-post-link');
        const status = document.getElementById('copy-post-link-status');

        if (copyBtn && status) {
            copyBtn.addEventListener('click', async () => {
                const target = pageUrl;
                let copied = false;

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    try {
                        await navigator.clipboard.writeText(target);
                        copied = true;
                    } catch (err) {
                        copied = false;
                    }
                }

                if (!copied) {
                    try {
                        const textarea = document.createElement('textarea');
                        textarea.value = target;
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        document.body.appendChild(textarea);
                        textarea.focus();
                        textarea.select();
                        copied = document.execCommand('copy');
                        document.body.removeChild(textarea);
                    } catch (err) {
                        copied = false;
                    }
                }

                if (copied) {
                    status.textContent = 'Copied!';
                    status.style.opacity = '1';
                    setTimeout(() => {
                        status.style.opacity = '0';
                    }, 1800);
                } else {
                    status.textContent = 'Could not copy';
                    status.style.opacity = '1';
                    setTimeout(() => {
                        status.style.opacity = '0';
                    }, 2500);
                }
            });
        }

        const linkedinBtn = document.getElementById('share-linkedin');
        if (linkedinBtn) {
            linkedinBtn.addEventListener('click', () => {
                const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`;
                window.open(linkedinUrl, '_blank', 'noopener');
            });
        }

        const whatsappBtn = document.getElementById('share-whatsapp');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${pageTitle} - ${pageUrl}`)}`;
                window.open(whatsappUrl, '_blank', 'noopener');
            });
        }

        const telegramBtn = document.getElementById('share-telegram');
        if (telegramBtn) {
            telegramBtn.addEventListener('click', () => {
                const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
                window.open(telegramUrl, '_blank', 'noopener');
            });
        }
    }

    initPostShareActions();
});
