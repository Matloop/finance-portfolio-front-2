// src/components/DashboardApp/DashboardApp.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './app.css';
import Dashboard from './Dashboard/Dashboard.jsx';
import Informations from './Informations/Informations.jsx';
import Assets from './Assets/Assets.jsx';
import AddAssetModal from './AddAssetModal/AddAssetModal.jsx';
import InvestedValueModal from './InvestedValueModal/InvestedValueModal.jsx';
import { API_BASE_URL } from '../../apiConfig.js';
import ThemeToggleButton from '../ThemeToggleButton.jsx';

function DashboardApp() {
    // Estados do App
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
    
    // Estados de Dados
    const [dashboardData, setDashboardData] = useState(null);
    const [evolutionData, setEvolutionData] = useState(null);
    
    // Estados de Carregamento e Erro
    const [isLoading, setIsLoading] = useState(true);
    const [isEvolutionLoading, setIsEvolutionLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState(null);
    const [evolutionError, setEvolutionError] = useState(null);

    // Estados de Importação
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    // Refs de Animação
    const headerRef = useRef(null);
    const mainRef = useRef(null);
    
    // 2. ESTADOS PARA O NOVO MODAL (já estavam no seu código, o que é bom)
    const [isInvestedModalOpen, setInvestedModalOpen] = useState(false);
    const [investedDetails, setInvestedDetails] = useState([]);
    const [isInvestedDetailsLoading, setIsInvestedDetailsLoading] = useState(false);

    // Função para buscar dados principais
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsEvolutionLoading(true);
        setDashboardError(null);
        setEvolutionError(null);
        
        try {
            const [dashboardResult, evolutionResult] = await Promise.allSettled([
                fetch(`${API_BASE_URL}/api/portfolio/dashboard`),
                fetch(`${API_BASE_URL}/api/portfolio/evolution`)
            ]);

            if (dashboardResult.status === 'fulfilled' && dashboardResult.value.ok) {
                setDashboardData(await dashboardResult.value.json());
            } else {
                setDashboardError(dashboardResult.reason?.message || 'Falha ao carregar dados do dashboard.');
            }
            
            if (evolutionResult.status === 'fulfilled' && evolutionResult.value.ok) {
                const data = await evolutionResult.value.json();
                setEvolutionData(data.evolution);
            } else {
                setEvolutionError(evolutionResult.reason?.message || 'Falha ao carregar dados de evolução.');
            }
        } catch (e) {
            const generalError = "Ocorreu um erro inesperado. Verifique sua conexão.";
            setDashboardError(generalError);
            setEvolutionError(generalError);
        } finally {
            setIsLoading(false);
            setIsEvolutionLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, dataRefreshTrigger]);

    // 3. FUNÇÃO PARA ABRIR O MODAL E BUSCAR OS DADOS (já estava no seu código)
    const handleOpenInvestedDetails = async () => {
        setIsInvestedDetailsLoading(true);
        setInvestedModalOpen(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/portfolio/invested-details`);
            if (!response.ok) throw new Error('Falha ao buscar detalhes.');
            const data = await response.json();
            setInvestedDetails(data);
        } catch (error) {
            console.error("Erro ao buscar detalhes do valor investido:", error);
            setInvestedDetails([]);
        } finally {
            setIsInvestedDetailsLoading(false);
        }
    };

    // ... (Hooks de animação e outros handlers permanecem iguais)
    useEffect(() => {
        if (window.gsap && headerRef.current && mainRef.current) {
            window.gsap.from(headerRef.current, { y: -50, opacity: 0, duration: 0.6, ease: 'power3.out' });
            window.gsap.from(mainRef.current.children, { y: 30, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out', delay: 0.2 });
        }
    }, []);

    useEffect(() => {
        if (!isLoading && !isEvolutionLoading && window.gsap && mainRef.current) {
            window.gsap.from(mainRef.current.children, { scale: 0.95, opacity: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(1.2)', clearProps: 'all' });
        }
    }, [isLoading, isEvolutionLoading, dataRefreshTrigger]);

    const handleTransactionSuccess = () => {
        setDataRefreshTrigger(prev => prev + 1);
    };

    const handleRefreshAssets = async () => {
        setIsRefreshing(true);
        const refreshBtn = document.querySelector('.refresh-button');
        if (window.gsap && refreshBtn) {
            window.gsap.to(refreshBtn, { rotation: 360, duration: 1, ease: 'power2.inOut' });
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/portfolio/refresh`, { method: 'POST' });
            if (!response.ok) throw new Error('Falha ao solicitar a atualização no backend.');
            setTimeout(() => setDataRefreshTrigger(prev => prev + 1), 2000);
        } catch (err) {
            alert('Não foi possível atualizar as cotações. Tente novamente.');
            setIsRefreshing(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsImporting(true);
        setImportResult(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${API_BASE_URL}/api/csv/import/transactions`, { method: 'POST', body: formData });
            const result = await response.json();
            setImportResult(result);
            if (response.ok && result.successCount > 0) {
                handleTransactionSuccess();
            }
        } catch (err) {
            setImportResult({ successCount: 0, errorCount: 1, errors: ['Erro de rede ao enviar o arquivo.'] });
        } finally {
            setIsImporting(false);
            event.target.value = null;
        }
    };
    
    return (
        <div className="app-container">
            <header className="app-header" ref={headerRef}>
                <h1>Minha Carteira</h1>
                <div className="header-actions">
                    <ThemeToggleButton />
                    <button className="refresh-button transition-smooth" onClick={handleRefreshAssets} disabled={isRefreshing || isLoading || isEvolutionLoading || isImporting}>
                        {isRefreshing ? 'Atualizando...' : 'Atualizar Cotações'}
                    </button>
                    <a href={`${API_BASE_URL}/api/csv/export/transactions`} className="export-button transition-smooth" download="carteira_transacoes.csv">
                        Exportar CSV
                    </a>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" style={{ display: 'none' }} />
                    <button className="import-button transition-smooth" onClick={handleImportClick} disabled={isImporting}>
                        {isImporting ? 'Importando...' : 'Importar CSV'}
                    </button>
                    <button className="add-button transition-smooth" onClick={() => setIsModalOpen(true)}>
                        Adicionar Ativo
                    </button>
                </div>
            </header>
            <main ref={mainRef}>
                {importResult && (
                    <div className={`import-summary animate-fade-in ${importResult.errorCount > 0 ? 'error' : 'success'}`}>
                        <p>Importação concluída: {importResult.successCount} sucesso(s), {importResult.errorCount} erro(s).</p>
                        {importResult.errors && importResult.errors.length > 0 && (
                            <ul>
                                {importResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                {importResult.errors.length > 5 && <li>E mais {importResult.errors.length - 5} erros...</li>}
                            </ul>
                        )}
                    </div>
                )}

                {/* 4. CORREÇÃO CRÍTICA: Passar a função `handleOpenInvestedDetails` como prop */}
                <Informations 
                    summaryData={dashboardData?.summary}
                    isLoading={isLoading}
                    error={dashboardError}
                    onOpenInvestedDetails={handleOpenInvestedDetails}
                />
                
                <Dashboard 
                    percentagesData={dashboardData?.percentages} 
                    evolutionData={evolutionData}
                    isPercentagesLoading={isLoading}
                    isEvolutionLoading={isEvolutionLoading}
                    evolutionError={evolutionError}
                />
                <Assets 
                    assetsData={dashboardData?.assets} 
                    isLoading={isLoading}
                    error={dashboardError}
                />
            </main>

            <AddAssetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTransactionSuccess={handleTransactionSuccess}
            />

            {/* 5. CORREÇÃO CRÍTICA: Renderizar o novo modal e passar as props corretas */}
            <InvestedValueModal
                isOpen={isInvestedModalOpen}
                onClose={() => setInvestedModalOpen(false)}
                detailsData={investedDetails}
                isLoading={isInvestedDetailsLoading}
            />
        </div>
    );
}

export default DashboardApp;