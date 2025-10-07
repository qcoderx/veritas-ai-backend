# Veritas AI - Insurance Claims Fraud Detection Platform

## 🚀 Overview

Veritas AI is an AI-powered insurance claims fraud detection platform that accelerates and authenticates the claim verification process for insurance companies. This repository contains both the frontend (React/TypeScript) and backend (FastAPI/Python) components.

## 📁 Repository Structure

```
Veritas_AI/
├── frontend/                   # React TypeScript Frontend
│   ├── public/                # Static assets
│   ├── src/                   # Source code
│   │   ├── components/        # UI components
│   │   ├── pages/            # Application pages
│   │   ├── services/         # API integration
│   │   └── redux/            # State management
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Build configuration
├── backend/                   # FastAPI Python Backend
│   ├── app/                   # Application code
│   ├── requirements.txt       # Python dependencies
│   └── main.py               # Entry point
└── README.md                 # This file
```

## ✨ Features

### 🔐 Authentication System
- User registration and login
- JWT token-based authentication
- Persistent user sessions with localStorage
- Personalized user experience

### 📊 Dashboard
- Real-time claims statistics
- Quick action buttons for common tasks
- Recent claims overview
- Personalized welcome interface

### 📋 Claims Management
- **Multi-step claim creation** with detailed form validation
- **Drag-and-drop file upload** with S3 integration
- **Real-time upload progress** tracking
- **Claims listing** with filtering and sorting
- **Detailed claim analysis** pages

### 🤖 AI-Powered Analysis
- **Automated fraud detection** with risk scoring
- **Evidence analysis** including image metadata examination
- **Timeline inconsistency detection**
- **Pattern matching** against historical fraud cases
- **Comprehensive fraud risk reports**

### 🕵️ AI Co-pilot (Investigator's Cockpit)
- **Interactive chat interface** for claim investigation
- **Real-time AI responses** with Amazon Q integration
- **Claim-specific analysis** with contextual insights
- **Quick action buttons** for common investigation tasks

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Chart.js** - Data visualization

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Production database
- **AWS S3** - File storage
- **Amazon Q** - AI investigation assistant
- **JWT** - Authentication tokens

## 🚀 Getting Started

### Prerequisites
- **Frontend**: Node.js 18+, npm/yarn
- **Backend**: Python 3.9+, pip
- **Database**: PostgreSQL
- **Cloud**: AWS account (S3, Amazon Q)

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

4. **Start development server**
```bash
npm run dev
```

Frontend available at `http://localhost:5173`

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Setup**
Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost/veritas_ai
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name
JWT_SECRET_KEY=your_jwt_secret
```

5. **Start backend server**
```bash
uvicorn main:app --reload
```

Backend available at `http://localhost:8000`

## 📱 User Workflows

### 1. Claim Submission Flow
1. **Login/Register** - User authentication
2. **Create Claim** - Multi-step form with evidence upload
3. **File Upload** - Drag-and-drop with S3 integration
4. **Analysis Trigger** - Immediate "Run Analysis" button
5. **Results Display** - Fraud risk score and detailed report

### 2. Investigation Workflow
1. **Claims Dashboard** - Overview of all claims
2. **Claim Selection** - Choose specific claim for analysis
3. **AI Co-pilot** - Interactive investigation with Amazon Q
4. **Evidence Analysis** - AI-powered insights and recommendations

## 🔧 API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/token` - User login (OAuth2 form data)

### Claims Management
- `GET /claims/` - List all claims
- `POST /claims/` - Create new claim
- `GET /claims/{id}` - Get specific claim
- `POST /claims/{id}/trigger-analysis` - Run fraud analysis

### AI Investigation
- `POST /investigate/{claim_id}/start-conversation` - Start Amazon Q conversation
- `POST /investigate/{claim_id}/query` - Send investigation query

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Render/AWS)
```bash
cd backend
# Deploy using Docker or direct Python deployment
```

### Environment Variables
**Frontend:**
```
VITE_API_BASE_URL=https://your-backend-url.com/api/v1
```

**Backend:**
```
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
JWT_SECRET_KEY=...
```

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run build  # Verify build works
npm run preview  # Test production build
```

### Backend Testing
```bash
cd backend
python -m pytest  # Run test suite
```

### Integration Testing
1. Start both frontend and backend
2. Test complete user workflows
3. Verify AI Co-pilot functionality
4. Test file upload to S3

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS settings include frontend URL
   - Check API_BASE_URL in frontend .env

2. **Database Connection**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format

3. **AWS Integration**
   - Verify AWS credentials and permissions
   - Check S3 bucket configuration

4. **Build Errors**
   - Ensure all dependencies are installed
   - Check Node.js/Python versions

## 📄 Project Architecture

### Frontend Architecture
- **Component-based**: Reusable UI components
- **State Management**: Redux Toolkit for global state
- **Routing**: React Router for navigation
- **API Layer**: Centralized API service

### Backend Architecture
- **FastAPI**: Async Python web framework
- **Database**: SQLAlchemy ORM with PostgreSQL
- **Authentication**: JWT-based auth system
- **File Storage**: AWS S3 integration
- **AI Integration**: Amazon Q for investigations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes in appropriate directory (frontend/ or backend/)
4. Test both components
5. Commit changes: `git commit -m "Add your feature"`
6. Push to branch: `git push origin feature/your-feature`
7. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **AI**: Amazon Q for investigation assistance
- **Cloud**: AWS S3 for file storage
- **Deployment**: Vercel (frontend), Render (backend)

---

**Veritas AI** - Complete full-stack solution for AI-powered insurance fraud detection.