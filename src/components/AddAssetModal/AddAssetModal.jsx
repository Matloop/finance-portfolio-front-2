import React, { useState, useEffect, useMemo } from 'react'; // <-- CORREÇÃO APLICADA AQUI
import './addAssetModal.css';
import { API_BASE_URL } from '../../../apiConfig';
import useDebounce from '../../hooks/useDebounce';

// Função auxiliar para nomes amigáveis na UI
const getFriendlyName = (key) => {
    const nameMap = {
        'CRYPTO': 'Criptomoeda',
        'STOCK_B3': 'Ação (Brasil)',
        'ETF_B3': 'ETF (Brasil)',
        'STOCK_US': 'Ação (EUA)',
        'ETF_US': 'ETF (EUA)',
        'Ações': 'Ações',
        'ETFs': 'ETFs',
        'Renda Fixa': 'Renda Fixa',
        'Criptomoedas': 'Criptomoedas'
    };
    return nameMap[key] || key;
};

const AddAssetModal = ({ isOpen, onClose, onTransactionSuccess }) => {
    // --- Estados para as abas e UI geral ---
    const [activeTab, setActiveTab] = useState('buy');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Estados para os campos de Compra/Venda ---
    const [assetType, setAssetType] = useState('CRYPTO');
    const [market, setMarket] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('CRYPTO');
    const [ticker, setTicker] = useState('');
    const [quantity, setQuantity] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [transactionDate, setTransactionDate] = useState('');
    const [otherCosts, setOtherCosts] = useState('');

    // --- Estados para a busca interativa ---
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 400);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);

    // --- Estados para os campos de Renda Fixa ---
    const [fiName, setFiName] = useState('');
    const [fiIndexer, setFiIndexer] = useState('CDI');
    const [fiIndexerRate, setFiIndexerRate] = useState('');
    const [fiPurchaseDate, setFiPurchaseDate] = useState('');
    const [fiInitialValue, setFiInitialValue] = useState('');
    const [fiMaturityDate, setFiMaturityDate] = useState('');
    const [fiDailyLiquidity, setFiDailyLiquidity] = useState(false);
    
    // --- LÓGICA PARA DETERMINAR A MOEDA ---
    const currencyIndicator = useMemo(() => {
        return selectedCategory.includes('_US') ? '(USD)' : '(BRL)';
    }, [selectedCategory]);

    // Efeito para buscar na API quando o termo de busca (com debounce) mudar
    useEffect(() => {
        if (debouncedSearchTerm && debouncedSearchTerm.length > 1) {
            setIsSearching(true);
            fetch(`${API_BASE_URL}/api/market-data/search/${debouncedSearchTerm}`)
                .then(res => res.ok ? res.json() : [])
                .then(data => setSearchResults(data))
                .catch(err => console.error("Erro na busca de ativos:", err))
                .finally(() => setIsSearching(false));
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchTerm]);

    if (!isOpen) return null;

    // Limpa todos os estados e fecha o modal
    const handleClose = () => {
        setActiveTab('buy');
        setAssetType('CRYPTO');
        setMarket(null);
        setSelectedCategory('CRYPTO');
        setTicker('');
        setQuantity('');
        setPricePerUnit('');
        setTransactionDate('');
        setOtherCosts('');
        setFiName('');
        setFiIndexer('CDI');
        setFiIndexerRate('');
        setFiPurchaseDate('');
        setFiInitialValue('');
        setFiMaturityDate('');
        setFiDailyLiquidity(false);
        setError(null);
        setSearchTerm('');
        setSearchResults([]);
        onClose();
    };

    // Lida com a mudança manual do tipo de ativo no <select>
    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);
        if (value.includes('_')) {
            const [type, mkt] = value.split('_');
            setAssetType(type);
            setMarket(mkt);
        } else {
            setAssetType(value);
            setMarket(null);
        }
        setSearchTerm('');
        setSearchResults([]);
        setTicker('');
        setPricePerUnit('');
    };

    // Busca o preço atual do ativo selecionado
    const fetchAssetPrice = async (selectedTicker) => {
        if (!selectedTicker) return;
        setIsFetchingPrice(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/market-data/price/${selectedTicker}`);
            if (response.ok) {
                const price = await response.json();
                setPricePerUnit(price);
            } else {
                console.warn(`Preço não encontrado para: ${selectedTicker}`);
            }
        } catch (error) {
            console.error("Erro ao buscar preço do ativo:", error);
        } finally {
            setIsFetchingPrice(false);
        }
    };

    // Chamada quando o usuário clica em um resultado da busca
    const handleSelectSearchResult = (result) => {
        setTicker(result.ticker);
        setAssetType(result.assetType);
        setMarket(result.market);
        
        const categoryValue = result.market ? `${result.assetType}_${result.market}` : result.assetType;
        setSelectedCategory(categoryValue);
        
        setSearchTerm('');
        setSearchResults([]);
        
        fetchAssetPrice(result.ticker);
    };

    // Lida com a submissão do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (activeTab === 'buy' || activeTab === 'sell') {
                if (!ticker || !quantity || !pricePerUnit || !transactionDate) {
                    setError('Por favor, preencha todos os campos obrigatórios.');
                    setIsLoading(false); return;
                }
                const payload = {
                    ticker: ticker.toUpperCase(), assetType, market,
                    transactionType: activeTab.toUpperCase(),
                    quantity: parseFloat(quantity), pricePerUnit: parseFloat(pricePerUnit),
                    transactionDate, otherCosts: otherCosts ? parseFloat(otherCosts) : null,
                };
                const response = await fetch(`${API_BASE_URL}/api/transactions`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Ocorreu um erro ao salvar a transação.');
                }
            } else if (activeTab === 'fixedIncome') {
                if (!fiName || !fiPurchaseDate || !fiInitialValue || !fiMaturityDate) {
                    setError('Por favor, preencha todos os campos obrigatórios para Renda Fixa.');
                    setIsLoading(false); return;
                }
                const fixedIncomePayload = {
                    name: fiName,
                    investedAmount: parseFloat(fiInitialValue),
                    investmentDate: fiPurchaseDate,
                    isDailyLiquid: fiDailyLiquidity,
                    maturityDate: fiMaturityDate,
                    indexType: fiIndexer,
                    contractedRate: fiIndexerRate ? parseFloat(fiIndexerRate) : null,
                };
                const response = await fetch(`${API_BASE_URL}/api/fixed-income`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fixedIncomePayload),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Ocorreu um erro ao salvar o ativo de renda fixa.');
                }
            }
            onTransactionSuccess();
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={handleClose}>×</button>
                <h2>Adicionar Transação</h2>
                <div className="tabs">
                    <button className={`tab-button ${activeTab === 'buy' ? 'active' : ''}`} onClick={() => setActiveTab('buy')}>Compra</button>
                    <button className={`tab-button ${activeTab === 'sell' ? 'active' : ''}`} onClick={() => setActiveTab('sell')}>Venda</button>
                    <button className={`tab-button ${activeTab === 'fixedIncome' ? 'active' : ''}`} onClick={() => setActiveTab('fixedIncome')}>Renda Fixa</button>
                </div>

                <form className="asset-form" onSubmit={handleSubmit}>
                    {(activeTab === 'buy' || activeTab === 'sell') && (
                        <>
                            <div className="form-group">
                                <label htmlFor="asset-type">Tipo de Ativo (Filtro)</label>
                                <select id="asset-type" value={selectedCategory} onChange={handleCategoryChange}>
                                    <option value="CRYPTO">Criptomoeda</option>
                                    <option value="STOCK_B3">Ação (Brasil)</option>
                                    <option value="ETF_B3">ETF (Brasil)</option>
                                    <option value="STOCK_US">Ação (EUA)</option>
                                    <option value="ETF_US">ETF (EUA)</option>
                                </select>
                            </div>
                            
                            <div className="form-group search-group">
                                <label htmlFor="asset-search">Buscar Ativo (Ticker ou Nome)</label>
                                <input 
                                    type="text" id="asset-search"
                                    placeholder="Comece a digitar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoComplete="off"
                                />
                                {isSearching && <div className="spinner"></div>}
                                {searchResults.length > 0 && (
                                    <ul className="search-results-list">
                                        {searchResults.map((result, index) => (
                                            <li key={`${result.ticker}-${index}`} onClick={() => handleSelectSearchResult(result)}>
                                                <span className="result-ticker">{result.ticker}</span>
                                                <span className="result-name">{result.name}</span>
                                                <span className="result-market">{result.market || result.assetType}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label>Ticker Selecionado</label>
                                <input type="text" value={ticker} readOnly disabled />
                            </div>

                            <div className="form-group">
                                <label htmlFor="asset-date">Data da Transação</label>
                                <input type="date" id="asset-date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="asset-quantity">Quantidade</label>
                                <input type="number" id="asset-quantity" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="asset-price">
                                    Preço Unitário
                                    <span className="currency-indicator">{currencyIndicator}</span>
                                </label>
                                <div className="price-input-wrapper">
                                    <input type="number" id="asset-price" step="any" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} disabled={isFetchingPrice} />
                                    {isFetchingPrice && <div className="spinner"></div>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="asset-costs">Outros Custos (Opcional)</label>
                                <input type="number" id="asset-costs" step="any" placeholder="Taxas de corretagem, etc." value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} />
                            </div>
                        </>
                    )}

                    {activeTab === 'fixedIncome' && (
                       <>
                           {/* ... (campos de Renda Fixa) ... */}
                       </>
                    )}

                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="submit-button" disabled={isLoading || isSearching || isFetchingPrice}>
                        {isLoading ? 'Adicionando...' : 'Adicionar Transação'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddAssetModal;