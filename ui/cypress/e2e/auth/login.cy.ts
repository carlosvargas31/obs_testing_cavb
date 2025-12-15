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

    it('debe permitir navegar con teclado en login', () => {
      cy.mockLoginApi();

      // Focus en email e input
      cy.get('input[name="email"]').focus().type(validEmail);
      // Focus en password e input
      cy.get('input[name="password"]').focus().type(validPassword);
      
      // Enter para enviar el formulario
      cy.get('input[name="password"]').type('{enter}');
      
      // Verificar que se envió la petición
      cy.wait('@loginSuccess');
      
      // Verificar redirección post-login
      cy.url().should('include', '/admin');
    });

    it('debe enviar credenciales correctamente en el request body', () => {
      // Interceptar y validar la petición POST
      cy.intercept('POST', '**/auth/login', (req) => {
        // Verificar que el body contiene email y password
        expect(req.body).to.include('email');
        expect(req.body).to.include('password');
        
        // Responder con token válido
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.Qs8nKjZ7GJXK7YjA_rOqwM7hK5dYWLNg8c3d_mLc8Z0';
        req.reply({
          statusCode: 200,
          body: {
            token: validToken,
            notBeforeTimestampInMillis: 1700000000000,
            expirationTimestampInMillis: 1900000000000
          }
        });
      }).as('loginRequest');
      
      // Llenar y enviar formulario
      cy.get('input[name="email"]').type(validEmail);
      cy.get('input[name="password"]').type(validPassword);
      cy.get('input[type="submit"]').click();
      
      // Esperar y validar la petición interceptada
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.request.method).to.eq('POST');
        expect(interception.request.body).to.include('email');
        expect(interception.request.body).to.include('password');
        // Verificar que el email y password están en el body (pueden estar codificados)
        expect(interception.request.body).to.match(/email=/);
        expect(interception.request.body).to.match(/password=/);
      });
      
      // Verificar redirección
      cy.url().should('include', '/admin');
    });
  });
});