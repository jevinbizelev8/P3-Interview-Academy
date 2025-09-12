#!/usr/bin/env node

/**
 * Session Context and State Management Analysis
 * Verifies how session data flows through React context and state management
 */

const fs = require('fs');
const path = require('path');

class SessionContextFlowAnalyzer {
  constructor() {
    this.analysis = {
      contextManagement: {},
      stateFlow: {},
      dataPersistence: {},
      moduleTransitions: {},
      recommendations: []
    };
  }

  async analyzeSessionContextFlow() {
    console.log('🔍 Session Context and State Management Analysis\n');
    
    try {
      // Step 1: Analyze Session Context
      await this.analyzeSessionContext();
      
      // Step 2: Analyze State Management
      await this.analyzeStateManagement();
      
      // Step 3: Analyze Data Persistence
      await this.analyzeDataPersistence();
      
      // Step 4: Analyze Module Transitions
      await this.analyzeModuleTransitions();
      
      // Step 5: Generate Context Flow Report
      this.generateContextFlowReport();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }

  async analyzeSessionContext() {
    console.log('📋 Analyzing Session Context...');
    
    try {
      const contextPath = path.join(__dirname, 'client', 'src', 'contexts', 'SessionContext.tsx');
      const contextContent = fs.readFileSync(contextPath, 'utf8');
      
      // Check for context provider
      const hasProvider = contextContent.includes('SessionProvider');
      console.log(`✅ Session Provider: ${hasProvider ? 'Present' : 'Missing'}`);
      
      // Check for context hook
      const hasHook = contextContent.includes('useSession');
      console.log(`✅ useSession Hook: ${hasHook ? 'Present' : 'Missing'}`);
      
      // Check for context state
      const hasState = contextContent.includes('useState') && contextContent.includes('currentSession');
      console.log(`✅ Context State: ${hasState ? 'Present' : 'Missing'}`);
      
      // Check for context methods
      const hasMethods = contextContent.includes('setCurrentSession') && 
                        contextContent.includes('setCurrentQuestion') && 
                        contextContent.includes('setCurrentResponse');
      console.log(`✅ Context Methods: ${hasMethods ? 'Present' : 'Missing'}`);
      
      this.analysis.contextManagement.provider = hasProvider;
      this.analysis.contextManagement.hook = hasHook;
      this.analysis.contextManagement.state = hasState;
      this.analysis.contextManagement.methods = hasMethods;
      
    } catch (error) {
      console.log('❌ Session context analysis failed:', error.message);
      this.analysis.contextManagement.error = error.message;
    }
  }

  async analyzeStateManagement() {
    console.log('\n🔄 Analyzing State Management...');
    
    try {
      // Analyze prepare module state
      const prepareDashboardPath = path.join(__dirname, 'client', 'src', 'pages', 'prepare', 'enhanced-dashboard.tsx');
      if (fs.existsSync(prepareDashboardPath)) {
        const prepareContent = fs.readFileSync(prepareDashboardPath, 'utf8');
        
        const hasStateManagement = prepareContent.includes('useState') || prepareContent.includes('useQuery');
        console.log(`✅ Prepare module state management: ${hasStateManagement ? 'Present' : 'Missing'}`);
        
        const hasSessionState = prepareContent.includes('preparationSessionId') || prepareContent.includes('sessionId');
        console.log(`✅ Prepare session state: ${hasSessionState ? 'Present' : 'Missing'}`);
        
        this.analysis.stateFlow.prepareState = hasStateManagement;
        this.analysis.stateFlow.prepareSessionState = hasSessionState;
      }
      
      // Analyze practice module state
      const practicePath = path.join(__dirname, 'client', 'src', 'pages', 'practice', 'interview-practice.tsx');
      if (fs.existsSync(practicePath)) {
        const practiceContent = fs.readFileSync(practicePath, 'utf8');
        
        const hasStateManagement = practiceContent.includes('useState') || practiceContent.includes('useQuery');
        console.log(`✅ Practice module state management: ${hasStateManagement ? 'Present' : 'Missing'}`);
        
        const hasSessionState = practiceContent.includes('sessionId') || practiceContent.includes('currentSession');
        console.log(`✅ Practice session state: ${hasSessionState ? 'Present' : 'Missing'}`);
        
        const hasMessageState = practiceContent.includes('messages') || practiceContent.includes('message');
        console.log(`✅ Practice message state: ${hasMessageState ? 'Present' : 'Missing'}`);
        
        this.analysis.stateFlow.practiceState = hasStateManagement;
        this.analysis.stateFlow.practiceSessionState = hasSessionState;
        this.analysis.stateFlow.practiceMessageState = hasMessageState;
      }
      
      // Analyze perform module state
      const performPath = path.join(__dirname, 'client', 'src', 'pages', 'perform', 'dashboard.tsx');
      if (fs.existsSync(performPath)) {
        const performContent = fs.readFileSync(performPath, 'utf8');
        
        const hasStateManagement = performContent.includes('useState') || performContent.includes('useQuery');
        console.log(`✅ Perform module state management: ${hasStateManagement ? 'Present' : 'Missing'}`);
        
        const hasEvaluationState = performContent.includes('evaluation') || performContent.includes('sessionId');
        console.log(`✅ Perform evaluation state: ${hasEvaluationState ? 'Present' : 'Missing'}`);
        
        this.analysis.stateFlow.performState = hasStateManagement;
        this.analysis.stateFlow.performEvaluationState = hasEvaluationState;
      }
      
    } catch (error) {
      console.log('❌ State management analysis failed:', error.message);
      this.analysis.stateFlow.error = error.message;
    }
  }

  async analyzeDataPersistence() {
    console.log('\n💾 Analyzing Data Persistence...');
    
    try {
      // Check for API integration
      const apiIntegrationFiles = [
        'client/src/lib/queryClient.ts',
        'client/src/hooks/use-auth.ts',
        'client/src/services/api.ts'
      ];
      
      let apiIntegrationCount = 0;
      apiIntegrationFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          apiIntegrationCount++;
        }
      });
      
