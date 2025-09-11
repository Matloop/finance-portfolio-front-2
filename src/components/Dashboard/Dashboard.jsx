// --- components/Dashboard/Dashboard.jsx ---
import React, { useState, useEffect, useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import './dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- Constantes e Funções Auxiliares ---
const COLORS = {
    category: ['#3b82f6', '#16a34a', '#f97316', '#9333ea'], // Azul, Verde, Laranja, Roxo
    brazil: ['#3498db', '#1abc9c', '#27ae60'],
    usa: ['#2ecc71', '#16a085'],
    crypto: ['#f7931a', '#627eea', '#f3ba2f', '#26a17b', '#e84142', '#a6b9c7', '#222222'],
};

const LABEL_MAP = {
    brasil: 'Brasil',
    eua: 'EUA',
    cripto: 'Cripto',
    ações: 'Ações',
    etfs: 'ETFs',
    'renda fixa': 'Renda Fixa',
    criptomoedas: 'Criptomoedas',
};

const getFriendlyLabel = (label) => LABEL_MAP[label.toLowerCase()] || label;

// --- Componente Principal ---
const Dashboard = ({ 
    percentagesData, 
    evolutionData, 
    isPercentagesLoading, 
    isEvolutionLoading,
    evolutionError 
}) => {
    // Estado para a navegação do gráfico de pizza
    const [viewStack, setViewStack] = useState([{ path: [], title: 'Alocação por Categoria' }]);
    const [pieChartData, setPieChartData] = useState({ labels: [], datasets: [] });
    
    // Estado para detectar o tema (claro/escuro)
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Acessa `document` apenas no cliente
        const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Efeito para atualizar o gráfico de pizza quando os dados ou a navegação mudam
    useEffect(() => {
        if (percentagesData) {
            const currentView = viewStack[viewStack.length - 1];
            let dataNode = percentagesData;
            currentView.path.forEach(key => { dataNode = dataNode[key]?.children || {}; });
            
            const children = dataNode || {};
            const labels = Object.keys(children).map(getFriendlyLabel);
            const data = Object.values(children).map(node => node.percentage);
            const colorKey = currentView.path.length > 0 ? currentView.path[0] : 'category';
            const backgroundColor = COLORS[colorKey] || COLORS.category;

            setPieChartData({ labels, datasets: [{ data, backgroundColor }] });
        }
    }, [percentagesData, viewStack]);

    // Lógica para o "drill-down" no gráfico de pizza
    const handlePieClick = (event, elements) => {
        if (!elements.length) return;
        const currentView = viewStack[viewStack.length - 1];
        let dataNode = percentagesData;
        currentView.path.forEach(key => { dataNode = dataNode[key]?.children || {}; });
        const originalLabel = Object.keys(dataNode)[elements[0].index];
        const clickedNode = dataNode[originalLabel];
        
        if (clickedNode && clickedNode.children && Object.keys(clickedNode.children).length > 0) {
            const newPath = [...currentView.path, originalLabel];
            const newTitle = `Alocação em ${getFriendlyLabel(originalLabel)}`;
            setViewStack([...viewStack, { path: newPath, title: newTitle }]);
        }
    };

    // Lógica para o botão "Voltar" do gráfico de pizza
    const handleBack = () => {
        if (viewStack.length > 1) {
            setViewStack(viewStack.slice(0, -1));
        }
    };

    // Otimização das opções do gráfico de pizza com useMemo
    const pieOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: isDarkMode ? '#e2e8f0' : '#4b5563', font: { size: 14 } }
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.label || ''}: ${context.parsed.toFixed(2)}%`
                }
            }
        },
        onClick: handlePieClick,
    }), [isDarkMode, viewStack, percentagesData]); // Adicionado percentagesData para reavaliar onClick

    // Otimização dos dados do gráfico de barras com useMemo
    const barChartData = useMemo(() => {
        if (!evolutionData || evolutionData.length === 0) return { labels: [], datasets: [] };
        
        const labels = evolutionData.map(d => d.date);
        const valorAplicadoData = evolutionData.map(d => d.valorAplicado);
        const ganhoCapitalData = evolutionData.map(d => d.patrimonio - d.valorAplicado);

        return {
            labels,
            datasets: [
                {
                    label: 'Ganho Capital',
                    data: ganhoCapitalData,
                    backgroundColor: isDarkMode ? '#4ade80' : '#28a745',
                    order: 1,
                },
                {
                    label: 'Valor Aplicado',
                    data: valorAplicadoData,
                    backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6',
                    order: 2,
                },
            ],
        };
    }, [evolutionData, isDarkMode]);
    
    // Otimização das opções do gráfico de barras com useMemo
    const barChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: isDarkMode ? '#e2e8f0' : '#4b5563' }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    footer: (tooltipItems) => {
                        const index = tooltipItems[0].dataIndex;
                        if (evolutionData && evolutionData[index]) {
                            const patrimonio = evolutionData[index].patrimonio;
                            return `Patrimônio: ${patrimonio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                        }
                        return '';
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: isDarkMode ? '#94a3b8' : '#6b7280' },
                grid: { display: false }
            },
            y: {
                stacked: true,
                ticks: {
                    color: isDarkMode ? '#94a3b8' : '#6b7280',
                    callback: (value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${value / 1000}k`;
                        return value;
                    }
                },
                grid: { color: isDarkMode ? '#334155' : '#e5e7eb' }
            }
        }
    }), [evolutionData, isDarkMode]);

    return (
        <div className="dashboard-container">
            {/* Card do Gráfico de Pizza */}
            <div className="chart-card card">
                <div className="chart-header">
                    <h2>{viewStack[viewStack.length - 1].title}</h2>
                    {viewStack.length > 1 && (
                        <button className="back-button" onClick={handleBack}>
                            &larr; Voltar
                        </button>
                    )}
                </div>
                <div className="chart-wrapper">
                    {isPercentagesLoading && <p className="loading-text">Carregando alocação...</p>}
                    {!isPercentagesLoading && percentagesData && Object.keys(percentagesData).length > 0 && (
                        <Pie data={pieChartData} options={pieOptions} />
                    )}
                    {!isPercentagesLoading && (!percentagesData || Object.keys(percentagesData).length === 0) && (
                        <p className="info-message">Adicione ativos para ver a alocação.</p>
                    )}
                </div>
            </div>
            
            {/* Card do Gráfico de Evolução */}
            <div className="chart-card card">
                <div className="chart-header">
                    <h2>Evolução do Patrimônio</h2>
                </div>
                 <div className="chart-wrapper">
                    {isEvolutionLoading && <p className="loading-text">Carregando evolução...</p>}
                    
                    {!isEvolutionLoading && evolutionError && (
                        <div className="error-message">
                            <p>Erro ao carregar dados de evolução.</p>
                            <small>{evolutionError}</small>
                        </div>
                    )}

                    {!isEvolutionLoading && !evolutionError && evolutionData && evolutionData.length > 0 && (
                        <Bar options={barChartOptions} data={barChartData} />
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