describe('BrainSafes Frontend - E2E Testing', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/');
    cy.intercept('GET', '**/api/**').as('apiCall');
  });

  describe('Landing Page', () => {
    it('debería cargar la página principal correctamente', () => {
      cy.get('[data-testid="landing-page"]').should('be.visible');
      cy.contains(/BrainSafes|Bienvenido|Welcome/i).should('be.visible');
      cy.get('[data-testid="hero-section"]').should('exist');
    });

    it('debería mostrar navegación principal', () => {
      cy.get('[data-testid="navbar"]').should('be.visible');
      cy.get('[data-testid="nav-links"]').within(() => {
        cy.contains('Dashboard').should('be.visible');
        cy.contains('Learning').should('be.visible');
        cy.contains('Marketplace').should('be.visible');
        cy.contains('Governance').should('be.visible');
      });
    });

    it('debería conectar wallet correctamente', () => {
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="wallet-modal"]').should('be.visible');
      
      // Simular conexión de wallet
      cy.get('[data-testid="metamask-option"]').click();
      cy.get('[data-testid="wallet-connected"]').should('be.visible');
    });

    it('debería mostrar características principales', () => {
      cy.get('[data-testid="features-section"]').within(() => {
        cy.contains('Blockchain Education').should('be.visible');
        cy.contains('AI-Powered Learning').should('be.visible');
        cy.contains('NFT Certificates').should('be.visible');
        cy.contains('DeFi Integration').should('be.visible');
      });
    });
  });

  describe('Dashboard', () => {
    beforeEach(() => {
      // Conectar wallet y navegar al dashboard
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
      cy.get('[data-testid="dashboard-link"]').click();
    });

    it('debería mostrar dashboard principal', () => {
      cy.get('[data-testid="dashboard"]').should('be.visible');
      cy.get('[data-testid="user-profile"]').should('exist');
      cy.get('[data-testid="quick-stats"]').should('exist');
    });

    it('debería mostrar métricas de usuario', () => {
      cy.get('[data-testid="user-metrics"]').within(() => {
        cy.get('[data-testid="courses-enrolled"]').should('be.visible');
        cy.get('[data-testid="certificates-earned"]').should('be.visible');
        cy.get('[data-testid="reputation-score"]').should('be.visible');
        cy.get('[data-testid="tokens-earned"]').should('be.visible');
      });
    });

    it('debería mostrar cursos recientes', () => {
      cy.get('[data-testid="recent-courses"]').should('be.visible');
      cy.get('[data-testid="course-card"]').should('have.length.at.least', 1);
    });

    it('debería mostrar certificados recientes', () => {
      cy.get('[data-testid="recent-certificates"]').should('be.visible');
      cy.get('[data-testid="certificate-card"]').should('have.length.at.least', 1);
    });

    it('debería mostrar alertas y notificaciones', () => {
      cy.get('[data-testid="alerts-panel"]').should('be.visible');
      cy.get('[data-testid="notification-bell"]').click();
      cy.get('[data-testid="notifications-dropdown"]').should('be.visible');
    });
  });

  describe('Learning Module', () => {
    beforeEach(() => {
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
      cy.get('[data-testid="learning-link"]').click();
    });

    it('debería mostrar catálogo de cursos', () => {
      cy.get('[data-testid="course-catalog"]').should('be.visible');
      cy.get('[data-testid="course-filters"]').should('exist');
      cy.get('[data-testid="course-search"]').should('be.visible');
    });

    it('debería filtrar cursos por categoría', () => {
      cy.get('[data-testid="category-filter"]').click();
      cy.get('[data-testid="blockchain-category"]').click();
      cy.get('[data-testid="course-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Blockchain');
      });
    });

    it('debería buscar cursos', () => {
      cy.get('[data-testid="course-search"]').type('Solidity');
      cy.get('[data-testid="search-results"]').should('contain', 'Solidity');
    });

    it('debería inscribirse en un curso', () => {
      cy.get('[data-testid="course-card"]').first().click();
      cy.get('[data-testid="course-details"]').should('be.visible');
      cy.get('[data-testid="enroll-btn"]').click();
      cy.get('[data-testid="enrollment-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-enrollment"]').click();
      cy.get('[data-testid="enrollment-success"]').should('be.visible');
    });

    it('debería mostrar progreso del curso', () => {
      cy.get('[data-testid="my-courses"]').click();
      cy.get('[data-testid="enrolled-course"]').first().click();
      cy.get('[data-testid="course-progress"]').should('be.visible');
      cy.get('[data-testid="progress-bar"]').should('exist');
    });

    it('debería completar un módulo', () => {
      cy.get('[data-testid="my-courses"]').click();
      cy.get('[data-testid="enrolled-course"]').first().click();
      cy.get('[data-testid="module-list"]').within(() => {
        cy.get('[data-testid="module-item"]').first().click();
      });
      cy.get('[data-testid="module-content"]').should('be.visible');
      cy.get('[data-testid="complete-module-btn"]').click();
      cy.get('[data-testid="module-completed"]').should('be.visible');
    });

    it('debería mostrar certificado al completar curso', () => {
      cy.get('[data-testid="my-courses"]').click();
      cy.get('[data-testid="completed-course"]').first().click();
      cy.get('[data-testid="claim-certificate-btn"]').click();
      cy.get('[data-testid="certificate-minted"]').should('be.visible');
      cy.get('[data-testid="certificate-preview"]').should('exist');
    });
  });

  describe('Marketplace', () => {
    beforeEach(() => {
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
      cy.get('[data-testid="marketplace-link"]').click();
    });

    it('debería mostrar marketplace de empleos', () => {
      cy.get('[data-testid="job-marketplace"]').should('be.visible');
      cy.get('[data-testid="job-filters"]').should('exist');
      cy.get('[data-testid="job-search"]').should('be.visible');
    });

    it('debería filtrar ofertas de trabajo', () => {
      cy.get('[data-testid="job-filters"]').within(() => {
        cy.get('[data-testid="remote-filter"]').click();
        cy.get('[data-testid="senior-level-filter"]').click();
      });
      cy.get('[data-testid="job-card"]').should('have.length.at.least', 1);
    });

    it('debería aplicar a un trabajo', () => {
      cy.get('[data-testid="job-card"]').first().click();
      cy.get('[data-testid="job-details"]').should('be.visible');
      cy.get('[data-testid="apply-job-btn"]').click();
      cy.get('[data-testid="application-form"]').should('be.visible');
      
      // Llenar formulario
      cy.get('[data-testid="cover-letter"]').type('Experienced blockchain developer');
      cy.get('[data-testid="certificates-select"]').click();
      cy.get('[data-testid="certificate-option"]').first().click();
      cy.get('[data-testid="submit-application"]').click();
      
      cy.get('[data-testid="application-submitted"]').should('be.visible');
    });

    it('debería mostrar reputación del empleador', () => {
      cy.get('[data-testid="job-card"]').first().click();
      cy.get('[data-testid="employer-reputation"]').should('be.visible');
      cy.get('[data-testid="reputation-score"]').should('exist');
      cy.get('[data-testid="reviews-section"]').should('exist');
    });

    it('debería mostrar NFT gallery', () => {
      cy.get('[data-testid="nft-gallery-tab"]').click();
      cy.get('[data-testid="nft-gallery"]').should('be.visible');
      cy.get('[data-testid="nft-card"]').should('have.length.at.least', 1);
    });

    it('debería comprar/vender NFTs', () => {
      cy.get('[data-testid="nft-gallery-tab"]').click();
      cy.get('[data-testid="nft-card"]').first().click();
      cy.get('[data-testid="nft-details"]').should('be.visible');
      cy.get('[data-testid="buy-nft-btn"]').click();
      cy.get('[data-testid="purchase-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-purchase"]').click();
      cy.get('[data-testid="purchase-success"]').should('be.visible');
    });
  });

  describe('Governance', () => {
    beforeEach(() => {
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
      cy.get('[data-testid="governance-link"]').click();
    });

    it('debería mostrar propuestas activas', () => {
      cy.get('[data-testid="governance-dashboard"]').should('be.visible');
      cy.get('[data-testid="active-proposals"]').should('exist');
      cy.get('[data-testid="proposal-card"]').should('have.length.at.least', 1);
    });

    it('debería filtrar propuestas', () => {
      cy.get('[data-testid="proposal-filters"]').within(() => {
        cy.get('[data-testid="active-filter"]').click();
        cy.get('[data-testid="education-filter"]').click();
      });
      cy.get('[data-testid="proposal-card"]').should('have.length.at.least', 1);
    });

    it('debería ver detalles de propuesta', () => {
      cy.get('[data-testid="proposal-card"]').first().click();
      cy.get('[data-testid="proposal-details"]').should('be.visible');
      cy.get('[data-testid="proposal-description"]').should('exist');
      cy.get('[data-testid="voting-stats"]').should('exist');
    });

    it('debería votar en propuesta', () => {
      cy.get('[data-testid="proposal-card"]').first().click();
      cy.get('[data-testid="vote-yes-btn"]').click();
      cy.get('[data-testid="voting-modal"]').should('be.visible');
      cy.get('[data-testid="vote-amount"]').type('100');
      cy.get('[data-testid="confirm-vote"]').click();
      cy.get('[data-testid="vote-submitted"]').should('be.visible');
    });

    it('debería crear propuesta', () => {
      cy.get('[data-testid="create-proposal-btn"]').click();
      cy.get('[data-testid="proposal-form"]').should('be.visible');
      
      // Llenar formulario
      cy.get('[data-testid="proposal-title"]').type('Nueva funcionalidad de AI');
      cy.get('[data-testid="proposal-description"]').type('Implementar nuevas capacidades de AI');
      cy.get('[data-testid="proposal-category"]').select('AI/ML');
      cy.get('[data-testid="submit-proposal"]').click();
      
      cy.get('[data-testid="proposal-created"]').should('be.visible');
    });

    it('debería mostrar resultados de votación', () => {
      cy.get('[data-testid="proposal-card"]').first().click();
      cy.get('[data-testid="voting-results"]').should('be.visible');
      cy.get('[data-testid="yes-votes"]').should('exist');
      cy.get('[data-testid="no-votes"]').should('exist');
      cy.get('[data-testid="abstain-votes"]').should('exist');
    });
  });

  describe('AI Chat Integration', () => {
    beforeEach(() => {
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
    });

    it('debería abrir chat de AI', () => {
      cy.get('[data-testid="ai-chat-btn"]').click();
      cy.get('[data-testid="ai-chat-panel"]').should('be.visible');
      cy.get('[data-testid="chat-input"]').should('be.visible');
    });

    it('debería enviar mensaje al AI', () => {
      cy.get('[data-testid="ai-chat-btn"]').click();
      cy.get('[data-testid="chat-input"]').type('¿Cómo funciona el sistema de certificados?');
      cy.get('[data-testid="send-message-btn"]').click();
      cy.get('[data-testid="ai-response"]').should('be.visible');
    });

    it('debería mostrar sugerencias de AI', () => {
      cy.get('[data-testid="ai-chat-btn"]').click();
      cy.get('[data-testid="ai-suggestions"]').should('be.visible');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="ai-response"]').should('be.visible');
    });
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
      cy.get('[data-testid="profile-link"]').click();
    });

    it('debería mostrar perfil de usuario', () => {
      cy.get('[data-testid="user-profile"]').should('be.visible');
      cy.get('[data-testid="profile-avatar"]').should('exist');
      cy.get('[data-testid="profile-stats"]').should('exist');
    });

    it('debería editar perfil', () => {
      cy.get('[data-testid="edit-profile-btn"]').click();
      cy.get('[data-testid="profile-form"]').should('be.visible');
      
      cy.get('[data-testid="name-input"]').clear().type('Nuevo Nombre');
      cy.get('[data-testid="bio-input"]').clear().type('Nueva bio');
      cy.get('[data-testid="save-profile"]').click();
      
      cy.get('[data-testid="profile-updated"]').should('be.visible');
    });

    it('debería mostrar certificados del usuario', () => {
      cy.get('[data-testid="certificates-tab"]').click();
      cy.get('[data-testid="user-certificates"]').should('be.visible');
      cy.get('[data-testid="certificate-item"]').should('have.length.at.least', 1);
    });

    it('debería mostrar badges y logros', () => {
      cy.get('[data-testid="badges-tab"]').click();
      cy.get('[data-testid="user-badges"]').should('be.visible');
      cy.get('[data-testid="badge-item"]').should('have.length.at.least', 1);
    });

    it('debería mostrar historial de transacciones', () => {
      cy.get('[data-testid="transactions-tab"]').click();
      cy.get('[data-testid="transaction-history"]').should('be.visible');
      cy.get('[data-testid="transaction-item"]').should('have.length.at.least', 1);
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
      cy.visit('http://localhost:5173/');
    });

    it('debería adaptarse a móviles', () => {
      cy.get('[data-testid="mobile-menu-btn"]').should('be.visible');
      cy.get('[data-testid="navbar"]').should('not.be.visible');
    });

    it('debería mostrar menú móvil', () => {
      cy.get('[data-testid="mobile-menu-btn"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      cy.get('[data-testid="mobile-nav-links"]').should('exist');
    });

    it('debería navegar desde móvil', () => {
      cy.get('[data-testid="mobile-menu-btn"]').click();
      cy.get('[data-testid="dashboard-mobile-link"]').click();
      cy.get('[data-testid="dashboard"]').should('be.visible');
    });
  });

  describe('Performance Testing', () => {
    it('debería cargar rápidamente', () => {
      cy.visit('http://localhost:5173/', {
        onBeforeLoad: (win) => {
          win.performance.mark('start-loading');
        }
      });
      
      cy.get('[data-testid="landing-page"]').should('be.visible').then(() => {
        cy.window().then((win) => {
          win.performance.mark('end-loading');
          win.performance.measure('page-load', 'start-loading', 'end-loading');
          
          const measure = win.performance.getEntriesByName('page-load')[0];
          expect(measure.duration).to.be.lessThan(3000); // Max 3 seconds
        });
      });
    });

    it('debería manejar carga de datos eficientemente', () => {
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
      cy.get('[data-testid="dashboard-link"]').click();
      
      cy.get('[data-testid="dashboard"]').should('be.visible');
      cy.wait('@apiCall').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        expect(interception.response.body).to.have.property('data');
      });
    });
  });

  describe('Error Handling', () => {
    it('debería manejar errores de conexión', () => {
      cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkError');
      
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
      
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-btn"]').should('exist');
    });

    it('debería mostrar loading states', () => {
      cy.intercept('GET', '**/api/**', { delay: 2000 }).as('slowRequest');
      
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
      
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.wait('@slowRequest');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });

    it('debería manejar errores de wallet', () => {
      cy.get('[data-testid="connect-wallet-btn"]').click();
      cy.get('[data-testid="metamask-option"]').click();
      
      // Simular error de wallet
      cy.get('[data-testid="wallet-error"]').should('be.visible');
      cy.get('[data-testid="try-again-btn"]').should('exist');
    });
  });

  describe('Accessibility', () => {
    it('debería tener navegación por teclado', () => {
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'connect-wallet-btn');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'dashboard-link');
    });

    it('debería tener alt text en imágenes', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('debería tener contraste adecuado', () => {
      cy.get('[data-testid="landing-page"]').should('have.css', 'color');
      cy.get('[data-testid="landing-page"]').should('have.css', 'background-color');
    });
  });
});
