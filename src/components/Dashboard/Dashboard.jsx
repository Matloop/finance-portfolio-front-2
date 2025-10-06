import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend as RechartsLegend } from 'recharts';
import AllocationChart from './AllocationChart';
import './dashboard.css';
import { getFriendlyLabel } from '../../utils/labelUtils'; 

// --- FUNÇÕES AUXILIARES ---
const formatChartDate = (dateString) => {
    if (!dateString || !dateString.includes('/')) return dateString;
    const [month, year] = dateString.split('/');
    const monthMap = {
        'Jan': 'Jan', 'Feb': 'Fev', 'Mar': 'Mar', 'Apr': 'Abr', 
        'May': 'Mai', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Ago', 
        'Sep': 'Set', 'Oct': 'Out', 'Nov': 'Nov', 'Dec': 'Dez'
    };
    const translatedMonth = monthMap[month] || month;
    return `${translatedMonth}/${year}`;
};

const formatCurrency = (value = 0) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatPercentageChange = (value = 0) => {
    const formatted = Number(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${value >= 0 ? '+' : ''}${formatted}%`;
};

// --- Componente de Tooltip customizado ---
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="custom-tooltip">
                <p className="tooltip-date">{data.date}</p>
                <p className="tooltip-item valor-aplicado">Valor Aplicado: {formatCurrency(data.valorAplicado)}</p>
                <p className="tooltip-item ganho-capital">Ganho Capital: {formatCurrency(data.ganhoCapital)}</p>
                <p className="tooltip-item patrimonio">Patrimônio: {formatCurrency(data.patrimonio)}</p>
            </div>
        );
    }
    return null;
};

// --- Componente Principal ---
const Dashboard = ({ 
    percentagesData, 
    evolutionData, 
    isPercentagesLoading, 
    isEvolutionLoading,
    evolutionError,
    onFilterChange,
    assetsData
}) => {
    const [viewStack, setViewStack] = useState([{ path: [], title: 'Alocação por Categoria' }]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedTicker, setSelectedTicker] = useState('all');

    useEffect(() => {
        const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const annualVariation = useMemo(() => {
        if (!evolutionData || evolutionData.length < 2) {
            return 0;
        }
        const firstValue = evolutionData[0].patrimonio;
        const lastValue = evolutionData[evolutionData.length - 1].patrimonio;

        if (firstValue === 0) {
            return lastValue > 0 ? 100.0 : 0; 
        }

        const variation = ((lastValue - firstValue) / firstValue) * 100;
        return variation;
    }, [evolutionData]);

    const { currentDataNode, colorKey } = useMemo(() => {
        if (!percentagesData) return { currentDataNode: null, colorKey: 'category' };
        const currentView = viewStack[viewStack.length - 1];
        let dataNode = percentagesData;
        currentView.path.forEach(key => { dataNode = dataNode[key]?.children || {}; });
        const cKey = currentView.path.length > 0 ? currentView.path[0] : 'category';
        return { currentDataNode: dataNode, colorKey: cKey };
    }, [percentagesData, viewStack]);

    const filterOptions = useMemo(() => {
        if (!assetsData) return { types: [], tickers: [] };
        
        const allAssets = Object.values(assetsData).flat().flatMap(cat => cat.assets || []);
        
        const types = [...new Set(allAssets.map(a => a.assetType))].sort();
        const tickers = [...new Set(allAssets.map(a => a.ticker || a.name))].sort();

        return { types, tickers };
    }, [assetsData]);
    
    useEffect(() => {
        if (onFilterChange && !isPercentagesLoading) {
            const filters = {
                assetType: selectedType !== 'all' ? selectedType : null,
                ticker: selectedTicker !== 'all' ? selectedTicker : null,
            };
            onFilterChange(filters);
        }
    }, [selectedType, selectedTicker, onFilterChange, isPercentagesLoading]);

    const handlePieClick = (originalLabel) => {
        const clickedNode = currentDataNode?.[originalLabel];
        if (clickedNode && clickedNode.children && Object.keys(clickedNode.children).length > 0) {
            const currentView = viewStack[viewStack.length - 1];
            const newPath = [...currentView.path, originalLabel];
            const newTitle = `Alocação em ${getFriendlyLabel(originalLabel)}`;
            setViewStack([...viewStack, { path: newPath, title: newTitle }]);
        }
    };

    const handleBack = () => {
        if (viewStack.length > 1) {
            setViewStack(viewStack.slice(0, -1));
        }
    };

    const rechartsData = useMemo(() => {
        if (!evolutionData || evolutionData.length === 0) return [];
        return evolutionData.map(d => ({
            date: formatChartDate(d.date),
            valorAplicado: d.valorAplicado,
            ganhoCapital: d.patrimonio - d.valorAplicado,
            patrimonio: d.patrimonio
        }));
    }, [evolutionData]);

    return (
        <div className="dashboard-container">
            <div className="chart-card card">
                <div className="chart-header">
                    <h2>{viewStack[viewStack.length - 1].title}</h2>
                    {viewStack.length > 1 && (
                        <button className="back-button" onClick={handleBack}>← Voltar</button>
                    )}
                </div>
                <div className="chart-wrapper">
                    {isPercentagesLoading && <p className="loading-text">Carregando alocação...</p>}
                    {!isPercentagesLoading && currentDataNode && Object.keys(currentDataNode).length > 0 && (
                        <AllocationChart 
                            dataNode={currentDataNode}
                            colorKey={colorKey}
                            onSliceClick={handlePieClick}
                            isDarkMode={isDarkMode}
                        />
                    )}
                    {!isPercentagesLoading && (!percentagesData || Object.keys(percentagesData).length === 0) && (
                        <p className="info-message">Adicione ativos para ver a alocação.</p>
                    )}
                </div>
            </div>
            
            <div className="chart-card card">
                <div className="chart-header">
                    <div className="chart-title-wrapper">
                        <h2>Evolução do Patrimônio</h2>
                        {!isEvolutionLoading && evolutionData && evolutionData.length > 1 && (
                            <span className={`annual-variation ${annualVariation >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                                {formatPercentageChange(annualVariation)}
                            </span>
                        )}
                    </div>
                    <div className="evolution-filters">
                        <select value={selectedType} onChange={e => { setSelectedTicker('all'); setSelectedType(e.target.value); }} disabled={isEvolutionLoading || !assetsData}>
                            <option value="all">Todos os Tipos</option>
                            {filterOptions.types.map(type => <option key={type} value={type}>{getFriendlyLabel(type)}</option>)}
                        </select>
                        <select value={selectedTicker} onChange={e => setSelectedTicker(e.target.value)} disabled={isEvolutionLoading || !assetsData}>
                            <option value="all">Todos os Ativos</option>
                            {filterOptions.tickers.map(ticker => <option key={ticker} value={ticker}>{ticker}</option>)}
                        </select>
                    </div>
                </div>
                <div className="chart-wrapper">
                    {isEvolutionLoading && <p className="loading-text">Carregando evolução...</p>}
                    {!isEvolutionLoading && evolutionError && (
                        <div className="error-message">
                            <p>Erro ao carregar dados de evolução.</p>
                            <small>{evolutionError}</small>
                        </div>
                    )}
                    {!isEvolutionLoading && !evolutionError && rechartsData.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={rechartsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValorAplicado" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isDarkMode ? "#60a5fa" : "#3b82f6"} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={isDarkMode ? "#60a5fa" : "#3b82f6"} stopOpacity={0.1}/>
                                    </linearGradient>
                                    <linearGradient id="colorGanhoCapital" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isDarkMode ? "#4ade80" : "#10b981"} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={isDarkMode ? "#4ade80" : "#10b981"} stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e5e7eb"} vertical={false}/>
                                <XAxis dataKey="date" stroke={isDarkMode ? "#94a3b8" : "#6b7280"} style={{ fontSize: '0.75rem' }}/>
                                <YAxis stroke={isDarkMode ? "#94a3b8" : "#6b7280"} style={{ fontSize: '0.75rem' }} tickFormatter={(value) => {
                                    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                    return value;
                                }}/>
                                <RechartsTooltip content={<CustomTooltip />} />
                                <RechartsLegend wrapperStyle={{ fontSize: '0.875rem', paddingTop: '1rem' }} iconType="circle"/>
                                <Area type="monotone" dataKey="valorAplicado" stroke={isDarkMode ? "#60a5fa" : "#3b82f6"} strokeWidth={2} fillOpacity={1} fill="url(#colorValorAplicado)" name="Valor Aplicado"/>
                                <Area type="monotone" dataKey="ganhoCapital" stroke={isDarkMode ? "#4ade80" : "#10b981"} strokeWidth={2} fillOpacity={1} fill="url(#colorGanhoCapital)" name="Ganho Capital"/>
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                    {!isEvolutionLoading && !evolutionError && (!evolutionData || evolutionData.length === 0) && (
                        <p className="info-message">Adicione transações para ver a evolução do seu patrimônio.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;