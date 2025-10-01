// src/components/Informations/Informations.jsx

import React, { useState } from 'react';
import './informations.css';
import InvestedValueModal from '../InvestedValueModal/InvestedValueModal';

const formatCurrency = (value = 0) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatPercentage = (value = 0) =>
  `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const Informations = ({ summaryData, assetsData, isLoading, error }) => {
  const [isInvestedModalOpen, setInvestedModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="informations-container">
        <div className="info-card card"><h3>Patrimônio Total</h3><p>Carregando...</p></div>
        <div className="info-card card"><h3>Valor Investido</h3><p>Carregando...</p></div>
        <div className="info-card card"><h3>Rentabilidade</h3><p>Carregando...</p></div>
      </div>
    );
  }
  
  if (error || !summaryData) {
    return (
        <div className="informations-container">
            <div className="info-card card" style={{ gridColumn: '1 / -1' }}>
                <p>Não foi possível carregar os dados do sumário.</p>
            </div>
        </div>
    );
  }

  const { totalHeritage = 0, totalInvested = 0, profitability = 0 } = summaryData;
  const profitabilityClass = profitability >= 0 ? 'profit' : 'loss';

  return (
    <>
      <div className="informations-container">
        <div className="info-card card">
          <h3>Patrimônio Total</h3>
          <p>{formatCurrency(totalHeritage)}</p>
        </div>

        <div className="info-card card">
          <button 
            className="details-button" 
            onClick={() => setInvestedModalOpen(true)}
            aria-label="Ver detalhes do valor investido"
          >
            +
          </button>
          <h3>Valor Investido</h3>
          <p>{formatCurrency(totalInvested)}</p>
        </div>

        <div className="info-card card">
          <h3>Rentabilidade</h3>
          <p className={profitabilityClass}>{formatPercentage(profitability)}</p>
        </div>
      </div>

      <InvestedValueModal
        isOpen={isInvestedModalOpen}
        onClose={() => setInvestedModalOpen(false)}
        assetsData={assetsData}
      />
    </>
  );
};

export default Informations;