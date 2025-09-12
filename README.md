# P³ Interview Academy 🎯

> **AI-Powered Interview Preparation Platform for Southeast Asia**

Transform your interview skills with personalized AI coaching, multi-language support, and comprehensive analytics using our proven **Prepare, Practice, Perform** framework.

🌐 **Live Demo**: [p3-interview-academy.replit.app](https://p3-interview-academy.replit.app)

---

## ✨ Features

### 🎯 **Three Core Modules**
- **📚 Prepare**: AI-driven question generation and interview fundamentals
- **🎪 Practice**: Real-time AI interview simulations with instant feedback
- **📊 Perform**: Comprehensive analytics and performance tracking

### 🌍 **Multi-Language Support**
- **10+ Southeast Asian Languages**: Thai, Indonesian, Malaysian, Vietnamese, Filipino, and more
- **Voice Recognition**: Speech-to-text in multiple languages
- **Text-to-Speech**: Natural voice feedback in your preferred language
- **Cultural Context**: AI responses tailored to regional business practices

### 🤖 **Advanced AI Integration**
- **SeaLion AI**: Primary AI service optimized for Southeast Asian markets
- **Multiple Fallbacks**: OpenAI and Vertex AI for reliable service
- **STAR Method Evaluation**: Structured feedback using Situation, Task, Action, Result framework
- **Real-time Coaching**: Instant analysis and personalized improvement suggestions

### 🎙️ **Voice Technology**
- **Free Browser APIs**: No server costs for voice functionality
- **Multi-language TTS/STT**: Seamless voice interaction in 10+ languages
- **Voice Quality Detection**: Automatic audio optimization
- **Browser Compatibility**: Works across modern browsers

---

## 🚀 Technology Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** + **Shadcn/ui** for modern, accessible UI
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **React Hook Form** + **Zod** for form handling and validation

### **Backend**
- **Node.js** + **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL (Neon serverless)
- **WebSocket** support for real-time features
- **RESTful API** design with structured error handling
- **Session management** with auto-save and recovery

### **AI & Language Services**
- **SeaLion AI** - Primary AI service for Southeast Asian contexts
- **OpenAI** - GPT-4o for advanced language processing
- **Google Vertex AI** - Additional AI capabilities
- **AWS Bedrock** - Claude integration for enterprise features

### **Development & Deployment**
- **TypeScript** for type safety across the stack
- **ESLint** + **Prettier** for code quality
- **Replit** deployment with automatic scaling
- **Git** version control with automated backups

---

## 🏗️ Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and service integrations
│   │   └── utils/          # Helper functions and utilities
├── server/                 # Backend Express application
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic and AI integrations
│   ├── middleware/         # Express middleware functions
│   └── db.ts               # Database configuration
├── shared/                 # Shared types and schemas
│   ├── schema.ts           # Database schema definitions
│   └── types.ts            # TypeScript type definitions
└── attached_assets/        # Static assets and images
    └── generated_images/   # AI-generated visual assets
```

---

## 🛠️ Getting Started

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL database (or Neon serverless)
- Required API keys (OpenAI, Google Cloud, etc.)

### **Development Setup**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd p3-interview-academy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Set up your environment variables:
   ```bash
   # AI Services
   OPENAI_API_KEY=your_openai_key
   SEALION_API_KEY=your_sealion_key
   
   # Database
   DATABASE_URL=your_postgresql_url
   
   # Google Cloud (for Vertex AI)
   GCP_PROJECT_ID=your_project_id
   GCP_REGION=your_region
   GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json
   ```

4. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

---

## 🌐 Deployment

### **Replit Deployment**
This application is optimized for deployment on Replit and is live at:
**[p3-interview-academy.replit.app](https://p3-interview-academy.replit.app)**

### **Manual Deployment**
For other platforms:
1. Ensure all environment variables are configured
2. Run the build process: `npm run build`
3. Start the production server: `npm start`

---

## 🎯 Key Features Deep Dive

### **Prepare Module**
- **AI Question Generation**: Dynamic questions based on job roles and companies
- **Interview Fundamentals**: STAR method training and best practices
- **Multi-language Content**: Questions and guidance in Southeast Asian languages
- **Progress Tracking**: Comprehensive preparation analytics

### **Practice Module** 
- **AI Interview Simulations**: Realistic interview scenarios with AI interviewers
- **Real-time Feedback**: Instant evaluation using STAR method framework
- **Voice Interaction**: Full voice-enabled interview practice
- **Performance Metrics**: Detailed scoring and improvement suggestions

### **Perform Module**
- **Analytics Dashboard**: Comprehensive performance tracking and trends
- **Progress Reports**: Detailed insights into interview preparation progress
- **Goal Setting**: Personalized improvement targets and milestones
- **Export Capabilities**: Download reports and certificates

---

## 🤝 Contributing

We welcome contributions to P³ Interview Academy! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow our coding standards and add tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**: Describe your changes and their benefits

### **Development Guidelines**
- Follow TypeScript best practices
- Use existing UI components from Shadcn/ui where possible
- Ensure all new features work across supported languages
- Add appropriate tests for new functionality
- Update documentation for significant changes

---

## 📄 License

This project is proprietary software developed for interview preparation services across Southeast Asia.

---

## 🆘 Support & Contact

For support, feature requests, or business inquiries:
- **Live Platform**: [p3-interview-academy.replit.app](https://p3-interview-academy.replit.app)
- **Technical Issues**: Use the GitHub Issues tab
- **Feature Requests**: Submit detailed proposals via Issues

---

## 🏆 Acknowledgments

- **SeaLion AI** for culturally-aware AI responses optimized for Southeast Asia
- **OpenAI** for advanced language processing capabilities
- **Google Cloud** for scalable AI infrastructure
- **Replit** for seamless deployment and hosting
- **Southeast Asian Developer Community** for feedback and testing

---

*Built with ❤️ for the Southeast Asian professional community*