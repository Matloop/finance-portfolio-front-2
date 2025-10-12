import React, { useState, useEffect, useCallback, useRef } from 'react';
import './app.css';
import Dashboard from './Dashboard/Dashboard.jsx';
import Informations from './Informations/Informations.jsx';
import Assets from './Assets/Assets.jsx';
import AddAssetModal from './AddAssetModal/AddAssetModal.jsx';
import InvestedValueModal from './InvestedValueModal/InvestedValueModal.jsx';
import ThemeToggleButton from '../ThemeToggleButton.jsx';

// Imports de autenticação
import { useAuth } from '../context/AuthContext.jsx';
import { fetchWithAuth } from '../../apiConfig.js';

// --- Modals (sem alterações) ---
const EditAssetModal = ({ isOpen, onClose, asset }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>×</button>
                <h2>Editar Ativo</h2>
                <p>Aqui você poderá ver e editar as transações do ativo:</p>
                <p><strong>{asset?.ticker || asset?.name}</strong></p>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ isOpen, onClose, asset, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>×</button>
                <h2>Confirmar Exclusão</h2>
                <p>Tem certeza que deseja excluir todas as transações do ativo <strong>{asset?.ticker || asset?.name}</strong>?</p>
                <p style={{ color: '#f87171' }}>Esta ação não pode ser desfeita.</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="refresh-button" onClick={onClose}>Cancelar</button>
                    <button className="add-button" style={{ backgroundColor: '#dc2626' }} onClick={onConfirm}>Excluir</button>
                </div>
            </div>
        </div>
    );
};


