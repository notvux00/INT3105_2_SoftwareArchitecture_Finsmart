// cypress/support/commands.js
Cypress.Commands.add('login', (username = 'demo', password = 'DemoPass123!') => {
  cy.intercept('POST', '**/functions/v1/login-limiting', {
    statusCode: 200,
    body: { success: true, user_id: 12345 }
  }).as('mockLoginCmd');

  cy.visit('/login');
  cy.get('[data-testid="input-account"]').clear().type(username);
  cy.get('[data-testid="input-password"]').clear().type(password);
  cy.on('window:alert', () => true);

  cy.get('[data-testid="login-button"]').click();
  cy.wait('@mockLoginCmd');
  
  // Đợi reload xong và chuyển trang
  cy.wait(1000); 
  cy.url().should('include', '/home');
});