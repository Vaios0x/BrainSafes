import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { 
  AcademicCapIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PlusIcon,
  CogIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const CertificateNFTManager = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [activeTab, setActiveTab] = useState('my-certificates');
  const [filters, setFilters] = useState({
    status: 'all',
    course: 'all',
    dateRange: 'all'
  });

  // Estados para emitir certificado
  const [certificateForm, setCertificateForm] = useState({
    studentAddress: '',
    courseId: '',
    courseName: '',
    score: '',
    completionDate: '',
    metadata: {
      description: '',
      skills: [],
      issuer: '',
      validUntil: ''
    }
  });

  const tabs = [
    { id: 'my-certificates', label: t('myCertificates'), icon: AcademicCapIcon },
    { id: 'issued', label: t('issuedCertificates'), icon: DocumentTextIcon },
    { id: 'pending', label: t('pendingCertificates'), icon: ClockIcon },
    { id: 'revoked', label: t('revokedCertificates'), icon: XCircleIcon }
  ];

  // Simulación de certificados (en producción vendría del contrato)
  useEffect(() => {
    const mockCertificates = [
      {
        id: 1,
        tokenId: '1',
        studentAddress: '0x1234...5678',
        studentName: 'Alice Johnson',
        courseId: 1,
        courseName: 'Blockchain Fundamentals',
        score: 85,
        completionDate: Date.now() - 86400000,
        issueDate: Date.now() - 86400000,
        issuer: '0x8765...4321',
        issuerName: 'Dr. Smith',
        status: 'active',
        metadata: {
          description: 'Certificate for completing Blockchain Fundamentals course',
          skills: ['blockchain', 'crypto', 'web3'],
          issuer: 'BrainSafes Academy',
          validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
          ipfsHash: 'QmX...',
          verificationUrl: 'https://brainsafes.com/verify/1'
        },
        nftContract: '0xABC...',
        transactionHash: '0xDEF...',
        isVerified: true,
        verificationCount: 15
      },
      {
        id: 2,
        tokenId: '2',
        studentAddress: '0x8765...4321',
        studentName: 'Bob Smith',
        courseId: 2,
        courseName: 'Smart Contract Development',
        score: 92,
        completionDate: Date.now() - 172800000,
        issueDate: Date.now() - 172800000,
        issuer: '0x1234...5678',
        issuerName: 'Prof. Johnson',
        status: 'active',
        metadata: {
          description: 'Certificate for completing Smart Contract Development course',
          skills: ['solidity', 'ethereum', 'defi', 'nft'],
          issuer: 'BrainSafes Academy',
          validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000,
          ipfsHash: 'QmY...',
          verificationUrl: 'https://brainsafes.com/verify/2'
        },
        nftContract: '0xABC...',
        transactionHash: '0xGHI...',
        isVerified: true,
        verificationCount: 8
      }
    ];
    setCertificates(mockCertificates);
  }, []);

  const handleIssueCertificate = async () => {
    if (!isConnected) {
      toast.error(t('connectWallet'));
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la llamada al contrato para emitir el certificado NFT
      const newCertificate = {
        id: certificates.length + 1,
        tokenId: (certificates.length + 1).toString(),
        studentAddress: certificateForm.studentAddress,
        studentName: 'New Student',
        courseId: certificateForm.courseId,
        courseName: certificateForm.courseName,
        score: parseInt(certificateForm.score),
        completionDate: new Date(certificateForm.completionDate).getTime(),
        issueDate: Date.now(),
        issuer: address,
        issuerName: 'Current User',
        status: 'active',
        metadata: {
          ...certificateForm.metadata,
          validUntil: new Date(certificateForm.metadata.validUntil).getTime(),
          ipfsHash: 'QmZ...',
          verificationUrl: `https://brainsafes.com/verify/${certificates.length + 1}`
        },
        nftContract: '0xABC...',
        transactionHash: '0xJKL...',
        isVerified: true,
        verificationCount: 0
      };

      setCertificates([newCertificate, ...certificates]);
      setShowIssueModal(false);
      setCertificateForm({
        studentAddress: '',
        courseId: '',
        courseName: '',
        score: '',
        completionDate: '',
        metadata: {
          description: '',
          skills: [],
          issuer: '',
          validUntil: ''
        }
      });
      toast.success(t('certificateIssued'));
    } catch (error) {
      toast.error(t('errorIssuingCertificate'));
      console.error('Error issuing certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCertificate = async (certificateId) => {
    if (!confirm(t('confirmRevokeCertificate'))) return;

    try {
      // Aquí iría la llamada al contrato para revocar el certificado
      setCertificates(certificates.map(c => 
        c.id === certificateId ? { ...c, status: 'revoked' } : c
      ));
      toast.success(t('certificateRevoked'));
    } catch (error) {
      toast.error(t('errorRevokingCertificate'));
    }
  };

  const handleVerifyCertificate = async (certificateId) => {
    try {
      const certificate = certificates.find(c => c.id === certificateId);
      if (certificate) {
        // Simular verificación
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(t('certificateVerified'));
      }
    } catch (error) {
      toast.error(t('errorVerifyingCertificate'));
    }
  };

  const handleDownloadCertificate = (certificate) => {
    // Simular descarga del certificado
    const certificateData = {
      ...certificate,
      downloadUrl: `https://brainsafes.com/certificates/${certificate.tokenId}.pdf`
    };
    console.log('Downloading certificate:', certificateData);
    toast.success(t('certificateDownloaded'));
  };

  const handleShareCertificate = (certificate) => {
    const shareUrl = certificate.metadata.verificationUrl;
    if (navigator.share) {
      navigator.share({
        title: `${certificate.courseName} Certificate`,
        text: `Check out my ${certificate.courseName} certificate!`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success(t('certificateUrlCopied'));
    }
  };

  const filteredCertificates = certificates.filter(certificate => {
    if (activeTab === 'my-certificates' && certificate.studentAddress !== address) return false;
    if (activeTab === 'issued' && certificate.issuer !== address) return false;
    if (filters.status !== 'all' && certificate.status !== filters.status) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircleIcon;
      case 'pending': return ClockIcon;
      case 'revoked': return XCircleIcon;
      default: return ClockIcon;
    }
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
                <AcademicCapIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('certificateNFTManager')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('manageCertificatesDescription')}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowIssueModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('issueCertificate')}</span>
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

        {/* Filters */}
        <motion.div 
          className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('allStatus')}</option>
              <option value="active">{t('active')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="revoked">{t('revoked')}</option>
            </select>

            <select
              value={filters.course}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('allCourses')}</option>
              <option value="blockchain">Blockchain Fundamentals</option>
              <option value="smart-contracts">Smart Contract Development</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('allDates')}</option>
              <option value="last-week">{t('lastWeek')}</option>
              <option value="last-month">{t('lastMonth')}</option>
              <option value="last-year">{t('lastYear')}</option>
            </select>
          </div>
        </motion.div>

        {/* Certificate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCertificates.map((certificate, index) => (
              <motion.div
                key={certificate.id}
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
                        {certificate.courseName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {certificate.studentName}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                      <div className="flex items-center space-x-1">
                        {React.createElement(getStatusIcon(certificate.status), { className: "h-4 w-4" })}
                        <span>{t(certificate.status)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('score')}</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {certificate.score}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('issueDate')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(certificate.issueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('tokenId')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        #{certificate.tokenId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('verifications')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {certificate.verificationCount}
                      </span>
                    </div>

                    {certificate.isVerified && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('verification')}</span>
                        <div className="flex items-center space-x-1">
                          <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">{t('verified')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {certificate.metadata.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerifyCertificate(certificate.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      {t('verify')}
                    </button>
                    
                    <button
                      onClick={() => handleDownloadCertificate(certificate)}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      {t('download')}
                    </button>
                  </div>

                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleShareCertificate(certificate)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      {t('share')}
                    </button>
                    
                    {certificate.issuer === address && certificate.status === 'active' && (
                      <button
                        onClick={() => handleRevokeCertificate(certificate.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        {t('revoke')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Issue Certificate Modal */}
        <AnimatePresence>
          {showIssueModal && (
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
                  {t('issueCertificate')}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('studentAddress')}
                    </label>
                    <input
                      type="text"
                      value={certificateForm.studentAddress}
                      onChange={(e) => setCertificateForm({ ...certificateForm, studentAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0x..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('courseId')}
                      </label>
                      <input
                        type="number"
                        value={certificateForm.courseId}
                        onChange={(e) => setCertificateForm({ ...certificateForm, courseId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('courseName')}
                      </label>
                      <input
                        type="text"
                        value={certificateForm.courseName}
                        onChange={(e) => setCertificateForm({ ...certificateForm, courseName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Course Name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('score')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={certificateForm.score}
                        onChange={(e) => setCertificateForm({ ...certificateForm, score: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="85"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('completionDate')}
                      </label>
                      <input
                        type="date"
                        value={certificateForm.completionDate}
                        onChange={(e) => setCertificateForm({ ...certificateForm, completionDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('description')}
                    </label>
                    <textarea
                      value={certificateForm.metadata.description}
                      onChange={(e) => setCertificateForm({
                        ...certificateForm,
                        metadata: { ...certificateForm.metadata, description: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('enterDescription')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('validUntil')}
                    </label>
                    <input
                      type="date"
                      value={certificateForm.metadata.validUntil}
                      onChange={(e) => setCertificateForm({
                        ...certificateForm,
                        metadata: { ...certificateForm.metadata, validUntil: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowIssueModal(false);
                      setCertificateForm({
                        studentAddress: '',
                        courseId: '',
                        courseName: '',
                        score: '',
                        completionDate: '',
                        metadata: {
                          description: '',
                          skills: [],
                          issuer: '',
                          validUntil: ''
                        }
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleIssueCertificate}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {loading ? t('issuing') : t('issueCertificate')}
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

export default CertificateNFTManager;
