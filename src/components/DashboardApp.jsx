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

    // --- LÓGICA DE CONTROLE DE SCROLL DO BODY ---
    useEffect(() => {
        const isAnyModalOpen = isAddAssetModalOpen || isInvestedModalOpen || isEditModalOpen || isDeleteModalOpen;
        if (isAnyModalOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        // Cleanup function para garantir que a classe seja removida se o componente for desmontado
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isAddAssetModalOpen, isInvestedModalOpen, isEditModalOpen, isDeleteModalOpen]);


    // =========================================================
    // MODIFICAÇÃO CHAVE: Separação do fetch de dados
    // =========================================================

    const fetchEvolutionDataWithFilters = useCallback(async (filters) => {
        setIsEvolutionLoading(true);
        setEvolutionError(null);
        
        const params = new URLSearchParams();
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

    const fetchEvolutionData = useCallback(async () => {
        // Recarrega a evolução sem filtros para o estado padrão
        const initialFilters = { category: null, assetType: null, ticker: null };
        await fetchEvolutionDataWithFilters(initialFilters);
    }, [fetchEvolutionDataWithFilters]);


    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setDashboardError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/portfolio/dashboard`);
            if (response.ok) {
                setDashboardData(await response.json());
            } else {
                setDashboardError('Falha ao carregar dados do dashboard.');
            }
        } catch (e) {
            setDashboardError("Ocorreu um erro inesperado. Verifique sua conexão.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // ---------------------------------------------------------
    // NOVO useEffect para carregar dados na montagem
    // ---------------------------------------------------------
    useEffect(() => {
        // Carrega o Dashboard e os Ativos
        fetchDashboardData();
        // Carrega a Evolução APENAS UMA VEZ para evitar lentidão
        fetchEvolutionData();
    }, [fetchDashboardData, fetchEvolutionData]);


    // ---------------------------------------------------------
    // NOVO useEffect que reage ao dataRefreshTrigger
    // ---------------------------------------------------------
    useEffect(() => {
        if (dataRefreshTrigger > 0) {
            // Recarrega APENAS o Dashboard (mais leve)
            fetchDashboardData();
            // A evolução não é recarregada para evitar as chamadas históricas
        }
    }, [dataRefreshTrigger, fetchDashboardData]);

    
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
            
            // Dá tempo para o backend iniciar a atualização (lenta) e então recarrega os dados do dashboard
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
        if (window.gsap && headerRef.current) {
            window.gsap.from(headerRef.current, { y: -50, opacity: 0, duration: 0.6, ease: 'power3.out' });
        }
    }, []);

    useEffect(() => {
        // Animação de entrada dos componentes principais
        if (!isLoading && !isEvolutionLoading && window.gsap && mainRef.current) {
            if (!mainRef.current.classList.contains('has-animated')) {
                mainRef.current.classList.add('has-animated');
                window.gsap.from(mainRef.current.children, {
                    y: 30,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.15,
                    ease: 'power3.out',
                    delay: 0.2
                });
            }
        }
    }, [isLoading, isEvolutionLoading]);

    useEffect(() => {
        // Animação de refresh
        if (dataRefreshTrigger > 0 && !isLoading && !isEvolutionLoading && window.gsap && mainRef.current) {
            window.gsap.from(mainRef.current.children, {
                scale: 0.95,
                opacity: 0,
                duration: 0.4,
                stagger: 0.1,
                ease: 'back.out(1.2)',
                clearProps: 'all'
            });
        }
    }, [dataRefreshTrigger]);


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
                    <button className="add-button transition-smooth" onClick={() => setIsAddAssetModalOpen(true)}>
                        Adicionar Ativo
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