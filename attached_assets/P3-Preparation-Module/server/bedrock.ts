import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import Anthropic from '@anthropic-ai/sdk';

// Parse the provided API key to extract AWS credentials or bearer token
function parseBedrockCredentials(apiKey: string) {
  try {
    // Handle new AWS Bedrock API Key format (Bearer token)
    if (apiKey.length > 100 && !apiKey.includes(':') && !apiKey.includes('BedrockAPIKey-')) {
      return { type: 'bearer', token: apiKey };
    }
    
    // Handle direct AWS credentials format: ACCESS_KEY:SECRET_KEY
    if (apiKey.includes(':') && !apiKey.includes('BedrockAPIKey-')) {
      const parts = apiKey.split(':');
      if (parts.length >= 2) {
        return {
          type: 'credentials' as const,
          accessKeyId: parts[0].trim(),
          secretAccessKey: parts[1].trim()
        };
      }
    }
    
    // Handle legacy base64 encoded format
    try {
      const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
      const match = decoded.match(/BedrockAPIKey-(.+):(.+)/);
      if (match) {
        return {
          type: 'credentials' as const,
          accessKeyId: match[1].trim(),
          secretAccessKey: match[2].trim()
        };
      }
    } catch {
      // Not base64, continue with other formats
    }
    
    throw new Error('Invalid API key format');
  } catch (error) {
    throw new Error(`Failed to parse Bedrock credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Initialize Bedrock client with error handling
let bedrockClient: BedrockRuntimeClient | null = null;
let initializationError: string | null = null;

try {
  const bedrockApiKey = process.env.BEDROCK_API_KEY;
  if (!bedrockApiKey) {
    throw new Error('BEDROCK_API_KEY environment variable is required');
  }

  const parsedCredentials = parseBedrockCredentials(bedrockApiKey);
  
  if (parsedCredentials.type === 'bearer') {
    throw new Error('Bearer token authentication not yet implemented. Please provide ACCESS_KEY:SECRET_KEY format.');
  } else if (parsedCredentials.type === 'credentials') {
    if (!parsedCredentials.accessKeyId || !parsedCredentials.secretAccessKey) {
      throw new Error('Invalid credentials: missing accessKeyId or secretAccessKey');
    }
    
    bedrockClient = new BedrockRuntimeClient({
      region: 'ap-southeast-1', // Singapore region
      credentials: {
        accessKeyId: parsedCredentials.accessKeyId,
        secretAccessKey: parsedCredentials.secretAccessKey
      }
    });
  }
  
  console.log('Bedrock client initialized successfully with', parsedCredentials.type, 'authentication');
  console.log('Using AWS region: ap-southeast-1 (Singapore)');
} catch (error) {
  initializationError = `Failed to initialize Bedrock client: ${error instanceof Error ? error.message : 'Unknown error'}`;
  console.error(initializationError);
}

export interface BedrockResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function generateWithBedrock(
  prompt: string,
  modelId: string = 'anthropic.claude-3-sonnet-20240229-v1:0'
): Promise<BedrockResponse> {
  if (!bedrockClient) {
    throw new Error(initializationError || 'Bedrock client not initialized');
  }
  
  try {
    console.log('Calling Bedrock with model:', modelId);
    console.log('Prompt length:', prompt.length);
    
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        top_p: 0.9
      })
    });

    const response = await bedrockClient.send(command);
    console.log('Bedrock response received, status:', response.$metadata.httpStatusCode);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Response parsed successfully');

    return {
      content: responseBody.content[0].text,
      usage: {
        inputTokens: responseBody.usage?.input_tokens || 0,
        outputTokens: responseBody.usage?.output_tokens || 0
      }
    };
  } catch (error) {
    console.error('Bedrock API error details:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Bedrock API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateInterviewFeedback(
  question: string,
  userResponse: string,
  interviewStage: string,
  position: string,
  company: string,
  jobDescription?: string
): Promise<string> {
  try {
    const contextPrompt = jobDescription 
      ? `Job Description Context: ${jobDescription.substring(0, 500)}...`
      : '';

    const prompt = `As an expert interview coach, evaluate this ${interviewStage} interview response using the STAR methodology (Situation, Task, Action, Result).

Question: "${question}"

Candidate Response: "${userResponse}"

Position: ${position}
Company: ${company}
${contextPrompt}

Please provide detailed feedback in the following JSON format:
{
  "overallScore": 4,
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["improvement1", "improvement2"],
  "specificFeedback": "Detailed analysis of the response quality, structure, and STAR methodology implementation",
  "actionableAdvice": "Concrete suggestions for improvement focused on STAR structure",
  "scoreBreakdown": {
    "situation": 4,
    "task": 3,
    "action": 5,
    "result": 4,
    "overall": 4
  }
}

Evaluation Criteria:
- Situation (1-5): Did they set proper context with relevant details without rambling?
- Task (1-5): Did they clearly explain their specific responsibility or objective?
- Action (1-5): Did they provide specific steps taken, avoiding vague answers like "I worked hard"?
- Result (1-5): Did they quantify outcomes with numbers, metrics, and long-term impact?
- Overall (1-5): How well does the story flow as a complete, coherent narrative?

Focus on how well the candidate follows the STAR methodology structure and provides concrete, specific examples with measurable outcomes.
  }
}

Rate each aspect on a 1-5 star scale where:
1 = Poor, needs significant improvement
2 = Below average, several areas to address  
3 = Average, meets basic expectations
4 = Good, above average with minor improvements needed
5 = Excellent, exceptional response

The 5-star criteria are:
- Relevant: Response directly addresses the question and role requirements
- Structured: Clear organisation using frameworks like STAR (Situation, Task, Action, Result)
- Specific: Concrete examples with quantifiable details and metrics
- Aligned: Response matches company values and interview stage expectations
- Outcome-orientated: Focus on results, impact, and measurable achievements

Focus on practical, actionable feedback that helps the candidate improve their interview performance. Use British English throughout.`;

    const response = await generateWithBedrock(prompt);
    
    // Clean up potential markdown formatting from the response
    let cleanResponse = response.content.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    
    // Validate JSON format
    try {
      JSON.parse(cleanResponse);
      return cleanResponse;
    } catch (parseError) {
      console.error('Failed to parse Bedrock JSON response:', parseError);
      console.error('Raw response:', cleanResponse);
      throw new Error('Invalid JSON response from Bedrock');
    }
  } catch (error) {
    console.error('Bedrock feedback generation failed:', error);
    
    // Generate intelligent fallback feedback using response analysis
    return generateIntelligentFallbackFeedback(question, userResponse, interviewStage, position, company, jobDescription);
  }
}

function generateIntelligentFallbackFeedback(
  question: string,
  userResponse: string,
  interviewStage: string,
  position: string,
  company: string,
  jobDescription?: string
): string {
  const responseLength = userResponse.length;
  const wordCount = userResponse.split(/\s+/).length;
  const sentences = userResponse.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  let overallScore = 3; // Default to average
  let strengths: string[] = [];
  let improvements: string[] = [];
  let specificFeedback = "";
  let actionableAdvice = "";
  
  // Analyze response characteristics
  const lowerResponse = userResponse.toLowerCase();
  
  // Length analysis
  if (wordCount < 50) {
    improvements.push("Response could be more detailed with additional context and examples");
    overallScore = Math.max(overallScore - 0.5, 2);
  } else if (wordCount > 200) {
    improvements.push("Consider being more concise while maintaining key points");
  } else {
    strengths.push("Good response length with appropriate detail level");
  }
  
  // Structure analysis (look for storytelling elements)
  let hasStructure = false;
  const structureWords = ['situation', 'challenge', 'context', 'task', 'action', 'result', 'outcome', 'impact'];
  const foundStructureWords = structureWords.filter(word => lowerResponse.includes(word));
  
  if (foundStructureWords.length >= 2) {
    strengths.push("Response demonstrates structured storytelling approach");
    hasStructure = true;
    overallScore += 0.5;
  } else {
    improvements.push("Consider using the STAR method (Situation, Task, Action, Result) for better structure");
  }
  
  // Specificity analysis
  const specificityIndicators = ['specific', 'example', 'instance', 'experience', 'project', 'company', 'team', 'achieved', 'implemented', 'developed'];
  const foundSpecificityWords = specificityIndicators.filter(word => lowerResponse.includes(word));
  
  if (foundSpecificityWords.length >= 3) {
    strengths.push("Response includes specific examples and concrete details");
    overallScore += 0.3;
  } else {
    improvements.push("Include more specific examples and quantifiable results");
  }
  
  // Industry/role relevance analysis
  if (jobDescription) {
    const jdWords = jobDescription.toLowerCase().split(/\s+/).slice(0, 100);
    const commonWords = jdWords.filter(word => 
      word.length > 4 && 
      lowerResponse.includes(word) && 
      !['that', 'this', 'with', 'have', 'will', 'been', 'from', 'they', 'were', 'said'].includes(word)
    );
    
    if (commonWords.length >= 2) {
      strengths.push("Response demonstrates understanding of role requirements");
      overallScore += 0.2;
    } else {
      improvements.push("Connect response more directly to the specific role and requirements");
    }
  }
  
  // Generate specific feedback based on interview stage
  switch (interviewStage) {
    case 'phone-screening':
      specificFeedback = "This initial screening response should focus on clear communication, enthusiasm for the role, and basic qualifications alignment.";
      if (!lowerResponse.includes('interest') && !lowerResponse.includes('excited')) {
        improvements.push("Express more enthusiasm and specific interest in the opportunity");
      }
      break;
    
    case 'functional-team':
      specificFeedback = "Team interview responses should emphasize collaboration, communication skills, and ability to work effectively with diverse stakeholders.";
      if (!lowerResponse.includes('team') && !lowerResponse.includes('collaborate')) {
        improvements.push("Highlight team collaboration and cross-functional communication skills");
      }
      break;
    
    case 'hiring-manager':
      specificFeedback = "Hiring manager interviews focus on leadership potential, strategic thinking, and ability to drive results independently.";
      if (!lowerResponse.includes('lead') && !lowerResponse.includes('decision') && !lowerResponse.includes('manage')) {
        improvements.push("Demonstrate leadership experience and strategic decision-making capabilities");
      }
      break;
    
    case 'subject-matter-expertise':
      specificFeedback = "Subject-matter expertise interviews require deep expertise demonstration, problem-solving methodology, and practical implementation experience.";
      if (!lowerResponse.includes('technical') && !lowerResponse.includes('solution') && !lowerResponse.includes('implement')) {
        improvements.push("Provide more technical depth and specific implementation details");
      }
      break;
    
    case 'executive-final':
      specificFeedback = "Executive interviews assess strategic vision, organizational impact, and long-term leadership potential.";
      if (!lowerResponse.includes('strategic') && !lowerResponse.includes('vision') && !lowerResponse.includes('impact')) {
        improvements.push("Focus on strategic impact, long-term vision, and organizational influence");
      }
      break;
    
    default:
      specificFeedback = "Response addresses the question but could benefit from more targeted storytelling and specific examples.";
  }
  
  // Generate actionable advice
  if (!hasStructure) {
    actionableAdvice = "Structure your response using STAR method: describe the Situation, explain your Task, detail the Actions you took, and highlight the Results achieved.";
  } else if (improvements.some(imp => imp.includes('specific'))) {
    actionableAdvice = "Strengthen your response by adding quantifiable metrics, specific timeframes, and concrete outcomes that demonstrate your impact.";
  } else {
    actionableAdvice = "Practice telling this story more concisely while ensuring you hit all key points that align with the role requirements.";
  }
  
  // Ensure score is within bounds
  overallScore = Math.max(1, Math.min(5, Math.round(overallScore)));
  
  // Calculate STAR-based scores
  const situationScore = lowerResponse.includes('situation') || lowerResponse.includes('context') || lowerResponse.includes('background') ? Math.min(overallScore + 1, 5) : Math.max(overallScore - 1, 1);
  const taskScore = lowerResponse.includes('task') || lowerResponse.includes('responsibility') || lowerResponse.includes('role') || lowerResponse.includes('objective') ? overallScore : Math.max(overallScore - 1, 1);
  const actionScore = foundSpecificityWords.length >= 3 ? Math.min(overallScore + 1, 5) : overallScore;
  const resultScore = lowerResponse.includes('result') || lowerResponse.includes('outcome') || lowerResponse.includes('achieved') || lowerResponse.includes('impact') ? Math.min(overallScore + 1, 5) : Math.max(overallScore - 1, 1);
  const overallFlowScore = hasStructure ? Math.min(overallScore + 1, 5) : overallScore;

  return JSON.stringify({
    overallScore,
    strengths: strengths.length > 0 ? strengths : ["Response addresses the question directly"],
    areasForImprovement: improvements.length > 0 ? improvements : ["Consider using STAR method for better structure"],
    specificFeedback,
    actionableAdvice,
    scoreBreakdown: {
      situation: situationScore,
      task: taskScore,
      action: actionScore,
      result: resultScore,
      overall: overallFlowScore
    }
  });
}

export async function enhanceQuestionWithJobDescription(
  baseQuestion: string,
  jobDescription: string,
  position: string,
  company: string
): Promise<string> {
  const prompt = `Enhance this interview question by incorporating specific details from the job description while maintaining the original question's intent and structure.

Base Question: "${baseQuestion}"

Job Description: "${jobDescription.substring(0, 1000)}..."

Position: ${position}
Company: ${company}

Instructions:
1. Keep the core question structure intact
2. Add 1-2 specific requirements, technologies, or responsibilities from the job description
3. Make it feel natural and relevant to the role
4. Ensure it remains answerable even if the candidate hasn't worked at this exact company
5. If the job description seems unrelated to the question type, return the original question

Return only the enhanced question, no additional text or formatting.`;

  try {
    const response = await generateWithBedrock(prompt);
    return response.content.trim();
  } catch (error) {
    console.error('Question enhancement failed:', error);
    return baseQuestion;
  }
}

// Generate industry-specific expert model answers and key success factors
export async function generateWGLLContent(question: string, industry: string, tags: string[]): Promise<{
  modelAnswer: string;
  keySuccessFactors: string[];
  expertTips: string[];
}> {
  // Try Anthropic API first if available
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicApiKey) {
    try {
      return await generateWGLLWithAnthropic(question, industry, tags, anthropicApiKey);
    } catch (error) {
      console.error('Anthropic WGLL generation failed:', error);
    }
  }

  // Fallback to Bedrock if available
  if (bedrockClient) {
    try {
      console.log(`Attempting Bedrock generation for ${industry} question...`);
      return await generateWGLLWithBedrock(question, industry, tags);
    } catch (error) {
      console.error('Bedrock WGLL generation failed:', error);
      if ((error as any).name === 'AccessDeniedException') {
        console.error('⚠️  Enable Claude model access in AWS Bedrock Console: https://console.aws.amazon.com/bedrock/');
      }
    }
  }

  // Professional fallback when AI unavailable
  return generateProfessionalFallbackWGLL(question, industry, tags);
}

// Generate WGLL content using Anthropic API directly
async function generateWGLLWithAnthropic(question: string, industry: string, tags: string[], apiKey: string): Promise<{
  modelAnswer: string;
  keySuccessFactors: string[];
  expertTips: string[];
}> {
  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const industryDisplayName = industry.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const tagsString = tags.join(', ');

  const prompt = `You are an expert interview coach specializing in ${industryDisplayName} technical interviews. Generate a comprehensive expert model answer and guidance for this interview question.

QUESTION: "${question}"
INDUSTRY: ${industryDisplayName}
TECHNICAL AREAS: ${tagsString}

Please provide:

1. EXPERT MODEL ANSWER: Write a detailed, professional response that demonstrates deep industry expertise. This should be a complete answer that showcases:
   - Technical competency specific to ${industryDisplayName}
   - Industry-specific terminology and concepts
   - Practical experience and real-world application
   - Quantifiable results and metrics where appropriate
   - Professional communication style

2. KEY SUCCESS FACTORS: List 5-7 specific factors that make an answer excellent for this ${industryDisplayName} question:
   - Industry-specific technical knowledge points
   - Communication techniques that resonate with ${industryDisplayName} hiring managers
   - Specific examples or metrics that demonstrate expertise
   - Common pitfalls to avoid in ${industryDisplayName} interviews

3. EXPERT TIPS: Provide 3-5 insider tips specific to ${industryDisplayName} that would help candidates excel:
   - Industry-specific best practices
   - Technical terminology to use confidently
   - Ways to demonstrate hands-on experience
   - How to connect technical skills to business value

Format your response as JSON:
{
  "modelAnswer": "...",
  "keySuccessFactors": ["factor1", "factor2", ...],
  "expertTips": ["tip1", "tip2", ...]
}

Ensure the content is specific to ${industryDisplayName} and demonstrates genuine industry expertise, not generic advice.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
  
  try {
    const parsedResponse = JSON.parse(responseText);
    return {
      modelAnswer: parsedResponse.modelAnswer || 'Expert model answer generation failed',
      keySuccessFactors: parsedResponse.keySuccessFactors || [],
      expertTips: parsedResponse.expertTips || []
    };
  } catch (parseError) {
    console.error('Failed to parse Anthropic JSON response:', parseError);
    return {
      modelAnswer: responseText,
      keySuccessFactors: [
        `Demonstrate deep ${industryDisplayName} expertise`,
        'Use specific industry terminology',
        'Provide quantifiable examples',
        'Show real-world application experience'
      ],
      expertTips: [
        `Research current ${industryDisplayName} trends`,
        'Practice technical communication',
        'Prepare specific examples with metrics'
      ]
    };
  }
}

