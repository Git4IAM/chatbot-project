# 🤖 University AI Chat

> AI Chat Application สำหรับนักศึกษามหาวิทยาลัย พัฒนาบน AWS Serverless Architecture

![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900?style=flat&logo=amazonaws)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat&logo=react)
![Python](https://img.shields.io/badge/Python-Lambda-3776AB?style=flat&logo=python)
![Amazon Bedrock](https://img.shields.io/badge/Amazon-Bedrock-FF9900?style=flat&logo=amazonaws)

---

## 📌 เกี่ยวกับโปรเจก(Not Finished yet)

ระบบ AI Chat สำหรับนักศึกษามหาวิทยาลัย ที่ให้สามารถสนทนากับ AI ได้อย่างปลอดภัย โดยจำกัดการเข้าถึงเฉพาะ email มหาวิทยาลัย (@silpakorn.edu) เท่านั้น รองรับการส่งข้อความ, รูปภาพ และเลือก AI Model ได้หลายรุ่น

---

## ✨ Features

- 🔐 **Authentication** — Login ด้วย Google OAuth 2.0 ผ่าน Amazon Cognito จำกัดเฉพาะ email มหาวิทยาลัย
- 💬 **AI Chat** — สนทนากับ AI ได้หลาย Model (Claude Haiku, Sonnet, Opus และ Amazon Nova)
- 🖼️ **Image Upload** — ส่งรูปภาพให้ AI วิเคราะห์ได้
- 📋 **Session Management** — บันทึกประวัติการสนทนา, เปลี่ยนชื่อ และลบ Session ได้
- 🔄 **Model Switcher** — เปลี่ยน AI Model ได้ตามความต้องการ
- 📱 **Responsive UI** — ใช้งานได้ทั้งบน Desktop และ Mobile

---

## 🏗️ System Architecture

```
User → AWS Amplify (React + Vite)
     → Amazon Cognito (Google OAuth 2.0)
     → API Gateway (HTTP API + JWT Authorizer)
     → AWS Lambda (Python)
     → Amazon Bedrock (Claude / Nova)
     → Amazon DynamoDB (Chat History)
     → Amazon S3 (Image Storage)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, AWS Amplify |
| Authentication | Amazon Cognito, Google OAuth 2.0 |
| API | Amazon API Gateway (HTTP API) |
| Backend | AWS Lambda (Python) |
| AI Model | Amazon Bedrock (Claude Haiku 4.5, Sonnet 4.5, Opus 4, Nova 2 Lite) |
| Database | Amazon DynamoDB |
| Storage | Amazon S3 |
| CI/CD | AWS Amplify CI/CD |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | ส่งข้อความและรับ AI Response |
| POST | `/upload-url` | ขอ S3 Presigned URL สำหรับ upload รูปภาพ |
| GET | `/sessions` | ดึงรายการ Session ทั้งหมด |
| GET | `/sessions/:id` | ดึงประวัติการสนทนาของ Session |
| PATCH | `/sessions/:id` | เปลี่ยนชื่อ Session |
| DELETE | `/sessions/:id` | ลบ Session |

---

## 🗄️ Database Schema

**Sessions Table**
```
PK: userId (String)
SK: sessionId (String)
title: String
createdAt: String
updatedAt: String
```

**Messages Table**
```
PK: sessionId (String)
SK: messageId (String)
role: String (user / assistant)
content: String
createdAt: String
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- AWS Account
- Google Cloud Console Project

### Installation

```bash
# Clone repository
git clone https://github.com/[username]/chatbot-project.git
cd chatbot-project

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### Environment Variables

```env
VITE_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID
VITE_COGINTO_DOMAIN
VITE_API_URL
VITE_AWS_REGION
```

### Run Development Server

```bash
npm run dev
```

---

## ☁️ Deployment

โปรเจกนี้ Deploy บน **AWS Amplify** โดย Auto Deploy ทุกครั้งที่ Push ขึ้น branch `main`

```bash
git push origin main
# Amplify จะ Build และ Deploy ให้อัตโนมัติ
```

---
