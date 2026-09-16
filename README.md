# KrishiSetu (SIH Hackathon Project)

An AI-powered, end-to-end procurement and supply chain management system for farmers and government centers.

## 🚀 Key Features

*   **Farmer Portal (Mobile-First):** Secure, password-less OTP login for farmers. Easy booking of procurement slots and real-time transport tracking.
*   **Multilingual Support:** Accessible in English, Hindi, and Telugu for local farmers.
*   **Admin Dashboard:** Centralized view for center staff to manage weighing, quality checks, and instantaneous payments.
*   **🤖 AI Shortage Prediction (Gemini-Powered):** Analyzes historical and real-time data to predict crop shortages before they happen.
*   **🤖 AI Redistribution Engine:** Automatically generates logistics plans to move surplus crops to deficit regions.
*   **Live IoT Sensor Monitoring:** Real-time dashboard for warehouse temperature, humidity, and pest risk.

## 🛠️ Tech Stack

*   **Frontend:** React, Vite
*   **Backend:** Node.js, Express
*   **Database:** PostgreSQL
*   **AI Engine:** Google Gemini (latest `gemini-3.6-flash` model)
*   **Authentication:** Custom OTP via Nodemailer

## ⚙️ How to Run Locally

1. Clone the repository.
2. Run `npm install` in both the root and frontend directories.
3. Create a `.env` file based on the environment variables required (Database URL, Gemini API Key, Email config).
4. Start the backend: `node server/server.js`
5. Start the frontend: `npm run dev`
6. Access the Farmer portal at `http://localhost:5173/farmer/login` and Admin portal at `http://localhost:5173/admin/login` (User: `admin`, Pass: `admin123`).
