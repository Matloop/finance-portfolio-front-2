import React from 'react';
import './informations.css';

// O componente agora recebe 'summaryData' e 'isLoading' como propriedades
const Informations = ({ summaryData, isLoading }) => {
    // Se estiver carregando, exibe um placeholder
    if (isLoading) {
        return (
            <div className="informations-container">
                <div className="info-card"><h3>Patrimônio Total</h3><p>Carregando...</p></div>
                <div className="info-card"><h3>Valor Investido</h3><p>Carregando...</p></div>
                <div className="info-card"><h3>Rentabilidade</h3><p>Carregando...</p></div>
            </div>
        );
    }

    // Se não houver dados (após o carregamento), exibe uma mensagem padrão
    if (!summaryData) {
        return <div className="info-card"><p>Não foi possível carregar os dados do sumário.</p></div>;
    }

    // Formata os números para exibição
    const formatCurrency = (value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatPercentage = (value) => `${Number(value).toFixed(2)}%`;
    const profitClass = summaryData.profitability >= 0 ? 'profit' : 'loss';

    return (
        <div className="informations-container">
            <div className="info-card">
                <h3>Patrimônio Total</h3>
                {/* Usa os dados vindos da API */}
                <p>{formatCurrency(summaryData.totalHeritage)}</p>
            </div>
            <div className="info-card">
                <h3>Valor Investido</h3>
                <p>{formatCurrency(summaryData.totalInvested)}</p>
            </div>
            <div className="info-card">
                <h3>Rentabilidade</h3>
                <p className={profitClass}>{formatPercentage(summaryData.profitability)}</p>
            </div>
        </div>
    );
};

export default Informations;