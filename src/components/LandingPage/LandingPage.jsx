
import React from 'react';
import './LandingPage.css';
import dashboardImage from '../../assets/dashboard-placeholder.png';
import ThemeToggleButton from '../../ThemeToggleButton';

const Header = () => (
    <header className="landing-header animate-fade-in">
        <div className="landing-container">
            <a href="/" className="logo">CarteiraPro</a>
            <nav className="main-nav">
                <a href="#features">Recursos</a>
                <a href="#">Preços</a>
                <a href="#">Contato</a>
            </nav>
            <div className="flex items-center gap-4"> {/* Wrapper para botões */}
                <ThemeToggleButton /> {/* <-- ADICIONE O BOTÃO AQUI */}
                <a href="/dashboard" className="cta-button primary-cta">
                    Acessar Carteira
                </a>
            </div>
            <a href="/dashboard" className="cta-button primary-cta">
                Acessar Carteira
            </a>
        </div>
    </header>
);

const Hero = () => (
    <section className="hero-section">
        {/* MODIFICAÇÃO: Trocamos 'text-center' por 'hero-grid-container' */}
        <div className="landing-container hero-grid-container">
            
            {/* Coluna Esquerda (adicionamos este div) */}
            <div className="hero-left-column">
                <h1 className="hero-title animate-fade-in-up">
                    Controle total<br/>dos seus<br/>
                    <span className="gradient-text">investimentos.</span>
                </h1>
            </div>

            {/* Coluna Direita (adicionamos este div) */}
            <div className="hero-right-column">
                <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    Visualize sua carteira, acompanhe a rentabilidade e tome decisões mais inteligentes. De Ações a Cripto, tudo em um só lugar.
                </p>
                <div className="hero-buttons animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <a href="/dashboard" className="cta-button primary-cta large-cta">
                        Comece Agora &rarr;
                    </a>
                    <a href="#features" className="cta-button secondary-cta large-cta">
                        Saiba Mais
                    </a>
                </div>
                {/* A imagem foi movida para a coluna direita */}
                <div className="hero-image-wrapper animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <img src={dashboardImage} alt="Dashboard da aplicação CarteiraPro" className="hero-image" />
                </div>
            </div>

        </div>
    </section>
);

const Features = () => {
    const featuresData = [
      { title: 'Portfólio Unificado', description: 'Adicione Ações (B3/EUA), ETFs, Criptomoedas e Renda Fixa para uma visão completa.' },
      { title: 'Visualização Inteligente', description: 'Gráficos interativos mostram sua alocação, ajudando a identificar riscos e oportunidades.' },
      { title: 'Acompanhamento Preciso', description: 'Atualize as cotações e veja a rentabilidade de cada ativo e da sua carteira consolidada.' }
    ];

    return (
        <section id="features" className="features-section">
            <div className="landing-container text-center">
                <h2 className="section-title">Uma plataforma completa para o investidor</h2>
                <p className="section-subtitle">
                    Tudo o que você precisa para gerenciar seus investimentos com confiança.
                </p>
                <div className="features-grid">
                    {featuresData.map((feature, index) => (
                        <div 
                            key={index}
                            className="feature-card animate-fade-in-up transition-transform duration-300 hover:scale-105 hover:-translate-y-1"
                            style={{ animationDelay: `${index * 200}ms` }}
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

const CallToAction = () => (
    <section className="cta-section">
        <div className="landing-container text-center">
            <h2 className="cta-title">Pronto para ter clareza sobre seus investimentos?</h2>
            <div style={{ marginTop: '2rem' }}>
                <a href="/dashboard" className="cta-button cta-section-button">
                    Criar minha carteira gratuitamente
                </a>
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer className="landing-footer">
        <div className="landing-container">
            <p>&copy; {new Date().getFullYear()} CarteiraPro. Todos os direitos reservados.</p>
        </div>
    </footer>
);


const LandingPage = () => {
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