function DashboardApp() {
    // --- Lógica de Autenticação ---
    const { isAuthenticated, isLoading: isAuthLoading, login, logout } = useAuth();

    // --- Sua Lógica de Estado (sem alterações) ---
    const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
    const [isInvestedModalOpen, setInvestedModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [evolutionData, setEvolutionData] = useState(null);
    const [investedDetails, setInvestedDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEvolutionLoading, setIsEvolutionLoading] = useState(true);
    const [isInvestedDetailsLoading, setIsInvestedDetailsLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);
    const [evolutionError, setEvolutionError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);
    const headerRef = useRef(null);
    const mainRef = useRef(null);

    // --- Captura o token da URL ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
        if (tokenFromUrl) {
            login(tokenFromUrl);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [login]);

    // --- Funções de Fetch atualizadas para usar `fetchWithAuth` ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsEvolutionLoading(true);
        setDashboardError(null);
        setEvolutionError(null);
        try {
            const [dashboardResult, evolutionResult] = await Promise.allSettled([
                fetchWithAuth('/api/portfolio/dashboard'),
                fetchWithAuth('/api/portfolio/evolution')
            ]);
            if (dashboardResult.status === 'fulfilled' && dashboardResult.value.ok) setDashboardData(await dashboardResult.value.json()); else setDashboardError('Falha ao carregar dados do dashboard.');
            if (evolutionResult.status === 'fulfilled' && evolutionResult.value.ok) setEvolutionData((await evolutionResult.value.json()).evolution); else setEvolutionError('Falha ao carregar dados de evolução.');
        } catch (e) {
            setDashboardError("Ocorreu um erro inesperado.");
            setEvolutionError("Ocorreu um erro inesperado.");
        } finally {
            setIsLoading(false);
            setIsEvolutionLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // --- Gatilho para buscar dados apenas se autenticado ---
    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, dataRefreshTrigger, fetchData]);

    const fetchEvolutionDataWithFilters = useCallback(async (filters) => {
        setIsEvolutionLoading(true);
        setEvolutionError(null);
        const params = new URLSearchParams();
        if (filters.assetType) params.append('assetType', filters.assetType);
        if (filters.ticker) params.append('ticker', filters.ticker);
        try {
            const response = await fetchWithAuth(`/api/portfolio/evolution?${params.toString()}`);
            if (!response.ok) throw new Error('Falha ao carregar dados.');
            const data = await response.json();
            setEvolutionData(data.evolution);
        } catch (e) {
            setEvolutionError(e.message);
        } finally {
            setIsEvolutionLoading(false);
        }
    }, []);

    const handleOpenInvestedDetails = async () => {
        setIsInvestedDetailsLoading(true);
        setInvestedModalOpen(true);
        try {
            const response = await fetchWithAuth('/api/portfolio/invested-details');
            if (!response.ok) throw new Error('Falha ao buscar detalhes.');
            setInvestedDetails(await response.json());
        } catch (error) {
            console.error("Erro:", error);
            setInvestedDetails([]);
        } finally {
            setIsInvestedDetailsLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedAsset) return;
        const identifier = selectedAsset.ticker || selectedAsset.name;
        try {
            const response = await fetchWithAuth(`/api/portfolio/assets/${identifier}?assetType=${selectedAsset.assetType}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao excluir.');
            handleTransactionSuccess();
        } catch (error) {
            alert('Não foi possível excluir o ativo.');
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedAsset(null);
        }
    };
    
    const handleRefreshAssets = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetchWithAuth('/api/portfolio/refresh', { method: 'POST' });
            if (!response.ok) throw new Error('Falha ao solicitar atualização.');
            setTimeout(() => setDataRefreshTrigger(prev => prev + 1), 2000);
        } catch (err) {
            alert('Não foi possível atualizar as cotações.');
            setIsRefreshing(false);
        }
    };

    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsImporting(true);
        setImportResult(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetchWithAuth('/api/csv/import/transactions', { method: 'POST', body: formData });
            const result = await response.json();
            setImportResult(result);
            if (response.ok && result.successCount > 0) handleTransactionSuccess();
        } catch (err) {
            setImportResult({ successCount: 0, errorCount: 1, errors: ['Erro de rede.'] });
        } finally {
            setIsImporting(false);
            event.target.value = null;
        }
    };

    // --- Lógica de Proteção de Rota ---
    if (isAuthLoading) {
        return <div className="loading-fullscreen">Verificando autenticação...</div>;
    }
    if (!isAuthenticated) {
        // Redireciona via efeito para evitar warnings do React
        useEffect(() => { window.location.href = '/'; }, []);
        return <div className="loading-fullscreen">Acesso negado. Redirecionando...</div>;
    }

    // --- Handlers de UI (sem alterações) ---
    const handleTransactionSuccess = () => setDataRefreshTrigger(prev => prev + 1);
    const handleEditAsset = (asset) => { setSelectedAsset(asset); setIsEditModalOpen(true); };
    const handleDeleteAsset = (asset) => { setSelectedAsset(asset); setIsDeleteModalOpen(true); };
    const handleImportClick = () => { fileInputRef.current.click(); };

    // --- Renderização do Componente ---
    return (
    <div className="app-container">
        <header className="app-header" ref={headerRef}>
            <h1>Minha Carteira</h1>
            <div className="header-actions">
                <ThemeToggleButton />
                <button 
                    className="refresh-button transition-smooth" 
                    onClick={handleRefreshAssets} 
                    disabled={isRefreshing || isLoading || isEvolutionLoading || isImporting}
                >
                    {isRefreshing ? 'Atualizando...' : 'Atualizar Cotações'}
                </button>
                <a 
                    href="http://financeportfolio6-env.eba-6iawnbyh.us-east-1.elasticbeanstalk.com"
                    className="export-button transition-smooth" 
                    download="carteira_transacoes.csv"
                >
                    Exportar CSV
                </a>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileImport} 
                    accept=".csv" 
                    style={{ display: 'none' }} 
                />
                <button 
                    className="import-button transition-smooth" 
                    onClick={handleImportClick} 
                    disabled={isImporting}
                >
                    {isImporting ? 'Importando...' : 'Importar CSV'}
                </button>
                <button 
                    className="add-button transition-smooth" 
                    onClick={() => setIsAddAssetModalOpen(true)}
                >
                    Adicionar Ativo
                </button>
                <button className="logout-button" onClick={logout}>
                    Sair
                </button>
            </div>
        </header>

        <main ref={mainRef}>
            {importResult && (
                <div className={`import-summary animate-fade-in ${importResult.errorCount > 0 ? 'error' : 'success'}`}>
                    <p>Importação concluída: {importResult.successCount} sucesso(s), {importResult.errorCount} erro(s).</p>
                    {importResult.errors?.length > 0 && (
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
                onOpenInvestedDetails={handleOpenInvestedDetails}
            />
            <Dashboard 
                percentagesData={dashboardData?.percentages} 
                evolutionData={evolutionData}
                isPercentagesLoading={isLoading}
                isEvolutionLoading={isEvolutionLoading}
                evolutionError={evolutionError}
                onFilterChange={fetchEvolutionDataWithFilters}
                assetsData={dashboardData?.assets}
            />
            <Assets 
                assetsData={dashboardData?.assets} 
                isLoading={isLoading}
                error={dashboardError}
                onEditAsset={handleEditAsset}
                onDeleteAsset={handleDeleteAsset}
            />
        </main>

        {/* --- Seção de Modais --- */}
        <AddAssetModal
            isOpen={isAddAssetModalOpen}
            onClose={() => setIsAddAssetModalOpen(false)}
            onTransactionSuccess={handleTransactionSuccess}
        />
        <InvestedValueModal
            isOpen={isInvestedModalOpen}
            onClose={() => setInvestedModalOpen(false)}
            detailsData={investedDetails}
            isLoading={isInvestedDetailsLoading}
        />
        <EditAssetModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            asset={selectedAsset}
        />
        <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            asset={selectedAsset}
            onConfirm={confirmDelete}
        />
    </div>
);
}

export default DashboardApp;