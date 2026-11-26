# AI Chatbot

A full-stack AI chatbot application built with **React, FastAPI, MySQL, and Google Gemini API**. It provides secure user authentication, AI-powered conversations, and persistent chat history.

## Features

- User registration and login
- JWT-based authentication
- Secure password hashing
- AI-powered conversations using Google Gemini
- Create, rename, and delete conversations
- Persistent conversation and message history
- Markdown rendering for AI responses
- Code syntax highlighting
- Copy code and message content
- Regenerate AI responses
- Responsive chat interface

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Markdown
- Syntax Highlighting

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- JWT Authentication

### Database & AI
- MySQL
- Google Gemini API

## Project Structure

```text
AI-Chatbot/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── migrations/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Python
- Node.js and npm
- MySQL
- Google Gemini API Key

### 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
cd AI-Chatbot
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv
```

Activate the virtual environment:

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory and configure:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ai_chatbot
DB_USER=your_database_user
DB_PASSWORD=your_database_password

SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model

FRONTEND_ORIGINS=http://localhost:5173
```

Create the MySQL database named `ai_chatbot` and configure your database credentials.

Run database migrations:

```bash
alembic upgrade head
```

Start the backend server:

```bash
python -m uvicorn app.main:app --reload
```

Backend API:

`http://127.0.0.1:8000`

API Documentation:

`http://127.0.0.1:8000/docs`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend

npm install
```

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend:

`http://localhost:5173`

## Application Architecture

```text
React Frontend
      |
      | Axios HTTP Requests
      v
FastAPI Backend
      |
      |---- JWT Authentication
      |
      |---- MySQL Database
      |
      |---- Google Gemini API
      |
      v
JSON Response
      |
      v
React Chat Interface
```

## Environment Variables

Never commit `.env` files, API keys, database passwords, or secret keys to GitHub.

Use `.env.example` files to document the required environment variables without exposing actual credentials.

## Future Improvements

- Real-time AI response streaming
- Automated backend and frontend tests
- Refresh token authentication
- Improved error handling
- Conversation management improvements

## Author

**Sadikuzzaman Tutul**

GitHub: [Sadikuzzamantutul23](https://github.com/Sadikuzzamantutul23)

LinkedIn: [Sadikuzzaman Tutul](https://www.linkedin.com/in/sadikuzzaman-tutul-34a4813a8/)