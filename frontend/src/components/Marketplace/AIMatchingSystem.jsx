import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import {
  CpuChipIcon,
  BriefcaseIcon,
  UserIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  AcademicCapIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts';

const AIMatchingSystem = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [matches, setMatches] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  const tabs = [
    { id: 'matches', label: t('marketplace.aiMatching'), icon: CpuChipIcon },
    { id: 'candidates', label: t('candidates'), icon: UserIcon },
    { id: 'jobs', label: t('marketplace.findJobs'), icon: BriefcaseIcon },
    { id: 'analytics', label: t('marketplace.analytics'), icon: ChartBarIcon }
  ];

  // Simulación de datos de matching
  useEffect(() => {
    const mockMatches = [
      {
        id: 1,
        jobId: 1,
        jobTitle: 'Desarrollador Blockchain Senior',
        company: 'TechCorp',
        candidateId: '0x8765...4321',
        candidateName: 'Alice Johnson',
        aiMatchScore: 92,
        humanScore: 88,
        overallScore: 90,
        skillsMatch: 95,
        experienceMatch: 87,
        cultureMatch: 89,
        salaryMatch: 85,
        locationMatch: 90,
        recommendations: [
          'Excelente experiencia en Solidity',
          'Proyectos DeFi destacados',
          'Comunicación efectiva',
          'Liderazgo técnico demostrado'
        ],
        riskFactors: [
          'Salario ligeramente alto',
          'Ubicación preferida diferente'
        ],
        aiInsights: {
          learningStyle: 'Hands-on y colaborativo',
          strengthAreas: ['Smart Contracts', 'DeFi Protocols', 'Team Leadership'],
          improvementAreas: ['Documentation', 'Testing'],
          optimalWorkStyle: 'Autonomous with regular check-ins',
          recommendedOnboarding: ['Code review sessions', 'Mentor assignment', 'Project shadowing']
        },
        status: 'pending',
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000
      },
      {
        id: 2,
        jobId: 2,
        jobTitle: 'Analista de Datos',
        company: 'DataFlow',
        candidateId: '0x1234...5678',
        candidateName: 'Bob Smith',
        aiMatchScore: 87,
        humanScore: 85,
        overallScore: 86,
        skillsMatch: 90,
        experienceMatch: 82,
        cultureMatch: 88,
        salaryMatch: 92,
        locationMatch: 85,
        recommendations: [
          'Fuerte background en Python',
          'Experiencia en ML/AI',
          'Análisis de datos complejos',
          'Comunicación de resultados'
        ],
        riskFactors: [
          'Experiencia limitada en Tableau',
          'Proyectos de menor escala'
        ],
        aiInsights: {
          learningStyle: 'Analytical and systematic',
          strengthAreas: ['Data Analysis', 'Python', 'Machine Learning'],
          improvementAreas: ['Data Visualization', 'Business Context'],
          optimalWorkStyle: 'Structured with clear objectives',
          recommendedOnboarding: ['Tool training', 'Domain knowledge', 'Stakeholder introduction']
        },
        status: 'accepted',
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
      }
    ];

    const mockCandidates = [
      {
        id: '0x8765...4321',
        name: 'Alice Johnson',
        title: 'Senior Blockchain Developer',
        experience: 5,
        skills: ['Solidity', 'React', 'Node.js', 'Ethereum', 'DeFi'],
        certifications: ['Certified Blockchain Developer', 'AWS Solutions Architect'],
        reputation: 4.8,
        completedProjects: 12,
        averageRating: 4.7,
        location: 'Madrid, España',
        salaryExpectation: 75000,
        availability: 'immediate',
        aiProfile: {
          learningStyle: 'Hands-on',
          communicationStyle: 'Direct and clear',
          problemSolving: 'Analytical',
          teamwork: 'Collaborative',
          adaptability: 'High'
        }
      },
      {
        id: '0x1234...5678',
        name: 'Bob Smith',
        title: 'Data Scientist',
        experience: 3,
        skills: ['Python', 'SQL', 'Machine Learning', 'Tableau', 'R'],
        certifications: ['Google Data Analytics', 'IBM Data Science'],
        reputation: 4.5,
        completedProjects: 8,
        averageRating: 4.6,
        location: 'Barcelona, España',
        salaryExpectation: 55000,
        availability: '2 weeks',
        aiProfile: {
          learningStyle: 'Structured',
          communicationStyle: 'Detailed',
          problemSolving: 'Methodical',
          teamwork: 'Supportive',
          adaptability: 'Medium'
        }
      }
    ];

    const mockJobs = [
      {
        id: 1,
        title: 'Desarrollador Blockchain Senior',
        company: 'TechCorp',
        location: 'Madrid, España',
        salaryMin: 60000,
        salaryMax: 90000,
        requiredSkills: ['Solidity', 'React', 'Node.js', 'Ethereum'],
        experienceLevel: 'senior',
        jobType: 'fullTime',
        aiRequirements: {
          technicalSkills: 90,
          softSkills: 85,
          experience: 80,
          cultureFit: 88,
          growthPotential: 92
        }
      },
      {
        id: 2,
        title: 'Analista de Datos',
        company: 'DataFlow',
        location: 'Barcelona, España',
        salaryMin: 45000,
        salaryMax: 65000,
        requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Tableau'],
        experienceLevel: 'mid',
        jobType: 'contract',
        aiRequirements: {
          technicalSkills: 85,
          softSkills: 80,
          experience: 75,
          cultureFit: 85,
          growthPotential: 88
        }
      }
    ];

    setMatches(mockMatches);
    setCandidates(mockCandidates);
    setJobs(mockJobs);
  }, []);

  const handleGenerateMatches = async () => {
    if (!isConnected) {
      toast.error(t('connectWallet'));
      return;
    }

    setLoading(true);
    try {
      // Simular generación de matches con IA
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newMatches = candidates.map(candidate => {
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const aiScore = Math.floor(Math.random() * 20) + 80;
        const humanScore = Math.floor(Math.random() * 20) + 75;
        
        return {
          id: matches.length + Math.random(),
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          candidateId: candidate.id,
          candidateName: candidate.name,
          aiMatchScore: aiScore,
          humanScore: humanScore,
          overallScore: Math.round((aiScore + humanScore) / 2),
          skillsMatch: Math.floor(Math.random() * 20) + 80,
          experienceMatch: Math.floor(Math.random() * 20) + 75,
          cultureMatch: Math.floor(Math.random() * 20) + 80,
          salaryMatch: Math.floor(Math.random() * 20) + 80,
          locationMatch: Math.floor(Math.random() * 20) + 85,
          recommendations: [
            'Experiencia relevante',
            'Habilidades técnicas sólidas',
            'Buena comunicación'
          ],
          riskFactors: [
            'Algunas áreas de mejora',
            'Considerar período de adaptación'
          ],
          aiInsights: {
            learningStyle: 'Adaptive',
            strengthAreas: ['Technical Skills', 'Problem Solving'],
            improvementAreas: ['Communication', 'Leadership'],
            optimalWorkStyle: 'Flexible',
            recommendedOnboarding: ['Training', 'Mentoring', 'Support']
          },
          status: 'pending',
          createdAt: Date.now()
        };
      });

      setMatches([...newMatches, ...matches]);
      toast.success(t('matchesGenerated'));
    } catch (error) {
      toast.error(t('errorGeneratingMatches'));
      console.error('Error generating matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-yellow-500';
    if (score >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                <CpuChipIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('marketplace.aiMatching')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('marketplace.aiMatchingDescription')}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateMatches}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200"
            >
              <SparklesIcon className="h-5 w-5" />
              <span>{loading ? t('generating') : t('generateMatches')}</span>
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
                    ? 'bg-purple-600 text-white shadow-sm'
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
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {match.jobTitle}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                          {match.company}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          {match.candidateName}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(match.overallScore)}`}>
                          {match.overallScore}%
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('marketplace.matchScore')}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.aiScore')}</span>
                        <span className={`font-medium ${getScoreColor(match.aiMatchScore)}`}>
                          {match.aiMatchScore}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.humanScore')}</span>
                        <span className={`font-medium ${getScoreColor(match.humanScore)}`}>
                          {match.humanScore}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.skillsMatch')}</span>
                        <span className={`font-medium ${getScoreColor(match.skillsMatch)}`}>
                          {match.skillsMatch}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                      <div 
                        className={`h-2 rounded-full ${getScoreBarColor(match.overallScore)}`}
                        style={{ width: `${match.overallScore}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMatch(match);
                          setShowMatchDetails(true);
                        }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
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

        {activeTab === 'candidates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {candidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {candidate.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {candidate.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {candidate.reputation}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('experience')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {candidate.experience} {t('years')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.salary')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          €{candidate.salaryExpectation.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('location')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {candidate.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {candidate.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                          +{candidate.skills.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        {t('marketplace.viewProfile')}
                      </button>
                      
                      <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors">
                        {t('marketplace.contact')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                          {job.company}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          €{job.salaryMin.toLocaleString()} - €{job.salaryMax.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('marketplace.salary')}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.jobType')}</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {job.jobType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.experienceLevel')}</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {job.experienceLevel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.aiRequirements')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {job.aiRequirements.technicalSkills}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                          +{job.requiredSkills.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        {t('marketplace.viewJob')}
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

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <CpuChipIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalMatches')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{matches.length}</p>
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
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('acceptedMatches')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {matches.filter(m => m.status === 'accepted').length}
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
                    <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('pendingMatches')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {matches.filter(m => m.status === 'pending').length}
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
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('averageScore')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(matches.reduce((acc, m) => acc + m.overallScore, 0) / matches.length || 0)}%
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('matchTrends')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={matches.map((match, index) => ({
                  name: `Match ${index + 1}`,
                  aiScore: match.aiMatchScore,
                  humanScore: match.humanScore,
                  overallScore: match.overallScore
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="aiScore" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="humanScore" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="overallScore" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Match Details Modal */}
        <AnimatePresence>
          {showMatchDetails && selectedMatch && (
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
                    {selectedMatch.jobTitle} - {selectedMatch.candidateName}
                  </h2>
                  <button
                    onClick={() => {
                      setShowMatchDetails(false);
                      setSelectedMatch(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <EyeIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Match Overview */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('matchOverview')}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('overallScore')}</p>
                          <p className={`text-2xl font-bold ${getScoreColor(selectedMatch.overallScore)}`}>
                            {selectedMatch.overallScore}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('matchStatus')}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                            {selectedMatch.status}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('scoreBreakdown')}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries({
                          skillsMatch: selectedMatch.skillsMatch,
                          experienceMatch: selectedMatch.experienceMatch,
                          cultureMatch: selectedMatch.cultureMatch,
                          salaryMatch: selectedMatch.salaryMatch,
                          locationMatch: selectedMatch.locationMatch
                        }).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full"
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
                        <CpuChipIcon className="h-5 w-5 text-purple-600" />
                        <span>{t('aiInsights')}</span>
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('learningStyle')}</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedMatch.aiInsights.learningStyle}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('strengthAreas')}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedMatch.aiInsights.strengthAreas.map((area, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations and Risk Factors */}
                  <div className="space-y-6">
                    {/* Recommendations */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <LightBulbIcon className="h-5 w-5 text-yellow-600" />
                        <span>{t('recommendations')}</span>
                      </h3>
                      <div className="space-y-2">
                        {selectedMatch.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                        <span>{t('riskFactors')}</span>
                      </h3>
                      <div className="space-y-2">
                        {selectedMatch.riskFactors.map((risk, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{risk}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('actions')}
                      </h3>
                      <div className="space-y-3">
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                          {t('acceptMatch')}
                        </button>
                        <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                          {t('rejectMatch')}
                        </button>
                        <button className="w-full bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors">
                          {t('requestMoreInfo')}
                        </button>
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

export default AIMatchingSystem;

