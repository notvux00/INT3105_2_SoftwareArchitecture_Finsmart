// cypress/e2e/auth.cy.js
describe('Authentication flows', () => {
  beforeEach(() => {
    // Mock các API
    cy.intercept('POST', '**/functions/v1/register-limiting', {
      statusCode: 200,
      body: { message: "Đăng ký thành công." }
    }).as('mockRegister');

    cy.intercept('POST', '**/functions/v1/login-limiting', {
      statusCode: 200,
      body: { success: true, user_id: 12345 }
    }).as('mockLogin');
    
    // Mock Supabase check user/wallet để tránh lỗi ngầm
    cy.intercept('GET', '**/rest/v1/users*', { statusCode: 200, body: [] });
    cy.intercept('POST', '**/rest/v1/wallets*', { statusCode: 201, body: [] });
  });

  it('allows a new user to register and sign in', () => {
    const username = `testuser_${Date.now()}`;
    const password = 'Password123!';

    // 1. Đăng ký
    cy.visit('/register');
    cy.get('input[name="fullName"]').type('Cypress Tester');
    cy.get('input[name="dob"]').type('01/01/1990');
    cy.get('input[name="email"]').type(`${username}@example.com`);
    cy.get('input[name="phone"]').type('0123456789');
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);

    cy.on('window:alert', () => true); 
    cy.get('form.register-form').submit();
    cy.wait('@mockRegister');

    // 2. FIX LỖI: Chủ động load lại trang Login để tránh crash do reload tự động
    cy.wait(500); // Đợi một chút cho logic reload của app chạy (nếu có)
    cy.visit('/login'); 
    
    // 3. Đăng nhập
    cy.get('[data-testid="input-account"]').should('be.visible').clear().type(username);
    cy.get('[data-testid="input-password"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@mockLogin');
    cy.url().should('include', '/home');
  });

  it('authenticates an existing seeded user', () => {
    cy.login();
  });
});