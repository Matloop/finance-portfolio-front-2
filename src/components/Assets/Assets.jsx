import React, { useState, useEffect, useMemo } from 'react';
import './assets.css';

// --- FUNÇÕES AUXILIARES ---
const formatCurrency = (value = 0) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatQuantity = (qty = 0) => Number(qty).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
const formatPercentage = (value = 0) => {
    const formattedNumber = Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formattedNumber}%`;
};
const getFriendlyName = (key) => {
    const nameMap = {
        'brasil': 'Brasil', 'eua': 'EUA', 'cripto': 'Cripto',
        'ações': 'Ações', 'etfs': 'ETFs', 'renda fixa': 'Renda Fixa',
        'criptomoedas': 'Criptomoedas'
    };
    return nameMap[key.toLowerCase()] || key;
};

// --- COMPONENTES REUTILIZÁVEIS ---
const Accordion = ({ title, totalValue, percentage, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="asset-accordion">
            <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="header-left">
                    <h3>{getFriendlyName(title)}</h3>
                    {percentage > 0 && (
                        <span className="category-percentage">
                            {formatPercentage(percentage)}
                        </span>
                    )}
                    <span className="total-value">{formatCurrency(totalValue)}</span>
                </div>
                <span className="toggle-icon">{isOpen ? '−' : '+'}</span>
            </div>
            {isOpen && <div className="accordion-content">{children}</div>}
        </div>
    );
};

const AssetsTable = ({ assets, isFixedIncome = false, onEditAsset, onDeleteAsset }) => {
    if (isFixedIncome) {
        return (
            <table className="assets-table">
                <thead>
                    <tr>
                        <th>Ativo</th>
                        <th className="align-right">Variação</th>
                        <th className="align-right">% da Carteira</th>
                        <th className="align-right">Valor Total</th>
                        <th className="actions-column">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset, index) => (
                        <tr key={`${asset.name}-${index}`}>
                            <td><div className="asset-name">{asset.name}</div></td>
                            <td className={`align-right ${asset.profitability >= 0 ? 'profit-positive' : 'profit-negative'}`}>{formatPercentage(asset.profitability)}</td>
                            <td className="align-right">{formatPercentage(asset.portfolioPercentage)}</td>
                            <td className="align-right">{formatCurrency(asset.currentValue)}</td>
                            <td className="actions-column">
                                <div className="action-buttons">
                                    <button className="action-button delete-button" onClick={() => onDeleteAsset(asset)} title="Deletar">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <table className="assets-table">
            <thead>
                <tr>
                    <th>Ativo</th>
                    <th className="align-right">Preço Médio</th>
                    <th className="align-right">Preço Atual</th>
                    <th className="align-right">Variação</th>
                    <th className="align-right">% da Carteira</th>
                    <th className="align-right">Valor Total</th>
                    <th className="actions-column">Ações</th>
                </tr>
            </thead>
            <tbody>
                {assets.map((asset, index) => (
                    <tr key={`${asset.ticker || asset.name}-${index}`}>
                        <td>
                            <div className="asset-name">{asset.ticker}</div>
                            <div className="asset-quantity">{formatQuantity(asset.totalQuantity)}</div>
                        </td>
                        <td className="align-right">{formatCurrency(asset.averagePrice)}</td>
                        <td className="align-right">{formatCurrency(asset.currentPrice)}</td>
                        <td className={`align-right ${asset.profitability >= 0 ? 'profit-positive' : 'profit-negative'}`}>{formatPercentage(asset.profitability)}</td>
                        <td className="align-right">{formatPercentage(asset.portfolioPercentage)}</td>
                        <td className="align-right">{formatCurrency(asset.currentValue)}</td>
                        <td className="actions-column">
                            <div className="action-buttons">
                                <button className="action-button delete-button" onClick={() => onDeleteAsset(asset)} title="Deletar">🗑️</button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};


// --- COMPONENTE PRINCIPAL ---
const Assets = ({ assetsData, isLoading, onEditAsset, onDeleteAsset }) => {
    const [activeTab, setActiveTab] = useState(null);

    useEffect(() => {
        if (assetsData && Object.keys(assetsData).length > 0 && !activeTab) {
            setActiveTab(Object.keys(assetsData)[0]);
        } else if (!assetsData && activeTab) {
            setActiveTab(null);
        }
    }, [assetsData, activeTab]);

    const totalHeritageOfActiveTab = useMemo(() => {
        if (!assetsData || !activeTab) return 0;
        return (assetsData[activeTab] || []).reduce((sum, subCategory) => sum + subCategory.totalValue, 0);
    }, [assetsData, activeTab]);

    if (isLoading) {
        return (
            <div className="assets-container card">
                <h2>Meus Ativos</h2>
                <p className='info-message'>Carregando ativos...</p>
            </div>
        );
    }

    if (!assetsData || Object.keys(assetsData).length === 0) {
        return (
            <div className="assets-container card">
                <h2>Meus Ativos</h2>
                <p className="no-assets-message">Nenhum ativo na carteira para exibir.</p>
            </div>
        );
    }

    const tabKeys = Object.keys(assetsData);
    const activeTabData = activeTab ? assetsData[activeTab] || [] : [];

    return (
        <div className="assets-container card">
            <h2>Meus Ativos</h2>

            <div className="tabs-container">
                {tabKeys.map(tabName => (
                    <button
                        key={tabName}
                        className={`tab-button ${activeTab === tabName ? 'active' : ''}`}
                        onClick={() => setActiveTab(tabName)}
                    >
                        {getFriendlyName(tabName)}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTabData.length > 0 ? (
                    activeTabData.map((subCategory) => {
                        const categoryPercentage = totalHeritageOfActiveTab > 0
                            ? (subCategory.totalValue / totalHeritageOfActiveTab) * 100
                            : 0;

                        return (
                            <Accordion
                                key={subCategory.categoryName}
                                title={subCategory.categoryName}
                                totalValue={subCategory.totalValue}
                                percentage={categoryPercentage}
                            >
                                {subCategory.assets && subCategory.assets.length > 0 ? (
                                    <AssetsTable 
                                        assets={subCategory.assets} 
                                        isFixedIncome={subCategory.categoryName.toLowerCase() === 'renda fixa'}
                                        onEditAsset={onEditAsset}
                                        onDeleteAsset={onDeleteAsset}
                                    />
                                ) : (
                                    <p className="no-assets-message">Nenhum ativo nesta categoria.</p>
                                )}
                            </Accordion>
                        );
                    })
                ) : (
                    <p className="no-assets-message">Nenhum ativo para exibir nesta categoria.</p>
                )}
            </div>
        </div>
    );
};

export default Assets;