// Generate WGLL content using AWS Bedrock
async function generateWGLLWithBedrock(question: string, industry: string, tags: string[]): Promise<{
  modelAnswer: string;
  keySuccessFactors: string[];
  expertTips: string[];
}> {
  if (!bedrockClient) {
    throw new Error('Bedrock client not available');
  }

  const industryDisplayName = industry.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const tagsString = tags.join(', ');

  const prompt = `You are an expert interview coach specializing in ${industryDisplayName} technical interviews. Generate a comprehensive expert model answer and guidance for this interview question.

QUESTION: "${question}"
INDUSTRY: ${industryDisplayName}
TECHNICAL AREAS: ${tagsString}

Please provide:

1. EXPERT MODEL ANSWER: Write a detailed, professional response that demonstrates deep industry expertise. This should be a complete answer that showcases:
   - Technical competency specific to ${industryDisplayName}
   - Industry-specific terminology and concepts
   - Practical experience and real-world application
   - Quantifiable results and metrics where appropriate
   - Professional communication style

2. KEY SUCCESS FACTORS: List 5-7 specific factors that make an answer excellent for this ${industryDisplayName} question:
   - Industry-specific technical knowledge points
   - Communication techniques that resonate with ${industryDisplayName} hiring managers
   - Specific examples or metrics that demonstrate expertise
   - Common pitfalls to avoid in ${industryDisplayName} interviews

3. EXPERT TIPS: Provide 3-5 insider tips specific to ${industryDisplayName} that would help candidates excel:
   - Industry-specific best practices
   - Technical terminology to use confidently
   - Ways to demonstrate hands-on experience
   - How to connect technical skills to business value

Format your response as JSON:
{
  "modelAnswer": "...",
  "keySuccessFactors": ["factor1", "factor2", ...],
  "expertTips": ["tip1", "tip2", ...]
}

Ensure the content is specific to ${industryDisplayName} and demonstrates genuine industry expertise, not generic advice.`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  if (!responseBody.content || !responseBody.content[0]?.text) {
    throw new Error('Invalid response format from Bedrock');
  }

  const aiResponse = responseBody.content[0].text;
  
  try {
    // Clean the AI response before parsing - be more careful with line breaks
    const cleanResponse = aiResponse
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/\r\n/g, "\\n")                     // Convert Windows line endings
      .replace(/\r/g, "\\n")                       // Convert Mac line endings  
      .replace(/\n/g, "\\n")                       // Escape Unix line endings
      .replace(/\t/g, "\\t");                      // Escape tabs
    
    const parsedResponse = JSON.parse(cleanResponse);
    return {
      modelAnswer: parsedResponse.modelAnswer || 'Expert model answer generation failed',
      keySuccessFactors: parsedResponse.keySuccessFactors || [],
      expertTips: parsedResponse.expertTips || []
    };
  } catch (parseError) {
    console.error('Failed to parse WGLL JSON response:', parseError);
    console.log('Raw AI response:', aiResponse.substring(0, 200) + '...');
    
    // Try to extract JSON from within the response with more aggressive cleaning
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let cleanJson = jsonMatch[0]
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")  // Remove control characters
          .replace(/\\/g, "\\\\")                        // Escape backslashes
          .replace(/"/g, '\\"')                          // Escape quotes
          .replace(/\\"/g, '"')                          // Fix over-escaped quotes
          .replace(/\n/g, "\\n")                         // Escape newlines
          .replace(/\t/g, "\\t")                         // Escape tabs
          .replace(/\r/g, "\\r");                        // Escape carriage returns
        
        const parsedResponse = JSON.parse(cleanJson);
        return {
          modelAnswer: parsedResponse.modelAnswer || 'Expert model answer generation failed',
          keySuccessFactors: parsedResponse.keySuccessFactors || [],
          expertTips: parsedResponse.expertTips || []
        };
      } catch (secondParseError) {
        console.error('Second JSON parse attempt failed:', secondParseError);
      }
    }
    
    // Technical fallback based on question content and industry
    return generateTechnicalFallback(question, industry, tags, aiResponse);
  }
}

