import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { toast } from 'react-hot-toast';
import { 
  BookOpenIcon, 
  ClockIcon, 
  UsersIcon, 
  StarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const CourseManagement = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    price: 'all',
    status: 'all'
  });

  // Estados para crear/editar curso
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    content: '',
    price: '',
    duration: '',
    maxStudents: '',
    skills: [],
    difficulty: 1,
    category: ''
  });

  const tabs = [
    { id: 'all', label: t('allCourses'), icon: BookOpenIcon },
    { id: 'my-courses', label: t('myCourses'), icon: UsersIcon },
    { id: 'enrolled', label: t('enrolled'), icon: StarIcon },
    { id: 'completed', label: t('completed'), icon: ChartBarIcon }
  ];

  const categories = [
    'blockchain', 'web3', 'defi', 'nft', 'smart-contracts',
    'programming', 'ai', 'data-science', 'business', 'design'
  ];

  const difficulties = [
    { value: 1, label: t('beginner'), color: 'bg-green-100 text-green-800' },
    { value: 2, label: t('intermediate'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 3, label: t('advanced'), color: 'bg-orange-100 text-orange-800' },
    { value: 4, label: t('expert'), color: 'bg-red-100 text-red-800' },
    { value: 5, label: t('master'), color: 'bg-purple-100 text-purple-800' }
  ];

  // Simulación de datos de cursos (en producción vendría del contrato)
  useEffect(() => {
    const mockCourses = [
      {
        id: 1,
        title: 'Blockchain Fundamentals',
        description: 'Learn the basics of blockchain technology and its applications',
        instructor: '0x1234...5678',
        price: ethers.utils.parseEther('0.1'),
        duration: 30,
        maxStudents: 100,
        currentStudents: 45,
        difficulty: 2,
        category: 'blockchain',
        skills: ['blockchain', 'crypto', 'web3'],
        isActive: true,
        createdAt: Date.now() - 86400000,
        rating: 4.5,
        totalEarnings: ethers.utils.parseEther('4.5')
      },
      {
        id: 2,
        title: 'Smart Contract Development',
        description: 'Master Solidity and smart contract development',
        instructor: '0x8765...4321',
        price: ethers.utils.parseEther('0.2'),
        duration: 45,
        maxStudents: 50,
        currentStudents: 30,
        difficulty: 3,
        category: 'smart-contracts',
        skills: ['solidity', 'ethereum', 'defi'],
        isActive: true,
        createdAt: Date.now() - 172800000,
        rating: 4.8,
        totalEarnings: ethers.utils.parseEther('6.0')
      }
    ];
    setCourses(mockCourses);
  }, []);

  const handleCreateCourse = async () => {
    if (!isConnected) {
      toast.error(t('connectWallet'));
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la llamada al contrato para crear el curso
      const newCourse = {
        id: courses.length + 1,
        ...courseForm,
        instructor: address,
        currentStudents: 0,
        isActive: true,
        createdAt: Date.now(),
        rating: 0,
        totalEarnings: ethers.utils.parseEther('0')
      };

      setCourses([newCourse, ...courses]);
      setShowCreateModal(false);
      setCourseForm({
        title: '',
        description: '',
        content: '',
        price: '',
        duration: '',
        maxStudents: '',
        skills: [],
        difficulty: 1,
        category: ''
      });
      toast.success(t('courseCreated'));
    } catch (error) {
      toast.error(t('errorCreatingCourse'));
      console.error('Error creating course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description,
      content: course.content || '',
      price: ethers.utils.formatEther(course.price),
      duration: course.duration.toString(),
      maxStudents: course.maxStudents.toString(),
      skills: course.skills,
      difficulty: course.difficulty,
      category: course.category
    });
    setShowCreateModal(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm(t('confirmDeleteCourse'))) return;

    try {
      // Aquí iría la llamada al contrato para desactivar el curso
      setCourses(courses.filter(c => c.id !== courseId));
      toast.success(t('courseDeleted'));
    } catch (error) {
      toast.error(t('errorDeletingCourse'));
    }
  };

  const filteredCourses = courses.filter(course => {
    if (activeTab === 'my-courses' && course.instructor !== address) return false;
    if (filters.category !== 'all' && course.category !== filters.category) return false;
    if (filters.difficulty !== 'all' && course.difficulty !== parseInt(filters.difficulty)) return false;
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('courseManagement')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('manageCoursesDescription')}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('createCourse')}</span>
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
                    ? 'bg-primary-600 text-white shadow-sm'
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('allCategories')}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{t(cat)}</option>
              ))}
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('allDifficulties')}</option>
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>

            <select
              value={filters.price}
              onChange={(e) => setFilters({ ...filters, price: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('allPrices')}</option>
              <option value="free">{t('free')}</option>
              <option value="paid">{t('paid')}</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('allStatus')}</option>
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </select>
          </div>
        </motion.div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
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
                        {course.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {course.description}
                      </p>
                    </div>
                    {course.instructor === address && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('price')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ethers.utils.formatEther(course.price)} ETH
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('duration')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {course.duration} {t('days')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('students')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {course.currentStudents}/{course.maxStudents}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('difficulty')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        difficulties.find(d => d.value === course.difficulty)?.color
                      }`}>
                        {difficulties.find(d => d.value === course.difficulty)?.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('rating')}</span>
                      <div className="flex items-center space-x-1">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {course.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                      {t('viewDetails')}
                    </button>
                    {course.instructor === address && (
                      <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors">
                        {t('analytics')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Create/Edit Course Modal */}
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
                  {selectedCourse ? t('editCourse') : t('createCourse')}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('courseTitle')}
                    </label>
                    <input
                      type="text"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('enterCourseTitle')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('description')}
                    </label>
                    <textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('enterDescription')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('price')} (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('duration')} ({t('days')})
                      </label>
                      <input
                        type="number"
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('maxStudents')}
                      </label>
                      <input
                        type="number"
                        value={courseForm.maxStudents}
                        onChange={(e) => setCourseForm({ ...courseForm, maxStudents: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('difficulty')}
                      </label>
                      <select
                        value={courseForm.difficulty}
                        onChange={(e) => setCourseForm({ ...courseForm, difficulty: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {difficulties.map(diff => (
                          <option key={diff.value} value={diff.value}>{diff.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('category')}
                    </label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('selectCategory')}</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{t(cat)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedCourse(null);
                      setCourseForm({
                        title: '',
                        description: '',
                        content: '',
                        price: '',
                        duration: '',
                        maxStudents: '',
                        skills: [],
                        difficulty: 1,
                        category: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleCreateCourse}
                    disabled={loading}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {loading ? t('creating') : (selectedCourse ? t('updateCourse') : t('createCourse'))}
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

export default CourseManagement;
