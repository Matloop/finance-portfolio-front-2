// src/components/Dashboard/Dashboard.jsx

import React, { useState, useEffect, useMemo } from 'react'; // 1. Importe useMemo
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = {
    category: ['#3b82f6', '#16a34a', '#f97316', '#9333ea'],
    brazil: ['#3498db', '#1abc9c', '#27ae60'],
    usa: ['#2ecc71', '#16a085'],
    crypto: ['#f7931a', '#627eea', '#f3ba2f', '#26a17b', '#e84142', '#a6b9c7', '#222222'],
};
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
    const [viewStack, setViewStack] = useState([{ path: [], title: 'Alocação por Categoria' }]);
    const [pieChartData, setPieChartData] = useState({
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }],
    });
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (percentagesData) {
            const currentView = viewStack[viewStack.length - 1];
            let dataNode = percentagesData;
            currentView.path.forEach(key => {
                dataNode = dataNode[key]?.children || {};
            });
            const children = dataNode || {};
            const labels = Object.keys(children).map(getFriendlyLabel);
            const data = Object.values(children).map(node => node.percentage);
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

    // 2. Otimize 'pieOptions' com useMemo
    const pieOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: isDarkMode ? '#e2e8f0' : '#4b5563',
                    font: { size: 14 }
                }
            },
            title: {
                display: false, // O título já está no card, removemos do gráfico para limpar
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed !== null) { label += `${context.parsed.toFixed(2)}%`; }
                        return label;
                    }
                }
            }
        },
        onClick: handlePieClick,
    }), [isDarkMode, viewStack]); // 3. Recalcula apenas se o tema ou os dados mudarem

    return (
        <div className="dashboard-container">
            <div className="chart-card card">
                <div className="chart-header">
                    {/* O título agora é dinâmico e está aqui */}
                    <h2>{viewStack[viewStack.length - 1].title}</h2> 
                    {viewStack.length > 1 && (
                        <button className="back-button" onClick={handleBack}>
                            &larr; Voltar
                        </button>
                    )}
                </div>
                <div className="chart-wrapper">
                    {isLoading && <p className="loading-text">Carregando gráfico...</p>}
                    {!isLoading && percentagesData && <Pie data={pieChartData} options={pieOptions} />}
                    {!isLoading && (!percentagesData || Object.keys(percentagesData).length === 0) && (
                        <p className="error-message">Adicione ativos para ver a alocação.</p>
                    )}
                </div>
            </div>
            
            <div className="chart-card card">
                <div className="chart-header">
                    <h2>Evolução do Patrimônio</h2>
                </div>
                 <div className="chart-wrapper">
                    {/* Estilo corrigido para a mensagem */}
                    <p className="info-message">Gráfico de evolução em breve.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;