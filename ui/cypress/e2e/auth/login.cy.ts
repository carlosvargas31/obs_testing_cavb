// cypress/e2e/auth/login.cy.ts

describe('Login Page', () => {
  const validEmail = 'test@example.com';
  const validPassword = 'password123';

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
      cy.get('input[type="submit"]').click();

      cy.contains(/usuario o contraseña no pueden estar vacíos|username and password must not be empty/i).should(
        'be.visible'
      );
    });

    it('debe mostrar error solo con email', () => {
      cy.get('input[name="email"]').type(validEmail);
      cy.get('input[type="submit"]').click();

      cy.contains(/password|contraseña/i).should('be.visible');
    });
  });

  describe('Login con API mockeada', () => {
    
    it('debe hacer login exitoso', () => {
      // Mockear respuesta de la API
      cy.mockLoginApi();
      
      // Llenar formulario
      cy.get('input[name="email"]').type(validEmail);
      cy.get('input[name="password"]').type(validPassword);
      cy.get('input[type="submit"]').click();
      
      // Esperar respuesta
      cy.wait('@loginSuccess').then((interception) => {
        expect(interception.request.method).to.eq('POST');
        expect(interception.request.body).to.contain(`email=${encodeURIComponent(validEmail)}`);
        expect(interception.request.body).to.contain(`password=${encodeURIComponent(validPassword)}`);
      });
      
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
      cy.contains(/invalid login|inicio inválido|invalid credentials|error/i).should('be.visible');
    });

    it('debe mostrar loading mientras espera la respuesta', () => {
      cy.mockLoginApi({ delay: 1000 });

      cy.get('input[name="email"]').type(validEmail);
      cy.get('input[name="password"]').type(validPassword);
      cy.get('input[type="submit"]').click();

      cy.contains(/loading|cargando/i).should('be.visible');
      cy.wait('@loginSuccess');
      cy.contains(/loading|cargando/i).should('not.exist');
    });
  });
});