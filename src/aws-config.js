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
          redirectSignIn: ["http://localhost:5173/", "https://main.d2rof1iy68oyio.amplifyapp.com/", "http://localhost:5173/login", "https://main.d2rof1iy68oyio.amplifyapp.com/login"],
          redirectSignOut: ["http://localhost:5173/login", "https://main.d2rof1iy68oyio.amplifyapp.com/login", "http://localhost:5173/", "https://main.d2rof1iy68oyio.amplifyapp.com/"],
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