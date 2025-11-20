import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks";
import Sidebar from "../shared/ui/Sidebar"; // Import Sidebar dùng chung
import "../frontend/pages/Profile.css"; // Import CSS giao diện mới

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleEditProfile = () => {
    navigate("/update-profile");
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="bodyProfile">
      {/* Sidebar đồng bộ với Dashboard */}
      <Sidebar currentPath="/profile" />

      <div className="profile-main-content">
        {/* Header tiêu đề */}
        <div className="profile-header">
          <h1>Thông tin cá nhân</h1>
          <p>Quản lý thông tin tài khoản và cài đặt bảo mật</p>
        </div>

        {/* Card thông tin chính */}
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              <img 
                className="imageProfile" 
                src="Soucre/Profile.jpg" 
                alt="Avatar"
                onError={(e) => {e.target.onerror = null; e.target.src = "https://via.placeholder.com/150"}} 
              />
            </div>
            <h2 className="profile-name">Người dùng FinSmart</h2>
            <p className="profile-role">Thành viên</p>
          </div>

          <div className="profile-actions-list">
            <div className="action-item" onClick={handleEditProfile}>
              <div className="action-icon">✏️</div>
              <div className="action-info">
                <span>Chỉnh sửa thông tin</span>
                <small>Cập nhật tên, ngày sinh, số điện thoại</small>
              </div>
              <div className="action-arrow">›</div>
            </div>

            <div className="action-item" onClick={() => navigate('/forgot-password')}>
              <div className="action-icon">🔒</div>
              <div className="action-info">
                <span>Đổi mật khẩu</span>
                <small>Bảo vệ tài khoản của bạn</small>
              </div>
              <div className="action-arrow">›</div>
            </div>

            <div className="action-item logout" onClick={handleLogout}>
              <div className="action-icon">🚪</div>
              <div className="action-info">
                <span>Đăng xuất</span>
                <small>Thoát khỏi phiên làm việc</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;