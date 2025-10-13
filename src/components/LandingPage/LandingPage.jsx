import React, { useEffect, useRef } from 'react';
import './LandingPage.css';
import dashboardImage from '../../assets/dashboard-placeholder.png';
import ThemeToggleButton from '../../ThemeToggleButton';


const API_BASE_URL = 'http://localhost:8080'; 
    
const Header = () => {
    const headerRef = useRef(null);

    useEffect(() => {
        if (window.gsap && headerRef.current) {
            window.gsap.from(headerRef.current, {
                y: -100,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out'
            });
        }
    }, []);

    return (
        <header className="landing-header" ref={headerRef}>
            <div className="landing-container">
                <a href="/" className="logo">CarteiraPro</a>
                <nav className="main-nav">
                    <a href="#features">Recursos</a>
                    <a href="#">Preços</a>
                    <a href="#">Contato</a>
                </nav>
                <div className="flex items-center gap-4">
                    <ThemeToggleButton />
                    {/* NOVO BOTÃO DE LOGIN COM GOOGLE */}
                    <a href={`${API_BASE_URL}/oauth2/authorization/google`} className="cta-button secondary-cta">
                        Login com Google
                    </a>
                    <a href="/dashboard" className="cta-button primary-cta">
                        Acessar Carteira
                    </a>
                </div>
            </div>
        </header>
    );
};

const Hero = () => {
    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const buttonsRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        if (window.gsap && heroRef.current) {
            const tl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });

            tl.from(titleRef.current, {
                y: 50,
                opacity: 0,
                duration: 0.8
            })
            .from(subtitleRef.current, {
                y: 30,
                opacity: 0,
                duration: 0.6
            }, '-=0.4')
            .from(buttonsRef.current.children, {
                y: 20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1
            }, '-=0.3')
            .from(imageRef.current, {
                y: 40,
                opacity: 0,
                scale: 0.95,
                duration: 0.8
            }, '-=0.4');

            // Parallax effect no scroll
            if (window.ScrollTrigger) {
                window.gsap.to(imageRef.current, {
                    y: 50,
                    scrollTrigger: {
                        trigger: heroRef.current,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: 1
                    }
                });
            }
        }
    }, []);

    return (
        <section className="hero-section" ref={heroRef}>
            <div className="landing-container hero-grid-container">
                <div className="hero-left-column">
                    <h1 className="hero-title" ref={titleRef}>
                        Controle total<br/>dos seus<br/>
                        <span className="gradient-text">investimentos.</span>
                    </h1>
                </div>

                <div className="hero-right-column">
                    <p className="hero-subtitle" ref={subtitleRef}>
                        Visualize sua carteira, acompanhe a rentabilidade e tome decisões mais inteligentes. De Ações a Cripto, tudo em um só lugar.
                    </p>
                    <div className="hero-buttons" ref={buttonsRef}>
                        <a href="/dashboard" className="cta-button primary-cta large-cta">
                            Comece Agora &rarr;
                        </a>
                        <a href="#features" className="cta-button secondary-cta large-cta">
                            Saiba Mais
                        </a>
                    </div>
                    <div className="hero-image-wrapper" ref={imageRef}>
                        <img src={dashboardImage} alt="Dashboard da aplicação CarteiraPro" className="hero-image" />
                    </div>
                </div>
            </div>
        </section>
    );
};

const Features = () => {
    const featuresRef = useRef(null);
    const cardsRef = useRef([]);

    const featuresData = [
        { title: 'Portfólio Unificado', description: 'Adicione Ações (B3/EUA), ETFs, Criptomoedas e Renda Fixa para uma visão completa.' },
        { title: 'Visualização Inteligente', description: 'Gráficos interativos mostram sua alocação, ajudando a identificar riscos e oportunidades.' },
        { title: 'Acompanhamento Preciso', description: 'Atualize as cotações e veja a rentabilidade de cada ativo e da sua carteira consolidada.' }
    ];

    useEffect(() => {
        if (window.gsap && window.ScrollTrigger && featuresRef.current) {
            cardsRef.current.forEach((card, index) => {
                if (card) {
                    window.gsap.from(card, {
                        y: 60,
                        opacity: 0,
                        duration: 0.8,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 80%',
                            end: 'top 50%',
                            toggleActions: 'play none none reverse'
                        }
                    });

                    // Hover animation
                    card.addEventListener('mouseenter', () => {
                        window.gsap.to(card, {
                            y: -10,
                            scale: 1.03,
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                    });

                    card.addEventListener('mouseleave', () => {
                        window.gsap.to(card, {
                            y: 0,
                            scale: 1,
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                    });
                }
            });
        }
    }, []);

    return (
        <section id="features" className="features-section" ref={featuresRef}>
            <div className="landing-container text-center">
                <h2 className="section-title">Uma plataforma completa para o investidor</h2>
                <p className="section-subtitle">
                    Tudo o que você precisa para gerenciar seus investimentos com confiança.
                </p>
                <div className="features-grid">
                    {featuresData.map((feature, index) => (
                        <div
                            key={index}
                            ref={el => cardsRef.current[index] = el}
                            className="feature-card"
                        >
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CallToAction = () => {
    const ctaRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        if (window.gsap && window.ScrollTrigger && ctaRef.current) {
            window.gsap.from(ctaRef.current.children, {
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: ctaRef.current,
                    start: 'top 70%'
                }
            });

            // Pulse animation no botão
            if (buttonRef.current) {
                window.gsap.to(buttonRef.current, {
                    scale: 1.05,
                    duration: 1,
                    repeat: -1,
                    yoyo: true,
                    ease: 'power1.inOut'
                });
            }
        }
    }, []);

    return (
        <section className="cta-section" ref={ctaRef}>
            <div className="landing-container text-center">
                <h2 className="cta-title">Pronto para ter clareza sobre seus investimentos?</h2>
                <div style={{ marginTop: '2rem' }}>
                    <a
                        href="/dashboard"
                        className="cta-button cta-section-button"
                        ref={buttonRef}
                    >
                        Criar minha carteira gratuitamente
                    </a>
                </div>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="landing-footer">
        <div className="landing-container">
            <p>&copy; {new Date().getFullYear()} CarteiraPro. Todos os direitos reservados.</p>
        </div>
    </footer>
);

const LandingPage = () => {
    useEffect(() => {
        // Smooth scroll para âncoras
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }, []);

    return (
        <div className="landing-page">
            <Header />
            <main>
                <Hero />
                <Features />
                <CallToAction />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;