// cypress/e2e/preodic.cy.js

describe('Periodic (Định kỳ) flows', () => {
  // Bỏ qua lỗi JS vặt, tránh gãy test
  Cypress.on('uncaught:exception', () => false);

  beforeEach(() => {
    // Dùng lại custom command cy.login() (đã có sẵn từ project)
    cy.login();
    cy.wait(1000); // cho trang home ổn định
  });

  it('hiển thị được trang danh sách giao dịch định kỳ', () => {
    cy.visit('/preodic');

    // Tiêu đề trang
    cy.contains('Danh sách định kỳ').should('exist');

    // Các cột chính trong bảng
    cy.contains('Tên').should('be.visible');
    cy.contains('Số tiền').should('be.visible');
    cy.contains('Tần suất').should('be.visible');

    // Ít nhất hoặc là có dữ liệu, hoặc hiện placeholder "Không có dữ liệu"
    cy.contains(/Không có dữ liệu|tiền học phí/i).should('exist');
  });

  it('mở được form "Thêm định kỳ mới" khi bấm nút Thêm', () => {
    cy.visit('/preodic');

    // Nút Thêm ở góc trên bên phải
    cy.contains('button', 'Thêm').click();

    // Form bên phải xuất hiện với các field chính
    cy.contains('Thêm định kỳ mới').should('be.visible');

    // Chỉ cần form có đủ các label là được
    ['Tên định kỳ', 'Số tiền', 'Tần suất', 'Ngày bắt đầu', 'Ngày kết thúc'].forEach((text) => {
      cy.contains('label', text).should('exist');
    });

    cy.contains('button', 'Lưu').should('exist');
  });
});
