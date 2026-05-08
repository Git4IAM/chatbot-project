// 1. เช็คว่าตอนนี้เปิดเว็บจาก localhost หรือไม่
const isLocalhost = window.location.hostname === "localhost";

// 2. กำหนด URL ให้ตรงกับสถานการณ์ปัจจุบัน
const redirectUrl = isLocalhost 
  ? "http://localhost:5173/" 
  : "https://main.d2rof1iy68oyio.amplifyapp.com/";

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      region: "ap-southeast-1",
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ["email", "openid", "profile"],
          // 3. ใส่ตัวแปร redirectUrl ที่เช็คแล้วลงไปใน Array ตัวเดียวจบ
          redirectSignIn: [redirectUrl],
          redirectSignOut: [redirectUrl],
          responseType: "code"
        }
      }
    }
  }
};

export default awsConfig;