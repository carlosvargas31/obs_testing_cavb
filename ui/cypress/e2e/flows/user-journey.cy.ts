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
      cy.contains('Carlos Vargas').should('be.visible');
    });
  });

  describe('Flujo completo: Landing → Dashboard → Login', () => {
    
    const validEmail = 'test@example.com';
    const validPassword = 'password123';

    beforeEach(() => {
      // Configurar todos los mocks necesarios antes de empezar
      cy.intercept('GET', '**/v1/aboutme/', { fixture: 'aboutme.json' }).as('getAboutMe');
      cy.intercept('GET', '**/v1/projects/', { fixture: 'projects.json' }).as('getProjects');
      cy.mockLoginApi();
    });

    it('debe completar el flujo Landing → Dashboard → Login con verificaciones en cada paso', () => {
      // PASO 1: Visitar Landing Page
      cy.visit('/');
      
      // Verificar datos en Landing
      cy.contains(/bienvenido|welcome|personal/i).should('be.visible');
      cy.get('a[href="/dashboard"]').should('exist');

      // PASO 2: Navegar a Dashboard
      cy.get('a[href="/dashboard"]').click();
      cy.url().should('include', '/dashboard');
      
      // Esperar respuestas de APIs
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar datos cargados en Dashboard
      cy.contains('Carlos Vargas').should('be.visible');
      cy.get('a[href="/"]').should('be.visible');
      
      // PASO 3: Navegar a Login (visitar directamente ya que no hay link en UI)
      cy.visit('/login');
      cy.url().should('include', '/login');
      
      // Verificar que el formulario de login está disponible
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[type="submit"]').should('be.visible');

      // PASO 4: Completar formulario de login
      cy.get('input[name="email"]').type(validEmail);
      cy.get('input[name="password"]').type(validPassword);
      
      // PASO 5: Enviar formulario y verificar petición
      cy.get('input[type="submit"]').click();
      
      // Verificar que la petición se envía correctamente
      cy.wait('@loginSuccess').then((interception) => {
        expect(interception.request.method).to.eq('POST');
        // El body está en formato URL-encoded
        const body = interception.request.body;
        expect(body).to.match(/email=/);
        expect(body).to.match(/password=/);
      });
      
      // PASO 6: Verificar redirección post-login
      cy.get('input[name="email"]').should('not.exist');
      cy.url().should('include', '/admin');
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