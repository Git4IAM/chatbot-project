import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import Login from './pages/login';
import Chat from './pages/chat';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
    }
  };

  checkAuth();

      // ฟัง event หลัง Google redirect กลับมา
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      //console.log('Auth event:', payload.event);
      switch (payload.event) {
        case 'signedIn':
        case 'signInWithRedirect':
        // รอให้ Amplify process token ก่อน
          setTimeout(async () => {
            try {
              await getCurrentUser();
              setIsAuthenticated(true);
            } catch (e) {
              //console.log(e);
            }
          }, 500);
          break;
        case 'signedOut':
          setIsAuthenticated(false);
          break;
        case 'signInWithRedirect_failure':
          console.log('Failed:', payload);
          setIsAuthenticated(false);
          break;
      } 
    });

    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/chat" /> : <Login />
      }/>
      <Route path="/chat" element={
        isAuthenticated 
          ? <Chat /> : <Navigate to="/login" />
      }/>
      <Route path="*" element={
        <Navigate to={isAuthenticated ? "/chat" : "/login"} />
      }/>
    </Routes>
  );
}

export default App;
/*
**ลำดับการทำ**

1. แก้ App.jsx (เดิม) → บันทึก → ย้ายเป็น pages/Chat.jsx
2. สร้าง App.jsx ใหม่ (Router ด้านบน)
3. สร้าง pages/Login.jsx
4. สร้าง aws-config.js
5. แก้ main.jsx*/