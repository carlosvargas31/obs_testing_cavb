// cypress/e2e/dashboard/dashboard.cy.ts

describe('Dashboard Page', () => {
  
  describe('Carga de datos', () => {
    
    beforeEach(() => {
      // Mockear las APIs del dashboard
      cy.mockDashboardApi();
    });

    it('debe cargar y mostrar el perfil', () => {
      cy.visit('/dashboard');
      
      // Esperar a que las APIs respondan
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar que se muestra la información
      cy.contains('Test User').should('be.visible');
    });

    it('debe mostrar los proyectos', () => {
      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar que hay al menos un proyecto
      cy.contains('Test Project').should('be.visible');
    });
  });

  describe('Estados de carga', () => {
    
    it('debe mostrar loading mientras carga', () => {
      // Mockear con delay
      cy.mockDashboardApi({ delay: 1000 });
      
      cy.visit('/dashboard');
      
      // Verificar que aparece el loader
      cy.contains(/loading|cargando/i).should('be.visible');
      
      // Esperar a que termine
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Loader desaparece
      cy.contains(/loading|cargando/i).should('not.exist');
    });
  });

  describe('Manejo de errores', () => {
    
    it('debe mostrar error cuando la API falla', () => {
      // Mockear error
      cy.mockDashboardApi({ error: true });
      
      cy.visit('/dashboard');
      
      // Verificar mensaje de error
      cy.contains(/error/i).should('be.visible');
    });
  });
});