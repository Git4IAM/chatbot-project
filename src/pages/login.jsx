import { signInWithRedirect } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useState, useEffect } from 'react';
import imgSrc from '../assets/login-illustration.jpg';

export default function Login() {
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. ดักจับ Error จาก URL Parameters
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    
    const redirectError = searchParams.get('error') || hashParams.get('error');
    const redirectErrorDescription = searchParams.get('error_description') || hashParams.get('error_description');

    if (redirectError || redirectErrorDescription) {
      // ตรวจสอบว่า Error เป็นเรื่องการถูกระงับสิทธิ์หรือไม่
      const description = (redirectErrorDescription || '').toLowerCase();
      
      if (description.includes('disabled')) {
        setError('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
      } else {
        setError('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
      }
      
      // ล้าง URL ให้สะอาดหลังจากอ่านค่าเสร็จแล้ว
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. ดักจับ Error จาก Amplify Hub
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect_failure') {
        // บางครั้ง Error อาจจะมากับ payload.data.message
        const errorMessage = (payload.data?.message || '').toLowerCase();
        
        if (errorMessage.includes('disabled')) {
          setError('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
        } else {
          setError('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="login-wrapper">
      <div
        style={{
          display: 'flex',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          width: 680,
          height: 420
        }}
      >
        <div
          style={{
            background: 'linear-gradient(160deg, #1a2e3b 0%, #0f1e28 100%)',
            width: '45%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 30
          }}
        >
          <img src={imgSrc} alt="AI Assistant" style={{ width: '85%', objectFit: 'contain', borderRadius: 12 }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '12px 0 0' }}>University AI Assistant</p>
        </div>

        <div
          style={{
            background: 'white',
            flex: 1,
            padding: '44px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <h2 style={{ margin: '0 0 8px', color: '#1a2e3b', fontSize: 26, fontWeight: 700 }}>Sign in</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>ใช้ Email ในการเข้าใช้งาน</p>

          <button
            onClick={async () => {
              try {
                setError('');
                await signInWithRedirect({ provider: 'Google' });
              } catch (e) {
                setError('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบด้');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: 'white',
              border: '1.5px solid #e0e0e0',
              borderRadius: 10,
              padding: '12px 20px',
              fontSize: 15,
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <img src="https://www.google.com/favicon.ico" width={20} height={20} alt="Google Logo" />
            <span style={{ fontWeight: 600, color: '#333' }}>Login with Google</span>
          </button>

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#dc2626',
                fontSize: 13,
                textAlign: 'center'
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}