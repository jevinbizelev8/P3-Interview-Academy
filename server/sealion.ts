import axios from 'axios';

// Sea Lion AI Configuration
const SEA_LION_BASE_URL = 'https://api.sea-lion.ai/v1/chat/completions';
const SEA_LION_MODEL = 'aisingapore/Llama-SEA-LION-v3.5-8B-R';

// Initialize Sea Lion client with error handling
let seaLionClient: any = null;
let initializationError: string | null = null;

try {
  const seaLionApiKey = process.env.SEA_LION_API_KEY;
  if (!seaLionApiKey) {
    throw new Error('SEA_LION_API_KEY environment variable is required');
  }
  
  seaLionClient = {
    apiKey: seaLionApiKey,
    baseURL: SEA_LION_BASE_URL,
    model: SEA_LION_MODEL
  };
  
  console.log('Sea Lion AI client initialized successfully');
  console.log('Using Sea Lion model:', SEA_LION_MODEL);
} catch (error) {
  initializationError = error instanceof Error ? error.message : 'Unknown error';
  console.error('Sea Lion AI initialization failed:', initializationError);
}

// Rate limiting to prevent throttling
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

async function rateLimitedRequest() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

// Sea Lion AI API call function
async function callSeaLionAPI(prompt: string, maxTokens: number = 1000): Promise<string> {
  if (!seaLionClient || initializationError) {
    throw new Error(`Sea Lion client not available: ${initializationError}`);
  }

  await rateLimitedRequest();

  try {
    console.log('Using Sea Lion API endpoint:', SEA_LION_BASE_URL);
    const response = await axios.post(SEA_LION_BASE_URL, {
      model: SEA_LION_MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${seaLionClient.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response structure from Sea Lion API');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;
      
      if (status === 429) {
        throw new Error('Sea Lion API rate limit exceeded. Please wait and try again.');
      } else if (status === 401) {
        throw new Error('Sea Lion API authentication failed. Please check your API key.');
      } else if (status === 400) {
        throw new Error(`Sea Lion API request error: ${message}`);
      } else {
        throw new Error(`Sea Lion API error (${status}): ${message}`);
      }
    } else {
      throw new Error(`Sea Lion API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Generate interview feedback using Sea Lion AI
export async function generateInterviewFeedback(feedbackData: {
  questionText: string;
  responseText: string;
  interviewStage: string;
  position: string;
  company: string;
  jobDescription: string;
}): Promise<any> {
  const { questionText, responseText, interviewStage, position, company, jobDescription } = feedbackData;
  
  const prompt = `You are an expert interview coach providing detailed feedback for ${interviewStage} interview preparation. 

INTERVIEW CONTEXT:
Position: ${position || 'Professional role'}
Company: ${company || 'Technology company'}
Interview Stage: ${interviewStage}
${jobDescription ? `Job Description: ${jobDescription.substring(0, 500)}...` : ''}

QUESTION: ${questionText}

CANDIDATE RESPONSE: ${responseText}

Please evaluate this response using the STAR methodology framework and provide feedback in exactly this JSON format. Return ONLY valid JSON with no extra text, explanations, or formatting:

{
  "score": 3,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "starCompliance": {
    "situation": 3,
    "task": 3, 
    "action": 3,
    "result": 3,
    "overallFlow": 3
  },
  "specificAdvice": "Detailed advice on how to improve this response, focusing on STAR structure and professional communication."
}

CRITICAL: All text in JSON strings must be on single lines with no line breaks, tabs, or control characters. Escape any quotes with backslashes.

Focus on:
• Clear situation context setting
• Specific task/responsibility description  
• Detailed action steps taken
• Quantified results and outcomes
• Professional communication style
• Relevance to the ${interviewStage} interview stage

Provide constructive, actionable feedback using British English.`;

  try {
    const response = await callSeaLionAPI(prompt, 1500);
    
    // Clean and parse the JSON response with better error handling
    let cleanResponse = response.trim();
    
    // Remove any markdown formatting
    cleanResponse = cleanResponse.replace(/```json\s*/g, '');
    cleanResponse = cleanResponse.replace(/```\s*/g, '');
    
    // Try to extract JSON if there's extra text before/after
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }
    
    // Fix JSON by properly handling strings with newlines and control characters
    function repairJSON(jsonStr: string): string {
      // Replace problematic characters within string values only
      let inString = false;
      let escaped = false;
      let result = '';
      
      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        const prevChar = jsonStr[i - 1];
        
        if (char === '"' && !escaped) {
          inString = !inString;
        }
        
        if (inString && !escaped) {
          // Replace control characters within strings
          if (char === '\n') {
            result += ' '; // Replace newlines with spaces
          } else if (char === '\r') {
            result += ' '; // Replace carriage returns with spaces
          } else if (char === '\t') {
            result += ' '; // Replace tabs with spaces
          } else {
            result += char;
          }
        } else {
          result += char;
        }
        
        escaped = (char === '\\' && !escaped);
      }
      
      return result;
    }

    cleanResponse = repairJSON(cleanResponse);
    console.log('Repaired Sea Lion response for parsing:', cleanResponse.substring(0, 300) + '...');
    
    const parsedResponse = JSON.parse(cleanResponse);
    
    // Validate the response structure
    const feedback = {
      score: Math.max(1, Math.min(5, parsedResponse.score || 3)),
      strengths: Array.isArray(parsedResponse.strengths) ? parsedResponse.strengths.slice(0, 3) : ['Professional response provided'],
      improvements: Array.isArray(parsedResponse.improvements) ? parsedResponse.improvements.slice(0, 3) : ['Consider adding more specific examples'],
      starCompliance: {
        situation: Math.max(1, Math.min(5, parsedResponse.starCompliance?.situation || 3)),
        task: Math.max(1, Math.min(5, parsedResponse.starCompliance?.task || 3)),
        action: Math.max(1, Math.min(5, parsedResponse.starCompliance?.action || 3)),
        result: Math.max(1, Math.min(5, parsedResponse.starCompliance?.result || 3)),
        overallFlow: Math.max(1, Math.min(5, parsedResponse.starCompliance?.overallFlow || 3))
      },
      specificAdvice: parsedResponse.specificAdvice || 'Focus on providing more specific examples using the STAR methodology.'
    };
    
    return feedback;
  } catch (error) {
    console.error('Sea Lion feedback generation failed:', error);
    
    // Professional fallback feedback
    return {
      score: 3,
      strengths: [
        'Provided a response to the interview question',
        'Demonstrated engagement with the topic',
        'Showed willingness to participate in the interview process'
      ],
      improvements: [
        'Structure response using STAR method (Situation, Task, Action, Result)',
        'Include specific examples and quantifiable outcomes',
        'Provide more detailed context and background information'
      ],
      starCompliance: {
        situation: 3,
        task: 3,
        action: 3,
        result: 2,
        overallFlow: 3
      },
      specificAdvice: 'To improve your response, use the STAR methodology: clearly describe the Situation, explain your specific Task, detail the Actions you took, and quantify the Results you achieved. This structure helps demonstrate your professional experience effectively.'
    };
  }
}



// Enhance question with job description context using Sea Lion AI
export async function enhanceQuestionWithJobDescription(
  originalQuestion: string,
  jobDescription: string,
  position: string,
  company: string
): Promise<string> {
  const prompt = `You are an interview preparation expert. Enhance this interview question to be more relevant to the specific role and company context.

ORIGINAL QUESTION: ${originalQuestion}
JOB DESCRIPTION: ${jobDescription.substring(0, 1000)}...
POSITION: ${position}
COMPANY: ${company}

Please provide an enhanced version of the question that:
• Maintains the original question's intent and structure
• Adds specific context from the job description
• Makes it more relevant to the ${position} role
• References ${company} context where appropriate
• Uses British English
• Keeps the enhanced question concise (1-2 sentences maximum)

Return only the enhanced question text, no additional formatting or explanation.`;

  try {
    const response = await callSeaLionAPI(prompt, 300);
    const enhancedQuestion = response.trim();
    
    // Validate the response isn't too long or generic
    if (enhancedQuestion.length > 500 || enhancedQuestion.length < 10) {
      return originalQuestion;
    }
    
    return enhancedQuestion;
  } catch (error) {
    console.error('Sea Lion question enhancement failed:', error);
    return originalQuestion; // Return original if enhancement fails
  }
}

// Technical fallback content generator
function generateTechnicalFallback(question: string, industry: string, tags: string[]): {
  modelAnswer: string;
  keySuccessFactors: string[];
  expertTips: string[];
} {
  const lowerQuestion = question.toLowerCase();
  const industryDisplayName = industry.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  // Check for specific question types and provide relevant content
  if (lowerQuestion.includes('composite') && (lowerQuestion.includes('manufacturing') || lowerQuestion.includes('aircraft'))) {
    return {
      modelAnswer: `**Advanced Composite Materials Engineering**

As a ${industryDisplayName} specialist, I approach composite manufacturing through systematic engineering principles.

**Technical Implementation**
• Utilise autoclave processing for aerospace-grade prepreg materials
• Implement strict temperature and pressure profiles per manufacturer specifications
• Apply advanced NDT methods including ultrasonic C-scan and thermography
• Maintain ISO 9001 and AS9100 quality management standards

**Manufacturing Excellence**
• Achieve void content below 2% through proper vacuum bagging techniques
• Control fibre orientation within ±2° tolerance using automated lay-up systems
• Implement statistical process control for consistent mechanical properties
• Document complete material traceability per aviation regulations

This systematic approach ensures components meet stringent aerospace certification requirements while optimising production efficiency.`,
      keySuccessFactors: [
        'Demonstrate deep understanding of composite material properties and behaviour',
        'Show knowledge of aerospace manufacturing standards and certifications',
        'Explain specific quality control and testing methodologies',
        'Reference relevant industry standards (AS9100, NADCAP, etc.)',
        'Quantify performance metrics and tolerance requirements',
        'Display understanding of advanced manufacturing technologies'
      ],
      expertTips: [
        'Prepare specific examples of composite manufacturing projects with measurable outcomes',
        'Stay current with latest aerospace material developments and certifications',
        'Understand the relationship between processing parameters and mechanical properties',
        'Know the regulatory requirements for aerospace composite components'
      ]
    };
  }

  // Phone screening questions
  if (lowerQuestion.includes('question') && (lowerQuestion.includes('company') || lowerQuestion.includes('culture') || lowerQuestion.includes('position'))) {
    return {
      modelAnswer: `**Professional Response Approach**

This is an excellent opportunity to demonstrate genuine interest and research about the company and role.

**Key Elements to Address**
• Show you've researched the company's mission, values, and recent developments
• Ask specific questions about team dynamics, growth opportunities, and day-to-day responsibilities
• Demonstrate alignment between your career goals and the company's direction
• Inquire about success metrics and performance expectations

**Sample Professional Questions**
• "What are the biggest challenges facing the team right now?"
• "How do you measure success in this role during the first 90 days?"
• "What opportunities exist for professional development and growth?"
• "Can you tell me about the team culture and collaboration style?"

**Professional Positioning**
This question allows you to showcase your preparation and genuine interest while gathering crucial information to determine mutual fit.`,
      keySuccessFactors: [
        'Demonstrate thorough research about the company and industry',
        'Ask thoughtful questions about role expectations and team dynamics',
        'Show genuine enthusiasm and interest in the opportunity',
        'Balance asking questions with showing your value proposition',
        'Inquire about growth opportunities and career development',
        'Ask about company culture and working environment'
      ],
      expertTips: [
        'Research recent company news, achievements, and challenges before the interview',
        'Prepare 3-5 thoughtful questions that show strategic thinking',
        'Avoid questions about salary, benefits, or time off in initial screening',
        'Show how your background aligns with company goals and values'
      ]
    };
  }

  // Generic professional fallback for other questions
  return {
    modelAnswer: `**Professional Response**

As a ${industryDisplayName} professional, I approach this systematically using established methodologies.

**Key Approach**
• Apply industry-standard processes and procedures
• Utilise appropriate tools and technologies
• Follow established quality standards and specifications
• Implement proper validation methods

**Expected Outcomes**
This approach ensures deliverables meet professional standards and requirements.`,
    keySuccessFactors: [
      `Demonstrate relevant ${industryDisplayName} expertise`,
      'Use appropriate industry terminology',
      'Provide specific examples with results',
      'Show practical experience and problem-solving skills',
      'Display understanding of industry standards',
      'Connect technical skills to business outcomes'
    ],
    expertTips: [
      `Stay current with ${industryDisplayName} developments`,
      'Prepare specific examples with concrete metrics',
      'Practice clear communication of complex concepts',
      'Research the company\'s technical challenges and opportunities'
    ]
  };
}

// Test Sea Lion API connectivity
export async function testSeaLionConnection(): Promise<{ success: boolean; message: string; model?: string }> {
  try {
    if (!seaLionClient || initializationError) {
      return {
        success: false,
        message: `Sea Lion client not initialized: ${initializationError}`
      };
    }

    const testPrompt = "Hello! Please respond with a brief confirmation that you are working correctly.";
    const response = await callSeaLionAPI(testPrompt, 100);
    
    if (response && response.length > 0) {
      return {
        success: true,
        message: "Sea Lion AI is working correctly",
        model: SEA_LION_MODEL
      };
    } else {
      return {
        success: false,
        message: "Sea Lion API returned empty response"
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Sea Lion connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Translation function for ASEAN languages using Sea Lion AI
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!targetLanguage || targetLanguage === "en") {
    return text; // Return original text for English
  }

  const languageNames: { [key: string]: string } = {
    "ms": "Bahasa Malaysia",
    "id": "Bahasa Indonesia", 
    "th": "Thai (ไทย)",
    "vi": "Vietnamese (Tiếng Việt)",
    "tl": "Filipino",
    "my": "Myanmar (မြန်မာ)",
    "km": "Khmer (ខ្មែរ)",
    "zh-sg": "Chinese - Singapore (中文)"
  };

  const languageName = languageNames[targetLanguage] || targetLanguage;
  
  const prompt = `You are a professional translator specializing in ${languageName}. 

Translate this EXACTLY to pure ${languageName} with NO English words mixed in:

"${text}"

STRICT REQUIREMENTS:
- ONLY ${languageName} text in your response
- NO English words at all in the translation
- NO explanations, reasoning, or extra text
- NO thinking process shown  
- Professional interview tone
- Return translation only, nothing else

Pure ${languageName} translation:`;

  try {
    const response = await callSeaLionAPI(prompt, 2000);
    
    // Extract only the final translation from the response
    let translation = response.trim();
    
    // If response contains thinking tags or patterns, extract only what's after them
    if (translation.includes('</think>')) {
      const afterThink = translation.split('</think>')[1];
      if (afterThink) {
        translation = afterThink.trim();
      }
    }
    
    // Remove any remaining explanatory text and keep only the translation
    // Look for the actual language text (non-English characters or Malaysian phrases)
    const lines = translation.split('\n').filter(line => line.trim());
    
    // Find the line that contains the actual translation (likely contains target language text)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      // Skip lines that look like explanations or English text
      if (!line.toLowerCase().includes('translation') && 
          !line.toLowerCase().includes('check') &&
          !line.toLowerCase().includes('make sure') &&
          !line.toLowerCase().includes('final') &&
          !line.toLowerCase().includes('the user') &&
          !line.toLowerCase().includes('i need') &&
          line.length > 5) {
        translation = line;
        break;
      }
    }
    
    // Clean up any remaining artifacts
    translation = translation.replace(/^[^\w\u0100-\u017F\u0590-\u05FF\u0600-\u06FF\u0E00-\u0E7F\u1000-\u109F\u1780-\u17FF\u4E00-\u9FFF]+/, '');
    translation = translation.replace(/[^\w\s\u0100-\u017F\u0590-\u05FF\u0600-\u06FF\u0E00-\u0E7F\u1000-\u109F\u1780-\u17FF\u4E00-\u9FFF.,?!-]+$/, '');
    
    // Check if translation appears truncated (ends abruptly without proper punctuation)
    const finalTranslation = translation.trim();
    if (finalTranslation.length > 0) {
      // If translation seems incomplete (doesn't end with proper punctuation and is suspiciously short compared to original)
      const lastChar = finalTranslation[finalTranslation.length - 1];
      const hasProperEnding = /[.!?。！？]/.test(lastChar);
      const isReasonableLength = finalTranslation.length >= text.length * 0.3; // At least 30% of original length
      
      if (!hasProperEnding && !isReasonableLength && finalTranslation.length < 100) {
        console.warn(`Translation appears truncated for "${targetLanguage}": "${finalTranslation}"`);
        // Return original text if translation seems incomplete
        return text;
      }
    }
    
    return finalTranslation || text;
  } catch (error) {
    console.error("Translation failed:", error);
    // Return original text as fallback
    return text;
  }
}

// Function to detect and translate response text from ASEAN languages to English for AI processing
export async function translateToEnglish(text: string, sourceLanguage: string): Promise<string> {
  if (!sourceLanguage || sourceLanguage === "en") {
    return text; // Return original text if English
  }

  const languageNames: { [key: string]: string } = {
    "ms": "Bahasa Malaysia",
    "id": "Bahasa Indonesia",
    "th": "Thai (ไทย)", 
    "vi": "Vietnamese (Tiếng Việt)",
    "tl": "Filipino",
    "my": "Myanmar (မြန်မာ)",
    "km": "Khmer (ខ្មែរ)",
    "lo": "Lao (ລາວ)",
    "zh-sg": "Chinese - Singapore (中文)"
  };

  const languageName = languageNames[sourceLanguage] || sourceLanguage;
  
  const prompt = `You are a professional translator. Translate this ${languageName} text to English, maintaining professional interview tone.

RULES:
- Output ONLY the English translation
- Do NOT include any explanations, reasoning, or additional text
- Do NOT show your thinking process  
- Keep the professional interview context

${languageName} text: "${text}"

English translation:`;

  try {
    const response = await callSeaLionAPI(prompt, 1000);
    
    // Extract only the final translation from the response
    let translation = response.trim();
    
    // If response contains thinking tags or patterns, extract only what's after them
    if (translation.includes('</think>')) {
      const afterThink = translation.split('</think>')[1];
      if (afterThink) {
        translation = afterThink.trim();
      }
    }
    
    // Remove any remaining explanatory text and keep only the translation
    // Look for the actual English translation text
    const lines = translation.split('\n').filter(line => line.trim());
    
    // Find the line that contains the actual translation
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      // Skip lines that look like explanations
      if (!line.toLowerCase().includes('translation') && 
          !line.toLowerCase().includes('check') &&
          !line.toLowerCase().includes('make sure') &&
          !line.toLowerCase().includes('final') &&
          !line.toLowerCase().includes('the user') &&
          !line.toLowerCase().includes('i need') &&
          line.length > 5) {
        translation = line;
        break;
      }
    }
    
    // Clean up any remaining artifacts
    translation = translation.replace(/^[^\w\u0100-\u017F\u0590-\u05FF\u0600-\u06FF\u0E00-\u0E7F\u1000-\u109F\u1780-\u17FF\u4E00-\u9FFF]+/, '');
    translation = translation.replace(/[^\w\s\u0100-\u017F\u0590-\u05FF\u0600-\u06FF\u0E00-\u0E7F\u1000-\u109F\u1780-\u17FF\u4E00-\u9FFF.,?!-]+$/, '');
    
    return translation.trim() || text;
  } catch (error) {
    console.error("Translation to English failed:", error);
    // Return original text as fallback
    return text;
  }
}

// Generic method for generating responses with messages format
export async function generateResponse(options: {
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  if (!seaLionClient || initializationError) {
    throw new Error(`Sea Lion client not available: ${initializationError}`);
  }

  await rateLimitedRequest();

  try {
    const response = await axios.post(SEA_LION_BASE_URL, {
      model: SEA_LION_MODEL,
      messages: options.messages,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      top_p: 0.9,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${seaLionClient.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response structure from Sea Lion API');
    }
  } catch (error) {
    console.error('Sea Lion API error:', error);
    throw error;
  }
}
