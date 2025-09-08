import React, { useState, useEffect } from 'react';
import { useContracts } from '../../hooks/useContracts';
import { useAccount } from 'wagmi';

const ContractLearningPanel = () => {
  const { address, isConnected } = useAccount();
  const { 
    createCourse, 
    enrollInCourse, 
    getCourse, 
    isEnrolled,
    getEDUBalance,
    approveEDU,
    addresses,
    isLoading,
    error 
  } = useContracts();

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    ipfsHash: ''
  });

  const [enrollForm, setEnrollForm] = useState({
    courseId: '',
    price: ''
  });

  const [courseInfo, setCourseInfo] = useState(null);
  const [eduBalance, setEduBalance] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState('');

  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected && address) {
        const balance = await getEDUBalance();
        setEduBalance(balance);
      }
    };
    loadBalance();
  }, [isConnected, address, getEDUBalance]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!isConnected) return;

    setIsSubmitting(true);
    setTxStatus('Creating course...');

    try {
      const tx = await createCourse(
        courseForm.title,
        courseForm.description,
        courseForm.price,
        parseInt(courseForm.duration),
        courseForm.ipfsHash || 'QmDefaultHash'
      );
      
      setTxStatus('Transaction sent! Waiting for confirmation...');
      console.log('Course creation transaction:', tx);
      
      setTxStatus('Course created successfully!');
      setCourseForm({
        title: '',
        description: '',
        price: '',
        duration: '',
        ipfsHash: ''
      });
      
      setTimeout(() => setTxStatus(''), 5000);
    } catch (err) {
      console.error('Error creating course:', err);
      setTxStatus(`Error: ${err.message}`);
      setTimeout(() => setTxStatus(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollInCourse = async (e) => {
    e.preventDefault();
    if (!isConnected) return;

    setIsSubmitting(true);
    setTxStatus('Enrolling in course...');

    try {
      // First check if we need to approve EDU tokens
      if (parseFloat(enrollForm.price) > 0) {
        setTxStatus('Approving EDU tokens...');
        await approveEDU(addresses.SimpleCourseNFT, enrollForm.price);
      }

      const tx = await enrollInCourse(
        parseInt(enrollForm.courseId),
        enrollForm.price
      );
      
      setTxStatus('Transaction sent! Waiting for confirmation...');
      console.log('Enrollment transaction:', tx);
      
      setTxStatus('Successfully enrolled in course!');
      setEnrollForm({ courseId: '', price: '' });
      
      setTimeout(() => setTxStatus(''), 5000);
    } catch (err) {
      console.error('Error enrolling in course:', err);
      setTxStatus(`Error: ${err.message}`);
      setTimeout(() => setTxStatus(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetCourseInfo = async () => {
    if (!enrollForm.courseId) return;

    try {
      const course = await getCourse(parseInt(enrollForm.courseId));
      const enrolled = await isEnrolled(parseInt(enrollForm.courseId));
      
      setCourseInfo({ ...course, isUserEnrolled: enrolled });
    } catch (err) {
      console.error('Error getting course info:', err);
      setCourseInfo(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-800 mb-2">Connect Wallet</h2>
        <p className="text-yellow-600">Please connect your wallet to interact with the learning contracts.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading contracts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Contract Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">🎓 Learning Contract Interaction</h1>
        <p className="text-blue-600">Interact with real BrainSafes contracts on Arbitrum Sepolia</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-blue-600">Your EDU Balance:</span>
          <span className="font-bold text-blue-800">{parseFloat(eduBalance).toFixed(2)} EDU</span>
        </div>
      </div>

      {txStatus && (
        <div className={`border rounded-lg p-4 ${
          txStatus.includes('Error') 
            ? 'bg-red-50 border-red-200 text-red-600' 
            : txStatus.includes('successfully') 
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-blue-50 border-blue-200 text-blue-600'
        }`}>
          {txStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Course Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Create Course</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course Title</label>
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter course title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                placeholder="Course description"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Price (ETH)</label>
              <input
                type="number"
                step="0.001"
                value={courseForm.price}
                onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="0.01"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Duration (hours)</label>
              <input
                type="number"
                value={courseForm.duration}
                onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="40"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">IPFS Hash (optional)</label>
              <input
                type="text"
                value={courseForm.ipfsHash}
                onChange={(e) => setCourseForm({ ...courseForm, ipfsHash: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="QmXXXXXX..."
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Course'}
            </button>
          </form>
        </div>

        {/* Course Info & Enrollment */}
        <div className="space-y-6">
          {/* Course Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Course Information</h2>
            <div className="flex space-x-2 mb-4">
              <input
                type="number"
                value={enrollForm.courseId}
                onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Course ID"
              />
              <button
                onClick={handleGetCourseInfo}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Get Info
              </button>
            </div>
            
            {courseInfo && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-bold">{courseInfo.title}</h3>
                <p className="text-sm text-gray-600">{courseInfo.description}</p>
                <div className="flex justify-between text-sm">
                  <span>Price: {parseFloat(courseInfo.price) / 1e18} ETH</span>
                  <span>Duration: {courseInfo.duration.toString()} hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Enrolled: {courseInfo.enrolledCount.toString()}</span>
                  <span className={`font-medium ${courseInfo.isUserEnrolled ? 'text-green-600' : 'text-red-600'}`}>
                    {courseInfo.isUserEnrolled ? '✅ Enrolled' : '❌ Not Enrolled'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Instructor: {courseInfo.instructor}
                </div>
              </div>
            )}
          </div>

          {/* Enrollment Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Enroll in Course</h2>
            <form onSubmit={handleEnrollInCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Course ID</label>
                <input
                  type="number"
                  value={enrollForm.courseId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Price (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={enrollForm.price}
                  onChange={(e) => setEnrollForm({ ...enrollForm, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0.01"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Enrolling...' : 'Enroll in Course'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Contract Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Course NFT:</span>
            <p className="font-mono text-xs text-gray-600">{addresses.SimpleCourseNFT}</p>
          </div>
          <div>
            <span className="font-medium">EDU Token:</span>
            <p className="font-mono text-xs text-gray-600">{addresses.SimpleEDUToken}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractLearningPanel;