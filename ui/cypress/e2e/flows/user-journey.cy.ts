// cypress/e2e/flows/user-journey.cy.ts

describe('Flujo de Usuario', () => {

  describe('Usuario anónimo', () => {
    
    it('debe navegar de landing a dashboard', () => {
      // Mockear APIs
      cy.intercept('GET', '**/v1/aboutme/', { fixture: 'aboutme.json' }).as('getAboutMe');
      cy.intercept('GET', '**/v1/projects/', { fixture: 'projects.json' }).as('getProjects');
      
      // Empezar en landing
      cy.visit('/');
      
      // Click en Dashboard
      cy.contains(/dashboard/i).click();
      
      // Verificar navegación
      cy.url().should('include', '/dashboard');
      
      // Esperar datos
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar contenido
      cy.contains('Lucas Fernandez').should('be.visible');
    });
  });

  describe('Usuario autenticado', () => {
    
    beforeEach(() => {
      cy.mockLoginApi({ success: true });
      cy.mockDashboardApi();
    });

    it('debe hacer login y acceder a admin', () => {
      // Ir a login
      cy.visit('/login');
      
      // Hacer login
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      // Esperar login
      cy.wait('@loginSuccess');
      
      // Verificar que estamos en admin
      cy.url().should('include', '/admin');
    });
  });
});