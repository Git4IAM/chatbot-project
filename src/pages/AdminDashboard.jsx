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

  // ฟังก์ชันสลับสิทธิ์ Admin (เลื่อนยศ / ถอดยศ)
  const toggleAdminRole = async (username, email, is_admin) => {
    const confirmMsg = is_admin 
      ? `ยืนยันการถอนสิทธิ์ Admin ของ ${email} ใช่หรือไม่?` 
      : `ยืนยันการแต่งตั้ง ${email} ให้เป็น Admin ใช่หรือไม่?`;
      
    if (!window.confirm(confirmMsg)) return;

    // ถ้าเป็นแอดมินอยู่แล้ว ให้ส่งคำสั่ง demote ถ้ายืนยันจะให้ส่ง promote
    const action = is_admin ? 'demote' : 'promote';

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      await axios.post(`${API_ADMIN_URL}/admin/users/promote`, 
        { username: username, action: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(is_admin ? 'ถอนสิทธิ์ Admin สำเร็จ' : 'แต่งตั้งเป็น Admin สำเร็จ!');
      fetchUsers(); 
    } catch (err) {
      console.error('Error toggling admin role:', err);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์');
    }
  };

  // ฟังก์ชันลบผู้ใช้งานถาวร
  const deleteUser = async (username, email) => {
    // ใช้หน้าต่างเตือนแบบขู่ให้กลัวนิดนึง เพราะลบแล้วกู้ไม่ได้ครับ
    if (!window.confirm(`คำเตือน: คุณต้องการลบบัญชี ${email} ทิ้งอย่างถาวรใช่หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้!`)) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      // ยิงไปที่ Path /delete ที่เพิ่งสร้างใหม่
      await axios.post(`${API_ADMIN_URL}/admin/users/delete`, 
        { username: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('ลบผู้ใช้งานออกจากระบบเรียบร้อยแล้ว');
      fetchUsers(); // รีเฟรชตาราง
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
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
                                    <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                        
                                        {/* 1. ปุ่มสลับสิทธิ์ Admin */}
                                        <button
                                            onClick={() => toggleAdminRole(user.username, user.email, user.is_admin)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: user.is_admin ? '#6b7280' : '#f59e0b', // ถ้าเป็น Admin จะเป็นสีเทา
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {user.is_admin ? 'ถอนสิทธิ์ Admin' : 'ตั้งเป็น Admin'}
                                        </button>

                                        {/* 2. ปุ่มระงับสิทธิ์ (เพิ่มการล็อกไม่ให้แบน Admin ด้วยกันเอง) */}
                                        <button
                                            onClick={() => toggleStatus(user.username, user.enabled)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: user.enabled ? '#ff4d4f' : '#52c41a',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: user.is_admin ? 'not-allowed' : 'pointer',
                                                opacity: user.is_admin ? 0.5 : 1
                                            }}
                                            disabled={user.is_admin} 
                                            title={user.is_admin ? "ไม่สามารถระงับ Admin ด้วยกันเองได้" : "ระงับการใช้งาน"}
                                        >
                                            {user.enabled ? 'ระงับการใช้' : 'ปลดล็อก'}
                                        </button>

                                        {/* 3. ปุ่มลบผู้ใช้งานถาวร */}
                                        <button
                                            onClick={() => deleteUser(user.username, user.email)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#dc2626',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: user.is_admin ? 'not-allowed' : 'pointer',
                                                opacity: user.is_admin ? 0.5 : 1
                                            }}
                                            disabled={user.is_admin}
                                            title={user.is_admin ? "ไม่สามารถลบ Admin ด้วยกันเองได้" : "ลบผู้ใช้งานนี้ถาวร"}
                                        >
                                            ลบ
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
