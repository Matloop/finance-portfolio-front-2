import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './Dashboard/Dashboard';
import Informations from './Informations/Informations';
import Assets from './Assets/Assets';
import AddAssetModal from './AddAssetModal/AddAssetModal';
import { API_BASE_URL } from '../../apiConfig'; // Certifique-se de que este arquivo existe

// Importe o CSS que antes era do App.js.
// Se você o tinha em src/App.css, mova-o para src/components/app.css ou ajuste o caminho.
import './app.css';

function DashboardApp() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/portfolio/dashboard`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setDashboardData(data);
        } catch (e) {
            setError(e.message);
            console.error("Falha ao buscar dados do dashboard:", e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData, dataRefreshTrigger]);

    const handleTransactionSuccess = () => {
        console.log("Transação bem-sucedida! Atualizando os dados...");
        setDataRefreshTrigger(prev => prev + 1);
    };

    const handleRefreshAssets = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/portfolio/refresh`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Falha ao solicitar a atualização no backend.');
            }
            console.log('Backend notificado. Dando um tempo para processar e buscando novos dados...');

            setTimeout(() => {
                setDataRefreshTrigger(prev => prev + 1);
            }, 2000);

        } catch (err) {
            console.error('Erro ao atualizar cotações:', err);
            alert('Não foi possível atualizar as cotações. Tente novamente.');
            setIsRefreshing(false);
        }
    };

    if (error && !dashboardData) {
        return <div className="error-message-full-page">Erro ao carregar os dados da carteira: {error}</div>;
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Minha Carteira</h1>
                <div className="header-actions">
                    <button
                        className="refresh-button"
                        onClick={handleRefreshAssets}
                        disabled={isRefreshing || isLoading}
                    >
                        {isRefreshing ? 'Atualizando...' : 'Atualizar Cotações'}
                    </button>
                    <button className="add-button" onClick={() => setIsModalOpen(true)}>
                        Adicionar Ativo
                    </button>
                </div>
            </header>
            <main>
                <Informations summaryData={dashboardData?.summary} isLoading={isLoading} />
                <Dashboard percentagesData={dashboardData?.percentages} isLoading={isLoading} />
                <Assets assetsData={dashboardData?.assets} isLoading={isLoading} />
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