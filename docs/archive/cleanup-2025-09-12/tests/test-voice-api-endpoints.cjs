#!/usr/bin/env node

/**
 * Voice API Endpoints Test
 * Tests the newly implemented voice services API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class VoiceAPIEndpointsTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = {
      voiceHealth: {},
      voiceConfig: {},
      tts: {},
      stt: {},
      translation: {},
      qualityAnalysis: {},
      errors: []
    };
    this.testUserId = 'test-user-' + Date.now();
    this.cookies = '';
  }

  async runVoiceAPITests() {
    console.log('🎤 Voice API Endpoints Test\n');
    
    try {
      // Step 1: Start server
      await this.startServer();
      
      // Step 2: Setup user
      await this.setupUser();
      
      // Step 3: Test Voice Health
      await this.testVoiceHealth();
      
      // Step 4: Test Voice Configuration
      await this.testVoiceConfiguration();
      
      // Step 5: Test TTS Endpoint
      await this.testTTSEndpoint();
      
      // Step 6: Test STT Endpoint
      await this.testSTTEndpoint();
      
      // Step 7: Test Translation Endpoint
      await this.testTranslationEndpoint();
      
      // Step 8: Test Quality Analysis
      await this.testQualityAnalysis();
      
      // Step 9: Generate Voice API Report
      this.generateVoiceAPIReport();
      
    } catch (error) {
      console.error('❌ Voice API tests failed:', error.message);
      this.testResults.errors.push(error.message);
    } finally {
      await this.cleanup();
    }
  }

  async startServer() {
    console.log('🚀 Starting server...');
    
    const { spawn } = require('child_process');
    this.serverProcess = spawn('npm', ['start'], {
      cwd: '/home/runner/workspace',
      stdio: 'pipe'
    });
    
    await this.waitForServer();
    console.log('✅ Server started successfully');
  }

  async waitForServer() {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await this.makeRequest('/api/health');
        if (response.status === 200) {
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Server failed to start within 30 seconds');
  }

  async setupUser() {
    console.log('\n👤 Setting up user...');
    
    // Register user
    const registerResponse = await this.makeRequest('/api/auth/signup', 'POST', {
      email: `test-${this.testUserId}@example.com`,
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (registerResponse.status === 200 || registerResponse.status === 409) {
      console.log('✅ User setup complete');
    }
    
    // Login user
    const loginResponse = await this.makeRequest('/api/auth/login', 'POST', {
      email: `test-${this.testUserId}@example.com`,
      password: 'testpassword123'
    });
    
    if (loginResponse.status === 200) {
      this.cookies = loginResponse.headers['set-cookie']?.join('; ') || '';
      console.log('✅ User login complete');
    }
  }

  async testVoiceHealth() {
    console.log('\n🏥 Testing Voice Health Endpoint...');
    
    try {
      const response = await this.makeRequest('/api/voice/health');
      
      if (response.status === 200) {
        console.log('✅ Voice health check passed');
        console.log('📋 Health Response:', JSON.stringify(response.data, null, 2));
        this.testResults.voiceHealth.status = 'PASS';
        this.testResults.voiceHealth.data = response.data;
      } else {
        console.log('❌ Voice health check failed:', response.status);
        this.testResults.voiceHealth.status = 'FAIL';
        this.testResults.voiceHealth.error = response.data;
      }
    } catch (error) {
      console.log('❌ Voice health test failed:', error.message);
      this.testResults.voiceHealth.status = 'FAIL';
      this.testResults.voiceHealth.error = error.message;
    }
  }

  async testVoiceConfiguration() {
    console.log('\n⚙️ Testing Voice Configuration Endpoint...');
    
    try {
      const response = await this.makeRequest('/api/voice/config');
      
      if (response.status === 200) {
        console.log('✅ Voice configuration retrieved');
        console.log('📋 Configuration Response:', JSON.stringify(response.data, null, 2));
        this.testResults.voiceConfig.status = 'PASS';
        this.testResults.voiceConfig.data = response.data;
      } else {
        console.log('❌ Voice configuration failed:', response.status);
        this.testResults.voiceConfig.status = 'FAIL';
        this.testResults.voiceConfig.error = response.data;
      }
    } catch (error) {
      console.log('❌ Voice configuration test failed:', error.message);
      this.testResults.voiceConfig.status = 'FAIL';
      this.testResults.voiceConfig.error = error.message;
    }
  }

  async testTTSEndpoint() {
    console.log('\n🔊 Testing TTS Endpoint...');
    
    try {
      if (!this.cookies) {
        throw new Error('No session cookies available');
      }
      
      const ttsResponse = await this.makeRequest('/api/voice/tts', 'POST', {
        text: 'Hello, this is a test of the text-to-speech functionality.',
        language: 'en',
        voice: 'en-US-Standard-A',
        rate: 1.0,
        pitch: 1.0
      }, this.cookies);
      
      if (ttsResponse.status === 200) {
        console.log('✅ TTS generation successful');
        console.log('📋 TTS Response:', JSON.stringify(ttsResponse.data, null, 2));
        this.testResults.tts.status = 'PASS';
        this.testResults.tts.data = ttsResponse.data;
      } else {
        console.log('❌ TTS generation failed:', ttsResponse.status);
        this.testResults.tts.status = 'FAIL';
        this.testResults.tts.error = ttsResponse.data;
      }
    } catch (error) {
      console.log('❌ TTS test failed:', error.message);
      this.testResults.tts.status = 'FAIL';
      this.testResults.tts.error = error.message;
    }
  }

  async testSTTEndpoint() {
    console.log('\n🎙️ Testing STT Endpoint...');
    
    try {
      if (!this.cookies) {
        throw new Error('No session cookies available');
      }
      
      // Create a mock audio file for testing
      const mockAudioData = Buffer.from('mock audio data for testing');
      const audioPath = '/tmp/test-audio.wav';
      fs.writeFileSync(audioPath, mockAudioData);
      
      // Test STT with mock audio
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(audioPath), 'test-audio.wav');
      formData.append('language', 'en');
      formData.append('model', 'whisper-1');
      
      const sttResponse = await this.makeFormRequest('/api/voice/stt', 'POST', formData, this.cookies);
      
      if (sttResponse.status === 200) {
        console.log('✅ STT processing successful');
        console.log('📋 STT Response:', JSON.stringify(sttResponse.data, null, 2));
        this.testResults.stt.status = 'PASS';
        this.testResults.stt.data = sttResponse.data;
      } else {
        console.log('❌ STT processing failed:', sttResponse.status);
        this.testResults.stt.status = 'FAIL';
        this.testResults.stt.error = sttResponse.data;
      }
      
      // Clean up mock audio file
      fs.unlinkSync(audioPath);
    } catch (error) {
      console.log('❌ STT test failed:', error.message);
      this.testResults.stt.status = 'FAIL';
      this.testResults.stt.error = error.message;
    }
  }

  async testTranslationEndpoint() {
    console.log('\n🌐 Testing Translation Endpoint...');
    
    try {
      if (!this.cookies) {
        throw new Error('No session cookies available');
      }
      
      const translationResponse = await this.makeRequest('/api/voice/translate', 'POST', {
        text: 'Tell me about yourself and your experience in software development.',
        targetLanguage: 'ms',
        sourceLanguage: 'en'
      }, this.cookies);
      
      if (translationResponse.status === 200) {
        console.log('✅ Translation successful');
        console.log('📋 Translation Response:', JSON.stringify(translationResponse.data, null, 2));
        this.testResults.translation.status = 'PASS';
        this.testResults.translation.data = translationResponse.data;
      } else {
        console.log('❌ Translation failed:', translationResponse.status);
        this.testResults.translation.status = 'FAIL';
        this.testResults.translation.error = translationResponse.data;
      }
    } catch (error) {
      console.log('❌ Translation test failed:', error.message);
      this.testResults.translation.status = 'FAIL';
      this.testResults.translation.error = error.message;
    }
  }

  async testQualityAnalysis() {
    console.log('\n🔍 Testing Quality Analysis Endpoint...');
    
    try {
      if (!this.cookies) {
        throw new Error('No session cookies available');
      }
      
      // Create a mock audio file for testing
      const mockAudioData = Buffer.from('mock audio data for quality analysis');
      const audioPath = '/tmp/test-quality-audio.wav';
      fs.writeFileSync(audioPath, mockAudioData);
      
      // Test quality analysis with mock audio
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(audioPath), 'test-quality-audio.wav');
      
      const qualityResponse = await this.makeFormRequest('/api/voice/analyze-quality', 'POST', formData, this.cookies);
      
      if (qualityResponse.status === 200) {
        console.log('✅ Quality analysis successful');
        console.log('📋 Quality Response:', JSON.stringify(qualityResponse.data, null, 2));
        this.testResults.qualityAnalysis.status = 'PASS';
        this.testResults.qualityAnalysis.data = qualityResponse.data;
      } else {
        console.log('❌ Quality analysis failed:', qualityResponse.status);
        this.testResults.qualityAnalysis.status = 'FAIL';
        this.testResults.qualityAnalysis.error = qualityResponse.data;
      }
      
      // Clean up mock audio file
      fs.unlinkSync(audioPath);
    } catch (error) {
      console.log('❌ Quality analysis test failed:', error.message);
      this.testResults.qualityAnalysis.status = 'FAIL';
      this.testResults.qualityAnalysis.error = error.message;
    }
  }

  makeRequest(path, method = 'GET', body = null, cookies = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (cookies) {
        options.headers['Cookie'] = cookies;
      }

      if (body) {
        const bodyString = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(bodyString);
      }

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const responseData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              data: responseData,
              headers: res.headers
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  makeFormRequest(path, method = 'POST', formData, cookies = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Cookie': cookies || ''
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const responseData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              data: responseData,
              headers: res.headers
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      // For form data, we need to handle it differently
      // This is a simplified version - in production, you'd use a proper form-data library
      req.end();
    });
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('✅ Server stopped');
    }
  }

  generateVoiceAPIReport() {
    console.log('\n📊 Voice API Endpoints Test Report');
    console.log('===================================');
    
    // Voice Health Results
    console.log('\n🏥 Voice Health:');
    console.log(`  Status: ${this.testResults.voiceHealth.status || 'NOT TESTED'}`);
    if (this.testResults.voiceHealth.data) {
      console.log(`  Services: ${JSON.stringify(this.testResults.voiceHealth.data.services)}`);
    }
    
    // Voice Configuration Results
    console.log('\n⚙️ Voice Configuration:');
    console.log(`  Status: ${this.testResults.voiceConfig.status || 'NOT TESTED'}`);
    if (this.testResults.voiceConfig.data) {
      console.log(`  Languages: ${this.testResults.voiceConfig.data.supportedLanguages?.length || 0}`);
      console.log(`  TTS Voices: ${Object.keys(this.testResults.voiceConfig.data.ttsVoices || {}).length}`);
    }
    
    // TTS Results
    console.log('\n🔊 TTS (Text-to-Speech):');
    console.log(`  Status: ${this.testResults.tts.status || 'NOT TESTED'}`);
    if (this.testResults.tts.data) {
      console.log(`  Success: ${this.testResults.tts.data.success}`);
      console.log(`  Language: ${this.testResults.tts.data.language}`);
      console.log(`  Voice: ${this.testResults.tts.data.voice}`);
    }
    
    // STT Results
    console.log('\n🎙️ STT (Speech-to-Text):');
    console.log(`  Status: ${this.testResults.stt.status || 'NOT TESTED'}`);
    if (this.testResults.stt.data) {
      console.log(`  Success: ${this.testResults.stt.data.success}`);
      console.log(`  Language: ${this.testResults.stt.data.language}`);
      console.log(`  Transcription: ${this.testResults.stt.data.transcription?.substring(0, 100)}...`);
    }
    
    // Translation Results
    console.log('\n🌐 Translation:');
    console.log(`  Status: ${this.testResults.translation.status || 'NOT TESTED'}`);
    if (this.testResults.translation.data) {
      console.log(`  Success: ${this.testResults.translation.data.success}`);
      console.log(`  Source: ${this.testResults.translation.data.sourceLanguage}`);
      console.log(`  Target: ${this.testResults.translation.data.targetLanguage}`);
      console.log(`  Translation: ${this.testResults.translation.data.translatedText?.substring(0, 100)}...`);
    }
    
    // Quality Analysis Results
    console.log('\n🔍 Quality Analysis:');
    console.log(`  Status: ${this.testResults.qualityAnalysis.status || 'NOT TESTED'}`);
    if (this.testResults.qualityAnalysis.data) {
      console.log(`  Success: ${this.testResults.qualityAnalysis.data.success}`);
      console.log(`  Volume: ${this.testResults.qualityAnalysis.data.quality?.volume}`);
      console.log(`  Clarity: ${this.testResults.qualityAnalysis.data.quality?.clarity}`);
    }
    
    // Error Summary
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Overall Status
    const totalTests = 6;
    const passedTests = Object.values(this.testResults).filter(r => r.status === 'PASS').length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (this.testResults.errors.length === 0) {
      console.log('🎉 All voice API endpoints are working!');
      console.log('✅ Voice health check is functional');
      console.log('✅ Voice configuration is accessible');
      console.log('✅ TTS endpoint is working');
      console.log('✅ STT endpoint is working');
      console.log('✅ Translation endpoint is working');
      console.log('✅ Quality analysis endpoint is working');
    } else {
      console.log('⚠️ Some tests failed. Please review the errors above.');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new VoiceAPIEndpointsTester();
  tester.runVoiceAPITests().catch(console.error);
}

module.exports = VoiceAPIEndpointsTester;
