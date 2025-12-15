// cypress/e2e/auth/login.cy.ts

describe('Login Page', () => {
  
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Elementos del formulario', () => {
    
    it('debe mostrar los campos del formulario', () => {
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[type="submit"]').should('be.visible');
    });
  });

  describe('Validación', () => {
    
    it('debe mostrar error con campos vacíos', () => {
      // Submit sin llenar
      cy.get('input[type="submit"]').click();
      
      // Debe mostrar mensaje de error
      cy.contains(/username|password|email/i).should('be.visible');
    });

    it('debe mostrar error solo con email', () => {
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[type="submit"]').click();
      
      // Error porque falta password
      cy.contains(/password|contraseña/i).should('be.visible');
    });
  });

  describe('Login con API mockeada', () => {
    
    it('debe hacer login exitoso', () => {
      // Mockear respuesta de la API
      cy.mockLoginApi({ success: true });
      
      // Llenar formulario
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      // Esperar respuesta
      cy.wait('@loginSuccess');
      
      // Verificar redirección
      cy.url().should('include', '/admin');
    });

    it('debe mostrar error con credenciales inválidas', () => {
      // Mockear error
      cy.mockLoginApi({ success: false });
      
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpass');
      cy.get('input[type="submit"]').click();
      
      cy.wait('@loginError');
      
      // Seguimos en login
      cy.url().should('include', '/login');
      
      // Muestra error
      cy.contains(/invalid|error/i).should('be.visible');
    });
  });
});