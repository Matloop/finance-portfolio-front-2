import React, { useState, useEffect, useCallback, useRef } from 'react';
import './app.css';
import Dashboard from './Dashboard/Dashboard.jsx';
import Informations from './Informations/Informations.jsx';
import Assets from './Assets/Assets.jsx';
import AddAssetModal from './AddAssetModal/AddAssetModal.jsx';
import InvestedValueModal from './InvestedValueModal/InvestedValueModal.jsx';
import { API_BASE_URL } from '../../apiConfig.js';
import ThemeToggleButton from '../ThemeToggleButton.jsx';

// --- Placeholder Modals ---
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
    // --- Estados de Modais ---
    const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
    const [isInvestedModalOpen, setInvestedModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    

    // --- Estados de Dados e Carregamento ---
    const [dashboardData, setDashboardData] = useState(null);
    const [evolutionData, setEvolutionData] = useState(null);
    const [investedDetails, setInvestedDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEvolutionLoading, setIsEvolutionLoading] = useState(true);
    const [isInvestedDetailsLoading, setIsInvestedDetailsLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);
    const [evolutionError, setEvolutionError] = useState(null);

    // --- Estados de Ações do Usuário ---
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    // --- Refs de Animação ---
    const headerRef = useRef(null);
    const mainRef = useRef(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsEvolutionLoading(true);
        setDashboardError(null);
        setEvolutionError(null);
        try {
            const [dashboardResult, evolutionResult] = await Promise.allSettled([
                fetch(`${API_BASE_URL}/api/portfolio/dashboard`),
                fetch(`${API_BASE_URL}/api/portfolio/evolution`) // Busca inicial sem filtros
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

    const fetchEvolutionDataWithFilters = useCallback(async (filters) => {
        setIsEvolutionLoading(true);
        setEvolutionError(null);
        
        const params = new URLSearchParams();
        // Nomes dos parâmetros ajustados para corresponder ao backend
        if (filters.category) params.append('category', filters.category);
        if (filters.assetType) params.append('assetType', filters.assetType);
        if (filters.ticker) params.append('ticker', filters.ticker);
        const queryString = params.toString();

        try {
            const response = await fetch(`${API_BASE_URL}/api/portfolio/evolution?${queryString}`);
            if (!response.ok) throw new Error('Falha ao carregar dados de evolução com filtros.');
            
            const data = await response.json();
            setEvolutionData(data.evolution);
        } catch (e) {
            setEvolutionError(e.message || 'Erro ao buscar dados de evolução.');
        } finally {
            setIsEvolutionLoading(false);
        }
    }, []);

    // --- Handlers de Ações ---
    const handleTransactionSuccess = () => setDataRefreshTrigger(prev => prev + 1);

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

    const handleEditAsset = (asset) => {
        setSelectedAsset(asset);
        setIsEditModalOpen(true);
    };

    const handleDeleteAsset = (asset) => {
        setSelectedAsset(asset);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedAsset) return;
        const identifier = selectedAsset.ticker || selectedAsset.name;
        try {
            const response = await fetch(`${API_BASE_URL}/api/portfolio/assets/${identifier}?assetType=${selectedAsset.assetType}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Falha ao excluir o ativo no servidor.');
            }
            handleTransactionSuccess();
        } catch (error) {
            console.error("Erro ao deletar ativo:", error);
            alert('Não foi possível excluir o ativo. Tente novamente.');
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedAsset(null);
        }
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

    // --- Hooks de Animação ---
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

     return (
        <div className="app-container">
            <header className="app-header" ref={headerRef}>
                {/* ... (conteúdo do header) ... */}
            </header>

            <main ref={mainRef}>
                {importResult && (
                    <div className={`import-summary animate-fade-in ${importResult.errorCount > 0 ? 'error' : 'success'}`}>
                        {/* ... */}
                    </div>
                )}

                <Informations 
                    summaryData={dashboardData?.summary}
                    isLoading={isLoading}
                    error={dashboardError}
                    onOpenInvestedDetails={handleOpenInvestedDetails}
                />
                
                <Dashboard 
                    summaryData={dashboardData?.summary}
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
            <AddAssetModal isOpen={isAddAssetModalOpen} onClose={() => setIsAddAssetModalOpen(false)} onTransactionSuccess={handleTransactionSuccess} />
            <InvestedValueModal isOpen={isInvestedModalOpen} onClose={() => setInvestedModalOpen(false)} detailsData={investedDetails} isLoading={isInvestedDetailsLoading} />
            <EditAssetModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} asset={selectedAsset} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} asset={selectedAsset} onConfirm={confirmDelete} />
        </div>
    );
}

export default DashboardApp;