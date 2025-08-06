import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t transition-colors duration-300 dark:bg-gray-900 dark:border-gray-700 bg-gray-50 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 BrainSafes. {t('footer.rights') || 'Todos los derechos reservados.'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              {t('footer.version') || 'Versión 1.0.0'}
            </p>
            
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              {t('footer.built') || 'Construido con React & Tailwind CSS'}
            </p>
          </div>
        </div>
        
        {/* Additional footer content */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                BrainSafes
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Plataforma descentralizada para la gestión segura de credenciales educativas y profesionales.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Tecnologías
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Blockchain & Smart Contracts</li>
                <li>• Web3 & DeFi Integration</li>
                <li>• AI & Machine Learning</li>
                <li>• Zero-Knowledge Proofs</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Comunidad
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• GitHub</li>
                <li>• Discord</li>
                <li>• Twitter</li>
                <li>• Documentation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 