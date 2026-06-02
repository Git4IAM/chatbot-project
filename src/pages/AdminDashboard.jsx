import React, { useState, useEffect } from "react";
import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";
import "../App.css";
import { useNavigate } from "react-router-dom";

// รับค่า token มาจาก App.js หรือ Context เพื่อใช้ยืนยันตัวตนกับ API
const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_ADMIN_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const response = await axios.get(`${API_ADMIN_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // เอาข้อมูลที่ได้จาก Lambda มาใส่ใน State
      setUsers(response.data.users);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("ไม่สามารถดึงข้อมูลผู้ใช้งานได้ โปรดตรวจสอบสิทธิ์ Admin");
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับกดปุ่มระงับ/ปลดล็อก
  const toggleStatus = async (username, currentStatus) => {
    // ถามย้ำเพื่อความแน่ใจ
    const confirmMsg = currentStatus
      ? "คุณต้องการระงับบัญชีนี้ใช่หรือไม่?"
      : "คุณต้องการปลดล็อกบัญชีนี้ใช่หรือไม่?";
    if (!window.confirm(confirmMsg)) return;

    const action = currentStatus ? "disable" : "enable";

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      // ยิงไปหา Lambda ตัวใหม่ที่เราเพิ่งสร้าง (เปลี่ยน URL ด้วยนะครับ)
      await axios.post(
        `${API_ADMIN_URL}/admin/users/status`,
        { username: username, action: action },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert(currentStatus ? "ระงับบัญชีสำเร็จ" : "ปลดล็อกบัญชีสำเร็จ");

      // ดึงข้อมูลใหม่มาแสดงผลเพื่ออัปเดตตาราง
      fetchUsers();
    } catch (err) {
      console.error("Error toggling user status:", err);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  if (loading)
    return (
      <div style={{ padding: "20px" }}>⏳ กำลังโหลดข้อมูลผู้ใช้งาน...</div>
    );
  if (error)
    return <div style={{ padding: "20px", color: "red" }}>❌ {error}</div>;

  return (
    <div className="app-layout">
      <div
        className="main-content"
        style={{ padding: "40px", width: "100%", overflowY: "auto" }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* ส่วนหัวและปุ่มกดกลับ */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>ระบบจัดการผู้ใช้งาน (Admin Dashboard)</h2>
            <button
              onClick={() => navigate("/chat")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              กลับหน้าแชท
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>อีเมล (Email)</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>โดเมน</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>สิทธิ์ (Role)</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>สถานะ</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{user.email}</td>
                                    
                                    {/* คอลัมน์โดเมน (ใหม่) */}
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9em' }}>
                                            {user.domain}
                                        </span>
                                    </td>

                                    {/* คอลัมน์สิทธิ์ (ใหม่) */}
                                    <td style={{ padding: '12px' }}>
                                        {user.is_admin ? (
                                            <span style={{ color: '#d97706', fontWeight: 'bold' }}>Admin</span>
                                        ) : (
                                            <span style={{ color: '#4b5563' }}> User</span>
                                        )}
                                    </td>

                                    <td style={{ padding: '12px' }}>
                                        {user.enabled ? (
                                            <span style={{ color: 'green', fontWeight: 'bold' }}>ใช้งานอยู่</span>
                                        ) : (
                                            <span style={{ color: 'red', fontWeight: 'bold' }}>ถูกระงับ</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                        
                                        {/* ปุ่มตั้งเป็นแอดมิน (เตรียมไว้ก่อน) */}
                                        <button
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: user.is_admin ? '#9ca3af' : '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: user.is_admin ? 'not-allowed' : 'pointer'
                                            }}
                                            disabled={user.is_admin}
                                        >
                                            {user.is_admin ? 'เป็น Admin แล้ว' : 'ตั้งเป็น Admin'}
                                        </button>

                                        {/* ปุ่มระงับสิทธิ์รายคน (ของเดิม) */}
                                        <button
                                            onClick={() => toggleStatus(user.username, user.enabled)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: user.enabled ? '#ff4d4f' : '#52c41a',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {user.enabled ? 'ระงับการใช้' : 'ปลดล็อก'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
