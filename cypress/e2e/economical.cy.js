// cypress/e2e/economical.cy.js

describe('Economical (Tiết kiệm) flows', () => {
  // Bỏ qua lỗi JS vặt vãnh
  Cypress.on('uncaught:exception', () => false);

  beforeEach(() => {
    // Dùng lại custom command login của project (demo / DemoPass123!)
    cy.login();
    cy.wait(1000); // cho trang home ổn định
  });

  it('hiển thị được trang tiết kiệm và khu vực mục tiêu', () => {
    cy.visit('/economical');

    // Tiêu đề trang
    cy.contains('Tiết kiệm').should('exist');

    // Bộ lọc trạng thái + khu nhắc nhở bên phải
    cy.contains('Tất cả').should('exist');
    cy.contains('Nhắc nhở').should('exist');

    // Ít nhất là có một mục tiêu hoặc text thông báo trống
    cy.contains(/VND|Không có mục tiêu|Không có nhắc nhở/i).should('exist');
  });

  it('mở giao diện tạo mục tiêu tiết kiệm khi bấm nút +', () => {
    cy.visit('/economical');

    // Nút + thêm mục tiêu ở góc phải trên
    // (Nếu không tìm được bằng text '+', ta sẽ chỉnh sau khi xem log)
    cy.contains('button', '+').click();

    // Sau khi bấm, mong đợi xuất hiện form có input để nhập thông tin
    cy.get('input').should('exist');
  });
});
