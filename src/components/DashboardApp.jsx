// --- components/DashboardApp.jsx ---
import React, { useState, useEffect, useCallback } from 'react';
import './app.css'; // Estilos globais para o layout do dashboard
import Dashboard from './Dashboard/Dashboard.jsx';
import Informations from './Informations/Informations.jsx';
import Assets from './Assets/Assets.jsx';
import AddAssetModal from './AddAssetModal/AddAssetModal.jsx';
import { API_BASE_URL } from '../../apiConfig.js'; // Ajuste o caminho se necessário (ex: ../../apiConfig)
import ThemeToggleButton from '../ThemeToggleButton.jsx';

function DashboardApp() {
    // --- Estados para Componentes e UI ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

    // --- Estados de Dados ---
    const [dashboardData, setDashboardData] = useState(null);
    const [evolutionData, setEvolutionData] = useState(null);
    
    // --- Estados de Carregamento (Loading) ---
    const [isLoading, setIsLoading] = useState(true);
    const [isEvolutionLoading, setIsEvolutionLoading] = useState(true);
    
    // --- Estados de Erro ---
    const [dashboardError, setDashboardError] = useState(null);
    const [evolutionError, setEvolutionError] = useState(null);

    // Função centralizada para buscar todos os dados necessários para o dashboard.
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsEvolutionLoading(true);
        setDashboardError(null);
        setEvolutionError(null);
        
        try {
            // Executa as duas buscas em paralelo para mais performance.
            // Promise.allSettled garante que ambas terminem, mesmo que uma falhe.
            const [dashboardResult, evolutionResult] = await Promise.allSettled([
                fetch(`${API_BASE_URL}/api/portfolio/dashboard`),
                fetch(`${API_BASE_URL}/api/portfolio/evolution`)
            ]);

            // Processa o resultado do Dashboard (Informations, Pie Chart, Assets)
            if (dashboardResult.status === 'fulfilled' && dashboardResult.value.ok) {
                const data = await dashboardResult.value.json();
                setDashboardData(data);
            } else {
                const errorMsg = dashboardResult.reason?.message || 'Falha ao carregar dados do dashboard.';
                setDashboardError(errorMsg);
                console.error("Erro no Dashboard:", errorMsg);
            }
            
            // Processa o resultado da Evolução do Patrimônio (Bar Chart)
            if (evolutionResult.status === 'fulfilled' && evolutionResult.value.ok) {
                const data = await evolutionResult.value.json();
                setEvolutionData(data.evolution);
            } else {
                const errorMsg = evolutionResult.reason?.message || 'Falha ao carregar dados de evolução.';
                setEvolutionError(errorMsg);
                console.error("Erro na Evolução:", errorMsg);
            }

        } catch (e) {
            // Este catch é para erros inesperados na lógica do fetch em si
            const generalError = "Ocorreu um erro inesperado. Verifique sua conexão.";
            setDashboardError(generalError);
            setEvolutionError(generalError);
            console.error("Erro geral no fetchData:", e);
        } finally {
            // Finaliza todos os loadings
            setIsLoading(false);
            setIsEvolutionLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Efeito para buscar os dados na montagem do componente e quando o gatilho de refresh for acionado.
    useEffect(() => {
        fetchData();
    }, [fetchData, dataRefreshTrigger]);

    // Callback para o modal, para atualizar os dados após uma nova transação.
    const handleTransactionSuccess = () => {
        setDataRefreshTrigger(prev => prev + 1);
    };

    // Função para o botão "Atualizar Cotações".
    const handleRefreshAssets = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/portfolio/refresh`, { method: 'POST' });
            if (!response.ok) throw new Error('Falha ao solicitar a atualização no backend.');
            
            // Espera um tempo para o backend processar e então aciona o refetch de todos os dados.
            setTimeout(() => {
                setDataRefreshTrigger(prev => prev + 1);
            }, 2000);

        } catch (err) {
            console.error('Erro ao atualizar cotações:', err);
            alert('Não foi possível atualizar as cotações. Tente novamente.');
            setIsRefreshing(false);
        }
    };
    
    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Minha Carteira</h1>
                <div className="header-actions">
                    <ThemeToggleButton />
                    <button
                        className="refresh-button"
                        onClick={handleRefreshAssets}
                        disabled={isRefreshing || isLoading || isEvolutionLoading}
                    >
                        {isRefreshing ? 'Atualizando...' : 'Atualizar Cotações'}
                    </button>
                    <button className="add-button" onClick={() => setIsModalOpen(true)}>
                        Adicionar Ativo
                    </button>
                </div>
            </header>
            <main>
                <Informations 
                    summaryData={dashboardData?.summary} 
                    isLoading={isLoading}
                    error={dashboardError}
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
        </div>
    );
}

export default DashboardApp;