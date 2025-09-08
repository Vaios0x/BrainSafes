import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { 
  CpuChipIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const AutomatedAssessment = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [assessments, setAssessments] = useState([]);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);

  // Estados para el formulario de evaluación
  const [assessmentForm, setAssessmentForm] = useState({
    courseId: '',
    studentId: '',
    assessmentType: 'quiz',
    questions: [],
    aiAnalysis: true
  });

  const assessmentTypes = [
    { id: 'quiz', label: t('quiz'), icon: DocumentTextIcon },
    { id: 'project', label: t('project'), icon: AcademicCapIcon },
    { id: 'essay', label: t('essay'), icon: DocumentTextIcon },
    { id: 'practical', label: t('practical'), icon: LightBulbIcon }
  ];

  // Simulación de evaluaciones (en producción vendría del contrato)
  useEffect(() => {
    const mockAssessments = [
      {
        id: 1,
        courseId: 1,
        courseTitle: 'Blockchain Fundamentals',
        studentId: '0x1234...5678',
        studentName: 'Alice Johnson',
        assessmentType: 'quiz',
        status: 'completed',
        score: 85,
        maxScore: 100,
        aiScore: 87,
        humanScore: 83,
        completedAt: Date.now() - 86400000,
        questions: [
          { id: 1, question: 'What is a blockchain?', answer: 'A distributed ledger technology', score: 10 },
          { id: 2, question: 'What is the purpose of consensus mechanisms?', answer: 'To agree on the state of the blockchain', score: 8 },
          { id: 3, question: 'Explain the difference between public and private blockchains', answer: 'Public blockchains are open to anyone, private are restricted', score: 7 }
        ],
        aiFeedback: 'Strong understanding of blockchain fundamentals. Good grasp of consensus mechanisms. Could improve on practical applications.',
        humanFeedback: 'Excellent work on core concepts. Well-structured answers. Consider exploring real-world use cases.',
        aiConfidence: 0.92
      },
      {
        id: 2,
        courseId: 2,
        courseTitle: 'Smart Contract Development',
        studentId: '0x8765...4321',
        studentName: 'Bob Smith',
        assessmentType: 'project',
        status: 'in_progress',
        score: 0,
        maxScore: 100,
        aiScore: 0,
        humanScore: 0,
        startedAt: Date.now() - 3600000,
        questions: [
          { id: 1, question: 'Create a simple ERC20 token contract', answer: '', score: 0 },
          { id: 2, question: 'Implement a basic NFT contract', answer: '', score: 0 },
          { id: 3, question: 'Write tests for your contracts', answer: '', score: 0 }
        ],
        aiFeedback: '',
        humanFeedback: '',
        aiConfidence: 0
      }
    ];
    setAssessments(mockAssessments);
  }, []);

  const handleStartAssessment = async (assessmentId) => {
    if (!isConnected) {
      toast.error(t('connectWallet'));
      return;
    }

    setLoading(true);
    try {
      const assessment = assessments.find(a => a.id === assessmentId);
      setCurrentAssessment(assessment);
      setShowAssessmentModal(true);
      toast.success(t('assessmentStarted'));
    } catch (error) {
      toast.error(t('errorStartingAssessment'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!currentAssessment) return;

    setLoading(true);
    try {
      // Simular procesamiento de IA
      await new Promise(resolve => setTimeout(resolve, 2000));

      const aiScore = Math.floor(Math.random() * 30) + 70; // 70-100
      const humanScore = Math.floor(Math.random() * 20) + (aiScore - 10); // ±10 del score de IA

      const results = {
        assessmentId: currentAssessment.id,
        aiScore,
        humanScore,
        finalScore: Math.round((aiScore + humanScore) / 2),
        aiFeedback: generateAIFeedback(aiScore),
        humanFeedback: generateHumanFeedback(humanScore),
        aiConfidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        completedAt: Date.now()
      };

      setAssessmentResults(results);
      
      // Actualizar la evaluación en la lista
      setAssessments(assessments.map(a => 
        a.id === currentAssessment.id 
          ? { ...a, ...results, status: 'completed' }
          : a
      ));

      toast.success(t('assessmentCompleted'));
    } catch (error) {
      toast.error(t('errorSubmittingAssessment'));
    } finally {
      setLoading(false);
    }
  };

  const generateAIFeedback = (score) => {
    if (score >= 90) return 'Outstanding performance! Demonstrates exceptional understanding and application of concepts.';
    if (score >= 80) return 'Excellent work with strong grasp of core concepts. Minor areas for improvement identified.';
    if (score >= 70) return 'Good performance with solid understanding. Some concepts need further clarification.';
    if (score >= 60) return 'Satisfactory work but several areas need improvement. Consider reviewing course materials.';
    return 'Performance below expectations. Significant improvement needed in core concepts.';
  };

  const generateHumanFeedback = (score) => {
    if (score >= 90) return 'Impressive work! Clear understanding and excellent communication of ideas.';
    if (score >= 80) return 'Very good work with clear reasoning and good examples provided.';
    if (score >= 70) return 'Good effort with some strong points. Could benefit from more detailed explanations.';
    if (score >= 60) return 'Adequate work but needs more depth and clarity in explanations.';
    return 'Work needs significant improvement. Please review course materials and seek additional help.';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'in_progress': return ClockIcon;
      case 'pending': return ClockIcon;
      default: return ClockIcon;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                              <CpuChipIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('automatedAssessment')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('aiPoweredAssessmentDescription')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Assessment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {assessments.map((assessment, index) => (
              <motion.div
                key={assessment.id}
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
                        {assessment.courseTitle}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {assessment.studentName}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                      <div className="flex items-center space-x-1">
                        {React.createElement(getStatusIcon(assessment.status), { className: "h-4 w-4" })}
                        <span>{t(assessment.status)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('assessmentType')}</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {assessment.assessmentType}
                      </span>
                    </div>

                    {assessment.status === 'completed' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{t('finalScore')}</span>
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {assessment.score}/{assessment.maxScore}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{t('aiScore')}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {assessment.aiScore}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{t('humanScore')}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {assessment.humanScore}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{t('aiConfidence')}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {(assessment.aiConfidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </>
                    )}

                    {assessment.status === 'in_progress' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('timeElapsed')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Math.floor((Date.now() - assessment.startedAt) / 60000)}m
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {assessment.status === 'pending' && (
                      <button
                        onClick={() => handleStartAssessment(assessment.id)}
                        disabled={loading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        {t('startAssessment')}
                      </button>
                    )}
                    
                    {assessment.status === 'in_progress' && (
                      <button
                        onClick={() => handleStartAssessment(assessment.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        {t('continueAssessment')}
                      </button>
                    )}

                    {assessment.status === 'completed' && (
                      <button
                        onClick={() => {
                          setCurrentAssessment(assessment);
                          setShowAssessmentModal(true);
                        }}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        {t('viewResults')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Assessment Modal */}
        <AnimatePresence>
          {showAssessmentModal && currentAssessment && (
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
                    {currentAssessment.courseTitle} - {t('assessment')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAssessmentModal(false);
                      setCurrentAssessment(null);
                      setAssessmentResults(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                {currentAssessment.status === 'completed' ? (
                  // Mostrar resultados
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800 dark:text-green-200">{t('finalScore')}</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {currentAssessment.score}/{currentAssessment.maxScore}
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CpuChipIcon className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-800 dark:text-blue-200">{t('aiScore')}</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {currentAssessment.aiScore}
                        </div>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                          <span className="font-semibold text-purple-800 dark:text-purple-200">{t('humanScore')}</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {currentAssessment.humanScore}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <CpuChipIcon className="h-5 w-5 text-blue-600" />
                          <span>{t('aiFeedback')}</span>
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300">
                            {currentAssessment.aiFeedback}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                          <span>{t('humanFeedback')}</span>
                        </h3>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300">
                            {currentAssessment.humanFeedback}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('questionDetails')}</h3>
                      <div className="space-y-4">
                        {currentAssessment.questions.map((question, idx) => (
                          <div key={question.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {t('question')} {idx + 1}
                              </h4>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {question.score} {t('points')}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">{question.question}</p>
                            {question.answer && (
                              <div className="bg-white dark:bg-gray-600 p-3 rounded border-l-4 border-green-500">
                                <p className="text-gray-700 dark:text-gray-300">{question.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Mostrar evaluación en progreso
                  <div className="space-y-6">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-800 dark:text-yellow-200">{t('assessmentInProgress')}</span>
                      </div>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        {t('aiProcessingDescription')}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('questions')}</h3>
                      <div className="space-y-4">
                        {currentAssessment.questions.map((question, idx) => (
                          <div key={question.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {t('question')} {idx + 1}
                              </h4>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {question.score} {t('points')}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">{question.question}</p>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                              placeholder={t('enterYourAnswer')}
                              value={question.answer}
                              onChange={(e) => {
                                const updatedQuestions = currentAssessment.questions.map((q, i) =>
                                  i === idx ? { ...q, answer: e.target.value } : q
                                );
                                setCurrentAssessment({
                                  ...currentAssessment,
                                  questions: updatedQuestions
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setShowAssessmentModal(false);
                          setCurrentAssessment(null);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('saveAndContinue')}
                      </button>
                      <button
                        onClick={handleSubmitAssessment}
                        disabled={loading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        {loading ? t('processing') : t('submitAssessment')}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AutomatedAssessment;
