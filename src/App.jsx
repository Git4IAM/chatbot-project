import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

import Login from './pages/login';
import Chat from './pages/chat';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        const session = await fetchAuthSession();
        const groups = session.tokens?.accessToken?.payload['cognito:groups'] || session.tokens?.idToken?.payload['cognito:groups'] || [];
        setIsAdmin(groups.includes('Admin'));

        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        setIsAdmin(false);
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
              const session = await fetchAuthSession();
              const groups = session.tokens?.accessToken?.payload['cognito:groups'] || session.tokens?.idToken?.payload['cognito:groups'] || [];
              
              setIsAdmin(groups.includes('Admin'));
              setIsAuthenticated(true);
            } catch (e) {
              //console.log(e);
            }
          }, 500);
          break;
        case 'signedOut':
          setIsAuthenticated(false);
          setIsAdmin(false);
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
          ? <Chat isAdmin={isAdmin}/> : <Navigate to="/login" />
      }/>
      <Route path="/admin" element={
        // เงื่อนไข: ต้องล็อกอินแล้ว และ ต้องเป็น Admin ด้วย ถึงจะเข้าได้
        isAuthenticated && isAdmin 
          ? <AdminDashboard /> 
          : <Navigate to="/chat" /> // ถ้าไม่ใช่ Admin ให้เด้งกลับไปหน้าแชทปกติ
      }/>
      <Route path="*" element={
        <Navigate
          to={
            isAuthenticated
              ? "/chat"
              : `/login${location.search}${location.hash}`
          }
          replace
        />
      }/>
    </Routes>
  );
}

export default App;