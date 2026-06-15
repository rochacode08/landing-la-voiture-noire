// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial Hero Animations (Text Fade In)
    const heroTl = gsap.timeline();
    heroTl.to(".hero-title", {
        opacity: 1,
        y: 0,
        duration: 2,
        ease: "power3.out"
    })
    .to(".hero-subtitle", { 
        opacity: 1, 
        y: 0, 
        duration: 2, 
        ease: "power3.out" 
    }, "-=1.5")
    .to(".scroll-indicator", {
        opacity: 1,
        duration: 2,
        ease: "power2.inOut"
    }, "-=1.0");

    // 2. Vídeo: scroll-scrub no desktop (>= 1024px), loop automático no mobile/tablet
    const video = document.getElementById("hero-video");

    // O fade-out do texto do herói vale para os dois modos (desktop e mobile),
    // então fica FORA do matchMedia e é criado uma única vez.
    gsap.to([".hero-title", ".hero-subtitle", ".scroll-indicator"], {
        scrollTrigger: {
            trigger: ".video-section",
            start: "top top",
            end: "15% top", // some logo no início da rolagem
            scrub: true
        },
        opacity: 0,
        y: -50,
        ease: "none"
    });

    // gsap.matchMedia() ativa o bloco quando a media query bate e CHAMA o cleanup
    // (a função retornada) automaticamente quando ela deixa de bater. É isso que
    // resolve o redimensionamento de janela / rotação de tablet cruzando 1024px.
    const mm = gsap.matchMedia();

    // ---------- DESKTOP (>= 1024px): o scroll controla o tempo do vídeo ----------
    mm.add("(min-width: 1024px)", () => {
        // Carrega o vídeo apenas no desktop — no mobile o poster estático é exibido
        if (!video.src) {
            video.src = 'assets/lvn-hero.mp4';
            video.load();
        }

        // Garante que não ficou em loop/autoplay vindo do modo mobile
        video.loop = false;
        video.autoplay = false;
        video.pause();

        let targetTime = 0;
        let currentScrubTime = 0;
        let animFrameId = null;

        // duração real do vídeo, com fallback caso os metadados ainda não tenham chegado
        const getDuration = () =>
            (video.duration && isFinite(video.duration) && video.duration > 0) ? video.duration : 5;

        const smoothScrub = () => {
            if (video.readyState >= 1 && video.duration > 0) {
                // interpolação suave em direção ao tempo-alvo (efeito "scrub" cinematográfico)
                currentScrubTime += (targetTime - currentScrubTime) * 0.08;

                // evita travar o navegador esperando o 'seek' terminar antes do próximo frame
                if (!video.seeking && Math.abs(targetTime - video.currentTime) > 0.01) {
                    video.currentTime = currentScrubTime;
                }

                // diferença insignificante => para o loop de animação para economizar CPU
                if (Math.abs(targetTime - currentScrubTime) < 0.005 && !video.seeking) {
                    animFrameId = null;
                    return;
                }
            }
            animFrameId = requestAnimationFrame(smoothScrub);
        };

        const startScrub = () => {
            if (!animFrameId) animFrameId = requestAnimationFrame(smoothScrub);
        };

        // GSAP só calcula o progresso (0 a 1) da seção; quem move o vídeo é o RAF acima
        const st = ScrollTrigger.create({
            trigger: ".video-section",
            start: "top top",
            end: "bottom bottom",
            pin: ".video-section > div",
            pinSpacing: false,
            onUpdate: (self) => {
                targetTime = self.progress * getDuration();
                startScrub();
            }
        });

        // Desliga o RAF quando a seção sai da viewport (economia de processamento)
        let videoObserver = null;
        const videoSection = document.querySelector(".video-section");
        if ('IntersectionObserver' in window && videoSection) {
            videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        startScrub();
                    } else if (animFrameId) {
                        cancelAnimationFrame(animFrameId);
                        animFrameId = null;
                    }
                });
            }, { threshold: 0.01 });
            videoObserver.observe(videoSection);
        }

        // CLEANUP: roda sozinho quando a tela fica < 1024px
        return () => {
            st.kill();
            if (animFrameId) cancelAnimationFrame(animFrameId);
            if (videoObserver) videoObserver.disconnect();
        };
    });

    // ---------- MOBILE / TABLET (< 1024px): vídeo em loop automático ----------
    mm.add("(max-width: 1023px)", () => {
        video.loop = true;
        video.muted = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');

        const tryPlay = () => {
            const p = video.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
        };

        // tenta tocar agora e também quando os metadados chegarem (autoplay é "frágil" no mobile)
        tryPlay();
        video.addEventListener('loadedmetadata', tryPlay);

        // CLEANUP: roda sozinho quando a tela fica >= 1024px
        return () => {
            video.removeEventListener('loadedmetadata', tryPlay);
            video.loop = false;
            video.pause();
        };
    });

    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 3. Reveal Animations for Content Sections (Luxury Fade & Slide up)
    const revealElements = document.querySelectorAll("[data-reveal]");
    
    if (!isReducedMotion) {
        revealElements.forEach((el) => {
            gsap.fromTo(el, 
                { opacity: 0, y: 80 },
                {
                    opacity: 1, y: 0, duration: 1.8, ease: "expo.out",
                    scrollTrigger: {
                        trigger: el, start: "top 85%", toggleActions: "play none none reverse"
                    }
                }
            );
        });
    }

    // -- Navbar Glassmorphism --
    const nav = document.getElementById("navbar");
    ScrollTrigger.create({
        start: "100px top",
        onEnter: () => {
            nav.classList.remove("bg-transparent", "py-6");
            nav.classList.add("backdrop-blur-md", "bg-bugatti-black/85", "border-b", "border-bugatti-accent/20", "py-4");
        },
        onLeaveBack: () => {
            nav.classList.remove("backdrop-blur-md", "bg-bugatti-black/85", "border-b", "border-bugatti-accent/20", "py-4");
            nav.classList.add("bg-transparent", "py-6");
        }
    });

    // -- SplitText Stagger (Phase 2) --
    const splitTitles = document.querySelectorAll("h2:not(#exclusivity-title)");
    if (!isReducedMotion && window.innerWidth >= 768) {
        splitTitles.forEach((title) => {
            const text = new SplitType(title, { types: 'words, chars' });
            gsap.from(text.chars, {
                scrollTrigger: { trigger: title, start: "top 85%", toggleActions: "play none none reverse" },
                y: 50, opacity: 0, duration: 1.2, stagger: 0.03, ease: "power3.out"
            });
        });
    }

    // -- Performance Grid: Fast Stagger Entrance + Counters --
    const perfGrid = document.getElementById('perf-grid');
    if (perfGrid && !isReducedMotion) {
        const perfCards = perfGrid.querySelectorAll('.spec-card');
        gsap.set(perfCards, { opacity: 0, y: 22 });

        const perfTl = gsap.timeline({ scrollTrigger: { trigger: perfGrid, start: 'top 80%', toggleActions: 'play none none none' } });
        perfTl.to(perfCards, { opacity: 1, y: 0, duration: 0.55, stagger: 0.18, ease: 'power2.out' });
        perfTl.add(() => {
            perfGrid.querySelectorAll('[data-counter]').forEach(counter => {
                const targetValue = parseFloat(counter.getAttribute('data-counter'));
                const isDecimal = targetValue % 1 !== 0;
                gsap.to(counter, {
                    innerHTML: targetValue,
                    duration: 2.0,
                    ease: 'expo.out',
                    snap: { innerHTML: isDecimal ? 0.1 : 1 },
                    onUpdate: function() {
                        if (isDecimal) counter.innerHTML = Number(counter.innerHTML).toFixed(1).replace('.', ',');
                        else counter.innerHTML = Number(counter.innerHTML).toLocaleString('pt-BR');
                    }
                });
            });
        }, '+=0.1');
    }

    // -- Image Reveal (Phase 3) --
    const imageReveals = document.querySelectorAll(".image-reveal");
    if (!isReducedMotion) {
        imageReveals.forEach((container) => {
            const img = container.querySelector("img");
            gsap.set(container, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" });
            gsap.fromTo(img, { opacity: 0 }, {
                opacity: 1, duration: 0.6, ease: "power2.out",
                scrollTrigger: { trigger: container, start: "top 95%", toggleActions: "play none none reverse" }
            });
        });
    }

    // -- Car Approach Animation --
    const carApproach = document.getElementById("car-approach");
    if (carApproach && !isReducedMotion) {
        gsap.fromTo(carApproach,
            { opacity: 0, scale: 0.08, filter: "brightness(0)" },
            {
                opacity: 0.9, scale: 1, filter: "brightness(1)",
                duration: 2.4,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: carApproach,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    // -- Preloader (Phase 4) --
    setTimeout(() => {
        const preloader = document.getElementById("preloader");
        if (preloader) {
            preloader.style.transition = 'opacity 0.7s ease';
            preloader.style.opacity = '0';
            setTimeout(() => preloader.remove(), 700);
            ScrollTrigger.refresh();
        }
    }, 1500);

    // -- W16 Audio Player (Phase 4) --
    const audioBtn = document.getElementById("w16-audio-btn");
    const audio = document.getElementById("w16-audio");
    if (audioBtn && audio) {
        audioBtn.addEventListener("click", () => {
            const playIcon = audioBtn.querySelector(".play-icon");
            const pauseIcon = audioBtn.querySelector(".pause-icon");
            const waveform = audioBtn.querySelector(".waveform-container");
            
            if (audio.paused) {
                audio.play();
                playIcon.classList.add("hidden");
                pauseIcon.classList.remove("hidden");
                waveform.classList.add("playing");
            } else {
                audio.pause();
                playIcon.classList.remove("hidden");
                pauseIcon.classList.add("hidden");
                waveform.classList.remove("playing");
            }
        });
    }
    // -- Text Scramble / Decoder Effect (Phase 5) --
    const scrambleElements = document.querySelectorAll('[data-scramble]');
    if (!isReducedMotion) {
        scrambleElements.forEach((el) => {
            const originalText = el.textContent;
            gsap.to(el, {
                scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
                duration: 1.5,
                text: { value: originalText, scrambleText: { text: originalText, chars: "01X!<>-_\\/[]{}—=+*^?#________", speed: 0.5 } },
                ease: "none"
            });
        });
    }

    // -- Back to Top --
    const backToTopBtn  = document.getElementById("back-to-top");
    const backToTopRing = document.getElementById("back-to-top-ring");
    const circumference = 125.66;
    let pageTotalHeight = document.documentElement.scrollHeight - window.innerHeight;

    window.addEventListener("resize", () => {
        pageTotalHeight = document.documentElement.scrollHeight - window.innerHeight;
    }, { passive: true });

    window.addEventListener("scroll", () => {
        const scrolled = window.scrollY;
        const total    = pageTotalHeight > 0 ? pageTotalHeight : 1;
        const progress = scrolled / total;

        // Arco de progresso
        backToTopRing.style.strokeDashoffset = circumference * (1 - progress);

        // Mostrar/esconder botão
        if (scrolled > 400) {
            backToTopBtn.classList.remove("opacity-0", "translate-y-4", "pointer-events-none");
            backToTopBtn.classList.add("opacity-100", "translate-y-0");
        } else {
            backToTopBtn.classList.add("opacity-0", "translate-y-4", "pointer-events-none");
            backToTopBtn.classList.remove("opacity-100", "translate-y-0");
        }
    }, { passive: true });

    backToTopBtn?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // -- Before/After Comparison Slider --
    const compareSlider = document.getElementById("compare-slider");
    const compareLeft   = document.getElementById("compare-left");
    const compareHandle = document.getElementById("compare-handle");

    if (compareSlider) {
        let dragging = false;
        const labelAtlantic = document.getElementById('label-atlantic');
        const labelLvn      = document.getElementById('label-lvn');

        const setPosition = (x) => {
            const rect = compareSlider.getBoundingClientRect();
            let pct = (x - rect.left) / rect.width;
            pct = Math.min(Math.max(pct, 0.02), 0.98);
            compareLeft.style.clipPath = `inset(0 ${(1 - pct) * 100}% 0 0)`;
            compareHandle.style.left   = `${pct * 100}%`;

            // Atlantic (esquerda) aparece conforme slider vai para a direita
            labelAtlantic.style.opacity = Math.min(Math.max((pct - 0.08) / 0.15, 0), 1);
            // LVN (direita) aparece conforme slider vai para a esquerda
            labelLvn.style.opacity      = Math.min(Math.max((0.92 - pct) / 0.15, 0), 1);
        };

        compareSlider.addEventListener("pointerdown", (e) => {
            dragging = true;
            setPosition(e.clientX);
            compareSlider.setPointerCapture(e.pointerId);
        });
        compareSlider.addEventListener("pointermove", (e) => {
            if (dragging) setPosition(e.clientX);
        });
        compareSlider.addEventListener("pointerup", (e) => {
            dragging = false;
            compareSlider.releasePointerCapture(e.pointerId);
        });
        compareSlider.addEventListener("pointercancel", () => {
            dragging = false;
        });
    }

    // -- Lazy load Sketchfab Iframe --
    const sketchfabIframe = document.getElementById("sketchfab-iframe");
    const sketchfabOverlay = document.getElementById("sketchfab-overlay");

    if (sketchfabOverlay && sketchfabIframe) {
        sketchfabOverlay.addEventListener("click", () => {
            sketchfabOverlay.classList.add("opacity-0", "pointer-events-none");
            sketchfabIframe.style.pointerEvents = "auto";
        });
    }

    if (sketchfabIframe) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const dataSrc = sketchfabIframe.getAttribute("data-src");
                    if (dataSrc) {
                        sketchfabIframe.src = dataSrc;
                    }
                    obs.unobserve(sketchfabIframe);
                }
            });
        }, { rootMargin: "200px" });
        observer.observe(sketchfabIframe);
    }

    // -- Footer Year --
    const footerYear = document.getElementById("footer-year");
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    // -- Mobile Menu --
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const hamburgerLines = document.querySelectorAll(".hamburger-line");
    let menuOpen = false;

    mobileMenuBtn?.addEventListener("click", () => {
        menuOpen = !menuOpen;
        mobileMenuBtn.setAttribute("aria-expanded", menuOpen);
        if (menuOpen) {
            document.body.style.overflow = "hidden";
            mobileMenu.classList.remove("opacity-0", "pointer-events-none");
            mobileMenu.classList.add("opacity-100");
            hamburgerLines[0].style.transform = "translateY(6px) rotate(45deg)";
            hamburgerLines[1].style.opacity = "0";
            hamburgerLines[2].style.transform = "translateY(-6px) rotate(-45deg)";
            hamburgerLines[2].style.width = "24px";
        } else {
            document.body.style.overflow = "";
            mobileMenu.classList.add("opacity-0", "pointer-events-none");
            mobileMenu.classList.remove("opacity-100");
            hamburgerLines[0].style.transform = "";
            hamburgerLines[1].style.opacity = "";
            hamburgerLines[2].style.transform = "";
            hamburgerLines[2].style.width = "";
        }
    });

    document.querySelectorAll(".mobile-nav-link").forEach(link => {
        link.addEventListener("click", () => {
            menuOpen = false;
            mobileMenuBtn?.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
            mobileMenu.classList.add("opacity-0", "pointer-events-none");
            mobileMenu.classList.remove("opacity-100");
            hamburgerLines[0].style.transform = "";
            hamburgerLines[1].style.opacity = "";
            hamburgerLines[2].style.transform = "";
            hamburgerLines[2].style.width = "";
        });
    });

    // -- Parallax on Large Images --
    const escapamentoImg = document.querySelector('#heart .image-reveal img');
    if (escapamentoImg) {
        ScrollTrigger.create({
            trigger: escapamentoImg.closest('.image-reveal'),
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
            onUpdate: self => {
                escapamentoImg.style.objectPosition = `center ${30 + self.progress * 40}%`;
            }
        });
    }

    const lendaImg = document.querySelector('#icon .image-reveal img');
    if (lendaImg) {
        gsap.fromTo(lendaImg,
            { scale: 1.04 },
            {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                    trigger: lendaImg.closest('.image-reveal'),
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5
                }
            }
        );
    }

    // -- 3D Tilt on Spec Cards --
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    if (!isTouchDevice) {
        document.querySelectorAll('.spec-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease, transform 0.1s ease';
            });
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateX = ((y / rect.height) - 0.5) * -10;
                const rotateY = ((x / rect.width)  - 0.5) *  10;
                card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease, transform 0.6s ease';
                card.style.transform = '';
            });
        });
    }

    // -- Word Reveal: Exclusivity Title --
    const exclusivityTitle = document.getElementById('exclusivity-title');
    if (exclusivityTitle && !isReducedMotion) {
        const words = exclusivityTitle.querySelectorAll('.reveal-word');
        gsap.from(words, {
            scrollTrigger: { trigger: exclusivityTitle, start: "top 80%", toggleActions: "play none none reverse" },
            y: "110%", opacity: 0, duration: 1.4, stagger: 0.28, ease: "expo.out"
        });
    }

    // -- Interior Features Stagger --
    const interiorFeatures = document.querySelectorAll('.interior-feature');
    if (interiorFeatures.length && !isReducedMotion) {
        gsap.from(interiorFeatures, {
            scrollTrigger: { trigger: '#interior-features', start: 'top 80%', toggleActions: 'play none none reverse' },
            y: 50, opacity: 0, duration: 1.0, stagger: 0.18, ease: 'power3.out'
        });
    }

    // -- Active Nav + Section Dots --
    const navSections = [
        { id: 'icon',        href: '#icon' },
        { id: 'design',      href: '#design' },
        { id: 'performance', href: '#performance' },
        { id: 'exclusivity', href: '#exclusivity' },
    ];
    const allNavLinks  = document.querySelectorAll('.nav-link');
    const sectionDotsNav = document.getElementById('section-dots');
    const allDots      = document.querySelectorAll('.section-dot');

    const setActiveNav = (href) => {
        allNavLinks.forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[href="${href}"]`)?.classList.add('active');
    };
    const setActiveDot = (id) => {
        allDots.forEach(d => d.classList.remove('active'));
        document.querySelector(`.section-dot[data-dot="${id}"]`)?.classList.add('active');
    };

    navSections.forEach(({ id, href }, index) => {
        const section = document.getElementById(id);
        if (!section) return;
        ScrollTrigger.create({
            trigger: section,
            start: "top center",
            end: "bottom center",
            onEnter: () => {
                setActiveNav(href);
                setActiveDot(id);
                if (sectionDotsNav) sectionDotsNav.style.opacity = '1';
            },
            onEnterBack: () => {
                setActiveNav(href);
                setActiveDot(id);
                if (sectionDotsNav) sectionDotsNav.style.opacity = '1';
            },
            onLeaveBack: () => {
                if (index === 0) {
                    allNavLinks.forEach(l => l.classList.remove('active'));
                    allDots.forEach(d => d.classList.remove('active'));
                    if (sectionDotsNav) sectionDotsNav.style.opacity = '0';
                }
            },
            onLeave: () => {
                if (index === navSections.length - 1) {
                    allNavLinks.forEach(l => l.classList.remove('active'));
                    allDots.forEach(d => d.classList.remove('active'));
                    if (sectionDotsNav) sectionDotsNav.style.opacity = '0';
                }
            }
        });
    });

    // Forçar recálculo do ScrollTrigger para que o vídeo não quebre com as novas seções
    window.addEventListener("load", () => {
        ScrollTrigger.refresh();
    });
});