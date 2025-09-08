import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { 
  AcademicCapIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  CpuChipIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const ScholarshipManager = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [scholarships, setScholarships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  // Estados para crear beca
  const [scholarshipForm, setScholarshipForm] = useState({
    name: '',
    description: '',
    amount: '',
    maxRecipients: '',
    deadline: '',
    criteria: {
      minGPA: '',
      minAge: '',
      maxAge: '',
      requiredSkills: [],
      eligibleCountries: [],
      maxIncome: ''
    }
  });

  // Estados para aplicar a beca
  const [applicationForm, setApplicationForm] = useState({
    scholarshipId: '',
    personalInfo: {
      name: '',
      email: '',
      age: '',
      country: '',
      income: ''
    },
    academicInfo: {
      gpa: '',
      currentInstitution: '',
      fieldOfStudy: '',
      expectedGraduation: ''
    },
    essay: '',
    skills: [],
    achievements: []
  });

  const tabs = [
    { id: 'available', label: t('availableScholarships'), icon: AcademicCapIcon },
    { id: 'my-applications', label: t('myApplications'), icon: DocumentTextIcon },
    { id: 'my-scholarships', label: t('myScholarships'), icon: UserGroupIcon },
    { id: 'approved', label: t('approvedScholarships'), icon: CheckCircleIcon }
  ];

  // Simulación de becas (en producción vendría del contrato)
  useEffect(() => {
    const mockScholarships = [
      {
        id: 1,
        name: 'Blockchain Innovation Scholarship',
        description: 'Supporting students pursuing blockchain and Web3 education',
        sponsor: '0x1234...5678',
        sponsorName: 'Crypto Foundation',
        amount: ethers.utils.parseEther('2.0'),
        maxRecipients: 10,
        currentRecipients: 3,
        deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        status: 'active',
        criteria: {
          minGPA: 3.5,
          minAge: 18,
          maxAge: 25,
          requiredSkills: ['blockchain', 'programming'],
          eligibleCountries: ['US', 'CA', 'UK', 'DE'],
          maxIncome: ethers.utils.parseEther('50000')
        },
        aiScore: 85,
        humanScore: 82,
        totalApplications: 45,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000
      },
      {
        id: 2,
        name: 'DeFi Development Grant',
        description: 'Funding for DeFi protocol development and research',
        sponsor: '0x8765...4321',
        sponsorName: 'DeFi Alliance',
        amount: ethers.utils.parseEther('5.0'),
        maxRecipients: 5,
        currentRecipients: 1,
        deadline: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days
        status: 'active',
        criteria: {
          minGPA: 3.8,
          minAge: 20,
          maxAge: 30,
          requiredSkills: ['defi', 'solidity', 'ethereum'],
          eligibleCountries: ['US', 'CA', 'UK', 'SG'],
          maxIncome: ethers.utils.parseEther('75000')
        },
        aiScore: 92,
        humanScore: 89,
        totalApplications: 23,
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000
      }
    ];

    const mockApplications = [
      {
        id: 1,
        scholarshipId: 1,
        studentAddress: '0x1234...5678',
        studentName: 'Alice Johnson',
        status: 'pending',
        aiScore: 87,
        humanScore: 85,
        appliedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        personalInfo: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          age: 22,
          country: 'US',
          income: ethers.utils.parseEther('35000')
        },
        academicInfo: {
          gpa: 3.7,
          currentInstitution: 'MIT',
          fieldOfStudy: 'Computer Science',
          expectedGraduation: '2024'
        },
        essay: 'I am passionate about blockchain technology and want to contribute to the Web3 ecosystem...',
        skills: ['blockchain', 'solidity', 'javascript'],
        achievements: ['Dean\'s List', 'Hackathon Winner']
      }
    ];

    setScholarships(mockScholarships);
    setApplications(mockApplications);
  }, []);

  const handleCreateScholarship = async () => {
    if (!isConnected) {
      toast.error(t('connectWallet'));
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la llamada al contrato para crear la beca
      const newScholarship = {
        id: scholarships.length + 1,
        ...scholarshipForm,
        sponsor: address,
        sponsorName: 'Current User',
        currentRecipients: 0,
        status: 'active',
        aiScore: 0,
        humanScore: 0,
        totalApplications: 0,
        createdAt: Date.now()
      };

      setScholarships([newScholarship, ...scholarships]);
      setShowCreateModal(false);
      setScholarshipForm({
        name: '',
        description: '',
        amount: '',
        maxRecipients: '',
        deadline: '',
        criteria: {
          minGPA: '',
          minAge: '',
          maxAge: '',
          requiredSkills: [],
          eligibleCountries: [],
          maxIncome: ''
        }
      });
      toast.success(t('scholarshipCreated'));
    } catch (error) {
      toast.error(t('errorCreatingScholarship'));
      console.error('Error creating scholarship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyScholarship = async () => {
    if (!isConnected) {
      toast.error(t('connectWallet'));
      return;
    }

    setLoading(true);
    try {
      // Simular evaluación de IA
      await new Promise(resolve => setTimeout(resolve, 2000));

      const aiScore = Math.floor(Math.random() * 30) + 70; // 70-100
      const humanScore = Math.floor(Math.random() * 20) + (aiScore - 10); // ±10 del score de IA

      const newApplication = {
        id: applications.length + 1,
        scholarshipId: applicationForm.scholarshipId,
        studentAddress: address,
        studentName: applicationForm.personalInfo.name,
        status: 'pending',
        aiScore,
        humanScore,
        appliedAt: Date.now(),
        ...applicationForm
      };

      setApplications([newApplication, ...applications]);
      setShowApplyModal(false);
      setApplicationForm({
        scholarshipId: '',
        personalInfo: {
          name: '',
          email: '',
          age: '',
          country: '',
          income: ''
        },
        academicInfo: {
          gpa: '',
          currentInstitution: '',
          fieldOfStudy: '',
          expectedGraduation: ''
        },
        essay: '',
        skills: [],
        achievements: []
      });
      toast.success(t('applicationSubmitted'));
    } catch (error) {
      toast.error(t('errorSubmittingApplication'));
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: 'approved' } : app
      ));
      toast.success(t('applicationApproved'));
    } catch (error) {
      toast.error(t('errorApprovingApplication'));
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: 'rejected' } : app
      ));
      toast.success(t('applicationRejected'));
    } catch (error) {
      toast.error(t('errorRejectingApplication'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircleIcon;
      case 'pending': return ClockIcon;
      case 'approved': return CheckCircleIcon;
      case 'rejected': return XCircleIcon;
      case 'closed': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const filteredScholarships = scholarships.filter(scholarship => {
    if (activeTab === 'my-scholarships' && scholarship.sponsor !== address) return false;
    if (activeTab === 'approved' && scholarship.status !== 'approved') return false;
    return true;
  });

  const filteredApplications = applications.filter(application => {
    if (activeTab === 'my-applications' && application.studentAddress !== address) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                <AcademicCapIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('scholarshipManager')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('aiPoweredScholarshipManagement')}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('createScholarship')}</span>
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
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Scholarship Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredScholarships.map((scholarship, index) => (
              <motion.div
                key={scholarship.id}
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
                        {scholarship.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {scholarship.description}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(scholarship.status)}`}>
                      <div className="flex items-center space-x-1">
                        {React.createElement(getStatusIcon(scholarship.status), { className: "h-4 w-4" })}
                        <span>{t(scholarship.status)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('amount')}</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {ethers.utils.formatEther(scholarship.amount)} ETH
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('recipients')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {scholarship.currentRecipients}/{scholarship.maxRecipients}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('deadline')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(scholarship.deadline).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('applications')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {scholarship.totalApplications}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('aiScore')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {scholarship.aiScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {scholarship.criteria.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    {scholarship.sponsor !== address && (
                      <button
                        onClick={() => {
                          setSelectedScholarship(scholarship);
                          setApplicationForm({ ...applicationForm, scholarshipId: scholarship.id });
                          setShowApplyModal(true);
                        }}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        {t('apply')}
                      </button>
                    )}
                    
                    {scholarship.sponsor === address && (
                      <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors">
                        {t('manage')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Applications List */}
        {activeTab === 'my-applications' && (
          <motion.div 
            className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t('myApplications')}
            </h2>
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div key={application.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {scholarships.find(s => s.id === application.scholarshipId)?.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Applied: {new Date(application.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {t(application.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('aiScore')}</span>
                      <p className="font-medium text-gray-900 dark:text-white">{application.aiScore}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('humanScore')}</span>
                      <p className="font-medium text-gray-900 dark:text-white">{application.humanScore}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('gpa')}</span>
                      <p className="font-medium text-gray-900 dark:text-white">{application.academicInfo.gpa}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                      {t('viewDetails')}
                    </button>
                    {application.status === 'pending' && (
                      <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors">
                        {t('withdraw')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Create Scholarship Modal */}
        <AnimatePresence>
          {showCreateModal && (
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
                  {t('createScholarship')}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('scholarshipName')}
                    </label>
                    <input
                      type="text"
                      value={scholarshipForm.name}
                      onChange={(e) => setScholarshipForm({ ...scholarshipForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('enterScholarshipName')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('description')}
                    </label>
                    <textarea
                      value={scholarshipForm.description}
                      onChange={(e) => setScholarshipForm({ ...scholarshipForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('enterDescription')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('amount')} (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={scholarshipForm.amount}
                        onChange={(e) => setScholarshipForm({ ...scholarshipForm, amount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="2.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('maxRecipients')}
                      </label>
                      <input
                        type="number"
                        value={scholarshipForm.maxRecipients}
                        onChange={(e) => setScholarshipForm({ ...scholarshipForm, maxRecipients: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('deadline')}
                    </label>
                    <input
                      type="date"
                      value={scholarshipForm.deadline}
                      onChange={(e) => setScholarshipForm({ ...scholarshipForm, deadline: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('minGPA')}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="4"
                        value={scholarshipForm.criteria.minGPA}
                        onChange={(e) => setScholarshipForm({
                          ...scholarshipForm,
                          criteria: { ...scholarshipForm.criteria, minGPA: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="3.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('maxIncome')} (USD)
                      </label>
                      <input
                        type="number"
                        value={scholarshipForm.criteria.maxIncome}
                        onChange={(e) => setScholarshipForm({
                          ...scholarshipForm,
                          criteria: { ...scholarshipForm.criteria, maxIncome: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="50000"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setScholarshipForm({
                        name: '',
                        description: '',
                        amount: '',
                        maxRecipients: '',
                        deadline: '',
                        criteria: {
                          minGPA: '',
                          minAge: '',
                          maxAge: '',
                          requiredSkills: [],
                          eligibleCountries: [],
                          maxIncome: ''
                        }
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleCreateScholarship}
                    disabled={loading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {loading ? t('creating') : t('createScholarship')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apply for Scholarship Modal */}
        <AnimatePresence>
          {showApplyModal && selectedScholarship && (
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
                  {t('applyForScholarship')}: {selectedScholarship.name}
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('name')}
                      </label>
                      <input
                        type="text"
                        value={applicationForm.personalInfo.name}
                        onChange={(e) => setApplicationForm({
                          ...applicationForm,
                          personalInfo: { ...applicationForm.personalInfo, name: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('email')}
                      </label>
                      <input
                        type="email"
                        value={applicationForm.personalInfo.email}
                        onChange={(e) => setApplicationForm({
                          ...applicationForm,
                          personalInfo: { ...applicationForm.personalInfo, email: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('age')}
                      </label>
                      <input
                        type="number"
                        value={applicationForm.personalInfo.age}
                        onChange={(e) => setApplicationForm({
                          ...applicationForm,
                          personalInfo: { ...applicationForm.personalInfo, age: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('gpa')}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="4"
                        value={applicationForm.academicInfo.gpa}
                        onChange={(e) => setApplicationForm({
                          ...applicationForm,
                          academicInfo: { ...applicationForm.academicInfo, gpa: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('essay')}
                    </label>
                    <textarea
                      value={applicationForm.essay}
                      onChange={(e) => setApplicationForm({ ...applicationForm, essay: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('writeYourEssay')}
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowApplyModal(false);
                      setSelectedScholarship(null);
                      setApplicationForm({
                        scholarshipId: '',
                        personalInfo: {
                          name: '',
                          email: '',
                          age: '',
                          country: '',
                          income: ''
                        },
                        academicInfo: {
                          gpa: '',
                          currentInstitution: '',
                          fieldOfStudy: '',
                          expectedGraduation: ''
                        },
                        essay: '',
                        skills: [],
                        achievements: []
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleApplyScholarship}
                    disabled={loading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {loading ? t('submitting') : t('submitApplication')}
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

export default ScholarshipManager;
