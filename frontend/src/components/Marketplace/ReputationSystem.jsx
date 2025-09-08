import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import {
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  AcademicCapIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const ReputationSystem = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const tabs = [
    { id: 'users', label: t('users'), icon: UserIcon },
    { id: 'companies', label: t('companies'), icon: BuildingOfficeIcon },
    { id: 'reviews', label: t('reviews'), icon: StarIcon },
    { id: 'analytics', label: t('marketplace.analytics'), icon: ChartBarIcon }
  ];

  // Simulación de datos de reputación
  useEffect(() => {
    const mockUsers = [
      {
        id: '0x8765...4321',
        name: 'Alice Johnson',
        title: 'Senior Blockchain Developer',
        reputation: 4.8,
        verified: true,
        badges: ['Top Performer', 'Verified Expert', 'Community Leader'],
        totalReviews: 24,
        positiveReviews: 22,
        negativeReviews: 2,
        completedProjects: 15,
        averageRating: 4.7,
        skills: ['Solidity', 'React', 'Node.js', 'Ethereum'],
        location: 'Madrid, España',
        experience: 5,
        reputationHistory: [
          { month: 'Jan', score: 4.2 },
          { month: 'Feb', score: 4.4 },
          { month: 'Mar', score: 4.6 },
          { month: 'Apr', score: 4.7 },
          { month: 'May', score: 4.8 },
          { month: 'Jun', score: 4.8 }
        ],
        reputationFactors: {
          technicalSkills: 95,
          communication: 88,
          reliability: 92,
          problemSolving: 90,
          teamwork: 85,
          punctuality: 94
        }
      },
      {
        id: '0x1234...5678',
        name: 'Bob Smith',
        title: 'Data Scientist',
        reputation: 4.5,
        verified: true,
        badges: ['Data Expert', 'Verified Professional'],
        totalReviews: 18,
        positiveReviews: 16,
        negativeReviews: 2,
        completedProjects: 12,
        averageRating: 4.5,
        skills: ['Python', 'SQL', 'Machine Learning', 'Tableau'],
        location: 'Barcelona, España',
        experience: 3,
        reputationHistory: [
          { month: 'Jan', score: 4.0 },
          { month: 'Feb', score: 4.2 },
          { month: 'Mar', score: 4.3 },
          { month: 'Apr', score: 4.4 },
          { month: 'May', score: 4.5 },
          { month: 'Jun', score: 4.5 }
        ],
        reputationFactors: {
          technicalSkills: 88,
          communication: 82,
          reliability: 85,
          problemSolving: 90,
          teamwork: 80,
          punctuality: 88
        }
      }
    ];

    const mockCompanies = [
      {
        id: '0x9876...5432',
        name: 'TechCorp',
        industry: 'Technology',
        reputation: 4.6,
        verified: true,
        badges: ['Verified Company', 'Top Employer', 'Innovation Leader'],
        totalReviews: 45,
        positiveReviews: 42,
        negativeReviews: 3,
        totalEmployees: 150,
        averageRating: 4.5,
        location: 'Madrid, España',
        founded: 2018,
        reputationHistory: [
          { month: 'Jan', score: 4.3 },
          { month: 'Feb', score: 4.4 },
          { month: 'Mar', score: 4.5 },
          { month: 'Apr', score: 4.5 },
          { month: 'May', score: 4.6 },
          { month: 'Jun', score: 4.6 }
        ],
        reputationFactors: {
          workEnvironment: 88,
          compensation: 85,
          careerGrowth: 90,
          workLifeBalance: 82,
          management: 87,
          benefits: 89
        }
      },
      {
        id: '0x5432...9876',
        name: 'DataFlow',
        industry: 'Data & Analytics',
        reputation: 4.3,
        verified: true,
        badges: ['Verified Company', 'Data Expert'],
        totalReviews: 32,
        positiveReviews: 28,
        negativeReviews: 4,
        totalEmployees: 75,
        averageRating: 4.2,
        location: 'Barcelona, España',
        founded: 2020,
        reputationHistory: [
          { month: 'Jan', score: 4.0 },
          { month: 'Feb', score: 4.1 },
          { month: 'Mar', score: 4.2 },
          { month: 'Apr', score: 4.2 },
          { month: 'May', score: 4.3 },
          { month: 'Jun', score: 4.3 }
        ],
        reputationFactors: {
          workEnvironment: 85,
          compensation: 82,
          careerGrowth: 88,
          workLifeBalance: 85,
          management: 80,
          benefits: 83
        }
      }
    ];

    const mockReviews = [
      {
        id: 1,
        reviewerId: '0x8765...4321',
        reviewerName: 'Alice Johnson',
        revieweeId: '0x9876...5432',
        revieweeName: 'TechCorp',
        rating: 5,
        title: 'Excelente experiencia laboral',
        content: 'TechCorp ofrece un ambiente de trabajo increíble con oportunidades de crecimiento...',
        category: 'company',
        verified: true,
        helpful: 8,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        tags: ['Work Environment', 'Career Growth', 'Compensation']
      },
      {
        id: 2,
        reviewerId: '0x9876...5432',
        reviewerName: 'TechCorp',
        revieweeId: '0x8765...4321',
        revieweeName: 'Alice Johnson',
        rating: 5,
        title: 'Desarrollador excepcional',
        content: 'Alice demostró habilidades técnicas sobresalientes y excelente comunicación...',
        category: 'user',
        verified: true,
        helpful: 12,
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        tags: ['Technical Skills', 'Communication', 'Problem Solving']
      }
    ];

    setUsers(mockUsers);
    setCompanies(mockCompanies);
    setReviews(mockReviews);
  }, []);

  const getReputationColor = (score) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-yellow-600';
    if (score >= 3.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getReputationBarColor = (score) => {
    if (score >= 4.5) return 'bg-green-500';
    if (score >= 4.0) return 'bg-yellow-500';
    if (score >= 3.5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                <ShieldCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('marketplace.reputationSystem')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('marketplace.reputationSystemDescription')}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200"
            >
              <SparklesIcon className="h-5 w-5" />
              <span>{t('verifyProfile')}</span>
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
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content based on active tab */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </h3>
                          {user.verified && (
                            <CheckBadgeIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {user.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getReputationColor(user.reputation)}`}>
                          {user.reputation}
                        </div>
                        <div className="flex items-center space-x-1">
                          {renderStars(Math.round(user.reputation))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('experience')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user.experience} {t('years')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('totalReviews')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user.totalReviews}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('completedProjects')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user.completedProjects}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {user.badges.slice(0, 2).map((badge, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full"
                        >
                          {badge}
                        </span>
                      ))}
                      {user.badges.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                          +{user.badges.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        {t('marketplace.viewDetails')}
                      </button>
                      
                      <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors">
                        {t('marketplace.analytics')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {companies.map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {company.name}
                          </h3>
                          {company.verified && (
                            <CheckBadgeIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {company.industry}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getReputationColor(company.reputation)}`}>
                          {company.reputation}
                        </div>
                        <div className="flex items-center space-x-1">
                          {renderStars(Math.round(company.reputation))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('employees')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {company.totalEmployees}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('totalReviews')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {company.totalReviews}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('founded')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {company.founded}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {company.badges.slice(0, 2).map((badge, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full"
                        >
                          {badge}
                        </span>
                      ))}
                      {company.badges.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                          +{company.badges.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        {t('marketplace.viewDetails')}
                      </button>
                      
                      <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors">
                        {t('marketplace.analytics')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <AnimatePresence>
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {review.title}
                          </h3>
                          {review.verified && (
                            <CheckBadgeIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          {review.reviewerName} → {review.revieweeName}
                        </p>
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {review.content}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {review.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {t('helpful')}: {review.helpful}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                          {t('helpful')}
                        </button>
                        <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                          {t('report')}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                    <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('verifiedUsers')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {users.filter(u => u.verified).length}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('verifiedCompanies')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {companies.filter(c => c.verified).length}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                    <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('averageRating')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(users.reduce((acc, u) => acc + u.reputation, 0) / users.length).toFixed(1)}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalReviews')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {reviews.length}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reputationTrends')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={users[0]?.reputationHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reputationDistribution')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '4.5+ Stars', value: users.filter(u => u.reputation >= 4.5).length, color: '#10b981' },
                        { name: '4.0-4.4 Stars', value: users.filter(u => u.reputation >= 4.0 && u.reputation < 4.5).length, color: '#f59e0b' },
                        { name: '3.5-3.9 Stars', value: users.filter(u => u.reputation >= 3.5 && u.reputation < 4.0).length, color: '#f97316' },
                        { name: '<3.5 Stars', value: users.filter(u => u.reputation < 3.5).length, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {users.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        <AnimatePresence>
          {showUserDetails && selectedUser && (
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
                    {selectedUser.name} - {t('reputationProfile')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowUserDetails(false);
                      setSelectedUser(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <EyeIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Reputation Overview */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('reputationOverview')}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('overallScore')}</p>
                          <p className={`text-2xl font-bold ${getReputationColor(selectedUser.reputation)}`}>
                            {selectedUser.reputation}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalReviews')}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedUser.totalReviews}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reputation Factors */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('reputationFactors')}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(selectedUser.reputationFactors).map(([factor, value]) => (
                          <div key={factor} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                              {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full"
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

                    {/* Badges */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <CheckBadgeIcon className="h-5 w-5 text-green-600" />
                        <span>{t('badges')}</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-lg font-medium"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Charts and Stats */}
                  <div className="space-y-6">
                    {/* Reputation History */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('reputationHistory')}
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={selectedUser.reputationHistory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Review Stats */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('reviewStatistics')}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{t('positiveReviews')}</span>
                          <span className="font-medium text-green-600">{selectedUser.positiveReviews}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{t('negativeReviews')}</span>
                          <span className="font-medium text-red-600">{selectedUser.negativeReviews}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{t('completionRate')}</span>
                          <span className="font-medium text-blue-600">
                            {Math.round((selectedUser.completedProjects / (selectedUser.completedProjects + 2)) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('skills')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-lg font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReputationSystem;

