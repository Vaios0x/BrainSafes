import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  CloudUploadIcon, 
  DocumentIcon, 
  PhotoIcon, 
  FolderIcon,
  LinkIcon,
  ClipboardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const IPFSManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados para diferentes tipos de upload
  const [fileUpload, setFileUpload] = useState({
    file: null,
    pin: true
  });

  const [metadataUpload, setMetadataUpload] = useState({
    name: 'metadata.json',
    metadata: '',
    pin: true
  });

  const [nftUpload, setNftUpload] = useState({
    image: null,
    name: '',
    description: '',
    attributes: ''
  });

  const [directoryUpload, setDirectoryUpload] = useState({
    files: [],
    directoryName: 'directory'
  });

  // Función para subir archivo
  const handleFileUpload = useCallback(async () => {
    if (!fileUpload.file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', fileUpload.file);
      formData.append('pin', fileUpload.pin);

      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error subiendo archivo');
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadedFiles(prev => [...prev, {
          ...result.data,
          type: 'file',
          timestamp: new Date()
        }]);
        setSuccess('Archivo subido exitosamente');
        setFileUpload({ file: null, pin: true });
      } else {
        throw new Error(result.error);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [fileUpload]);

  // Función para subir metadata
  const handleMetadataUpload = useCallback(async () => {
    if (!metadataUpload.metadata) {
      setError('Por favor ingresa la metadata JSON');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let metadata;
      try {
        metadata = JSON.parse(metadataUpload.metadata);
      } catch (e) {
        throw new Error('JSON inválido');
      }

      const response = await fetch('/api/ipfs/upload-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metadata,
          name: metadataUpload.name,
          pin: metadataUpload.pin
        })
      });

      if (!response.ok) {
        throw new Error('Error subiendo metadata');
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadedFiles(prev => [...prev, {
          ...result.data,
          type: 'metadata',
          timestamp: new Date()
        }]);
        setSuccess('Metadata subida exitosamente');
        setMetadataUpload({ name: 'metadata.json', metadata: '', pin: true });
      } else {
        throw new Error(result.error);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [metadataUpload]);

  // Función para subir NFT
  const handleNFTUpload = useCallback(async () => {
    if (!nftUpload.image || !nftUpload.name || !nftUpload.description) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', nftUpload.image);
      formData.append('name', nftUpload.name);
      formData.append('description', nftUpload.description);
      if (nftUpload.attributes) {
        formData.append('attributes', nftUpload.attributes);
      }

      const response = await fetch('/api/ipfs/upload-nft', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error subiendo NFT');
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadedFiles(prev => [...prev, {
          ...result.data,
          type: 'nft',
          timestamp: new Date()
        }]);
        setSuccess('NFT subido exitosamente');
        setNftUpload({ image: null, name: '', description: '', attributes: '' });
      } else {
        throw new Error(result.error);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [nftUpload]);

  // Función para subir directorio
  const handleDirectoryUpload = useCallback(async () => {
    if (directoryUpload.files.length === 0) {
      setError('Por favor selecciona archivos');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      directoryUpload.files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('directoryName', directoryUpload.directoryName);

      const response = await fetch('/api/ipfs/upload-directory', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error subiendo directorio');
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadedFiles(prev => [...prev, {
          ...result.data,
          type: 'directory',
          timestamp: new Date()
        }]);
        setSuccess('Directorio subido exitosamente');
        setDirectoryUpload({ files: [], directoryName: 'directory' });
      } else {
        throw new Error(result.error);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [directoryUpload]);

  // Función para copiar al portapapeles
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copiado al portapapeles');
    } catch (err) {
      setError('Error copiando al portapapeles');
    }
  }, []);

  // Función para obtener URL de gateway
  const getGatewayUrl = useCallback((hash, gateway = 'ipfs.io') => {
    const gateways = {
      'ipfs.io': `https://ipfs.io/ipfs/${hash}`,
      'pinata': `https://gateway.pinata.cloud/ipfs/${hash}`,
      'cloudflare': `https://cloudflare-ipfs.com/ipfs/${hash}`,
      'dweb': `https://dweb.link/ipfs/${hash}`
    };
    return gateways[gateway] || gateways['ipfs.io'];
  }, []);

  const tabs = [
    { id: 'upload', name: 'Subir Archivo', icon: DocumentIcon },
    { id: 'metadata', name: 'Subir Metadata', icon: DocumentIcon },
    { id: 'nft', name: 'Subir NFT', icon: PhotoIcon },
    { id: 'directory', name: 'Subir Directorio', icon: FolderIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CloudUploadIcon className="w-8 h-8" />
            {t('IPFS Manager')}
          </h1>
          <p className="text-blue-100 mt-1">
            {t('Gestiona archivos y metadata en IPFS de forma segura')}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* File Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={(e) => setFileUpload(prev => ({ ...prev, file: e.target.files[0] }))}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {fileUpload.file ? fileUpload.file.name : 'Haz clic para seleccionar un archivo'}
                      </p>
                    </label>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={fileUpload.pin}
                        onChange={(e) => setFileUpload(prev => ({ ...prev, pin: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Pinear archivo</span>
                    </label>
                  </div>

                  <button
                    onClick={handleFileUpload}
                    disabled={uploading || !fileUpload.file}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon className="w-5 h-5" />
                        Subir Archivo
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Metadata Upload Tab */}
              {activeTab === 'metadata' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del archivo
                    </label>
                    <input
                      type="text"
                      value={metadataUpload.name}
                      onChange={(e) => setMetadataUpload(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="metadata.json"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metadata JSON
                    </label>
                    <textarea
                      value={metadataUpload.metadata}
                      onChange={(e) => setMetadataUpload(prev => ({ ...prev, metadata: e.target.value }))}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder='{"name": "Mi NFT", "description": "Descripción del NFT", "attributes": []}'
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={metadataUpload.pin}
                        onChange={(e) => setMetadataUpload(prev => ({ ...prev, pin: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Pinear metadata</span>
                    </label>
                  </div>

                  <button
                    onClick={handleMetadataUpload}
                    disabled={uploading || !metadataUpload.metadata}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon className="w-5 h-5" />
                        Subir Metadata
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* NFT Upload Tab */}
              {activeTab === 'nft' && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNftUpload(prev => ({ ...prev, image: e.target.files[0] }))}
                      className="hidden"
                      id="nft-image-upload"
                    />
                    <label htmlFor="nft-image-upload" className="cursor-pointer">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {nftUpload.image ? nftUpload.image.name : 'Haz clic para seleccionar una imagen'}
                      </p>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del NFT
                      </label>
                      <input
                        type="text"
                        value={nftUpload.name}
                        onChange={(e) => setNftUpload(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Mi NFT"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={nftUpload.description}
                        onChange={(e) => setNftUpload(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descripción del NFT"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Atributos (JSON opcional)
                    </label>
                    <textarea
                      value={nftUpload.attributes}
                      onChange={(e) => setNftUpload(prev => ({ ...prev, attributes: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder='[{"trait_type": "Rareza", "value": "Común"}]'
                    />
                  </div>

                  <button
                    onClick={handleNFTUpload}
                    disabled={uploading || !nftUpload.image || !nftUpload.name || !nftUpload.description}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon className="w-5 h-5" />
                        Subir NFT
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Directory Upload Tab */}
              {activeTab === 'directory' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del directorio
                    </label>
                    <input
                      type="text"
                      value={directoryUpload.directoryName}
                      onChange={(e) => setDirectoryUpload(prev => ({ ...prev, directoryName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="mi-directorio"
                    />
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setDirectoryUpload(prev => ({ ...prev, files: Array.from(e.target.files) }))}
                      className="hidden"
                      id="directory-upload"
                    />
                    <label htmlFor="directory-upload" className="cursor-pointer">
                      <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Haz clic para seleccionar múltiples archivos
                      </p>
                    </label>
                  </div>

                  {directoryUpload.files.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Archivos seleccionados:</h4>
                      <ul className="space-y-1">
                        {directoryUpload.files.map((file, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <DocumentIcon className="w-4 h-4" />
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={handleDirectoryUpload}
                    disabled={uploading || directoryUpload.files.length === 0}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon className="w-5 h-5" />
                        Subir Directorio
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
              >
                <XCircleIcon className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
              >
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-green-700">{success}</span>
                <button
                  onClick={() => setSuccess(null)}
                  className="ml-auto text-green-500 hover:text-green-700"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Archivos Subidos</h3>
              <div className="space-y-4">
                {uploadedFiles.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {file.type === 'nft' ? (
                            <PhotoIcon className="w-6 h-6 text-blue-600" />
                          ) : file.type === 'directory' ? (
                            <FolderIcon className="w-6 h-6 text-blue-600" />
                          ) : (
                            <DocumentIcon className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {file.type === 'nft' ? 'NFT' : file.type === 'directory' ? 'Directorio' : 'Archivo'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Hash: {file.hash}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(file.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(file.hash)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Copiar hash"
                        >
                          <ClipboardIcon className="w-4 h-4" />
                        </button>
                        <a
                          href={getGatewayUrl(file.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver en IPFS"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {file.type === 'nft' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Token URI:</span>
                            <p className="font-mono text-xs break-all">{file.tokenURI}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Image URI:</span>
                            <p className="font-mono text-xs break-all">{file.imageURI}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IPFSManager;
