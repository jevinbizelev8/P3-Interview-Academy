import { OpenAI } from 'openai';
import axios from 'axios';
import { logSeaLionError, errorLogger } from './error-logger';

// Define types locally since @shared/types may not exist
interface InterviewContext {
  stage: string;
  jobRole: string;
  company: string;
  candidateBackground: string;
  keyObjectives: string;
  userJobPosition?: string;
  userCompanyName?: string;
}

interface InterviewerPersona {
  name: string;
  title: string;
  style: string;
  personality: string;
}

interface AIResponse {
  content: string;
  questionNumber: number;
}

export interface SeaLionConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  reasoningModel: string;
  guardModel: string;
}

// Default configuration for SeaLion API
const DEFAULT_CONFIG: Omit<SeaLionConfig, 'apiKey'> = {
  baseUrl: 'https://api.sea-lion.ai/v1',
  defaultModel: 'aisingapore/Gemma-SEA-LION-v3-9B-IT',
  reasoningModel: 'aisingapore/Llama-SEA-LION-v3.5-8B-R',
  guardModel: 'aisingapore/Llama-SEA-Guard-Prompt-v1'
};

export class SeaLionService {
  private client: OpenAI;
  private config: SeaLionConfig;

  constructor(apiKey?: string) {
    this.config = {
      ...DEFAULT_CONFIG,
      apiKey: apiKey || process.env.SEALION_API_KEY || ''
    };

    if (!this.config.apiKey) {
      throw new Error('SeaLion API key is required. Set SEALION_API_KEY environment variable.');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl
    });
  }

  // Get language-specific instructions for SeaLion
  private getLanguageInstructions(language: string): string {
    const instructions = {
      en: "Respond in professional English suitable for a job interview context.",
      id: "Berikan respons dalam Bahasa Indonesia yang profesional dan sesuai untuk konteks wawancara kerja.",
      ms: "Berikan respons dalam Bahasa Melayu yang profesional dan sesuai untuk konteks wawancara kerja.",
      th: "ตอบกลับในภาษาไทยที่เป็นทางการและเหมาะสมสำหรับบริบทการสัมภาษณ์งาน",
      vi: "Trả lời bằng tiếng Việt chuyên nghiệp và phù hợp với bối cảnh phỏng vấn việc làm.",
      fil: "Tumugon sa wikang Filipino na propesyonal at angkop para sa konteksto ng panayam sa trabaho.",
      my: "အလုပ်သွားရောက်မေးမြန်းခြင်းအခြေအနေအတွက် သင့်တော်သော ပရော်ဖက်ရှင်နယ်မြန်မာဘာသာဖြင့် ပြန်လည်ဖြေကြားပါ။",
      km: "សូមឆ្លើយតបជាភាសាខ្មែរដែលមានលក្ខណៈវិជ្ជាជីវៈ និងសមរម្យសម្រាប់បរិបទនៃការសម្ភាសន៍ការងារ។",
      lo: "ກະລຸນາຕອບກັບເປັນພາສາລາວທີ່ມີວິຊາຊີບ ແລະ ເໝາະສົມສໍາລັບບໍລິບົດຂອງການສໍາພາດວຽກ.",
      'zh-sg': "请用纯正的简体中文回应。严格要求：1）仅使用中文汉字；2）绝对禁止拼音；3）绝对禁止英文；4）绝对禁止括号内拼音注释；5）不要提供任何罗马化文字；6）直接输出中文内容，无需任何翻译或注释。"
    };
    
    return instructions[language as keyof typeof instructions] || instructions.en;
  }

  // Generate interviewer persona using SeaLion
  async generateInterviewerPersona(
    context: InterviewContext,
    language: string = 'en'
  ): Promise<InterviewerPersona> {
    const languageInstructions = this.getLanguageInstructions(language);
    
    const systemPrompt = `You are an AI assistant creating realistic interviewer personas for job interviews. 
    
    ${languageInstructions}
    
    Create a unique interviewer persona for a ${context.userJobPosition || context.jobRole} position at ${context.userCompanyName || context.company}.
    
    Return ONLY a JSON object with these exact fields:
    - name: A realistic first and last name appropriate for the region
    - title: Their job title/position 
    - style: Their interviewing style (2-3 words)
    - personality: Key personality traits (3-4 descriptive words)
    
    Make this persona culturally appropriate for Southeast Asian business contexts and specific to the role and company.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Create an interviewer persona for ${context.userJobPosition || context.jobRole} at ${context.userCompanyName || context.company}` 
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const content = completion.choices[0].message.content || '';
      
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const persona = JSON.parse(jsonMatch[0]);
        return persona;
      }
      
      // Fallback persona based on context
      return this.generateFallbackPersona(context);
      
    } catch (error) {
      logSeaLionError('generateInterviewerPersona', error, true, { language, context: context.userJobPosition });
      return this.generateFallbackPersona(context);
    }
  }

  // Generate first interview question
  async generateFirstQuestion(
    context: InterviewContext,
    persona: InterviewerPersona | null,
    language: string = 'en'
  ): Promise<AIResponse> {
    const languageInstructions = this.getLanguageInstructions(language);
    
    const systemPrompt = persona ? 
      `You are ${persona.name}, a ${persona.title}. Your interviewing style is ${persona.style} and you are ${persona.personality}.
      
      ${languageInstructions}
      ${language === 'zh-sg' ? '\n\n***关键要求***：仅输出中文汉字，严禁拼音、英文、括号注释。不要解释或翻译，直接回答问题。' : ''}
      
      You are conducting an interview for a ${context.userJobPosition || context.jobRole} position at ${context.userCompanyName || context.company}.
      
      Start the interview with a warm, professional greeting and ask the candidate to introduce themselves and explain their interest in this specific role at this company.
      
      Make your response culturally appropriate for Southeast Asian business contexts. Keep it concise but engaging.` :
      
      `You are a professional AI interviewer conducting a job interview.
      
      ${languageInstructions}
      ${language === 'zh-sg' ? '\n\n***关键要求***：仅输出中文汉字，严禁拼音、英文、括号注释。不要解释或翻译，直接回答问题。' : ''}
      
      Start the interview for a ${context.userJobPosition || context.jobRole} position at ${context.userCompanyName || context.company} with a professional greeting and introduction request.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: 'Begin the interview with an appropriate opening question.' 
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      });

      const content = completion.choices[0].message.content || '';
      
      return {
        content,
        questionNumber: 1
      };
      
    } catch (error) {
      logSeaLionError('generateFirstQuestion', error, true, { language, jobRole: context.userJobPosition });
      return this.generateFallbackQuestion(1, context, language);
    }
  }

  // Generate follow-up questions
  async generateFollowUpQuestion(
    context: InterviewContext,
    persona: InterviewerPersona | null,
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }>,
    currentQuestionNumber: number,
    language: string = 'en'
  ): Promise<AIResponse> {
    const languageInstructions = this.getLanguageInstructions(language);
    
    // Handle null persona case with contextual fallback
    if (!persona) {
      console.log("Persona is null, using SeaLion contextual fallback");
      const contextualFallback = this.generateContextualFollowUpFallback(
        conversationHistory, 
        currentQuestionNumber + 1, 
        context, 
        language
      );
      
      console.log(`Using SeaLion contextual fallback for question ${currentQuestionNumber + 1} in ${language}: ${contextualFallback.substring(0, 50)}...`);
      
      return {
        content: contextualFallback,
        questionNumber: currentQuestionNumber + 1
      };
    }
    
    const systemPrompt = `You are ${persona.name}, a ${persona.title}. Your interviewing style is ${persona.style} and you are ${persona.personality}.

    ${languageInstructions}
    ${language === 'zh-sg' ? '\n\n***关键要求***：仅输出中文汉字，严禁拼音、英文、括号注释。不要解释或翻译，直接回答问题。' : ''}
    
    You are conducting an interview for a ${context.userJobPosition || context.jobRole} position at ${context.userCompanyName || context.company}.
    
    This is question #${currentQuestionNumber + 1} of 15. Based on the conversation so far, ask a relevant follow-up question that:
    - Builds naturally on the candidate's previous responses
    - Explores their experience with ${context.userJobPosition || context.jobRole} specific challenges
    - Is appropriate for the Southeast Asian business context
    - Progresses from basic to more complex topics
    - Considers real-world scenarios they would face at ${context.userCompanyName || context.company}
    
    Make each question unique and purposeful. Avoid repetition.`;

    const messages = conversationHistory.map(msg => ({
      role: msg.role === "user" ? "user" as const : "assistant" as const,
      content: msg.content
    }));

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.reasoningModel, // Use reasoning model for better follow-up questions
        messages: [
          { role: 'system' as const, content: systemPrompt },
          ...messages,
          { role: 'user' as const, content: 'Generate the next appropriate interview question.' }
        ],
        max_tokens: 400,
        temperature: 0.8
      });

      const content = completion.choices[0].message.content || '';
      
      return {
        content,
        questionNumber: currentQuestionNumber + 1
      };
      
    } catch (error) {
      logSeaLionError('generateFollowUpQuestion', error, true, { language, questionNumber: currentQuestionNumber + 1 });
      
      // Use contextual fallback on error
      const contextualFallback = this.generateContextualFollowUpFallback(
        conversationHistory, 
        currentQuestionNumber + 1, 
        context, 
        language
      );
      
      errorLogger.logFallbackSuccess('SeaLion', 'generateFollowUpQuestion', { language, questionNumber: currentQuestionNumber + 1 });
      
      return {
        content: contextualFallback,
        questionNumber: currentQuestionNumber + 1
      };
    }
  }

  // Generate comprehensive evaluation using SeaLion reasoning model
  async generateSTARAssessment(
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }>,
    context: InterviewContext,
    language: string = 'en'
  ): Promise<any> {
    const languageInstructions = this.getLanguageInstructions(language);
    
    const systemPrompt = `You are an expert interview evaluator specializing in Southeast Asian job markets.

    ${languageInstructions}
    
    Analyze this interview for a ${context.userJobPosition || context.jobRole} position at ${context.userCompanyName || context.company} using the STAR method (Situation, Task, Action, Result).
    
    Provide a comprehensive evaluation in JSON format with:
    
    {
      "overallScore": (1-100),
      "starAnalysis": {
        "situation": { "score": (1-10), "feedback": "detailed analysis" },
        "task": { "score": (1-10), "feedback": "detailed analysis" },
        "action": { "score": (1-10), "feedback": "detailed analysis" },
        "result": { "score": (1-10), "feedback": "detailed analysis" }
      },
      "keyStrengths": ["strength1", "strength2", "strength3"],
      "areasForImprovement": ["area1", "area2", "area3"],
      "culturalFit": { "score": (1-10), "analysis": "cultural fit analysis for SEA context" },
      "recommendations": "specific advice for improvement",
      "summary": "overall interview summary"
    }
    
    Consider Southeast Asian workplace cultures and ${context.userCompanyName || context.company} specific requirements.`;

    const messages = conversationHistory.map(msg => ({
      role: msg.role === "user" ? "user" as const : "assistant" as const,
      content: msg.content
    }));

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.reasoningModel, // Use reasoning model for comprehensive analysis
        messages: [
          { role: 'system' as const, content: systemPrompt },
          ...messages,
          { role: 'user' as const, content: 'Provide a comprehensive STAR-based evaluation of this interview.' }
        ],
        max_tokens: 1500,
        temperature: 0.3 // Lower temperature for more consistent evaluation
      });

      const content = completion.choices[0].message.content || '';
      
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback evaluation
      return this.generateFallbackEvaluation(language);
      
    } catch (error) {
      logSeaLionError('generateSTARAssessment', error, true, { language, conversationLength: conversationHistory.length });
      return this.generateFallbackEvaluation(language);
    }
  }

  // Content safety check using SeaLion Guard
  async checkContentSafety(content: string): Promise<{ safe: boolean; reason?: string }> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.guardModel,
        messages: [
          { role: 'user', content }
        ],
        stream: false
      });

      const result = completion.choices[0].message.content?.trim().toLowerCase() || '';
      
      return {
        safe: result === 'safe',
        reason: result === 'unsafe' ? 'Content flagged as potentially harmful' : undefined
      };
      
    } catch (error) {
      console.error("Error checking content safety with SeaLion Guard:", error);
      // Default to safe if check fails
      return { safe: true };
    }
  }

  // Private helper methods
  private generateFallbackPersona(context: InterviewContext): InterviewerPersona {
    const actualJobRole = context.userJobPosition || context.jobRole;
    const actualCompany = context.userCompanyName || context.company;
    
    if (actualJobRole.toLowerCase().includes('ai') || actualJobRole.toLowerCase().includes('ml')) {
      return {
        name: "Sarah Lim",
        title: "AI Engineering Director",
        style: "technical and innovative",
        personality: "analytical, forward-thinking, collaborative"
      };
    } else if (actualJobRole.toLowerCase().includes('engineer')) {
      return {
        name: "Marcus Tan",
        title: "Senior Engineering Manager",
        style: "systematic and thorough",
        personality: "detail-oriented, problem-solving, supportive"
      };
    } else {
      return {
        name: "Diana Wong",
        title: "Senior Hiring Manager",
        style: "conversational and insightful",
        personality: "empathetic, experienced, goal-oriented"
      };
    }
  }

  private generateFallbackQuestion(
    questionNumber: number, 
    context: InterviewContext, 
    language: string
  ): AIResponse {
    const fallbacks = {
      en: `Tell me about yourself and why you're interested in the ${context.userJobPosition || context.jobRole} position at ${context.userCompanyName || context.company}.`,
      id: `Ceritakan tentang diri Anda dan mengapa Anda tertarik dengan posisi ${context.userJobPosition || context.jobRole} di ${context.userCompanyName || context.company}.`,
      ms: `Ceritakan tentang diri anda dan mengapa anda berminat dengan jawatan ${context.userJobPosition || context.jobRole} di ${context.userCompanyName || context.company}.`,
      th: `เล่าเกี่ยวกับตัวคุณและเหตุผลที่สนใจตำแหน่ง ${context.userJobPosition || context.jobRole} ที่ ${context.userCompanyName || context.company}`,
      vi: `Hãy kể về bản thân và lý do bạn quan tâm đến vị trí ${context.userJobPosition || context.jobRole} tại ${context.userCompanyName || context.company}.`,
      'zh-sg': `请介绍一下您自己，以及您为什么对${context.userCompanyName || context.company}的${context.userJobPosition || context.jobRole}职位感兴趣。`
    };
    
    const content = fallbacks[language as keyof typeof fallbacks] || fallbacks.en;
    
    return {
      content,
      questionNumber
    };
  }

  // Enhanced contextual follow-up fallbacks with Southeast Asian context
  private generateContextualFollowUpFallback(
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }>,
    questionNumber: number,
    context: InterviewContext,
    language: string
  ): string {
    // Enhanced contextual templates with SEA business context
    const contextualTemplates = {
      'zh-sg': {
        2: [
          '很好。您能详细描述一个您在团队协作中发挥关键作用的项目吗？',
          '有趣的背景。您如何看待在多元文化环境中工作的挑战？',
          '请分享一个您必须快速适应新技术或流程的经历。'
        ],
        3: [
          '让我们谈谈领导力。您能描述一次您领导团队克服困难的经历吗？',
          '在快节奏的环境中，您如何确保工作质量和效率的平衡？',
          '请告诉我您如何处理项目中的不确定性和变化。'
        ],
        4: [
          '您对我们公司在东南亚市场的发展有什么了解和想法？',
          '如果要您向客户解释复杂的技术概念，您会如何处理？',
          '描述一下您理想的职业发展道路是什么样的。'
        ],
        5: [
          '在处理跨国项目时，您如何管理不同时区和文化差异？',
          '您如何保持对行业趋势的敏感度并持续学习新技能？',
          '描述一次您需要在资源有限的情况下完成重要任务的经历。'
        ]
      },
      'id': {
        2: [
          'Bagus sekali. Bisakah Anda menceritakan proyek di mana Anda berperan penting dalam kolaborasi tim?',
          'Latar belakang yang menarik. Bagaimana pandangan Anda tentang tantangan bekerja di lingkungan multikultural?',
          'Ceritakan pengalaman ketika Anda harus cepat beradaptasi dengan teknologi atau proses baru.'
        ],
        3: [
          'Mari bicara tentang kepemimpinan. Bisa ceritakan saat Anda memimpin tim mengatasi kesulitan?',
          'Di lingkungan yang bergerak cepat, bagaimana Anda menjaga keseimbangan kualitas dan efisiensi kerja?',
          'Tolong jelaskan bagaimana Anda menangani ketidakpastian dan perubahan dalam proyek.'
        ],
        4: [
          'Apa pemahaman dan ide Anda tentang perkembangan perusahaan kami di pasar Asia Tenggara?',
          'Jika diminta menjelaskan konsep teknis yang kompleks kepada klien, bagaimana Anda menanganinya?',
          'Gambarkan seperti apa jalur pengembangan karier ideal menurut Anda.'
        ],
        5: [
          'Dalam menangani proyek multinasional, bagaimana Anda mengelola perbedaan zona waktu dan budaya?',
          'Bagaimana cara Anda tetap peka terhadap tren industri dan terus belajar keterampilan baru?',
          'Ceritakan saat Anda harus menyelesaikan tugas penting dengan sumber daya terbatas.'
        ]
      },
      'th': {
        2: [
          'ดีมาก คุณช่วยเล่าโครงการที่คุณมีบทบาทสำคัญในการทำงานร่วมกันเป็นทีมได้ไหม?',
          'ประวัติที่น่าสนใจ คุณมองว่าความท้าทายในการทำงานในสภาพแวดล้อมที่หลากหลายทางวัฒนธรรมเป็นอย่างไร?',
          'เล่าประสบการณ์ที่คุณต้องปรับตัวอย่างรวดเร็วกับเทคโนโลยีหรือกระบวนการใหม่'
        ],
        3: [
          'มาคุยเรื่องภาวะผู้นำกันบ้าง คุณช่วยเล่าครั้งที่คุณนำทีมผ่านพ้นอุปสรรคได้ไหม?',
          'ในสภาพแวดล้อมที่เคลื่อนไหวเร็ว คุณรักษาสมดุลระหว่างคุณภาพงานและประสิทธิภาพอย่างไร?',
          'อธิบายว่าคุณจัดการกับความไม่แน่นอนและการเปลี่ยนแปลงในโครงการอย่างไร'
        ],
        4: [
          'คุณมีความเข้าใจและแนวคิดอย่างไรเกี่ยวกับการพัฒนาของบริษัทเราในตลาดเอเชียตะวันออกเฉียงใต้?',
          'หากต้องอธิบายแนวคิดทางเทคนิคที่ซับซ้อนให้ลูกค้าฟัง คุณจะจัดการอย่างไร?',
          'อธิบายว่าเส้นทางการพัฒนาอาชีพในอุดมคติของคุณเป็นอย่างไร'
        ],
        5: [
          'ในการจัดการโครงการข้ามชาติ คุณจัดการกับความแตกต่างของเขตเวลาและวัฒนธรรมอย่างไร?',
          'คุณรักษาความไวต่อแนวโน้มอุตสาหกรรมและเรียนรู้ทักษะใหม่อย่างต่อเนื่องอย่างไร?',
          'เล่าครั้งที่คุณต้องทำงานสำคัญให้เสร็จด้วยทรัพยากรที่จำกัด'
        ]
      },
      'ms': {
        2: [
          'Bagus sekali. Bolehkah anda ceritakan projek di mana anda memainkan peranan penting dalam kerjasama pasukan?',
          'Latar belakang yang menarik. Bagaimanakah pandangan anda tentang cabaran bekerja dalam persekitaran pelbagai budaya?',
          'Ceritakan pengalaman ketika anda terpaksa menyesuaikan diri dengan pantas kepada teknologi atau proses baharu.'
        ],
        3: [
          'Mari bercakap tentang kepimpinan. Bolehkah anda ceritakan ketika anda memimpin pasukan mengatasi kesukaran?',
          'Dalam persekitaran yang bergerak pantas, bagaimana anda mengekalkan keseimbangan kualiti kerja dan kecekapan?',
          'Sila jelaskan bagaimana anda mengendalikan ketidakpastian dan perubahan dalam projek.'
        ],
        4: [
          'Apa pemahaman dan idea anda tentang perkembangan syarikat kami di pasaran Asia Tenggara?',
          'Jika diminta menerangkan konsep teknikal yang kompleks kepada pelanggan, bagaimana anda mengendalikannya?',
          'Gambarkan seperti apa laluan pembangunan kerjaya ideal menurut anda.'
        ],
        5: [
          'Dalam mengendalikan projek multinasional, bagaimana anda menguruskan perbezaan zon masa dan budaya?',
          'Bagaimana cara anda kekal peka terhadap trend industri dan terus belajar kemahiran baru?',
          'Ceritakan masa anda terpaksa menyelesaikan tugas penting dengan sumber yang terhad.'
        ]
      }
    };

    // Get templates for this language
    const langTemplates = contextualTemplates[language as keyof typeof contextualTemplates];
    const questionTemplates = langTemplates?.[questionNumber as keyof typeof langTemplates];

    if (questionTemplates && questionTemplates.length > 0) {
      // Use modulo to ensure we get different questions even if we go beyond the template count
      const templateIndex = (questionNumber - 2) % questionTemplates.length;
      return questionTemplates[templateIndex];
    }

    // Enhanced generic fallbacks with SEA context
    const genericFallbacks = {
      en: "Can you share a specific example of how you've contributed to a cross-functional team in the Southeast Asian business environment?",
      id: "Bisakah Anda berbagi contoh spesifik bagaimana Anda berkontribusi dalam tim lintas fungsi di lingkungan bisnis Asia Tenggara?",
      ms: "Bolehkah anda berkongsi contoh khusus bagaimana anda menyumbang dalam pasukan lintas fungsi di persekitaran perniagaan Asia Tenggara?",
      th: "คุณช่วยแบ่งปันตัวอย่างเฉพาะเจาะจงว่าคุณมีส่วนร่วมในทีมข้ามสายงานในสภาพแวดล้อมธุรกิจเอเชียตะวันออกเฉียงใต้อย่างไร?",
      vi: "Bạn có thể chia sẻ một ví dụ cụ thể về cách bạn đóng góp cho một nhóm đa chức năng trong môi trường kinh doanh Đông Nam Á không?",
      fil: "Maaari mo bang ibahagi ang isang tiyak na halimbawa kung paano ka nag-ambag sa isang cross-functional team sa Southeast Asian business environment?",
      my: "အရှေ့တောင်အာရှစီးပွားရေးပတ်ဝန်းကျင်တွင် လုပ်ငန်းခွင်အမျိုးမျိုးရှိသော အဖွဲ့တစ်ခုတွင် သင်မည်သို့ပံ့ပိုးကူညီခဲ့သည်ကို တိကျသောဥပမာတစ်ခု မျှဝေနိုင်မလား။",
      km: "តើអ្នកអាចចែករំលែកឧទាហរណ៍ជាក់លាក់មួយអំពីរបៀបដែលអ្នកបានរួមចំណែកដល់ក្រុមអនុវត្តការខុសៗគ្នានៅក្នុងបរិយាកាសអាជីវកម្មអាស៊ីអាគ្នេយ៍ទេ?",
      lo: "ເຈົ້າສາມາດແບ່ງປັນຕົວຢ່າງສະເພາະກ່ຽວກັບວິທີທີ່ເຈົ້າໄດ້ປະກອບສ່ວນໃສ່ທີມງານຂ້າມໜ້າທີ່ໃນສະພາບແວດລ້ອມທຸລະກິດເອເຊຍຕາເວັນອອກສຽງໃຕ້ບໍ?",
      'zh-sg': "您能分享一个您在东南亚商业环境中为跨职能团队做出贡献的具体例子吗？"
    };
    
    return genericFallbacks[language as keyof typeof genericFallbacks] || genericFallbacks.en;
  }

  private generateFallbackEvaluation(language: string): any {
    const evaluations = {
      en: {
        overallScore: 75,
        starAnalysis: {
          situation: { score: 7, feedback: "Good situational awareness demonstrated" },
          task: { score: 8, feedback: "Clear understanding of task requirements" },
          action: { score: 7, feedback: "Appropriate actions taken with room for improvement" },
          result: { score: 8, feedback: "Positive outcomes achieved" }
        },
        keyStrengths: ["Clear communication", "Problem-solving ability", "Cultural adaptability"],
        areasForImprovement: ["Technical depth", "Leadership examples", "Strategic thinking"],
        culturalFit: { score: 8, analysis: "Shows good understanding of Southeast Asian business culture" },
        recommendations: "Continue developing technical skills and seek more leadership opportunities",
        summary: "Strong candidate with good potential for growth in Southeast Asian markets"
      },
      'zh-sg': {
        overallScore: 75,
        starAnalysis: {
          situation: { score: 7, feedback: "展现了良好的情境意识" },
          task: { score: 8, feedback: "对任务要求有清晰的理解" },
          action: { score: 7, feedback: "采取了适当的行动，仍有改进空间" },
          result: { score: 8, feedback: "取得了积极的成果" }
        },
        keyStrengths: ["沟通清晰", "解决问题的能力", "文化适应性"],
        areasForImprovement: ["技术深度", "领导力实例", "战略思维"],
        culturalFit: { score: 8, analysis: "对东南亚商业文化有良好的理解" },
        recommendations: "继续发展技术技能并寻求更多领导机会",
        summary: "在东南亚市场具有良好增长潜力的强势候选人"
      }
    };
    
    return evaluations[language as keyof typeof evaluations] || evaluations.en;
  }

  // Generic method for AI text generation with SeaLion using direct HTTP
  async generateResponse(options: {
    messages: Array<{ role: string; content: string }>;
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    try {
      // Use direct HTTP call to SeaLion API
      const response = await axios.post('https://api.sea-lion.ai/v1/chat/completions', {
        model: options.model || this.config.reasoningModel,
        messages: options.messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: 0.9,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      } else {
        throw new Error('Invalid response structure from SeaLion API');
      }
    } catch (error) {
      console.error('SeaLion generateResponse error:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error || error.message;
        
        if (status === 429) {
          throw new Error('SeaLion API rate limit exceeded. Please wait and try again.');
        } else if (status === 401) {
          throw new Error('SeaLion API authentication failed. Please check your API key.');
        } else if (status === 400) {
          throw new Error(`SeaLion API request error: ${message}`);
        } else {
          throw new Error(`SeaLion API error (${status}): ${message}`);
        }
      }
      
      throw new Error(`SeaLion API generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
const sealionService = new SeaLionService();
export { sealionService };