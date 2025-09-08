import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  UserGroupIcon,
  CalendarIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const JobPostingManager = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [jobs, setJobs] = useState([]);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    jobType: 'fullTime',
    experienceLevel: 'entry',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requiredSkills: [],
    preferredCertifications: [],
    requiredExperience: '',
    deadline: '',
    maxApplicants: '',
    category: 'technology'
  });

  const jobTypes = [
    { id: 'fullTime', label: t('marketplace.fullTime'), icon: ClockIcon },
    { id: 'partTime', label: t('marketplace.partTime'), icon: ClockIcon },
    { id: 'contract', label: t('marketplace.contract'), icon: BriefcaseIcon },
    { id: 'internship', label: t('marketplace.internship'), icon: AcademicCapIcon },
    { id: 'remote', label: t('marketplace.remote'), icon: MapPinIcon },
    { id: 'hybrid', label: t('marketplace.hybrid'), icon: BuildingOfficeIcon },
    { id: 'onSite', label: t('marketplace.onSite'), icon: BuildingOfficeIcon }
  ];

  const experienceLevels = [
    { id: 'entry', label: t('marketplace.entry'), icon: AcademicCapIcon },
    { id: 'mid', label: t('marketplace.mid'), icon: StarIcon },
    { id: 'senior', label: t('marketplace.senior'), icon: StarIcon },
    { id: 'expert', label: t('marketplace.expert'), icon: StarIcon }
  ];

  const tabs = [
    { id: 'all', label: t('all'), icon: BriefcaseIcon },
    { id: 'active', label: t('marketplace.active'), icon: CheckCircleIcon },
    { id: 'pending', label: t('marketplace.pending'), icon: ClockIcon },
    { id: 'closed', label: t('marketplace.closed'), icon: XCircleIcon }
  ];

  // Simulación de datos de empleos
  useEffect(() => {
    const mockJobs = [
      {
        id: 1,
        title: 'Desarrollador Blockchain Senior',
        company: 'TechCorp',
        location: 'Madrid, España',
        jobType: 'fullTime',
        experienceLevel: 'senior',
        salaryMin: 60000,
        salaryMax: 90000,
        description: 'Buscamos un desarrollador blockchain experimentado para liderar proyectos DeFi...',
        requiredSkills: ['Solidity', 'React', 'Node.js', 'Ethereum'],
        preferredCertifications: ['Certified Blockchain Developer'],
        requiredExperience: 36,
        deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
        maxApplicants: 50,
        currentApplicants: 12,
        isActive: true,
        category: 'technology',
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        employer: '0x1234...5678',
        applications: [
          {
            id: 1,
            applicant: '0x8765...4321',
            applicantName: 'Alice Johnson',
            coverLetter: 'Experiencia sólida en desarrollo blockchain...',
            aiMatchScore: 92,
            humanScore: 88,
            status: 'pending',
            appliedAt: Date.now() - 2 * 24 * 60 * 60 * 1000
          }
        ]
      },
      {
        id: 2,
        title: 'Analista de Datos',
        company: 'DataFlow',
        location: 'Barcelona, España',
        jobType: 'contract',
        experienceLevel: 'mid',
        salaryMin: 45000,
        salaryMax: 65000,
        description: 'Analista de datos para proyectos de machine learning...',
        requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Tableau'],
        preferredCertifications: ['Google Data Analytics'],
        requiredExperience: 24,
        deadline: Date.now() + 21 * 24 * 60 * 60 * 1000,
        maxApplicants: 30,
        currentApplicants: 8,
        isActive: true,
        category: 'data',
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        employer: '0x1234...5678',
        applications: []
      }
    ];

    setJobs(mockJobs);
  }, []);

  const handlePostJob = async () => {
    if (!isConnected) {
      toast.error(t('connectWallet'));
      return;
    }

    setLoading(true);
    try {
      // Simular publicación de empleo
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newJob = {
        id: jobs.length + 1,
        ...jobForm,
        currentApplicants: 0,
        isActive: true,
        createdAt: Date.now(),
        employer: address,
        applications: []
      };

      setJobs([newJob, ...jobs]);
      setShowPostJobModal(false);
      setJobForm({
        title: '',
        company: '',
        location: '',
        jobType: 'fullTime',
        experienceLevel: 'entry',
        salaryMin: '',
        salaryMax: '',
        description: '',
        requiredSkills: [],
        preferredCertifications: [],
        requiredExperience: '',
        deadline: '',
        maxApplicants: '',
        category: 'technology'
      });
      toast.success(t('jobPostedSuccessfully'));
    } catch (error) {
      toast.error(t('errorPostingJob'));
      console.error('Error posting job:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobTypeIcon = (jobType) => {
    const type = jobTypes.find(t => t.id === jobType);
    return type ? type.icon : BriefcaseIcon;
  };

  const getExperienceIcon = (level) => {
    const exp = experienceLevels.find(e => e.id === level);
    return exp ? exp.icon : AcademicCapIcon;
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return job.isActive;
    if (activeTab === 'pending') return !job.isActive && job.currentApplicants > 0;
    if (activeTab === 'closed') return !job.isActive && job.currentApplicants === 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <BriefcaseIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('marketplace.jobPosting')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('marketplace.jobPostingDescription')}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPostJobModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('marketplace.postJob')}</span>
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
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredJobs.map((job, index) => (
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
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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
                      <div className="flex items-center space-x-1 mb-2">
                        {getJobTypeIcon(job.jobType)({ className: "h-4 w-4 text-blue-600" })}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {jobTypes.find(t => t.id === job.jobType)?.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getExperienceIcon(job.experienceLevel)({ className: "h-4 w-4 text-green-600" })}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {experienceLevels.find(e => e.id === job.experienceLevel)?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.salary')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        €{job.salaryMin.toLocaleString()} - €{job.salaryMax.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.applications')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {job.currentApplicants}/{job.maxApplicants}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('marketplace.deadline')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setShowPostJobModal(true);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
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

        {/* Post Job Modal */}
        <AnimatePresence>
          {showPostJobModal && (
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
                  {selectedJob ? t('editJob') : t('marketplace.postJob')}
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('marketplace.jobTitle')}
                      </label>
                      <input
                        type="text"
                        value={jobForm.title}
                        onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Desarrollador Blockchain"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('marketplace.company')}
                      </label>
                      <input
                        type="text"
                        value={jobForm.company}
                        onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="TechCorp"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('marketplace.location')}
                      </label>
                      <input
                        type="text"
                        value={jobForm.location}
                        onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Madrid, España"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('marketplace.jobType')}
                      </label>
                      <select
                        value={jobForm.jobType}
                        onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {jobTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('marketplace.salary')} Min
                      </label>
                      <input
                        type="number"
                        value={jobForm.salaryMin}
                        onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('marketplace.salary')} Max
                      </label>
                      <input
                        type="number"
                        value={jobForm.salaryMax}
                        onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="80000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('marketplace.experienceLevel')}
                      </label>
                      <select
                        value={jobForm.experienceLevel}
                        onChange={(e) => setJobForm({ ...jobForm, experienceLevel: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {experienceLevels.map(level => (
                          <option key={level.id} value={level.id}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('marketplace.jobDescription')}
                    </label>
                    <textarea
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Describe el empleo..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('marketplace.deadline')}
                      </label>
                      <input
                        type="date"
                        value={jobForm.deadline}
                        onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('marketplace.maxApplicants')}
                      </label>
                      <input
                        type="number"
                        value={jobForm.maxApplicants}
                        onChange={(e) => setJobForm({ ...jobForm, maxApplicants: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowPostJobModal(false);
                      setSelectedJob(null);
                      setJobForm({
                        title: '',
                        company: '',
                        location: '',
                        jobType: 'fullTime',
                        experienceLevel: 'entry',
                        salaryMin: '',
                        salaryMax: '',
                        description: '',
                        requiredSkills: [],
                        preferredCertifications: [],
                        requiredExperience: '',
                        deadline: '',
                        maxApplicants: '',
                        category: 'technology'
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('marketplace.cancel')}
                  </button>
                  <button
                    onClick={handlePostJob}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {loading ? t('posting') : (selectedJob ? t('updateJob') : t('marketplace.postJob'))}
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

export default JobPostingManager;

