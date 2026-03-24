import { signInWithRedirect } from 'aws-amplify/auth';

import imgSrc from '../assets/login-illustration.jpg';

export default function Login() {
  return (
    <div className="login-wrapper">
      <div style={{ display: 'flex', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: 680, height: 420 }}>
        
        {/* Left Panel */}
        <div style={{ background: 'linear-gradient(160deg, #1a2e3b 0%, #0f1e28 100%)',
          width: '45%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <img src={imgSrc} alt="AI Assistant" style={{ width: '85%', objectFit: 'contain', borderRadius: 12 }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '12px 0 0' }}>
            University AI Assistant
          </p>
        </div>

        {/* Right Panel */}
        <div style={{ background: 'white', flex: 1, padding: '44px 40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ margin: '0 0 8px', color: '#1a2e3b', fontSize: 26, fontWeight: 700 }}>
            Log in
          </h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>
            ใช้ Email มหาวิทยาลัยเท่านั้น
          </p>

          <button onClick={() => {console.log('clicked'); signInWithRedirect({ provider: 'Google' })}}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, background: 'white', border: '1.5px solid #e0e0e0',
              borderRadius: 10, padding: '12px 20px', fontSize: 15,
              cursor: 'pointer', width: '100%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <img src="https://www.google.com/favicon.ico" width={20} height={20} />
            <span style={{ fontWeight: 600, color: '#333' }}>Login with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}