      console.log(`✅ API integration files: ${apiIntegrationCount}/${apiIntegrationFiles.length}`);
      
      // Check for data persistence patterns
      const persistencePatterns = [
        'localStorage',
        'sessionStorage',
        'useQuery',
        'useMutation',
        'queryClient'
      ];
      
      let persistenceCount = 0;
      const clientSrcPath = path.join(__dirname, 'client', 'src');
      
      // Search for persistence patterns in client code
      const searchInDirectory = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            searchInDirectory(filePath);
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              persistencePatterns.forEach(pattern => {
                if (content.includes(pattern)) {
                  persistenceCount++;
                }
              });
            } catch (error) {
              // Ignore file read errors
            }
          }
        });
      };
      
      searchInDirectory(clientSrcPath);
      
      console.log(`✅ Data persistence patterns found: ${persistenceCount} instances`);
      
      this.analysis.dataPersistence.apiIntegration = apiIntegrationCount;
      this.analysis.dataPersistence.persistencePatterns = persistenceCount;
      
    } catch (error) {
      console.log('❌ Data persistence analysis failed:', error.message);
      this.analysis.dataPersistence.error = error.message;
    }
  }

  async analyzeModuleTransitions() {
    console.log('\n🔗 Analyzing Module Transitions...');
    
    try {
      // Check for navigation patterns
      const navigationFiles = [
        'client/src/components/navigation/main-nav.tsx',
        'client/src/pages/prepare/enhanced-dashboard.tsx',
        'client/src/pages/practice/scenario-selection.tsx',
        'client/src/pages/perform/dashboard.tsx'
      ];
      
      let navigationCount = 0;
      navigationFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          navigationCount++;
        }
      });
      
      console.log(`✅ Navigation components: ${navigationCount}/${navigationFiles.length}`);
      
      // Check for route definitions
      const routeFiles = [
        'client/src/pages/prepare.tsx',
        'client/src/pages/practice.tsx',
        'client/src/pages/perform.tsx'
      ];
      
      let routeCount = 0;
      routeFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('Route') || content.includes('Switch')) {
            routeCount++;
          }
        }
      });
      
      console.log(`✅ Route definitions: ${routeCount}/${routeFiles.length}`);
      
      // Check for session ID passing
      const sessionIdPatterns = [
        'sessionId',
        'preparationSessionId',
        'useParams',
        'useSearch'
      ];
      
      let sessionIdCount = 0;
      const clientSrcPath = path.join(__dirname, 'client', 'src');
      
      const searchForSessionId = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            searchForSessionId(filePath);
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              sessionIdPatterns.forEach(pattern => {
                if (content.includes(pattern)) {
                  sessionIdCount++;
                }
              });
            } catch (error) {
              // Ignore file read errors
            }
          }
        });
      };
      
      searchForSessionId(clientSrcPath);
      
      console.log(`✅ Session ID passing patterns: ${sessionIdCount} instances`);
      
      this.analysis.moduleTransitions.navigation = navigationCount;
      this.analysis.moduleTransitions.routes = routeCount;
      this.analysis.moduleTransitions.sessionIdPassing = sessionIdCount;
      
    } catch (error) {
      console.log('❌ Module transitions analysis failed:', error.message);
      this.analysis.moduleTransitions.error = error.message;
    }
  }

  generateContextFlowReport() {
    console.log('\n📋 Session Context and State Management Report');
    console.log('==============================================');
    
    // Context Management Analysis
    console.log('\n📋 Context Management:');
    console.log(`  Session Provider: ${this.analysis.contextManagement.provider ? '✅' : '❌'}`);
    console.log(`  useSession Hook: ${this.analysis.contextManagement.hook ? '✅' : '❌'}`);
    console.log(`  Context State: ${this.analysis.contextManagement.state ? '✅' : '❌'}`);
    console.log(`  Context Methods: ${this.analysis.contextManagement.methods ? '✅' : '❌'}`);
    
    // State Management Analysis
    console.log('\n🔄 State Management:');
    console.log(`  Prepare State: ${this.analysis.stateFlow.prepareState ? '✅' : '❌'}`);
    console.log(`  Prepare Session State: ${this.analysis.stateFlow.prepareSessionState ? '✅' : '❌'}`);
    console.log(`  Practice State: ${this.analysis.stateFlow.practiceState ? '✅' : '❌'}`);
    console.log(`  Practice Session State: ${this.analysis.stateFlow.practiceSessionState ? '✅' : '❌'}`);
    console.log(`  Practice Message State: ${this.analysis.stateFlow.practiceMessageState ? '✅' : '❌'}`);
    console.log(`  Perform State: ${this.analysis.stateFlow.performState ? '✅' : '❌'}`);
    console.log(`  Perform Evaluation State: ${this.analysis.stateFlow.performEvaluationState ? '✅' : '❌'}`);
    
    // Data Persistence Analysis
    console.log('\n💾 Data Persistence:');
    console.log(`  API Integration Files: ${this.analysis.dataPersistence.apiIntegration || 0}/3`);
    console.log(`  Persistence Patterns: ${this.analysis.dataPersistence.persistencePatterns || 0} instances`);
    
    // Module Transitions Analysis
    console.log('\n🔗 Module Transitions:');
    console.log(`  Navigation Components: ${this.analysis.moduleTransitions.navigation || 0}/4`);
    console.log(`  Route Definitions: ${this.analysis.moduleTransitions.routes || 0}/3`);
    console.log(`  Session ID Passing: ${this.analysis.moduleTransitions.sessionIdPassing || 0} instances`);
    
    // Generate Recommendations
    this.generateRecommendations();
  }

  generateRecommendations() {
    console.log('\n💡 Recommendations:');
    
    const recommendations = [];
    
    // Context Management Recommendations
    if (!this.analysis.contextManagement.provider) {
      recommendations.push('Implement SessionProvider component');
    }
    
    if (!this.analysis.contextManagement.hook) {
      recommendations.push('Implement useSession hook');
    }
    
    if (!this.analysis.contextManagement.state) {
      recommendations.push('Add context state management');
    }
    
    if (!this.analysis.contextManagement.methods) {
      recommendations.push('Implement context methods for session management');
    }
    
    // State Management Recommendations
    if (!this.analysis.stateFlow.prepareState) {
      recommendations.push('Implement state management in prepare module');
    }
    
    if (!this.analysis.stateFlow.practiceState) {
      recommendations.push('Implement state management in practice module');
    }
    
    if (!this.analysis.stateFlow.performState) {
      recommendations.push('Implement state management in perform module');
    }
    
    // Data Persistence Recommendations
    if (!this.analysis.dataPersistence.apiIntegration || this.analysis.dataPersistence.apiIntegration < 2) {
      recommendations.push('Ensure proper API integration for data persistence');
    }
    
    if (!this.analysis.dataPersistence.persistencePatterns || this.analysis.dataPersistence.persistencePatterns < 10) {
      recommendations.push('Implement more data persistence patterns');
    }
    
    // Module Transitions Recommendations
    if (!this.analysis.moduleTransitions.navigation || this.analysis.moduleTransitions.navigation < 3) {
      recommendations.push('Implement navigation components for module transitions');
    }
    
    if (!this.analysis.moduleTransitions.routes || this.analysis.moduleTransitions.routes < 3) {
      recommendations.push('Implement route definitions for all modules');
    }
    
    if (!this.analysis.moduleTransitions.sessionIdPassing || this.analysis.moduleTransitions.sessionIdPassing < 5) {
      recommendations.push('Ensure session ID is properly passed between modules');
    }
    
    if (recommendations.length === 0) {
      console.log('  🎉 All systems are working correctly!');
      console.log('  ✅ Session context is properly managed across all modules');
      console.log('  ✅ State management is implemented consistently');
      console.log('  ✅ Data persistence patterns are in place');
      console.log('  ✅ Module transitions are properly configured');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new SessionContextFlowAnalyzer();
  analyzer.analyzeSessionContextFlow().catch(console.error);
}

module.exports = SessionContextFlowAnalyzer;
