# 🎯 InterVue AI

> **AI-Powered Intelligent Interview Platform**  
> Practice, Learn, and Ace Your Next Interview with Cutting-Edge AI Technology

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/yourusername/hirewise)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-success.svg)](https://github.com/yourusername/hirewise)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

**InterVue AI** is a next-generation interview preparation platform that leverages Google's Gemini AI to deliver intelligent, adaptive interview experiences. Whether you're a candidate looking to practice or a recruiter seeking to streamline hiring, InterVue AI provides:

- 🧠 **Smart Question Generation** - AI analyzes your resume and generates role-specific questions
- ⚡ **Rapid Fire Mode** - 10-question time-bound challenges with offline evaluation
- 🎙️ **Voice Interview** - Practice with speech-to-text capabilities
- 📊 **AI-Powered Scoring** - Get detailed feedback on your answers with actionable insights
- 📈 **Resume Analysis** - ATS scoring, skill gap analysis, and smart rewrite suggestions

---

## ✨ Features

### 🎯 Smart Interview Mode
- **Resume-Based Question Generation**: Upload your resume and get personalized questions based on your experience
- **Job Description Matching**: Tailored questions that align with specific job requirements
- **Adaptive Difficulty**: Questions adjust based on your expertise level (3-6 questions)
- **Learning Insights**: Detailed feedback with improvement tips and real interview advice
- **Multiple Question Types**: Behavioral, Technical, Situational, and Problem-Solving

### ⚡ Rapid Fire Mode
- **10-Question Challenges**: Fast-paced interview simulation
- **Offline Evaluation**: No API calls during the interview for instant experience
- **200+ Questions Database**: Curated questions for multiple roles:
  - Data Analyst
  - Data Scientist
  - Frontend Developer
  - Backend Developer
  - Full Stack Developer
  - Product Manager
  - Social Media Analyst
  - DevOps Engineer
  - And more...
- **60-Second Timer**: Practice thinking and answering under pressure
- **Batch AI Evaluation**: All answers evaluated together at the end for comprehensive report
- **Female Voice Synthesis**: Clear, professional voice feedback

### 🎙️ Voice Interview
- **Speech-to-Text**: Practice answering questions verbally
- **Real-Time Transcription**: See your answers as you speak
- **Natural Interview Flow**: Mimics real interview conditions
- **Voice Evaluation**: AI analyzes both content and communication

### 📊 Resume Analyzer
- **ATS Score**: Get your resume's applicant tracking system compatibility score
- **Skill Gap Analysis**: Identify missing skills and improvement areas
- **Smart Rewrite Suggestions**: AI-powered resume enhancement recommendations
- **PDF/DOCX Support**: Upload resumes in multiple formats

### 🤖 AI-Powered Features
- **Context-Aware Feedback**: Personalized evaluation based on job role and experience
- **Learning Reports**: Comprehensive post-interview analysis with:
  - Overall performance summary
  - Strengths demonstrated
  - Areas for improvement
  - Confidence level assessment
  - Estimated readiness timeline
- **Follow-up Topics**: Suggestions for deeper learning after each answer

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI Model**: Google Gemini AI (generative-ai v0.3.1)
- **Resume Parsing**: PyPDF2, python-docx
- **Database**: Supabase
- **API Documentation**: Auto-generated with FastAPI (Swagger/OpenAPI)

### Frontend
- **Framework**: React 18.2
- **Styling**: Custom CSS with glassmorphism and modern UI
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **PDF Export**: html2pdf.js

### DevOps
- **Backend Deployment**: Render
- **Frontend Deployment**: Vercel
- **Version Control**: Git/GitHub

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- Google Gemini API Key
- Supabase Account (optional, for database features)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hirewise.git
   cd hirewise/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # or
   source .venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file in the `backend` folder:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

5. **Run the backend**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`
   
   📚 API Docs: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file in the `frontend` folder:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

4. **Run the frontend**
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

---

## 📁 Project Structure

```
hirewise/
├── backend/
│   ├── data/
│   │   └── questions.json          # Rapid Fire question bank (200+ questions)
│   ├── main.py                     # FastAPI application & routes
│   ├── llm_service.py              # Gemini AI integration
│   ├── rapid_fire_mode.py          # Rapid Fire logic & offline evaluation
│   ├── resume_parser.py            # PDF/DOCX parsing
│   ├── similarity_engine.py        # Resume-job matching algorithm
│   ├── advanced_smart_cache.py     # Response caching for performance
│   ├── models.py                   # Pydantic models
│   ├── generate_questions.py       # Question generation utilities
│   ├── requirements.txt            # Python dependencies
│   └── .env                        # Environment variables
│
├── frontend/
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── App.js                  # Main application component
│   │   ├── RapidFire.jsx           # Rapid Fire interview interface
│   │   ├── VoiceInterview.jsx      # Voice interview component
│   │   ├── ResumeUpload.jsx        # Resume upload interface
│   │   ├── ResumeReport.jsx        # Resume analysis results
│   │   ├── App.css                 # Global styles
│   │   └── index.js                # React entry point
│   ├── package.json                # Node dependencies
│   └── .env                        # Frontend environment variables
│
├── docs/                           # Documentation
├── render.yaml                     # Render deployment config
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/health` | Detailed health status |
| `GET` | `/analytics` | Platform analytics |

### Interview Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload-resume` | Upload resume & start smart interview |
| `POST` | `/analyze-resume` | Resume analysis (ATS + scoring) |
| `POST` | `/start-rapid-fire` | Start Rapid Fire interview session |
| `POST` | `/submit-answer/{session_id}` | Submit answer for evaluation |
| `POST` | `/rapid-fire/{session_id}/submit-answer` | Rapid Fire answer submission |
| `POST` | `/submit-voice-batch` | Batch voice interview evaluation |
| `GET` | `/session/{session_id}` | Get session details |

### Request/Response Examples

**Start Rapid Fire Interview**
```bash
POST /start-rapid-fire
Content-Type: application/json

{
  "job_role": "Data Analyst"
}
```

Response:
```json
{
  "status": "success",
  "session_id": "uuid-here",
  "mode": "rapid_fire",
  "total_questions": 10,
  "first_question": {
    "question": "What is the difference between...",
    "type": "Technical",
    "difficulty": "Medium"
  },
  "config": {
    "num_questions": 10,
    "time_per_question": 60
  }
}
```

---

## 🌐 Deployment

### Backend (Render)
- Auto-deploys from `main` branch
- Configuration in `render.yaml`
- Environment variables set in Render dashboard

### Frontend (Vercel)
- Connected to GitHub repository
- Auto-deploys on push
- Environment variable: `REACT_APP_API_URL`

**Live URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-api.onrender.com`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the intelligent question generation and evaluation
- **React** community for excellent frontend tooling
- **FastAPI** for the blazing-fast backend framework
- All contributors and testers who helped shape this platform

---

## 📧 Contact

For questions, feedback, or support:
- **Email**: your.email@example.com
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/hirewise/issues)

---

<div align="center">

**Made with ❤️ by the InterVue AI Team**

⭐ Star this repo if you find it helpful!

</div>
