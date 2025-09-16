// --- components/DashboardApp.jsx ---
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './app.css';
import Dashboard from './Dashboard/Dashboard.jsx';
import Informations from './Informations/Informations.jsx';
import Assets from './Assets/Assets.jsx';
import AddAssetModal from './AddAssetModal/AddAssetModal.jsx';
import { API_BASE_URL } from '../../apiConfig.js';
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

    // --- Estados para a funcionalidade de Importação ---
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null); // Referência para o input de arquivo escondido

    // Função centralizada para buscar todos os dados
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

    const handleTransactionSuccess = () => {
        setDataRefreshTrigger(prev => prev + 1);
    };

    const handleRefreshAssets = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/portfolio/refresh`, { method: 'POST' });
            if (!response.ok) throw new Error('Falha ao solicitar a atualização no backend.');
            setTimeout(() => setDataRefreshTrigger(prev => prev + 1), 2000);
        } catch (err) {
            alert('Não foi possível atualizar as cotações. Tente novamente.');
            setIsRefreshing(false);
        }
    };

    // --- Lógica de Importação de CSV ---
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
            const response = await fetch(`${API_BASE_URL}/api/csv/import/transactions`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            setImportResult(result);

            if (response.ok && result.successCount > 0) {
                handleTransactionSuccess(); // Aciona o refresh dos dados do dashboard
            }

        } catch (err) {
            setImportResult({ successCount: 0, errorCount: 1, errors: ['Erro de rede ao enviar o arquivo.'] });
        } finally {
            setIsImporting(false);
            event.target.value = null; // Limpa o input
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
                        disabled={isRefreshing || isLoading || isEvolutionLoading || isImporting}
                    >
                        {isRefreshing ? 'Atualizando...' : 'Atualizar Cotações'}
                    </button>
                     <a
                        href={`${API_BASE_URL}/api/csv/export/transactions`}
                        className="export-button"
                        download="carteira_transacoes.csv"
                    >
                        Exportar CSV
                    </a>
                    {/* Input de arquivo escondido */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        accept=".csv"
                        style={{ display: 'none' }}
                    />
                    <button
                        className="import-button"
                        onClick={handleImportClick}
                        disabled={isImporting}
                    >
                        {isImporting ? 'Importando...' : 'Importar CSV'}
                    </button>
                    <button className="add-button" onClick={() => setIsModalOpen(true)}>
                        Adicionar Ativo
                    </button>
                </div>
            </header>
            <main>
                {/* Painel de Resultado da Importação */}
                {importResult && (
                    <div className={`import-summary ${importResult.errorCount > 0 ? 'error' : 'success'}`}>
                        <p>Importação concluída: {importResult.successCount} sucesso(s), {importResult.errorCount} erro(s).</p>
                        {importResult.errors && importResult.errors.length > 0 && (
                            <ul>
                                {importResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                {importResult.errors.length > 5 && <li>E mais {importResult.errors.length - 5} erros...</li>}
                            </ul>
                        )}
                    </div>
                )}

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