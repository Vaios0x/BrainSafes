import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  FireIcon,
  StarIcon,
  BoltIcon,
  TrophyIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const ProgressTracker = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedCourse, setSelectedCourse] = useState('all');

  // Estados para métricas
  const [metrics, setMetrics] = useState({
    totalCourses: 0,
    completedCourses: 0,
    currentProgress: 0,
    averageScore: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    certificatesEarned: 0,
    achievementsUnlocked: 0
  });

  const timeframes = [
    { id: 'day', label: t('day'), icon: CalendarIcon },
    { id: 'week', label: t('week'), icon: ClockIcon },
    { id: 'month', label: t('month'), icon: ChartBarIcon },
    { id: 'year', label: t('year'), icon: ArrowTrendingUpIcon }
  ];

  // Simulación de datos de progreso (en producción vendría del contrato)
  useEffect(() => {
    const mockProgressData = {
      overallProgress: 68,
      currentStreak: 7,
      totalStudyHours: 156,
      averageScore: 87,
      courses: [
        {
          id: 1,
          name: 'Blockchain Fundamentals',
          progress: 85,
          score: 92,
          timeSpent: 45,
          status: 'in_progress',
          lastActivity: Date.now() - 3600000,
          modules: [
            { id: 1, name: 'Introduction to Blockchain', progress: 100, completed: true },
            { id: 2, name: 'Consensus Mechanisms', progress: 100, completed: true },
            { id: 3, name: 'Smart Contracts', progress: 75, completed: false },
            { id: 4, name: 'DeFi Applications', progress: 0, completed: false }
          ]
        },
        {
          id: 2,
          name: 'Smart Contract Development',
          progress: 45,
          score: 78,
          timeSpent: 32,
          status: 'in_progress',
          lastActivity: Date.now() - 7200000,
          modules: [
            { id: 1, name: 'Solidity Basics', progress: 100, completed: true },
            { id: 2, name: 'ERC Standards', progress: 60, completed: false },
            { id: 3, name: 'Security Best Practices', progress: 0, completed: false },
            { id: 4, name: 'Advanced Patterns', progress: 0, completed: false }
          ]
        }
      ],
      achievements: [
        { id: 1, name: 'First Steps', description: 'Complete your first module', unlocked: true, icon: StarIcon },
        { id: 2, name: 'Streak Master', description: 'Study for 7 consecutive days', unlocked: true, icon: FireIcon },
        { id: 3, name: 'High Achiever', description: 'Score 90+ on any assessment', unlocked: false, icon: TrophyIcon },
        { id: 4, name: 'Quick Learner', description: 'Complete a course in under 30 days', unlocked: false, icon: BoltIcon }
      ],
      studyHistory: [
        { date: '2024-01-01', hours: 2, modules: 3, score: 85 },
        { date: '2024-01-02', hours: 1.5, modules: 2, score: 78 },
        { date: '2024-01-03', hours: 3, modules: 4, score: 92 },
        { date: '2024-01-04', hours: 2.5, modules: 3, score: 88 },
        { date: '2024-01-05', hours: 1, modules: 1, score: 75 },
        { date: '2024-01-06', hours: 2, modules: 2, score: 82 },
        { date: '2024-01-07', hours: 2.5, modules: 3, score: 90 }
      ],
      skillProgress: [
        { skill: 'Blockchain', progress: 85, level: 'Intermediate' },
        { skill: 'Solidity', progress: 60, level: 'Beginner' },
        { skill: 'DeFi', progress: 30, level: 'Beginner' },
        { skill: 'Web3', progress: 45, level: 'Beginner' }
      ]
    };

    setProgressData(mockProgressData);
    setMetrics({
      totalCourses: mockProgressData.courses.length,
      completedCourses: mockProgressData.courses.filter(c => c.progress === 100).length,
      currentProgress: mockProgressData.overallProgress,
      averageScore: mockProgressData.averageScore,
      studyStreak: mockProgressData.currentStreak,
      totalStudyTime: mockProgressData.totalStudyHours,
      certificatesEarned: 1,
      achievementsUnlocked: mockProgressData.achievements.filter(a => a.unlocked).length
    });
  }, []);

  const handleUpdateProgress = async (courseId, moduleId, progress) => {
    if (!isConnected) {
      toast.error(t('connectWallet'));
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la llamada al contrato para actualizar el progreso
      setProgressData(prev => ({
        ...prev,
        courses: prev.courses.map(course =>
          course.id === courseId
            ? {
                ...course,
                modules: course.modules.map(module =>
                  module.id === moduleId
                    ? { ...module, progress, completed: progress === 100 }
                    : module
                ),
                progress: course.modules.reduce((acc, m) => acc + m.progress, 0) / course.modules.length
              }
            : course
        )
      }));
      toast.success(t('progressUpdated'));
    } catch (error) {
      toast.error(t('errorUpdatingProgress'));
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!progressData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('loadingProgress')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
              <ChartBarIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('progressTracker')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('trackYourLearningProgress')}
              </p>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.id}
                onClick={() => setSelectedTimeframe(timeframe.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedTimeframe === timeframe.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <timeframe.icon className="h-5 w-5" />
                <span>{timeframe.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Metrics Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('overallProgress')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressData.overallProgress}%
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressBarColor(progressData.overallProgress)}`}
                  style={{ width: `${progressData.overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FireIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('studyStreak')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressData.currentStreak} {t('days')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalStudyTime')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressData.totalStudyHours}h
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <StarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('averageScore')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressData.averageScore}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Progress */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t('courseProgress')}
            </h2>
            <div className="space-y-6">
              {progressData.courses.map((course, index) => (
                <div key={course.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {course.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {course.timeSpent}h • {course.modules.length} {t('modules')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getProgressColor(course.progress)}`}>
                        {course.progress}%
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {course.score}% {t('score')}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full ${getProgressBarColor(course.progress)}`}
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>

                  <div className="space-y-2">
                    {course.modules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {module.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {module.progress}%
                          </span>
                          {module.completed && (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Charts */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Study History Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {t('studyHistory')}
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={progressData.studyHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="hours" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Skill Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {t('skillProgress')}
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={progressData.skillProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div 
          className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {t('achievements')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {progressData.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  achievement.unlocked
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.unlocked
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <achievement.icon className={`h-5 w-5 ${
                      achievement.unlocked
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${
                      achievement.unlocked
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {achievement.name}
                    </h3>
                    <p className={`text-sm ${
                      achievement.unlocked
                        ? 'text-green-600 dark:text-green-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Real-time Activity Feed */}
        <motion.div 
          className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {t('recentActivity')}
          </h2>
          <div className="space-y-4">
            {progressData.courses.map((course) => (
              <div key={course.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <LightBulbIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('lastActivity')}: <span className="font-medium">{course.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(course.lastActivity).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.progress}% {t('complete')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressTracker;
