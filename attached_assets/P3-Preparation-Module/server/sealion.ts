// Sea Lion API integration for AI-powered feedback
const SEA_LION_API_URL = "https://api.sea-lion.ai/v1/chat/completions";
const SEA_LION_API_KEY = process.env.SEA_LION_API_KEY || "";

interface FeedbackRequest {
  questionText: string;
  responseText: string;
  interviewStage: string;
  jobDescription?: string;
  position?: string;
  company?: string;
}

interface FeedbackResponse {
  overall: string;
  items: Array<{ type: 'positive' | 'improvement', message: string }>;
  starCompliance: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  score: number;
  evaluationScores: {
    technicalDepth: number;
    problemSolving: number;
    communication: number;
    leadershipImpact: number;
    resultsFocused: number;
  };
  suggestions: string[];
}

export async function generateAIFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
  const {
    questionText,
    responseText,
    interviewStage,
    jobDescription,
    position,
    company
  } = request;

  // Build context-aware prompt
  const prompt = `You are an expert interview coach providing detailed feedback on interview responses. 
Analyze the candidate's response using the STAR framework (Situation, Task, Action, Result) and provide constructive feedback.

Interview Context:
- Stage: ${interviewStage}
- Position: ${position || 'Not specified'}
- Company: ${company || 'Not specified'}
${jobDescription ? `- Job Description: ${jobDescription.substring(0, 500)}...` : ''}

Question: "${questionText}"

Candidate's Response: "${responseText}"

Please analyze this response and provide detailed feedback in the following JSON format:
{
  "overall": "Brief overall assessment (2-3 sentences)",
  "items": [
    {"type": "positive", "message": "Specific positive aspect"},
    {"type": "improvement", "message": "Specific area for improvement"}
  ],
  "starCompliance": {
    "situation": boolean,
    "task": boolean, 
    "action": boolean,
    "result": boolean
  },
  "score": number (1-10),
  "evaluationScores": {
    "technicalDepth": number (1-5),
    "problemSolving": number (1-5),
    "communication": number (1-5),
    "leadershipImpact": number (1-5),
    "resultsFocused": number (1-5)
  },
  "suggestions": ["Specific actionable suggestion 1", "Specific actionable suggestion 2"]
}

Return only the JSON object, no additional text.`;

  try {
    const response = await fetch(SEA_LION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEA_LION_API_KEY}`
      },
      body: JSON.stringify({
        model: "aisingapore/Gemma-SEA-LION-v3-9B-IT",
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach providing detailed feedback on interview responses. Analyze responses using the STAR framework and provide constructive feedback in JSON format only."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Sea Lion API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    const aiResponse = responseData.choices[0]?.message?.content || "";
    
    try {
      // Clean up the AI response (remove markdown code blocks if present)
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to parse as JSON
      const feedback = JSON.parse(cleanResponse);
      
      // Validate and ensure all required fields
      const evaluationScores = feedback.evaluationScores || {};
      
      // Generate basic evaluation scores if not provided by AI
      const baseScore = Math.min(Math.max(feedback.score || 5, 1), 10);
      const normalizedScore = Math.ceil(baseScore / 2); // Convert 1-10 to 1-5 scale
      
      return {
        overall: feedback.overall || "Response analyzed successfully.",
        items: Array.isArray(feedback.items) ? feedback.items : [],
        starCompliance: {
          situation: feedback.starCompliance?.situation || false,
          task: feedback.starCompliance?.task || false,
          action: feedback.starCompliance?.action || false,
          result: feedback.starCompliance?.result || false
        },
        score: baseScore,
        evaluationScores: {
          technicalDepth: evaluationScores.technicalDepth || normalizedScore,
          problemSolving: evaluationScores.problemSolving || normalizedScore,
          communication: evaluationScores.communication || normalizedScore,
          leadershipImpact: evaluationScores.leadershipImpact || normalizedScore,
          resultsFocused: evaluationScores.resultsFocused || normalizedScore
        },
        suggestions: Array.isArray(feedback.suggestions) ? feedback.suggestions : []
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.warn("Failed to parse AI response as JSON, using fallback format");
      return generateFallbackFeedback(responseText, aiResponse);
    }

  } catch (error) {
    console.error("Error generating AI feedback:", error);
    
    // Provide meaningful error feedback instead of failing silently
    return {
      overall: "Unable to generate AI feedback at this time. Please try again later.",
      items: [
        {
          type: "improvement",
          message: "AI feedback service temporarily unavailable. Your response has been saved."
        }
      ],
      starCompliance: {
        situation: false,
        task: false,
        action: false,
        result: false
      },
      score: 5,
      evaluationScores: {
        technicalDepth: 3,
        problemSolving: 3,
        communication: 3,
        leadershipImpact: 3,
        resultsFocused: 3
      },
      suggestions: [
        "Try recording your response again",
        "Ensure you address all parts of the question",
        "Consider using the STAR framework for structured responses"
      ]
    };
  }
}

function generateFallbackFeedback(responseText: string, aiResponse: string): FeedbackResponse {
  // Basic analysis when JSON parsing fails
  const wordCount = responseText.trim().split(/\s+/).length;
  const lowerText = responseText.toLowerCase();
  
  // Simple STAR detection
  const starCompliance = {
    situation: lowerText.includes('situation') || lowerText.includes('context') || lowerText.includes('background'),
    task: lowerText.includes('task') || lowerText.includes('objective') || lowerText.includes('goal'),
    action: lowerText.includes('action') || lowerText.includes('did') || lowerText.includes('implemented'),
    result: lowerText.includes('result') || lowerText.includes('outcome') || lowerText.includes('impact')
  };

  const starScore = Object.values(starCompliance).filter(Boolean).length;
  const lengthScore = Math.min(wordCount / 50, 4); // Up to 4 points for length
  const totalScore = Math.round((starScore + lengthScore) * 1.2);

  return {
    overall: aiResponse.substring(0, 200) + "...",
    items: [
      {
        type: wordCount > 30 ? "positive" : "improvement",
        message: wordCount > 30 ? "Good response length" : "Consider providing more detail"
      },
      {
        type: starScore >= 2 ? "positive" : "improvement", 
        message: starScore >= 2 ? "Shows good structure" : "Try using the STAR framework"
      }
    ],
    starCompliance,
    score: Math.min(Math.max(totalScore, 1), 10),
    evaluationScores: {
      technicalDepth: Math.min(Math.max(starScore, 1), 5),
      problemSolving: Math.min(Math.max(lengthScore, 1), 5),
      communication: Math.min(Math.max(wordCount / 20, 1), 5),
      leadershipImpact: Math.min(Math.max(starScore, 1), 5),
      resultsFocused: Math.min(Math.max(starScore, 1), 5)
    },
    suggestions: [
      "Structure your response using STAR framework",
      "Provide specific examples and metrics",
      "Practice articulating your thought process clearly"
    ]
  };
}

// Enhanced feedback for job description context
export async function generateContextualFeedback(
  request: FeedbackRequest & { jobDescriptionText?: string }
): Promise<FeedbackResponse> {
  if (request.jobDescriptionText) {
    // Enhanced prompt with job description context
    const enhancedRequest = {
      ...request,
      jobDescription: request.jobDescriptionText
    };
    
    return generateAIFeedback(enhancedRequest);
  }
  
  return generateAIFeedback(request);
}

// Job Description-based question generation  
export async function generateJobDescriptionQuestions(
  interviewType: string,
  jobDescriptionText: string,
  position: string,
  baseQuestions: any[]
): Promise<any[]> {
  try {
    // Analyze the job description to determine if it's technical or non-technical
    const isCodeRelated = jobDescriptionText.toLowerCase().includes('software') || 
                         jobDescriptionText.toLowerCase().includes('developer') ||
                         jobDescriptionText.toLowerCase().includes('programming') ||
                         jobDescriptionText.toLowerCase().includes('code') ||
                         jobDescriptionText.toLowerCase().includes('technical lead') ||
                         jobDescriptionText.toLowerCase().includes('engineer');

    let prompt: string;
    
    if (isCodeRelated) {
      // For technical roles, enhance existing questions
      prompt = `You are an expert interview coach. Based on the job description provided, enhance the existing interview questions to be more relevant and specific to this technical role.

Interview Stage: ${interviewType}
Position: ${position}

Job Description:
${jobDescriptionText.substring(0, 1000)}...

Existing Questions:
${baseQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

Please enhance these questions by adding specific technologies and technical context from the job description.

Return the enhanced questions in the same JSON format. Include all original fields (id, type, question, tags, difficulty, starGuidance) with improved content.

Return only a JSON array of questions, no additional text.`;
    } else {
      // For non-technical roles, generate completely new industry-appropriate questions
      prompt = `You are an expert interview coach. Based on the job description provided, create entirely NEW interview questions that are completely relevant to this non-technical role and industry.

Interview Stage: ${interviewType}
Position: ${position}

Job Description:
${jobDescriptionText.substring(0, 1000)}...

Generate ${baseQuestions.length} completely new questions that are:
1. Specific to the industry mentioned in the job description
2. Relevant to the actual role responsibilities 
3. Appropriate for the ${interviewType} interview stage
4. NEVER about coding, programming, software development, or technical implementation
5. Focused on business skills, industry knowledge, relationship management, strategy, etc.

For each question, provide:
- A unique ID (generate new UUID)
- The interview type: "${interviewType}"
- A relevant question specific to this industry and role
- Appropriate tags for the skills being assessed
- Difficulty level (easy/medium/hard)
- STAR framework guidance specific to the question

Example for a pharmaceutical business development role might include questions about:
- Regulatory compliance and FDA processes
- Drug licensing and partnership negotiations
- Market access strategies
- Clinical trial understanding
- Pharmaceutical industry dynamics

Return only a JSON array of NEW questions in this format:
[
  {
    "id": "generated-uuid",
    "type": "${interviewType}",
    "question": "Industry-specific question text",
    "tags": ["Relevant", "Skills", "Tags"],
    "difficulty": "medium",
    "starGuidance": {
      "situation": "Relevant context for this industry",
      "task": "Specific responsibility description", 
      "action": "Actions relevant to this field",
      "result": "Results that matter in this industry"
    }
  }
]

Return only the JSON array, no additional text.`;
    }

    const response = await fetch(SEA_LION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEA_LION_API_KEY}`
      },
      body: JSON.stringify({
        model: "aisingapore/Gemma-SEA-LION-v3-9B-IT",
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach who creates industry-appropriate interview questions based on job descriptions. For non-technical roles, never generate questions about coding or software development."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      console.log('Failed to generate JD-specific questions, using base questions');
      return baseQuestions;
    }

    const responseData = await response.json();
    let aiResponse = responseData.choices[0]?.message?.content || "";
    
    // Clean up response (remove markdown if present)
    if (aiResponse.startsWith('```json')) {
      aiResponse = aiResponse.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (aiResponse.startsWith('```')) {
      aiResponse = aiResponse.replace(/```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const enhancedQuestions = JSON.parse(aiResponse);
      
      // Validate that we got an array of questions
      if (Array.isArray(enhancedQuestions) && enhancedQuestions.length > 0) {
        // Ensure each question has required fields, fall back to base if missing
        const validatedQuestions = enhancedQuestions.map((enhanced, index) => {
          const base = baseQuestions[index];
          return {
            id: base?.id || `enhanced-${index}`,
            type: enhanced.type || base?.type || interviewType,
            question: enhanced.question || base?.question || 'Enhanced question generation failed',
            tags: enhanced.tags || base?.tags || [],
            difficulty: enhanced.difficulty || base?.difficulty || 'medium',
            starGuidance: enhanced.starGuidance || base?.starGuidance || {}
          };
        });
        
        console.log(`Generated ${validatedQuestions.length} JD-enhanced questions for ${interviewType}`);
        return validatedQuestions;
      }
    } catch (parseError) {
      console.log('Failed to parse JD-enhanced questions, using base questions');
    }

  } catch (error) {
    console.log('Error generating JD-specific questions:', error);
  }

  // Fall back to base questions if enhancement fails
  return baseQuestions;
}