// Professional fallback WGLL when AI isn't available
function generateProfessionalFallbackWGLL(question: string, industry: string, tags: string[]): {
  modelAnswer: string;
  keySuccessFactors: string[];
  expertTips: string[];
} {
  const industryDisplayName = industry.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return {
    modelAnswer: `As a ${industryDisplayName} professional with extensive experience, I approach this systematically. ${question.includes('implement') || question.includes('design') ? 
      `I begin by thoroughly understanding the requirements and constraints, then design a solution that balances technical excellence with practical implementation considerations.` :
      `I draw from my hands-on experience in ${industryDisplayName} to provide a comprehensive response that demonstrates both theoretical knowledge and practical application.`
    } 
    
    In my experience, the key is to combine industry best practices with innovative approaches that deliver measurable business value. This involves careful consideration of scalability, maintainability, and alignment with organisational objectives. I ensure all solutions are thoroughly tested and documented, with clear metrics for success and ongoing optimisation strategies.`,
    
    keySuccessFactors: [
      `Demonstrate deep ${industryDisplayName} technical knowledge`,
      'Use industry-specific terminology confidently',
      'Provide concrete examples with quantifiable results',
      'Show understanding of current industry trends',
      'Connect technical skills to business impact',
      'Display systematic problem-solving approach'
    ],
    
    expertTips: [
      `Stay current with latest ${industryDisplayName} technologies and methodologies`,
      'Practice articulating complex technical concepts clearly',
      'Prepare specific examples that showcase your expertise',
      'Research the company\'s technical challenges and opportunities'
    ]
  };
}