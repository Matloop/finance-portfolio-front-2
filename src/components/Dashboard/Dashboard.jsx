// Em src/components/Dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

// Paletas de cores para diferentes níveis
const COLORS = {
    category: ['#007bff', '#28a745', '#ffc107'],
    brazil: ['#3498db', '#1abc9c', '#27ae60'],
    usa: ['#2ecc71', '#16a085'],
    crypto: ['#f7931a', '#627eea', '#f3ba2f', '#26a17b', '#e84142', '#a6b9c7', '#222222'],
};

// Mapeamento de chaves para nomes amigáveis
const LABEL_MAP = {
    brazil: 'Brasil',
    usa: 'EUA',
    crypto: 'Cripto',
    stock: 'Ações',
    etf: 'ETFs',
    fixed_income: 'Renda Fixa'
};

const getFriendlyLabel = (label) => LABEL_MAP[label.toLowerCase()] || label;

const Dashboard = ({ percentagesData, isLoading }) => {
    // A pilha de navegação controla o nível de drill-down
    const [viewStack, setViewStack] = useState([{ path: [], title: 'Alocação por Categoria' }]);
    
    const [pieChartData, setPieChartData] = useState({
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }],
    });

    useEffect(() => {
        if (percentagesData) {
            const currentView = viewStack[viewStack.length - 1];
            let dataNode = percentagesData;
            
            // Navega na árvore de dados usando o caminho da pilha
            currentView.path.forEach(key => {
                dataNode = dataNode[key]?.children || {};
            });
            
            const children = dataNode || {};
            const labels = Object.keys(children).map(getFriendlyLabel);
            const data = Object.values(children).map(node => node.percentage);
            
            // Seleciona a paleta de cores correta
            const colorKey = currentView.path.length > 0 ? currentView.path[0] : 'category';
            const backgroundColor = COLORS[colorKey] || COLORS.category;

            setPieChartData({
                labels,
                datasets: [{ data, backgroundColor }],
            });
        }
    }, [percentagesData, viewStack]);

    const handlePieClick = (event, elements) => {
        if (!elements.length) return;

        const currentView = viewStack[viewStack.length - 1];
        let dataNode = percentagesData;
        currentView.path.forEach(key => { dataNode = dataNode[key]?.children || {}; });

        const originalLabel = Object.keys(dataNode)[elements[0].index];
        const clickedNode = dataNode[originalLabel];
        
        // Só avança se o nó clicado tiver filhos
        if (clickedNode && clickedNode.children && Object.keys(clickedNode.children).length > 0) {
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

    const pieOptions = {
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: viewStack[viewStack.length - 1].title,
                font: { size: 18 },
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += `${context.parsed.toFixed(2)}%`;
                        }
                        return label;
                    }
                }
            }
        },
        onClick: handlePieClick,
    };
    
    return (
        <div className="dashboard-container">
            <div className="chart-card">
                <div className="chart-header">
                    <h2>Alocação de Ativos</h2>
                    {viewStack.length > 1 && (
                        <button className="back-button" onClick={handleBack}>
                            &larr; Voltar
                        </button>
                    )}
                </div>

                {isLoading && <p>Carregando gráfico...</p>}
                {!isLoading && percentagesData && <Pie data={pieChartData} options={pieOptions} />}
                {!isLoading && (!percentagesData || Object.keys(percentagesData).length === 0) && (
                    <p className="error-message">Adicione ativos à sua carteira para ver a alocação.</p>
                )}
            </div>
            
            {/* O Gráfico de Linha permanece igual */}
            <div className="chart-card">
                <h2>Evolução do Patrimônio</h2>
                {/* ... filtros e componente Line ... */}
            </div>
        </div>
    );
};

export default Dashboard;