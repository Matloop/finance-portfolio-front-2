// src/components/Informations/Informations.jsx

import React from 'react';
import './informations.css';

// --- Funções Auxiliares ---
// Definidas fora do componente para melhor performance.
// Formata para a moeda brasileira (ex: R$ 1.234,56)
const formatCurrency = (value = 0) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Formata para porcentagem (ex: 12,34%)
const formatPercentage = (value = 0) =>
  `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;


const Informations = ({ summaryData, isLoading }) => {
  // --- Estado de Carregamento (isLoading) ---
  // Mostra placeholders com a classe .card para manter o layout consistente.
  if (isLoading) {
    return (
      <div className="informations-container">
        <div className="info-card card"><h3>Patrimônio Total</h3><p>Carregando...</p></div>
        <div className="info-card card"><h3>Valor Investido</h3><p>Carregando...</p></div>
        <div className="info-card card"><h3>Rentabilidade</h3><p>Carregando...</p></div>
      </div>
    );
  }

  // --- Estado de Erro ou Sem Dados ---
  // Se, após o carregamento, os dados não chegarem, mostra uma mensagem.
  if (!summaryData) {
    return (
      <div className="informations-container">
        <div className="info-card card" style={{ gridColumn: '1 / -1' }}>
          <p>Não foi possível carregar os dados do sumário.</p>
        </div>
      </div>
    );
  }

  // --- Renderização com Dados ---
  // Desestrutura os dados da API usando os nomes de propriedade que você forneceu.
  const { totalHeritage = 0, totalInvested = 0, profitability = 0 } = summaryData;

  // Define a classe de cor para a rentabilidade (verde para positivo, vermelho para negativo)
  const profitabilityClass = profitability >= 0 ? 'profit' : 'loss';

  return (
    <div className="informations-container">
      {/* Card de Patrimônio Total */}
      <div className="info-card card">
        <h3>Patrimônio Total</h3>
        <p>{formatCurrency(totalHeritage)}</p>
      </div>

      {/* Card de Valor Investido */}
      <div className="info-card card">
        <h3>Valor Investido</h3>
        <p>{formatCurrency(totalInvested)}</p>
      </div>

      {/* Card de Rentabilidade */}
      <div className="info-card card">
        <h3>Rentabilidade</h3>
        <p className={profitabilityClass}>{formatPercentage(profitability)}</p>
      </div>
    </div>
  );
};

export default Informations;