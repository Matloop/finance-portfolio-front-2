// --- components/AddAssetModal/AddAssetModal.js ---
import React, { useState } from 'react';
import './addAssetModal.css';
import { API_BASE_URL } from '../../../apiConfig';

const AddAssetModal = ({ isOpen, onClose, onTransactionSuccess }) => {
    const [activeTab, setActiveTab] = useState('buy');

    // --- Estados para os campos de Cripto/Ações/ETFs ---
    const [assetType, setAssetType] = useState('CRYPTO');
    const [market, setMarket] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('CRYPTO');

    const [ticker, setTicker] = useState('');
    const [quantity, setQuantity] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [transactionDate, setTransactionDate] = useState('');
    const [otherCosts, setOtherCosts] = useState('');

    // --- Estados para os campos de Renda Fixa ---
    const [fiName, setFiName] = useState('');
    const [fiIndexer, setFiIndexer] = useState('CDI');
    const [fiIndexerRate, setFiIndexerRate] = useState('');
    const [fiPurchaseDate, setFiPurchaseDate] = useState('');
    const [fiInitialValue, setFiInitialValue] = useState('');
    const [fiMaturityDate, setFiMaturityDate] = useState('');
    const [fiDailyLiquidity, setFiDailyLiquidity] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

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
    };

    const handleClose = () => {
        // Limpa todos os estados ao fechar
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
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (activeTab === 'buy' || activeTab === 'sell') {
                if (!ticker || !quantity || !pricePerUnit || !transactionDate) {
                    setError('Por favor, preencha todos os campos obrigatórios.');
                    setIsLoading(false);
                    return;
                }

                const payload = {
                    ticker: ticker.toUpperCase(),
                    assetType,
                    market: market,
                    transactionType: activeTab.toUpperCase(),
                    quantity: parseFloat(quantity),
                    pricePerUnit: parseFloat(pricePerUnit),
                    transactionDate,
                    otherCosts: otherCosts ? parseFloat(otherCosts) : null,
                };

                const response = await fetch(`${API_BASE_URL}/api/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao processar a resposta do servidor.' }));
                    throw new Error(errorData.message || `Erro: ${response.statusText}`);
                }

            } else if (activeTab === 'fixedIncome') {
                // CORREÇÃO 1: Validação de 'fiIndexerRate' foi removida
                if (!fiName || !fiPurchaseDate || !fiInitialValue || !fiMaturityDate) {
                    setError('Por favor, preencha todos os campos obrigatórios para Renda Fixa.');
                    setIsLoading(false); 
                    return;
                }

                // CORREÇÃO 2: Trata o valor opcional. Se estiver vazio, envia null.
                const contractedRateValue = fiIndexerRate ? parseFloat(fiIndexerRate) : null;

                const fixedIncomePayload = {
                    name: fiName, 
                    investedAmount: parseFloat(fiInitialValue), 
                    investmentDate: fiPurchaseDate,
                    isDailyLiquid: fiDailyLiquidity, 
                    maturityDate: fiMaturityDate, 
                    indexType: fiIndexer,
                    contractedRate: contractedRateValue, // Envia o valor tratado
                };
                
                const response = await fetch(`${API_BASE_URL}/api/fixed-income`, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fixedIncomePayload),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
                    throw new Error(errorData.message || `Erro: ${response.statusText}`);
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
                                <label htmlFor="asset-type">Tipo de Ativo</label>
                                <select id="asset-type" value={selectedCategory} onChange={handleCategoryChange}>
                                    <option value="CRYPTO">Criptomoeda</option>
                                    <option value="STOCK_B3">Ação (Brasil)</option>
                                    <option value="ETF_B3">ETF (Brasil)</option>
                                    <option value="STOCK_US">Ação (EUA)</option>
                                    <option value="ETF_US">ETF (EUA)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="asset-ticker">Ativo / Ticker</label>
                                <input type="text" id="asset-ticker" placeholder="Ex: BTC, PETR4, IVVB11, AAPL, SPY" value={ticker} onChange={(e) => setTicker(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="asset-date">Data da {activeTab === 'buy' ? 'Compra' : 'Venda'}</label>
                                <input type="date" id="asset-date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="asset-quantity">Quantidade</label>
                                <input type="number" id="asset-quantity" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="asset-price">Preço Unitário (R$ ou USD)</label>
                                <input type="number" id="asset-price" step="any" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="asset-costs">Outros Custos (Opcional)</label>
                                <input type="number" id="asset-costs" step="any" placeholder="Taxas de corretagem, etc." value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} />
                            </div>
                        </>
                    )}

                    {activeTab === 'fixedIncome' && (
                        <>
                            <div className="form-group">
                                <label htmlFor="fi-name">Nome do Ativo</label>
                                <input type="text" id="fi-name" placeholder="Ex: CDB PicPay 105%" value={fiName} onChange={(e) => setFiName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="fi-indexer">Indexador</label>
                                <select id="fi-indexer" value={fiIndexer} onChange={(e) => setFiIndexer(e.target.value)}>
                                    <option value="CDI">CDI</option>
                                    <option value="IPCA">IPCA</option>
                                    <option value="SELIC">Selic</option>
                                    <option value="PRE_FIXED">Pré-fixado</option>
                                </select>
                            </div>
                             <div className="form-group">
                                {/* CORREÇÃO 3: Rótulo atualizado para indicar que é opcional */}
                                <label htmlFor="fi-indexer-rate">Taxa Contratada (%) (Opcional)</label>
                                <input type="number" id="fi-indexer-rate" step="any" placeholder="Ex: 110 para 110% do CDI" value={fiIndexerRate} onChange={(e) => setFiIndexerRate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="fi-purchase-date">Data da compra</label>
                                <input type="date" id="fi-purchase-date" value={fiPurchaseDate} onChange={(e) => setFiPurchaseDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="fi-initial-value">Valor Investido (R$)</label>
                                <input type="number" id="fi-initial-value" step="any" placeholder="0,00" value={fiInitialValue} onChange={(e) => setFiInitialValue(e.target.value)} />
                            </div>
                             <div className="form-group">
                                <label htmlFor="fi-maturity-date">Data de vencimento</label>
                                <input type="date" id="fi-maturity-date" value={fiMaturityDate} onChange={(e) => setFiMaturityDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="fi-daily-liquidity">Possui liquidez diária?</label>
                                <input type="checkbox" id="fi-daily-liquidity" checked={fiDailyLiquidity} onChange={(e) => setFiDailyLiquidity(e.target.checked)} />
                            </div>
                        </>
                    )}

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="submit-button" disabled={isLoading}>
                        {isLoading ? 'Adicionando...' : 'Adicionar Transação'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddAssetModal;