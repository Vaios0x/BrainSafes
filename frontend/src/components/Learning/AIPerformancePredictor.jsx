import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { 
  CpuChipIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LightBulbIcon,
  AcademicCapIcon,
  ClockIcon,
  StarIcon,
  EyeIcon,
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts';

const AIPerformancePredictor = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [predictions, setPredictions] = useState([]);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Estados para predicciones
  const [predictionForm, setPredictionForm] = useState({
    studentId: '',
    courseId: '',
    predictionType: 'performance',
    timeframe: 'month',
    includeHistoricalData: true
  });

  const tabs = [
    { id: 'overview', label: t('overview'), icon: ChartBarIcon },
    { id: 'predictions', label: t('predictions'), icon: CpuChipIcon },
    { id: 'analytics', label: t('analytics'), icon: ArrowTrendingUpIcon },
    { id: 'recommendations', label: t('recommendations'), icon: LightBulbIcon }
  ];

  const predictionTypes = [
    { id: 'performance', label: t('performancePrediction'), icon: ArrowTrendingUpIcon },
    { id: 'completion', label: t('completionPrediction'), icon: AcademicCapIcon },
    { id: 'engagement', label: t('engagementPrediction'), icon: StarIcon },
    { id: 'success', label: t('successPrediction'), icon: AcademicCapIcon }
  ];

  // Simulación de predicciones (en producción vendría del contrato)
  useEffect(() => {
    const mockPredictions = [
      {
        id: 1,
        studentId: '0x1234...5678',
        studentName: 'Alice Johnson',
        courseId: 1,
        courseName: 'Blockchain Fundamentals',
        predictionType: 'performance',
        predictedScore: 87,
        confidence: 0.92,
        factors: {
          studyTime: 85,
          engagement: 78,
          previousPerformance: 82,
          difficulty: 75,
          motivation: 90
        },
        recommendations: [
          'Increase study time by 2 hours per week',
          'Focus on smart contract concepts',
          'Practice with hands-on projects',
          'Join study groups for better understanding'
        ],
        riskFactors: [
          'Limited practical experience',
          'Complex mathematical concepts',
          'Time management challenges'
        ],
        historicalData: [
          { week: 1, score: 75, studyTime: 8, engagement: 70 },
          { week: 2, score: 78, studyTime: 10, engagement: 75 },
          { week: 3, score: 82, studyTime: 12, engagement: 80 },
          { week: 4, score: 85, studyTime: 15, engagement: 85 },
          { week: 5, score: 87, studyTime: 18, engagement: 88 }
        ],
        aiInsights: {
          learningStyle: 'Visual and hands-on',
          strengthAreas: ['Conceptual understanding', 'Problem solving'],
          improvementAreas: ['Practical application', 'Time management'],
          optimalStudyTime: 'Evening sessions (2-3 hours)',
          recommendedResources: ['Interactive tutorials', 'Practice exercises', 'Peer discussions']
        },
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        status: 'active'
      },
      {
        id: 2,
        studentId: '0x8765...4321',
        studentName: 'Bob Smith',
        courseId: 2,
        courseName: 'Smart Contract Development',
        predictionType: 'completion',
        predictedScore: 92,
        confidence: 0.88,
        factors: {
          studyTime: 90,
          engagement: 85,
          previousPerformance: 88,
          difficulty: 80,
          motivation: 95
        },
        recommendations: [
          'Continue current study pattern',
          'Focus on advanced Solidity patterns',
          'Build portfolio projects',
          'Network with industry professionals'
        ],
        riskFactors: [
          'High expectations pressure',
          'Complex security concepts',
          'Rapid technology changes'
        ],
        historicalData: [
          { week: 1, score: 80, studyTime: 10, engagement: 75 },
          { week: 2, score: 85, studyTime: 12, engagement: 80 },
          { week: 3, score: 88, studyTime: 15, engagement: 85 },
          { week: 4, score: 90, studyTime: 18, engagement: 90 },
          { week: 5, score: 92, studyTime: 20, engagement: 92 }
        ],
        aiInsights: {
          learningStyle: 'Analytical and systematic',
          strengthAreas: ['Technical skills', 'Logical thinking'],
          improvementAreas: ['Creativity', 'Communication'],
          optimalStudyTime: 'Morning sessions (3-4 hours)',
          recommendedResources: ['Advanced tutorials', 'Security best practices', 'Industry case studies']
        },
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        status: 'active'
      }
    ];

    setPredictions(mockPredictions);
  }, []);

  const handleGeneratePrediction = async () => {
    if (!isConnected) {
      toast.error(t('connectWallet'));
      return;
    }

    setLoading(true);
    try {
      // Simular procesamiento de IA
      await new Promise(resolve => setTimeout(resolve, 3000));

      const predictedScore = Math.floor(Math.random() * 30) + 70; // 70-100
      const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0

      const newPrediction = {
        id: predictions.length + 1,
        studentId: predictionForm.studentId,
        studentName: 'New Student',
        courseId: predictionForm.courseId,
        courseName: 'Selected Course',
        predictionType: predictionForm.predictionType,
        predictedScore,
        confidence,
        factors: {
          studyTime: Math.floor(Math.random() * 30) + 70,
          engagement: Math.floor(Math.random() * 30) + 70,
          previousPerformance: Math.floor(Math.random() * 30) + 70,
          difficulty: Math.floor(Math.random() * 30) + 70,
          motivation: Math.floor(Math.random() * 30) + 70
        },
        recommendations: [
          'Focus on core concepts',
          'Practice regularly',
          'Seek help when needed',
          'Stay motivated'
        ],
        riskFactors: [
          'Time management',
          'Complex concepts',
          'Limited experience'
        ],
        historicalData: [
          { week: 1, score: 70, studyTime: 8, engagement: 65 },
          { week: 2, score: 75, studyTime: 10, engagement: 70 },
          { week: 3, score: 80, studyTime: 12, engagement: 75 },
          { week: 4, score: 85, studyTime: 15, engagement: 80 },
          { week: 5, score: predictedScore, studyTime: 18, engagement: 85 }
        ],
        aiInsights: {
          learningStyle: 'Adaptive',
          strengthAreas: ['Analytical thinking', 'Problem solving'],
          improvementAreas: ['Practical application', 'Time management'],
          optimalStudyTime: 'Flexible sessions (2-4 hours)',
          recommendedResources: ['Interactive content', 'Practice exercises', 'Peer support']
        },
        createdAt: Date.now(),
        status: 'active'
      };

      setPredictions([newPrediction, ...predictions]);
      setShowPredictionModal(false);
      setPredictionForm({
        studentId: '',
        courseId: '',
        predictionType: 'performance',
        timeframe: 'month',
        includeHistoricalData: true
      });
      toast.success(t('predictionGenerated'));
    } catch (error) {
      toast.error(t('errorGeneratingPrediction'));
      console.error('Error generating prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    if (confidence >= 0.7) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceBarColor = (confidence) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.8) return 'bg-yellow-500';
    if (confidence >= 0.7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPredictionColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-teal-100 dark:bg-teal-900/20 rounded-xl">
                <CpuChipIcon className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('aiPerformancePredictor')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('aiPoweredPerformancePrediction')}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPredictionModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200"
            >
              <SparklesIcon className="h-5 w-5" />
              <span>{t('generatePrediction')}</span>
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Predictions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {predictions.map((prediction, index) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {prediction.courseName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {prediction.studentName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getPredictionColor(prediction.predictedScore)}`}>
                        {prediction.predictedScore}%
                      </div>
                      <div className={`text-sm ${getConfidenceColor(prediction.confidence)}`}>
                        {(prediction.confidence * 100).toFixed(1)}% {t('confidence')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('predictionType')}</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {prediction.predictionType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('studyTime')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {prediction.factors.studyTime}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('engagement')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {prediction.factors.engagement}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('motivation')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {prediction.factors.motivation}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                    <div 
                      className={`h-2 rounded-full ${getConfidenceBarColor(prediction.confidence)}`}
                      style={{ width: `${prediction.confidence * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setCurrentPrediction(prediction);
                        setShowPredictionModal(true);
                      }}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      {t('viewDetails')}
                    </button>
                    
                    <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors">
                      {t('analytics')}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Prediction Details Modal */}
        <AnimatePresence>
          {showPredictionModal && currentPrediction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentPrediction.courseName} - {t('aiPrediction')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowPredictionModal(false);
                      setCurrentPrediction(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <EyeIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Prediction Overview */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('predictionOverview')}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('predictedScore')}</p>
                          <p className={`text-2xl font-bold ${getPredictionColor(currentPrediction.predictedScore)}`}>
                            {currentPrediction.predictedScore}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('confidence')}</p>
                          <p className={`text-2xl font-bold ${getConfidenceColor(currentPrediction.confidence)}`}>
                            {(currentPrediction.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Performance Factors */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('performanceFactors')}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(currentPrediction.factors).map(([factor, value]) => (
                          <div key={factor} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                              {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-teal-500 h-2 rounded-full"
                                  style={{ width: `${value}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {value}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <CpuChipIcon className="h-5 w-5 text-teal-600" />
                        <span>{t('aiInsights')}</span>
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('learningStyle')}</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {currentPrediction.aiInsights.learningStyle}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('optimalStudyTime')}</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {currentPrediction.aiInsights.optimalStudyTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts and Recommendations */}
                  <div className="space-y-6">
                    {/* Performance Chart */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('performanceTrend')}
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={currentPrediction.historicalData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <LightBulbIcon className="h-5 w-5 text-yellow-600" />
                        <span>{t('recommendations')}</span>
                      </h3>
                      <div className="space-y-2">
                        {currentPrediction.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                        <span>{t('riskFactors')}</span>
                      </h3>
                      <div className="space-y-2">
                        {currentPrediction.riskFactors.map((risk, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{risk}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Prediction Modal */}
        <AnimatePresence>
          {showPredictionModal && !currentPrediction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('generatePrediction')}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('studentId')}
                    </label>
                    <input
                      type="text"
                      value={predictionForm.studentId}
                      onChange={(e) => setPredictionForm({ ...predictionForm, studentId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0x..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('courseId')}
                    </label>
                    <input
                      type="number"
                      value={predictionForm.courseId}
                      onChange={(e) => setPredictionForm({ ...predictionForm, courseId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('predictionType')}
                    </label>
                    <select
                      value={predictionForm.predictionType}
                      onChange={(e) => setPredictionForm({ ...predictionForm, predictionType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {predictionTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('timeframe')}
                    </label>
                    <select
                      value={predictionForm.timeframe}
                      onChange={(e) => setPredictionForm({ ...predictionForm, timeframe: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="week">{t('week')}</option>
                      <option value="month">{t('month')}</option>
                      <option value="quarter">{t('quarter')}</option>
                      <option value="semester">{t('semester')}</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeHistorical"
                      checked={predictionForm.includeHistoricalData}
                      onChange={(e) => setPredictionForm({ ...predictionForm, includeHistoricalData: e.target.checked })}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="includeHistorical" className="text-sm text-gray-700 dark:text-gray-300">
                      {t('includeHistoricalData')}
                    </label>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowPredictionModal(false);
                      setPredictionForm({
                        studentId: '',
                        courseId: '',
                        predictionType: 'performance',
                        timeframe: 'month',
                        includeHistoricalData: true
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleGeneratePrediction}
                    disabled={loading}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {loading ? t('generating') : t('generatePrediction')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIPerformancePredictor;
