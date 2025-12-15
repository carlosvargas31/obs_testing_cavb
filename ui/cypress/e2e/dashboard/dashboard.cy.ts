// cypress/e2e/dashboard/dashboard.cy.ts

describe('Dashboard Page', () => {
  const aboutMeFixture = {
    name: 'Carlos Vargas',
    nationality: 'Colombian',
    job: 'Software Developer'
  };

  const projectFixture = {
    title: 'Taller Testing & Security',
    description: 'Proyecto educativo sobre testing y seguridad',
    tag: 'education'
  };
  
  describe('Carga de datos', () => {
    
    it('debe cargar datos desde fixtures', () => {
      // Mockear las APIs del dashboard con datos del fixture
      cy.mockDashboardApi({
        aboutMe: aboutMeFixture,
        projects: [projectFixture]
      });
      cy.visit('/dashboard');
      
      // Esperar a que las APIs respondan
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar que se muestra la información del fixture
      cy.contains(aboutMeFixture.name).should('be.visible');
      cy.contains(aboutMeFixture.job).should('be.visible');
      cy.contains(projectFixture.title).should('be.visible');
    });

    it('debe mostrar los proyectos', () => {
      cy.mockDashboardApi({
        projects: [projectFixture]
      });
      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar proyecto del fixture
      cy.contains(projectFixture.title).should('be.visible');
      cy.contains(projectFixture.description).should('be.visible');
    });
  });

  describe('Estados de carga', () => {
    
    it('debe mostrar loading mientras carga', () => {
      // Mockear con delay
      cy.visitWithMocks('/dashboard', { delay: 1500 });
      
      // Verificar que aparece el loader con mensaje específico
      cy.contains(/loading data|cargando/i).should('be.visible');
      
      // Esperar a que termine
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Loader desaparece y datos se muestran
      cy.contains(/loading data|cargando/i).should('not.exist');
      cy.contains('Test User').should('be.visible');
    });
  });

  describe('Manejo de errores', () => {
    
    it('debe mostrar error cuando la API falla', () => {
      // Mockear error
      cy.visitWithMocks('/dashboard', { error: true });
      
      // Esperar respuestas de error
      cy.wait(['@getAboutMeError', '@getProjectsError']);
      
      // Verificar mensaje de error traducido
      cy.contains(/error|error en la búsqueda/i).should('be.visible');
      
      // Verificar que no se muestran datos
      cy.contains('Test User').should('not.exist');
    });
  });

  describe('Navegación desde Dashboard', () => {
    
    beforeEach(() => {
      // Establecer token de autenticación para rutas protegidas
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.Qs8nKjZ7GJXK7YjA_rOqwM7hK5dYWLNg8c3d_mLc8Z0';
      const tokenObject = {
        accessToken: validToken,
        notBeforeTimestampInMillis: 1700000000000,
        expirationTimestampInMillis: 1900000000000
      };
      
      cy.window().then((win) => {
        win.localStorage.setItem('token', JSON.stringify(tokenObject));
      });
      
      cy.visitWithMocks('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);
    });

    it('debe navegar a Home desde el header', () => {
      // Encontrar y hacer click en el link de Home en el header
      cy.get('a[href="/"]').first().click();
      
      // Verificar que la URL cambió
      cy.url().should('include', '/');
      cy.url().should('not.include', '/dashboard');
    });

    it('debe navegar a Admin desde el header', () => {
      // Hacer click en Admin
      cy.get('a[href="/admin"]').click();
      
      // Verificar navegación
      cy.url().should('include', '/admin');
    });

    it('debe navegar de vuelta a Dashboard desde el header', () => {
      // Ir a Admin
      cy.get('a[href="/admin"]').click();
      cy.url().should('include', '/admin');
      
      // Volver a Dashboard
      cy.get('a[href="/dashboard"]').click();
      
      // Verificar que estamos de vuelta en Dashboard
      cy.url().should('include', '/dashboard');
    });
  });
});