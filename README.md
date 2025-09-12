# 🎯 P3 Interview Academy - AI Interview Coaching Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-p3--interview--academy.replit.app-blue?style=for-the-badge)](https://p3-interview-academy.replit.app)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

**Advanced AI-powered interview coaching platform designed for Southeast Asian professionals**

Transform your interview skills with personalized AI coaching, multi-language support, and real-time feedback across all interview stages - from phone screening to executive rounds.

## 🌟 Key Features

### 🤖 **AI-Powered Coaching**
- **SeaLion AI Integration**: Advanced AI models specifically trained for Southeast Asian contexts
- **Dynamic Question Generation**: Personalized questions based on job role, company, and interview stage
- **Real-time Coaching**: Instant guidance and suggestions during practice sessions
- **STAR Method Evaluation**: Comprehensive feedback using the Situation, Task, Action, Result framework

### 🌍 **Multi-Language Support**
- **10 Southeast Asian Languages**: English, Bahasa Malaysia, Bahasa Indonesia, Thai, Vietnamese, Filipino, and more
- **Cultural Adaptation**: Culturally appropriate responses and interview styles
- **Bilingual Practice**: Questions in local language with English AI feedback
- **Voice Recognition**: Speech-to-text in multiple languages

### 🎯 **Comprehensive Interview Preparation**
- **5 Interview Stages**: Phone screening, functional/team, hiring manager, technical expertise, executive rounds
- **Industry-Specific Scenarios**: Tailored questions for different sectors and roles
- **Performance Tracking**: Detailed analytics and progress monitoring
- **Model Answers**: AI-generated optimal responses for learning

### 📚 **Three-Module Learning Path**

#### 1. **Prepare** 📖
- Interview fundamentals and best practices
- Industry insights and common question patterns
- Comprehensive preparation resources
- Cultural interview etiquette

#### 2. **Practice** 🎭 (Primary Module)
- Interactive AI coaching sessions
- Real-time feedback and guidance
- Multi-language interview simulation
- Performance analytics and improvement suggestions

#### 3. **Perform** 🏆
- Advanced interview strategies
- Executive presence development
- Negotiation skills and career planning
- Master-level interview techniques

## 🚀 Live Application

**🌐 [Visit P3 Interview Academy](https://p3-interview-academy.replit.app)**

### Target Audiences
- **🎓 Fresh Graduates**: Build confidence for first job interviews
- **💼 Career Changers**: Navigate transition interviews successfully  
- **📈 Professionals**: Advance to senior positions with executive interview skills
- **🌏 International Candidates**: Master English interviews while maintaining cultural authenticity

## 🛠️ Technology Stack

### **Frontend**
- **React 18** with TypeScript for type-safe development
- **Vite** for fast build tooling and hot module replacement
- **TailwindCSS** for modern, responsive styling
- **Radix UI** for accessible, unstyled components
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **Framer Motion** for smooth animations

### **Backend**
- **Node.js** with Express.js for server infrastructure
- **TypeScript** for full-stack type safety
- **Drizzle ORM** with PostgreSQL for database management
- **Socket.io** for real-time communication
- **Express Sessions** for authentication management
- **Multer** for file upload handling

### **AI & Services**
- **SeaLion AI** (Primary) - Southeast Asia-focused language models
- **Anthropic Claude** - Advanced reasoning and coaching
- **Google Vertex AI** - Multi-modal AI capabilities
- **AWS Bedrock** - Scalable AI model access
- **Google Cloud Speech-to-Text** - Multi-language voice recognition
- **Google Cloud Text-to-Speech** - Natural voice synthesis

### **Development & Testing**
- **Vitest** for unit and integration testing
- **Testing Library** for component testing
- **MSW (Mock Service Worker)** for API mocking
- **TypeScript** for compile-time error checking
- **ESLint & Prettier** for code quality

### **Database & Deployment**
- **PostgreSQL** with connection pooling
- **Drizzle Kit** for database migrations
- **Replit** for hosting and deployment
- **Environment-based configuration** for multiple deployment stages

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Google Cloud credentials (for voice services)
- AI API keys (SeaLion, Anthropic, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/p3-interview-academy.git
   cd p3-interview-academy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   Configure your environment variables:
   ```env
   # Database
   DATABASE_URL=your_postgresql_url
   
   # AI Services
   SEALION_API_KEY=your_sealion_key
   ANTHROPIC_API_KEY=your_claude_key
   GOOGLE_APPLICATION_CREDENTIALS=path/to/gcp-credentials.json
   
   # Session Secret
   SESSION_SECRET=your_secure_session_secret
   ```

4. **Database setup**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run test suite
- `npm run test:coverage` - Generate test coverage report
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

## 🧪 Testing

Comprehensive test suite with **100% test pass rate**:

```bash
# Run all tests
npm run test

# Run specific test categories
npm run test:run                    # All tests
npm run test:coverage              # With coverage report
npm run test:prepare               # Component tests
```

**Test Coverage:**
- ✅ 38 passing tests across all modules
- 🧪 Component testing with React Testing Library
- 🔧 API integration testing with MSW
- 📱 Multi-language functionality testing
- ♿ Accessibility compliance testing

## 🏗️ Project Structure

```
p3-interview-academy/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Route components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   └── __tests__/        # Test files
├── server/                     # Backend Express server
│   ├── services/             # AI and external services
│   ├── routes/               # API route handlers
│   └── db/                   # Database schema and migrations
├── shared/                     # Shared TypeScript types
├── archive/                    # Development files (archived)
│   ├── docs/                 # Project documentation
│   ├── testing/              # Development test scripts
│   ├── legacy/               # Deprecated code
│   └── scripts/              # Build and utility scripts
└── dist/                      # Production build output
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with proper TypeScript types
4. **Add tests** for new functionality
5. **Run the test suite** (`npm run test`)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to your branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and TypeScript patterns
- Add tests for new features and bug fixes
- Update documentation for user-facing changes
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SeaLion AI** for Southeast Asian language model capabilities
- **Anthropic** for advanced AI reasoning and coaching
- **Google Cloud** for speech recognition and text-to-speech services
- **Replit** for hosting and deployment platform
- **Open Source Community** for the amazing tools and libraries

## 📧 Contact & Support

- **Live Demo**: [p3-interview-academy.replit.app](https://p3-interview-academy.replit.app)
- **Issues**: [GitHub Issues](https://github.com/yourusername/p3-interview-academy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/p3-interview-academy/discussions)

---

**🌟 Star this repository if you find it helpful!**

Built with ❤️ for the Southeast Asian professional community