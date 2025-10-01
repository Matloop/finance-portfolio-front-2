// src/components/InvestedValueModal/InvestedValueModal.jsx
import React, { useMemo } from 'react';
import './investedValueModal.css';

const formatCurrency = (value = 0) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const InvestedValueModal = ({ isOpen, onClose, assetsData }) => {
  if (!isOpen) return null;

  // A estrutura de 'assetsData' é aninhada. Esta função a transforma 
  // em uma lista simples de todos os ativos para facilitar a exibição.
  const flatAssetList = useMemo(() => {
    if (!assetsData) return [];
    
    return Object.values(assetsData)
      .flat()
      .flatMap(subCategory => subCategory.assets || [])
      .sort((a, b) => b.totalInvested - a.totalInvested); // Ordena pelo maior valor investido
  }, [assetsData]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Valor Investido por Ativo</h2>
        
        <div className="invested-list">
          {flatAssetList.length > 0 ? (
            flatAssetList.map((asset, index) => (
              <div key={`${asset.ticker || asset.name}-${index}`} className="invested-list-item">
                <span className="invested-asset-name">{asset.ticker || asset.name}</span>
                <span className="invested-asset-value">{formatCurrency(asset.totalInvested)}</span>
              </div>
            ))
          ) : (
            <p>Nenhum dado de ativo disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestedValueModal;