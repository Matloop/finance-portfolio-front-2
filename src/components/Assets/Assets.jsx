// src/components/Assets/Assets.jsx

import React, { useState, useEffect } from 'react';
import './assets.css';

// --- FUNÇÕES AUXILIARES ---

// Formata um número para o padrão de moeda brasileiro (R$) - JÁ ESTAVA CORRETO
const formatCurrency = (value = 0) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Formata a quantidade, permitindo mais casas decimais para cripto - JÁ ESTAVA CORRETO
const formatQuantity = (qty = 0) =>
    Number(qty).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 });

// Formata um número para porcentagem com duas casas decimais - CORRIGIDO
const formatPercentage = (value = 0) => {
    // A MUDANÇA ESTÁ AQUI: Usamos toLocaleString para o padrão brasileiro (1.234,56%)
    const formattedNumber = Number(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${formattedNumber}%`;
};

// Mapeia chaves da API para nomes amigáveis na UI
const getFriendlyName = (key) => {
    const nameMap = {
        'brasil': 'Brasil', 'eua': 'EUA', 'cripto': 'Cripto',
        'ações': 'Ações', 'etfs': 'ETFs', 'renda fixa': 'Renda Fixa',
        'criptomoedas': 'Criptomoedas'
    };
    return nameMap[key.toLowerCase()] || key;
};


// --- COMPONENTES REUTILIZÁVEIS ---

const Accordion = ({ title, totalValue, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="asset-accordion">
            <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="header-left">
                    <h3>{getFriendlyName(title)}</h3>
                    <span className="total-value">{formatCurrency(totalValue)}</span>
                </div>
                <span className="toggle-icon">{isOpen ? '−' : '+'}</span>
            </div>
            {isOpen && <div className="accordion-content">{children}</div>}
        </div>
    );
};

const AssetsTable = ({ assets, isFixedIncome = false }) => {
    if (isFixedIncome) {
        return (
            <table className="assets-table">
                <thead>
                    <tr>
                        <th>Ativo</th>
                        <th className="align-right">Variação</th>
                        <th className="align-right">% da Carteira</th>
                        <th className="align-right">Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset, index) => (
                        <tr key={`${asset.name}-${index}`}>
                            <td>
                                <div className="asset-name">{asset.name}</div>
                            </td>
                            <td className={`align-right ${asset.profitability >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                                {formatPercentage(asset.profitability)}
                            </td>
                            <td className="align-right">{formatPercentage(asset.portfolioPercentage)}</td>
                            <td className="align-right">{formatCurrency(asset.currentValue)}</td>
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
                        <td className={`align-right ${asset.profitability >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                            {formatPercentage(asset.profitability)}
                        </td>
                        <td className="align-right">{formatPercentage(asset.portfolioPercentage)}</td>
                        <td className="align-right">{formatCurrency(asset.currentValue)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};


// --- COMPONENTE PRINCIPAL ---
const Assets = ({ assetsData, isLoading }) => {
    const [activeTab, setActiveTab] = useState(null);

    useEffect(() => {
        if (assetsData && !activeTab && Object.keys(assetsData).length > 0) {
            setActiveTab(Object.keys(assetsData)[0]);
        }
        if (!assetsData && activeTab) {
            setActiveTab(null);
        }
    }, [assetsData, activeTab]);

    if (isLoading) {
        return (
            <div className="assets-container card">
                <h2>Meus Ativos</h2>
                <p className='info-message'>Carregando ativos...</p>
            </div>
        );
    }

    if (!assetsData || !activeTab || Object.keys(assetsData).length === 0) {
        return (
            <div className="assets-container card">
                <h2>Meus Ativos</h2>
                <p className="no-assets-message">Nenhum ativo na carteira para exibir.</p>
            </div>
        );
    }

    const tabKeys = Object.keys(assetsData);
    const activeTabData = assetsData[activeTab] || [];

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
                    activeTabData.map((subCategory) => (
                        <Accordion
                            key={subCategory.categoryName}
                            title={subCategory.categoryName}
                            totalValue={subCategory.totalValue}
                        >
                            {subCategory.assets && subCategory.assets.length > 0 ? (
                                <AssetsTable 
                                    assets={subCategory.assets} 
                                    isFixedIncome={subCategory.categoryName.toLowerCase() === 'renda fixa'}
                                />
                            ) : (
                                <p className="no-assets-message">Nenhum ativo nesta categoria.</p>
                            )}
                        </Accordion>
                    ))
                ) : (
                    <p className="no-assets-message">Nenhum ativo para exibir nesta categoria.</p>
                )}
            </div>
        </div>
    );
};

export default Assets;