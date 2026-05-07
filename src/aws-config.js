const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      region: "ap-southeast-1",
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGINTO_DOMAIN,
          scopes: ["email", "openid", "profile", "aws.cognito.signin.user.admin"],
          redirectSignIn: ["http://localhost:5173/", "http://localhost:5173/login"],
          redirectSignOut: ["http://localhost:5173/", "http://localhost:5173/login"],
          redirectSignIn: ["https://main.d2rof1iy68oyio.amplifyapp.com/", "https://main.d2rof1iy68oyio.amplifyapp.com/login"],
          redirectSignOut: ["https://main.d2rof1iy68oyio.amplifyapp.com/", "https://main.d2rof1iy68oyio.amplifyapp.com/login"],
          responseType: "code"
        }
      }
    }
  }
};

export default awsConfig;

//3. สร้างโฟลเดอร์ src/pages/

/*src/pages/Login.jsx 
src/pages/Chat.jsx*/