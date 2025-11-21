import React, { useState, useEffect } from "react";
import { useAuth } from "../../../shared/hooks";
import { useEconomical } from "../../../entities/economical";
import "../../../frontend/pages/Economical.css"; // Dùng lại CSS cũ

const EconomicalDashboard = () => {
  const { userId } = useAuth();
  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
    isAdding,
    isUpdating,
    isDeleting,
  } = useEconomical(userId);

  // --- Local State cho UI (Modal, Form, Filter) ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [filterType, setFilterType] = useState("Tất cả");
  const [depositAmount, setDepositAmount] = useState("");
  const [notifications, setNotifications] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    target_name: "",
    target_amount: "",
    current_amount: "",
    deadline: "",
  });

  // --- Logic Nhắc nhở (Deadline) ---
  useEffect(() => {
    if (!goals) return;
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    const upcoming = goals.filter((goal) => {
      const deadline = new Date(goal.deadline);
      return (
        deadline > now &&
        deadline <= oneWeekFromNow &&
        goal.status === "pending"
      );
    });

    const overdue = goals.filter((goal) => {
      const deadline = new Date(goal.deadline);
      return deadline < now && goal.status === "pending";
    });

    setNotifications([...upcoming, ...overdue]);
  }, [goals]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("amount")) {
      setFormData({ ...formData, [name]: Math.max(0, parseFloat(value) || 0) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const onAddGoal = async () => {
    if (formData.target_amount <= 0)
      return alert("Số tiền mục tiêu phải lớn hơn 0");
    try {
      await addGoal({
        target_name: formData.target_name,
        target_amount: formData.target_amount,
        current_amount: formData.current_amount,
        deadline: new Date(formData.deadline).toISOString(),
        status: "pending",
      });
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Lỗi thêm mục tiêu");
    }
  };

  const onUpdateGoal = async () => {
    if (!currentGoal) return;
    try {
      await updateGoal({
        id: currentGoal.id,
        updates: {
          target_name: formData.target_name,
          target_amount: formData.target_amount,
          deadline: new Date(formData.deadline).toISOString(),
        },
      });
      setIsEditModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Lỗi cập nhật mục tiêu");
    }
  };

  const onDeleteGoal = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa mục tiêu này?")) {
      await deleteGoal(id);
    }
  };

  const onDeposit = async () => {
    if (!currentGoal || depositAmount <= 0) return;
    try {
      await depositToGoal({
        id: currentGoal.id,
        amount: parseFloat(depositAmount),
        currentAmount: currentGoal.current_amount,
        targetAmount: currentGoal.target_amount,
        currentStatus: currentGoal.status,
      });
      setIsDepositModalOpen(false);
      setDepositAmount("");
    } catch (err) {
      alert("Lỗi nạp tiền");
    }
  };

  const resetForm = () => {
    setFormData({
      target_name: "",
      target_amount: "",
      current_amount: "",
      deadline: new Date().toISOString().slice(0, 10),
    });
    setCurrentGoal(null);
  };

  const openEditModal = (goal) => {
    setCurrentGoal(goal);
    setFormData({
      target_name: goal.target_name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: new Date(goal.deadline).toISOString().slice(0, 10),
    });
    setIsEditModalOpen(true);
  };

  // Helper Render
  const calculateProgress = (current, target) =>
    Math.min(Math.round((current / target) * 100), 100);
  const formatCurrency = (val) => new Intl.NumberFormat("vi-VN").format(val);

  const filteredGoals = goals.filter((goal) => {
    if (filterType === "Hiện tại") return goal.status === "pending";
    if (filterType === "Hoàn thành") return goal.status === "completed";
    return true;
  });

  return (
    <div className="mainEco">
      {/* Phần Danh Sách Mục Tiêu */}
      <div className="saving-goals-box">
        <div className="header-row">
          <div className="title-filter">
            <h2>Tiết kiệm</h2>
            <div className="dropdown-filter">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="Tất cả">Tất cả</option>
                <option value="Hiện tại">Hiện tại</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
            </div>
          </div>
          <button
            className="add-goal-btn"
            onClick={() => setIsAddModalOpen(true)}
          >
            +
          </button>
        </div>

        <div className="goals-grid">
          {filteredGoals.map((goal) => (
            <div key={goal.id} className="goal-card">
              <div className="goal-header">
                <span>{goal.target_name}</span>
                <div className="goal-header">
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(goal)}
                  >
                    ✎
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => onDeleteGoal(goal.id)}
                    disabled={isDeleting}
                  >
                    X
                  </button>
                </div>
              </div>
              <div
                className="progress-circle"
                onClick={() => {
                  setCurrentGoal(goal);
                  setIsDepositModalOpen(true);
                }}
              >
                <span>
                  {calculateProgress(goal.current_amount, goal.target_amount)}%
                </span>
              </div>
              <div className="goal-details">
                <p className="goal-amount">
                  <span className="current-amount">
                    {formatCurrency(goal.current_amount)}
                  </span>
                  <span className="separator">/</span>
                  <span className="target-amount">
                    {formatCurrency(goal.target_amount)} VND
                  </span>
                </p>
                <p className="goal-deadline">
                  <span className="deadline-label">Hạn:</span>{" "}
                  {new Date(goal.deadline).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          ))}
          {filteredGoals.length === 0 && (
            <div className="empty-state">
              <p>Chưa có mục tiêu nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* Phần Nhắc Nhở */}
      <div className="reminder-box">
        <h3>Nhắc nhở</h3>
        <div className="reminder-list">
          {notifications.length > 0 ? (
            notifications.map((n, i) => {
              const isOverdue =
                new Date(n.deadline) < new Date() && n.status === "pending";
              return (
                <div
                  key={i}
                  className="reminder-item"
                  style={{ color: isOverdue ? "red" : "black" }}
                >
                  <p>
                    Mục tiêu "<b>{n.target_name}</b>"{" "}
                    {isOverdue ? "đã quá hạn" : "sắp đến hạn"} (
                    {new Date(n.deadline).toLocaleDateString("vi-VN")})
                  </p>
                </div>
              );
            })
          ) : (
            <p className="no-notifications">Không có nhắc nhở nào</p>
          )}
        </div>
      </div>

      {/* --- CÁC MODAL (Add, Edit, Deposit) --- */}
      {/* (Tôi giữ nguyên cấu trúc HTML modal cũ để CSS hoạt động đúng) */}

      {/* Modal Thêm */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Tạo Mục tiêu Mới</h2>
              <button
                className="close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Các input form giữ nguyên như cũ, chỉ bind vào state */}
              <div className="form-group">
                <label>Tên mục tiêu</label>
                <input
                  name="target_name"
                  value={formData.target_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Số tiền mục tiêu</label>
                <input
                  type="number"
                  name="target_amount"
                  value={formData.target_amount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Số tiền ban đầu</label>
                <input
                  type="number"
                  name="current_amount"
                  value={formData.current_amount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Ngày hạn</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="save-btn"
                onClick={onAddGoal}
                disabled={isAdding}
              >
                {isAdding ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa (Tương tự Add) */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Chỉnh sửa</h2>
              <button
                className="close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên mục tiêu</label>
                <input
                  name="target_name"
                  value={formData.target_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Số tiền mục tiêu</label>
                <input
                  type="number"
                  name="target_amount"
                  value={formData.target_amount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Ngày hạn</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="save-btn"
                onClick={onUpdateGoal}
                disabled={isUpdating}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nạp Tiền */}
      {isDepositModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Nạp thêm tiền</h2>
              <button
                className="close-btn"
                onClick={() => setIsDepositModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Số tiền thêm</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setIsDepositModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="save-btn"
                onClick={onDeposit}
                disabled={isUpdating}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EconomicalDashboard;
