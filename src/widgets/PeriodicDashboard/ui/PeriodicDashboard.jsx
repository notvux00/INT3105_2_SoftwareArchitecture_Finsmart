import React, { useState, useEffect } from "react";
import { useAuth } from "../../../shared/hooks";
import { usePeriodic } from "../../../entities/periodic";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../frontend/pages/Preodic.css";

const PeriodicDashboard = () => {
  const { userId } = useAuth();

  const {
    periodicList,
    addPeriodic,
    updatePeriodic,
    deletePeriodic,
    isLoading,
    isAdding,
    isUpdating,
  } = usePeriodic(userId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const [newPeriodic, setNewPeriodic] = useState({
    name: "",
    amount: "",
    frequency: "Hàng tháng",
    startDate: "",
    endDate: "",
    is_active: true,
  });

  const [editPeriodic, setEditPeriodic] = useState(null);

  const getDaysLeft = (endDateStr) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper format ngày cho input date (yyyy-MM-dd)
  const formatDateForInput = (isoString) => {
    if (!isoString) return "";
    return isoString.split("T")[0];
  };

  useEffect(() => {
    if (!periodicList) return;
    periodicList.forEach((item) => {
      if (item.status === "Hoạt động" && item.next_execution) {
        const nextExec = new Date(item.next_execution);
        const today = new Date();
        if (
          nextExec.getDate() === today.getDate() &&
          nextExec.getMonth() === today.getMonth() &&
          nextExec.getFullYear() === today.getFullYear()
        ) {
          toast.info(
            `Định kỳ "${
              item.name
            }" đến hạn thực hiện hôm nay (${item.amount.toLocaleString()} đ)!`,
            { position: "top-right" }
          );
        }
      }
    });
  }, [periodicList]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await addPeriodic({
        ...newPeriodic,
        amount: Number(newPeriodic.amount),
      });
      setShowAddForm(false);
      setNewPeriodic({
        name: "",
        amount: "",
        frequency: "Hàng tháng",
        startDate: "",
        endDate: "",
        is_active: true,
      });
      toast.success("Thêm định kỳ thành công!");
    } catch (error) {
      toast.error("Lỗi thêm định kỳ");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPeriodic) return;
    try {
      await updatePeriodic({
        id: editPeriodic.id,
        updates: {
          name: editPeriodic.name,
          amount: Number(editPeriodic.amount),
          frequency: editPeriodic.frequency,
          startDate: editPeriodic.startDate,
          endDate: editPeriodic.endDate,
          status: editPeriodic.status,
        },
      });
      setShowEditForm(false);
      setEditPeriodic(null);
      toast.success("Cập nhật thành công!");
    } catch (error) {
      toast.error("Lỗi cập nhật định kỳ");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa định kỳ này không?")) {
      try {
        await deletePeriodic(id);
        toast.success("Đã xóa định kỳ");
      } catch (error) {
        toast.error("Lỗi xóa định kỳ");
      }
    }
  };

  const openEditForm = (item) => {
    setEditPeriodic({
      id: item.id,
      name: item.name,
      amount: item.amount,
      frequency: item.frequency,
      startDate: formatDateForInput(item.startDate) || item.startDate,
      endDate: formatDateForInput(item.endDate) || item.endDate,
      status: item.status,
    });
    setShowEditForm(true);
  };

  const filteredData = (periodicList || []).filter((item) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return item.status === "Hoạt động";
    if (filterStatus === "inactive") return item.status === "Tạm dừng";
    return true;
  });

  if (isLoading) {
    return (
      <div
        className="periodic-main-content"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h3>Đang tải dữ liệu...</h3>
      </div>
    );
  }

  return (
    <div className="periodic-main-content">
      {/* KHỐI 1: BẢNG DANH SÁCH */}
      <div className="periodic-table-container">
        <div className="table-header">
          <h2>Danh sách định kỳ</h2>
          <div className="filter-container">
            <label htmlFor="statusFilter" className="filter-label">
              Trạng thái:
            </label>
            <select
              id="statusFilter"
              className="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>
          <button
            className="btnpre add-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Thêm định kỳ
          </button>
        </div>

        <table className="periodic-table">
          <thead>
            <tr>
              <th>Tên định kỳ</th>
              <th>Số tiền</th>
              <th>Tần suất</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.amount.toLocaleString()} đ</td>
                  <td>{item.frequency}</td>
                  <td>
                    {new Date(item.startDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td>{new Date(item.endDate).toLocaleDateString("vi-VN")}</td>
                  <td data-status={item.status}>{item.status}</td>
                  <td>
                    <button
                      className="btnpre edit-btn"
                      onClick={() => openEditForm(item)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btnpre delete-btn"
                      onClick={() => handleDelete(item.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* KHỐI 2: NHẮC NHỞ */}
      <div className="periodic-notice">
        <h2>Nhắc nhở</h2>
        {filteredData.filter(
          (i) =>
            i.status === "Hoạt động" &&
            getDaysLeft(i.endDate) <= 3 &&
            getDaysLeft(i.endDate) >= 0
        ).length > 0 ? (
          filteredData
            .filter(
              (i) =>
                i.status === "Hoạt động" &&
                getDaysLeft(i.endDate) <= 3 &&
                getDaysLeft(i.endDate) >= 0
            )
            .map((item) => (
              <div key={item.id} className="reminder-item">
                <strong>{item.name}</strong> sẽ kết thúc trong{" "}
                <span className="days-left">
                  {getDaysLeft(item.endDate)} ngày
                </span>{" "}
                nữa.
              </div>
            ))
        ) : (
          <div className="notice-empty">Không có định kỳ nào sắp hết hạn.</div>
        )}
      </div>

      {/* MODAL THÊM (Sử dụng đúng class periodic-overlay) */}
      {showAddForm && (
        <div className="periodic-overlay" onClick={() => setShowAddForm(false)}>
          <div
            className="periodic-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Thêm định kỳ mới</h2>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>
                  Tên định kỳ <span>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={newPeriodic.name}
                  onChange={(e) =>
                    setNewPeriodic({ ...newPeriodic, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>
                  Số tiền <span>*</span>
                </label>
                <input
                  required
                  type="number"
                  value={newPeriodic.amount}
                  onChange={(e) =>
                    setNewPeriodic({ ...newPeriodic, amount: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>
                  Tần suất <span>*</span>
                </label>
                <select
                  value={newPeriodic.frequency}
                  onChange={(e) =>
                    setNewPeriodic({
                      ...newPeriodic,
                      frequency: e.target.value,
                    })
                  }
                >
                  {[
                    "3 phút",
                    "Hàng ngày",
                    "Hàng tuần",
                    "Hàng tháng",
                    "Hàng quý",
                    "Hàng năm",
                  ].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Ngày bắt đầu <span>*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={newPeriodic.startDate}
                    onChange={(e) =>
                      setNewPeriodic({
                        ...newPeriodic,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>
                    Ngày kết thúc <span>*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={newPeriodic.endDate}
                    onChange={(e) =>
                      setNewPeriodic({
                        ...newPeriodic,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={newPeriodic.is_active}
                    onChange={(e) =>
                      setNewPeriodic({
                        ...newPeriodic,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  Kích hoạt ngay
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Hủy
                </button>
                <button type="submit" disabled={isAdding}>
                  {isAdding ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA */}
      {showEditForm && editPeriodic && (
        <div
          className="periodic-overlay-dark"
          onClick={() => setShowEditForm(false)}
        >
          <div
            className="periodic-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Chỉnh sửa định kỳ</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Tên định kỳ</label>
                <input
                  required
                  type="text"
                  value={editPeriodic.name}
                  onChange={(e) =>
                    setEditPeriodic({ ...editPeriodic, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Số tiền</label>
                <input
                  required
                  type="number"
                  value={editPeriodic.amount}
                  onChange={(e) =>
                    setEditPeriodic({ ...editPeriodic, amount: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Tần suất</label>
                <select
                  value={editPeriodic.frequency}
                  onChange={(e) =>
                    setEditPeriodic({
                      ...editPeriodic,
                      frequency: e.target.value,
                    })
                  }
                >
                  {[
                    "Hàng ngày",
                    "Hàng tuần",
                    "Hàng tháng",
                    "Hàng quý",
                    "Hàng năm",
                  ].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <input
                    required
                    type="date"
                    value={editPeriodic.startDate}
                    onChange={(e) =>
                      setEditPeriodic({
                        ...editPeriodic,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input
                    required
                    type="date"
                    value={editPeriodic.endDate}
                    onChange={(e) =>
                      setEditPeriodic({
                        ...editPeriodic,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select
                  value={editPeriodic.status}
                  onChange={(e) =>
                    setEditPeriodic({ ...editPeriodic, status: e.target.value })
                  }
                >
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Tạm dừng">Tạm dừng</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditForm(false)}>
                  Hủy
                </button>
                <button type="submit" disabled={isUpdating}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default PeriodicDashboard;
