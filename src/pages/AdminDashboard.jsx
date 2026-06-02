import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

// รับค่า token มาจาก App.js หรือ Context เพื่อใช้ยืนยันตัวตนกับ API
const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 🛑 เปลี่ยนเป็น URL ของ API Gateway ตัวใหม่ที่คุณเพิ่งสร้างนะครับ
    const API_ADMIN_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            const response = await axios.get(`${API_ADMIN_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // เอาข้อมูลที่ได้จาก Lambda มาใส่ใน State
            setUsers(response.data.users);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('ไม่สามารถดึงข้อมูลผู้ใช้งานได้ โปรดตรวจสอบสิทธิ์ Admin');
            setLoading(false);
        }
    };

    // ฟังก์ชันสำหรับกดปุ่มระงับ/ปลดล็อก
    const toggleStatus = async (username, currentStatus) => {
        // ถามย้ำเพื่อความแน่ใจ
        const confirmMsg = currentStatus ? "คุณต้องการระงับบัญชีนี้ใช่หรือไม่?" : "คุณต้องการปลดล็อกบัญชีนี้ใช่หรือไม่?";
        if (!window.confirm(confirmMsg)) return;

        const action = currentStatus ? 'disable' : 'enable';

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            // ยิงไปหา Lambda ตัวใหม่ที่เราเพิ่งสร้าง (เปลี่ยน URL ด้วยนะครับ)
            await axios.post(`${API_ADMIN_URL}/admin/users/status`,
                { username: username, action: action },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(currentStatus ? 'ระงับบัญชีสำเร็จ' : 'ปลดล็อกบัญชีสำเร็จ');

            // ดึงข้อมูลใหม่มาแสดงผลเพื่ออัปเดตตาราง
            fetchUsers();
        } catch (err) {
            console.error('Error toggling user status:', err);
            alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>⏳ กำลังโหลดข้อมูลผู้ใช้งาน...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>❌ {error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2>👥 ระบบจัดการผู้ใช้งาน (Admin Dashboard)</h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>อีเมล (Email)</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>วันที่สมัคร</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>สถานะ</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px' }}>{user.email}</td>
                            <td style={{ padding: '12px' }}>{user.created_at}</td>
                            <td style={{ padding: '12px' }}>
                                {user.enabled ? (
                                    <span style={{ color: 'green', fontWeight: 'bold' }}>✅ ใช้งานอยู่</span>
                                ) : (
                                    <span style={{ color: 'red', fontWeight: 'bold' }}>❌ ถูกระงับ</span>
                                )}
                            </td>
                            <td style={{ padding: '12px' }}>
                                {/* ปุ่มนี้เดี๋ยวเรามาเขียนฟังก์ชันเชื่อม API ระงับสิทธิ์ทีหลังครับ */}
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
                                    {user.enabled ? 'ระงับสิทธิ์' : 'ปลดล็อก'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;