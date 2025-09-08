import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdvancedAnalyticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
    setupWebSocket();
    
    const interval = setInterval(loadDashboardData, 30000); // Actualizar cada 30 segundos
    
    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-analytics/dashboard?timeframe=${timeframe}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    // Simular WebSocket para datos en tiempo real
    const mockRealTimeData = {
      timestamp: Date.now(),
      activeUsers: Math.floor(Math.random() * 1000) + 500,
      performance: {
        currentResponseTime: Math.floor(Math.random() * 200) + 50,
        currentThroughput: Math.floor(Math.random() * 100) + 50,
        currentErrorRate: Math.random() * 2
      },
      blockchain: {
        currentGasPrice: Math.floor(Math.random() * 10000000000) + 1000000000,
        currentTransactions: Math.floor(Math.random() * 500) + 100
      },
      ai: {
        currentAccuracy: Math.floor(Math.random() * 20) + 80,
        currentResponseTime: Math.floor(Math.random() * 400) + 100
      }
    };
    
    setRealTimeData(mockRealTimeData);
    
    // Simular actualizaciones en tiempo real
    setInterval(() => {
      const newData = {
        ...mockRealTimeData,
        timestamp: Date.now(),
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        performance: {
          currentResponseTime: Math.floor(Math.random() * 200) + 50,
          currentThroughput: Math.floor(Math.random() * 100) + 50,
          currentErrorRate: Math.random() * 2
        }
      };
      setRealTimeData(newData);
    }, 5000);
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'blockchain', label: 'Blockchain', icon: '🔗' },
    { id: 'ai', label: 'IA & ML', icon: '🤖' },
    { id: 'security', label: 'Seguridad', icon: '🔒' },
    { id: 'trends', label: 'Tendencias', icon: '📈' }
  ];

  const performanceChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Tiempo de Respuesta (ms)',
        data: [120, 150, 180, 200, 160, 140, 130],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Throughput (req/s)',
        data: [80, 90, 70, 60, 85, 95, 88],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const blockchainChartData = {
    labels: ['L1 Gas', 'L2 Gas', 'Batch Size', 'State Size'],
    datasets: [
      {
        label: 'Métricas Arbitrum',
        data: [85, 92, 78, 88],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ],
        borderWidth: 2
      }
    ]
  };

  const aiChartData = {
    labels: ['Precisión', 'Tiempo Respuesta', 'Detección Fraude', 'Recomendaciones', 'Paths IA'],
    datasets: [
      {
        label: 'Métricas IA',
        data: [92, 85, 88, 90, 87],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(153, 102, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(153, 102, 255, 1)'
      }
    ]
  };

  const securityChartData = {
    labels: ['Bots Detectados', 'IPs Bloqueadas', 'Ataques DDoS', 'Violaciones WAF', 'Anomalías'],
    datasets: [
      {
        data: [12, 8, 3, 5, 7],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderWidth: 2
      }
    ]
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Usuarios Activos"
          value={realTimeData?.activeUsers || 0}
          change="+12.5%"
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Tiempo Respuesta"
          value={`${realTimeData?.performance?.currentResponseTime || 0}ms`}
          change="-8.2%"
          icon="⚡"
          color="green"
        />
        <MetricCard
          title="Gas Price L2"
          value={`${(realTimeData?.blockchain?.currentGasPrice / 1e9).toFixed(2)} Gwei`}
          change="+5.1%"
          icon="🔗"
          color="purple"
        />
        <MetricCard
          title="Precisión IA"
          value={`${realTimeData?.ai?.currentAccuracy || 0}%`}
          change="+2.3%"
          icon="🤖"
          color="orange"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Performance en Tiempo Real">
          <Line 
            data={performanceChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </ChartCard>
        
        <ChartCard title="Métricas Blockchain">
          <Doughnut 
            data={blockchainChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }}
          />
        </ChartCard>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceMetric
          title="Response Time P50"
          value={`${dashboardData?.performance?.responseTime?.p50 || 0}ms`}
          status="good"
        />
        <PerformanceMetric
          title="Response Time P95"
          value={`${dashboardData?.performance?.responseTime?.p95 || 0}ms`}
          status="warning"
        />
        <PerformanceMetric
          title="Response Time P99"
          value={`${dashboardData?.performance?.responseTime?.p99 || 0}ms`}
          status="critical"
        />
      </div>
      
      <ChartCard title="Análisis de Performance Detallado">
        <Bar 
          data={{
            labels: ['P50', 'P95', 'P99', 'Throughput', 'Error Rate'],
            datasets: [{
              label: 'Métricas',
              data: [
                dashboardData?.performance?.responseTime?.p50 || 0,
                dashboardData?.performance?.responseTime?.p95 || 0,
                dashboardData?.performance?.responseTime?.p99 || 0,
                dashboardData?.performance?.throughput || 0,
                dashboardData?.performance?.errorRate || 0
              ],
              backgroundColor: [
                'rgba(75, 192, 192, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(153, 102, 255, 0.8)'
              ]
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            }
          }}
        />
      </ChartCard>
    </div>
  );

  const renderBlockchain = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BlockchainMetric
          title="Gas Usage Promedio"
          value={`${dashboardData?.blockchain?.gasUsage?.average || 0} gas`}
          icon="⛽"
        />
        <BlockchainMetric
          title="Gas Usage Peak"
          value={`${dashboardData?.blockchain?.gasUsage?.peak || 0} gas`}
          icon="📈"
        />
        <BlockchainMetric
          title="Eficiencia Gas"
          value={`${dashboardData?.blockchain?.gasUsage?.efficiency || 0}%`}
          icon="🎯"
        />
        <BlockchainMetric
          title="Transacciones/hora"
          value={dashboardData?.blockchain?.transactionVolume?.hourly || 0}
          icon="🔄"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Métricas Arbitrum">
          <Radar 
            data={blockchainChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' }
              },
              scales: {
                r: { beginAtZero: true, max: 100 }
              }
            }}
          />
        </ChartCard>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Estado de la Red</h3>
          <div className="space-y-3">
            <NetworkStatus
              label="L1 Gas Price"
              value={`${(dashboardData?.blockchain?.arbitrum?.l1GasPrice / 1e9).toFixed(2)} Gwei`}
              status="normal"
            />
            <NetworkStatus
              label="L2 Gas Price"
              value={`${(dashboardData?.blockchain?.arbitrum?.l2GasPrice / 1e9).toFixed(2)} Gwei`}
              status="good"
            />
            <NetworkStatus
              label="Batch Size"
              value={dashboardData?.blockchain?.arbitrum?.batchSize || 0}
              status="warning"
            />
            <NetworkStatus
              label="State Size"
              value={`${(dashboardData?.blockchain?.arbitrum?.stateSize / 1e9).toFixed(2)} GB`}
              status="normal"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAI = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AIMetric
          title="Precisión General"
          value={`${dashboardData?.ai?.predictionAccuracy?.overall || 0}%`}
          icon="🎯"
        />
        <AIMetric
          title="Recomendaciones"
          value={`${dashboardData?.ai?.predictionAccuracy?.courseRecommendations || 0}%`}
          icon="📚"
        />
        <AIMetric
          title="Detección Fraude"
          value={`${dashboardData?.ai?.predictionAccuracy?.fraudDetection || 0}%`}
          icon="🛡️"
        />
        <AIMetric
          title="Learning Paths"
          value={`${dashboardData?.ai?.predictionAccuracy?.learningPaths || 0}%`}
          icon="🧠"
        />
      </div>
      
      <ChartCard title="Rendimiento de IA">
        <Radar 
          data={aiChartData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' }
            },
            scales: {
              r: { beginAtZero: true, max: 100 }
            }
          }}
        />
      </ChartCard>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Predicciones ML</h3>
          <div className="space-y-3">
            {Object.entries(dashboardData?.mlPredictions || {}).map(([key, prediction]) => (
              <MLPrediction
                key={key}
                name={key}
                value={prediction.value}
                confidence={prediction.confidence}
                timestamp={prediction.timestamp}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tiempos de Respuesta IA</h3>
          <div className="space-y-3">
            <ResponseTimeMetric
              label="Promedio"
              value={`${dashboardData?.ai?.responseTimes?.average || 0}ms`}
            />
            <ResponseTimeMetric
              label="P95"
              value={`${dashboardData?.ai?.responseTimes?.p95 || 0}ms`}
            />
            <ResponseTimeMetric
              label="P99"
              value={`${dashboardData?.ai?.responseTimes?.p99 || 0}ms`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SecurityMetric
          title="IPs Bloqueadas"
          value={dashboardData?.security?.blockedIPs || 0}
          icon="🚫"
          color="red"
        />
        <SecurityMetric
          title="Bots Detectados"
          value={dashboardData?.security?.botSignatures || 0}
          icon="🤖"
          color="orange"
        />
        <SecurityMetric
          title="Ataques DDoS"
          value={dashboardData?.security?.ddosAttacks || 0}
          icon="⚔️"
          color="purple"
        />
        <SecurityMetric
          title="Violaciones WAF"
          value={dashboardData?.security?.wafViolations || 0}
          icon="🛡️"
          color="blue"
        />
      </div>
      
      <ChartCard title="Análisis de Seguridad">
        <Doughnut 
          data={securityChartData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }}
        />
      </ChartCard>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setTimeframe('1h')}
          className={`px-4 py-2 rounded-lg ${
            timeframe === '1h' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          1 Hora
        </button>
        <button
          onClick={() => setTimeframe('24h')}
          className={`px-4 py-2 rounded-lg ${
            timeframe === '24h' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          24 Horas
        </button>
        <button
          onClick={() => setTimeframe('7d')}
          className={`px-4 py-2 rounded-lg ${
            timeframe === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          7 Días
        </button>
        <button
          onClick={() => setTimeframe('30d')}
          className={`px-4 py-2 rounded-lg ${
            timeframe === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          30 Días
        </button>
      </div>
      
      <ChartCard title="Tendencias de Performance">
        <Line 
          data={{
            labels: ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'],
            datasets: [
              {
                label: 'Response Time',
                data: [120, 115, 125, 110, 130, 105, 118],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true
              },
              {
                label: 'Throughput',
                data: [80, 85, 82, 88, 78, 90, 85],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true
              }
            ]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' }
            }
          }}
        />
      </ChartCard>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'performance':
        return renderPerformance();
      case 'blockchain':
        return renderBlockchain();
      case 'ai':
        return renderAI();
      case 'security':
        return renderSecurity();
      case 'trends':
        return renderTrends();
      default:
        return renderOverview();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          <span className="bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent">
            Dashboard Analytics Avanzado
          </span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Métricas en tiempo real, ML predictions y análisis avanzado de BrainSafes
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Componentes auxiliares
const MetricCard = ({ title, value, change, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -5 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </p>
      </div>
      <div className={`text-3xl ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

const PerformanceMetric = ({ title, value, status }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    <div className={`w-full h-2 rounded-full mt-2 ${
      status === 'good' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
    }`}></div>
  </div>
);

const BlockchainMetric = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center space-x-2 mb-2">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const NetworkStatus = ({ label, value, status }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <span className="text-gray-700 dark:text-gray-300">{label}</span>
    <div className="flex items-center space-x-2">
      <span className="text-gray-900 dark:text-white font-semibold">{value}</span>
      <div className={`w-3 h-3 rounded-full ${
        status === 'good' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-gray-500'
      }`}></div>
    </div>
  </div>
);

const AIMetric = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center space-x-2 mb-2">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const MLPrediction = ({ name, value, confidence, timestamp }) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Confianza: {(confidence * 100).toFixed(1)}%
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  </div>
);

const ResponseTimeMetric = ({ label, value }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <span className="text-gray-700 dark:text-gray-300">{label}</span>
    <span className="text-gray-900 dark:text-white font-semibold">{value}</span>
  </div>
);

const SecurityMetric = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center space-x-2 mb-2">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
    <p className={`text-xl font-bold ${
      color === 'red' ? 'text-red-600' : color === 'orange' ? 'text-orange-600' : color === 'purple' ? 'text-purple-600' : 'text-blue-600'
    }`}>{value}</p>
  </div>
);

export default AdvancedAnalyticsDashboard;
