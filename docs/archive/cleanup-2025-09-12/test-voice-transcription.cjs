/**
 * Test voice transcription endpoint directly
 */

const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Create a minimal WAV file for testing
function createTestWavFile() {
  const sampleRate = 16000;
  const duration = 1; // 1 second
  const samples = sampleRate * duration;
  
  // Create WAV header
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + samples * 2, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(samples * 2, 40);
  
  // Create simple sine wave audio data
  const audioData = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const value = Math.floor(Math.sin(i * 440 * 2 * Math.PI / sampleRate) * 16384);
    audioData.writeInt16LE(value, i * 2);
  }
  
  return Buffer.concat([header, audioData]);
}

async function testSTTEndpoint() {
  console.log('🔍 Testing STT endpoint directly...');
  
  try {
    // Create test audio file
    const wavData = createTestWavFile();
    
    // Create FormData
    const formData = new FormData();
    formData.append('audio', wavData, 'test.wav');
    formData.append('language', 'en');
    formData.append('model', 'whisper-1');
    
    console.log('📤 Making request to /api/voice-services/stt...');
    
    // Test the STT endpoint
    const response = await fetch('http://localhost:5000/api/voice-services/stt', {
      method: 'POST',
      body: formData,
    });
    
    console.log(`📥 Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ STT endpoint response:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ STT endpoint error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ STT test failed:', error.message);
  }
}

async function testSTTRoute() {
  console.log('🔍 Testing if STT route exists...');
  
  try {
    const response = await fetch('http://localhost:5000/api/voice-services/stt', {
      method: 'OPTIONS',
    });
    console.log(`📥 OPTIONS response status: ${response.status}`);
  } catch (error) {
    console.error('❌ Route test failed:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting voice transcription tests...\n');
  
  await testSTTRoute();
  console.log('');
  
  await testSTTEndpoint();
}

runTests().catch(console.error);