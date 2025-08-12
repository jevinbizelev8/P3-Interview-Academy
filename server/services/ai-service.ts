import { bedrockService } from './bedrock';
import type { InterviewMessage, InterviewSession, AiEvaluationResult } from '@shared/schema';
import { SUPPORTED_LANGUAGES } from '@shared/schema';

// Language-specific fallback messages
const LANGUAGE_FALLBACKS = {
  en: {
    firstQuestion: (jobRole: string, company: string) => 
      `Hello! I'm your AI interviewer for the ${jobRole} position at ${company}. I'll be conducting a comprehensive interview tailored specifically to this role and company. Let's begin with an introduction - please tell me about yourself and why you're interested in this position at ${company}.`,
    followUpGeneric: "That's interesting. Can you tell me more about a specific situation where you demonstrated that skill?",
    finalMessage: (jobRole: string, company: string) =>
      `Thank you for this comprehensive interview! You've provided excellent insights into your experience and approach to the ${jobRole} role at ${company}. I'm now preparing your detailed performance evaluation with personalized feedback and recommendations. This will be available shortly.`
  },
  ms: {
    firstQuestion: (jobRole: string, company: string) => 
      `Selamat datang! Saya penginterview AI untuk jawatan ${jobRole} di ${company}. Saya akan menjalankan temuduga menyeluruh yang disesuaikan khusus untuk peranan dan syarikat ini. Mari kita mulakan dengan pengenalan - sila ceritakan tentang diri anda dan mengapa anda berminat dengan jawatan ini di ${company}.`,
    followUpGeneric: "Itu menarik. Bolehkah anda ceritakan lebih lanjut tentang situasi khusus di mana anda menunjukkan kemahiran tersebut?",
    finalMessage: (jobRole: string, company: string) =>
      `Terima kasih atas temuduga yang menyeluruh ini! Anda telah memberikan pandangan yang sangat baik tentang pengalaman dan pendekatan anda terhadap peranan ${jobRole} di ${company}. Saya sedang menyediakan penilaian prestasi terperinci anda dengan maklum balas dan cadangan yang diperibadikan. Ini akan tersedia tidak lama lagi.`
  },
  id: {
    firstQuestion: (jobRole: string, company: string) => 
      `Halo! Saya pewawancara AI untuk posisi ${jobRole} di ${company}. Saya akan melakukan wawancara komprehensif yang disesuaikan khusus untuk peran dan perusahaan ini. Mari kita mulai dengan perkenalan - tolong ceritakan tentang diri Anda dan mengapa Anda tertarik dengan posisi ini di ${company}.`,
    followUpGeneric: "Itu menarik. Bisakah Anda menceritakan lebih banyak tentang situasi spesifik di mana Anda menunjukkan keterampilan tersebut?",
    finalMessage: (jobRole: string, company: string) =>
      `Terima kasih atas wawancara komprehensif ini! Anda telah memberikan wawasan yang sangat baik tentang pengalaman dan pendekatan Anda terhadap peran ${jobRole} di ${company}. Saya sekarang sedang mempersiapkan evaluasi kinerja detail Anda dengan umpan balik dan rekomendasi yang dipersonalisasi. Ini akan tersedia sebentar lagi.`
  },
  th: {
    firstQuestion: (jobRole: string, company: string) => 
      `สวัสดีครับ! ผมเป็นผู้สัมภาษณ์ AI สำหรับตำแหน่ง ${jobRole} ที่ ${company} ผมจะทำการสัมภาษณ์แบบครอบคลุมที่ปรับแต่งเฉพาะสำหรับตำแหน่งและบริษัทนี้ เริ่มต้นด้วยการแนะนำตัว - กรุณาเล่าเกี่ยวกับตัวคุณและเหตุผลที่คุณสนใจตำแหน่งนี้ที่ ${company}`,
    followUpGeneric: "น่าสนใจมาก คุณช่วยเล่าเพิ่มเติมเกี่ยวกับสถานการณ์เฉพาะที่คุณแสดงให้เห็นทักษะนั้นได้ไหม?",
    finalMessage: (jobRole: string, company: string) =>
      `ขอบคุณสำหรับการสัมภาษณ์ที่ครอบคลุมนี้! คุณได้ให้ข้อมูลเชิงลึกที่ยอดเยี่ยมเกี่ยวกับประสบการณ์และแนวทางของคุณสำหรับตำแหน่ง ${jobRole} ที่ ${company} ตอนนี้ผมกำลังเตรียมการประเมินผลการปฏิบัติงานโดยละเอียดพร้อมข้อเสนอแนะและคำแนะนำที่เป็นส่วนตัว ซึ่งจะพร้อมใช้งานในไม่ช้า`
  },
  vi: {
    firstQuestion: (jobRole: string, company: string) => 
      `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${jobRole} tại ${company}. Tôi sẽ tiến hành một cuộc phỏng vấn toàn diện được thiết kế riêng cho vai trò và công ty này. Hãy bắt đầu bằng việc giới thiệu - vui lòng kể cho tôi nghe về bản thân và lý do bạn quan tâm đến vị trí này tại ${company}.`,
    followUpGeneric: "Thật thú vị. Bạn có thể kể thêm về một tình huống cụ thể mà bạn đã thể hiện kỹ năng đó không?",
    finalMessage: (jobRole: string, company: string) =>
      `Cảm ơn bạn đã tham gia cuộc phỏng vấn toàn diện này! Bạn đã cung cấp những hiểu biết xuất sắc về kinh nghiệm và cách tiếp cận của mình đối với vai trò ${jobRole} tại ${company}. Tôi đang chuẩn bị đánh giá hiệu suất chi tiết của bạn với phản hồi và khuyến nghị được cá nhân hóa. Điều này sẽ có sẵn sớm.`
  },
  fil: {
    firstQuestion: (jobRole: string, company: string) => 
      `Kumusta! Ako ang inyong AI interviewer para sa posisyon ng ${jobRole} sa ${company}. Magsasagawa ako ng komprehensibong interbyu na naka-customize para sa papel at kumpanyang ito. Magsimula tayo sa panimula - pakikwento po tungkol sa inyong sarili at bakit kayo interesado sa posisyong ito sa ${company}.`,
    followUpGeneric: "Nakakainteresa iyon. Maaari ba ninyong ikwento nang higit pa ang tungkol sa isang partikular na sitwasyon kung saan ninyo naipakita ang kasanayang iyon?",
    finalMessage: (jobRole: string, company: string) =>
      `Salamat sa komprehensibong interbyu na ito! Nagbigay kayo ng napakagandang mga insight tungkol sa inyong karanasan at diskarte sa papel ng ${jobRole} sa ${company}. Inihahanda ko na ang inyong detalyadong pagtatasa ng performance na may personalized na feedback at mga rekomendasyon. Magiging available ito maya-maya.`
  },
  my: {
    firstQuestion: (jobRole: string, company: string) => 
      `မင်္ဂလာပါ! ကျွန်တော်သည် ${company} ရှိ ${jobRole} ရာထူးအတွက် AI အင်တာဗျူးယာဖြစ်ပါသည်။ ဤအခန်းကဏ္ဍနှင့် ကုမ္ပဏီအတွက် အထူးပြုလုပ်ထားသော ပြည့်စုံသော အင်တာဗျူးကို လုပ်ဆောင်မည်ဖြစ်ပါသည်။ မိတ်ဆက်ခြင်းဖြင့် စတင်ကြပါစို့ - သင့်အကြောင်းနှင့် ${company} တွင် ဤရာထူးကို အဘယ်ကြောင့် စိတ်ဝင်စားသည်ကို ပြောပြပါ။`,
    followUpGeneric: "စိတ်ဝင်စားဖွယ်ပါပဲ။ သင်သည် ထိုကျွမ်းကျင်မှုကို ပြသခဲ့သည့် တိကျသော အခြေအနေတစ်ခုအကြောင်း နောက်ထပ် ပြောပြနိုင်မလား?",
    finalMessage: (jobRole: string, company: string) =>
      `ဤပြည့်စုံသော အင်တာဗျူးအတွက် ကျေးးဇူးတင်ပါသည်! သင်သည် ${company} ရှိ ${jobRole} အခန်းကဏ္ဍအတွက် သင့်အတွေ့အကြုံနှင့် ချဉ်းကပ်မှုအကြောင်း အလွန်ကောင်းမွန်သော ထိုးထွင်းမြင်ကွင်းများ ပေးခဲ့ပါသည်။ ကျွန်တော်သည် ယခုအခါ သင့်အတွက် ပုဂ္ဂိုလ်ရေးဆိုင်ရာ တုံ့ပြန်ချက်နှင့် အကြံပြုချက်များဖြင့် အသေးစိတ် စွမ်းဆောင်ရည် အကဲဖြတ်ချက်ကို ပြင်ဆင်နေပါသည်။ ယင်းသည် မကြာမီတွင် ရရှိနိုင်မည်ဖြစ်ပါသည်။`
  },
  km: {
    firstQuestion: (jobRole: string, company: string) => 
      `ជំរាបសួរ! ខ្ញុំជាអ្នកសម្ភាសន៍ AI សម្រាប់មុខតំណែង ${jobRole} នៅ ${company}។ ខ្ញុំនឹងធ្វើការសម្ភាសន៍ពេញលេញដែលត្រូវបានរៀបចំជាពិសេសសម្រាប់តួនាទីនិងក្រុមហ៊ុននេះ។ សូមចាប់ផ្តើមជាមួយការណែនាំ - សូមប្រាប់ខ្ញុំអំពីខ្លួនអ្នកនិងហេតុផលដែលអ្នកចាប់អារម្មណ៍នឹងមុខតំណែងនេះនៅ ${company}។`,
    followUpGeneric: "វាគួរឱ្យចាប់អារម្មណ៍។ តើអ្នកអាចប្រាប់ខ្ញុំបន្ថែមអំពីស្ថានភាពជាក់លាក់មួយដែលអ្នកបានបង្ហាញជំនាញនោះបានទេ?",
    finalMessage: (jobRole: string, company: string) =>
      `អរគុណសម្រាប់ការសម្ភាសន៍ពេញលេញនេះ! អ្នកបានផ្តល់នូវយោបល់ដ៏ល្អអំពីបទពិសោធន៍និងវិធីសាស្រ្តរបស់អ្នកចំពោះតួនាទី ${jobRole} នៅ ${company}។ ខ្ញុំកំពុងរៀបចំការវាយតម្លៃដំណើរការលម្អិតរបស់អ្នកជាមួយនឹងការប្រតិកម្មនិងអនុសាសន៍ផ្ទាល់ខ្លួន។ វានឹងមានភ្លាមៗនេះ។`
  },
  lo: {
    firstQuestion: (jobRole: string, company: string) => 
      `ສະບາຍດີ! ຂ້ອຍແມ່ນນັກສຳພາດ AI ສຳລັບຕຳແໜ່ງ ${jobRole} ທີ່ ${company}. ຂ້ອຍຈະເຮັດການສຳພາດທີ່ຄົບຖ້ວນທີ່ຖືກອອກແບບສະເພາະສຳລັບບົດບາດ ແລະ ບໍລິສັດນີ້. ມາເລີ່ມຕົ້ນດ້ວຍການແນະນຳ - ກະລຸນາບອກຂ້ອຍກ່ຽວກັບຕົວເຈົ້າ ແລະ ເຫດຜົນທີ່ເຈົ້າສົນໃຈໃນຕຳແໜ່ງນີ້ທີ່ ${company}.`,
    followUpGeneric: "ນັ້ນໜ້າສົນໃຈ. ເຈົ້າສາມາດບອກຂ້ອຍເພີ່ມເຕີມກ່ຽວກັບສະຖານະການສະເພາະທີ່ເຈົ້າສະແດງໃຫ້ເຫັນທັກສະນັ້ນໄດ້ບໍ?",
    finalMessage: (jobRole: string, company: string) =>
      `ຂໍຂອບໃຈສຳລັບການສຳພາດທີ່ຄົບຖ້ວນນີ້! ເຈົ້າໄດ້ໃຫ້ຄວາມເຂົ້າໃຈທີ່ດີເລີດກ່ຽວກັບປະສົບການ ແລະ ວິທີການເຂົ້າຫາຂອງເຈົ້າຕໍ່ບົດບາດ ${jobRole} ທີ່ ${company}. ຂ້ອຍກຳລັງກະກຽມການປະເມີນຜົນປະສິດທິພາບລະອຽດຂອງເຈົ້າດ້ວຍຄຳຕິຊົມ ແລະ ຄຳແນະນຳສ່ວນບຸກຄົນ. ສິ່ງນີ້ຈະມີໃນໄວໆນີ້.`
  },
  'zh-sg': {
    firstQuestion: (jobRole: string, company: string) => 
      `您好！我是您的AI面试官，负责${company}的${jobRole}职位面试。我将针对此职位和公司进行全面的定制化面试。让我们从自我介绍开始 - 请告诉我您的情况以及您为什么对${company}的这个职位感兴趣。`,
    followUpGeneric: "很有趣。您能详细描述一个您展示了该技能的具体情况吗？",
    finalMessage: (jobRole: string, company: string) =>
      `感谢您参加这次全面的面试！您对${company}${jobRole}职位的经验和方法提供了出色的见解。我正在准备您的详细绩效评估，包括个性化反馈和建议。这将很快提供给您。`
  }
};

export class AIService {
  static async generateInterviewQuestion(
    session: InterviewSession,
    messages: InterviewMessage[],
    questionNumber: number
  ): Promise<string> {
    const conversationHistory = messages
      .map(msg => ({
        role: msg.messageType === 'ai' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      }));

    const context = {
      stage: "perform-simulation",
      jobRole: session.userJobPosition || "Software Engineer",
      company: session.userCompanyName || "Technology Company",
      candidateBackground: "Experienced professional",
      keyObjectives: `Assess candidate suitability for ${session.userJobPosition} at ${session.userCompanyName}`,
      userJobPosition: session.userJobPosition,
      userCompanyName: session.userCompanyName,
    };

    const language = session.interviewLanguage || 'en';
    console.log(`Generating question in language: ${language} for session ${session.id}`);

    try {
      const persona = await bedrockService.generateInterviewerPersona(context);
      console.log(`Successfully generated persona for ${language}`);
      
      if (questionNumber === 1 && conversationHistory.length === 0) {
        const response = await bedrockService.generateFirstQuestion(context, persona, language);
        console.log(`Successfully generated first question in ${language}`);
        return response.content || response;
      } else {
        const response = await bedrockService.generateFollowUpQuestion(
          context,
          persona,
          conversationHistory,
          questionNumber,
          language
        );
        console.log(`Successfully generated follow-up question in ${language}`);
        return response.content || response;
      }
    } catch (personaError) {
      console.error(`Error generating persona: ${personaError.message}`);
      
      // If persona fails, try direct question generation
      try {
        if (questionNumber === 1 && conversationHistory.length === 0) {
          const response = await bedrockService.generateFirstQuestion(context, null, language);
          console.log(`Successfully generated first question without persona in ${language}`);
          return response.content || response;
        } else {
          const response = await bedrockService.generateFollowUpQuestion(
            context,
            null,
            conversationHistory,
            questionNumber,
            language
          );
          console.log(`Successfully generated follow-up question without persona in ${language}`);
          return response.content || response;
        }
      } catch (error) {
        console.error(`Error generating ${questionNumber === 1 ? 'first' : 'follow-up'} question:`, error);
        console.log(`Using ${language} language fallback due to AWS error`);
        
        // Use language-specific fallback
        const languageFallback = LANGUAGE_FALLBACKS[language as keyof typeof LANGUAGE_FALLBACKS] || LANGUAGE_FALLBACKS.en;
        console.log(`Selected fallback for language: ${language}`, languageFallback ? 'found' : 'not found');
        
        if (questionNumber === 1 && conversationHistory.length === 0) {
          const result = languageFallback.firstQuestion(
            session.userJobPosition || "Software Engineer",
            session.userCompanyName || "Technology Company"
          );
          console.log(`Fallback first question result: ${result.substring(0, 50)}...`);
          return result;
        } else {
          const result = languageFallback.followUpGeneric;
          console.log(`Fallback follow-up result: ${result.substring(0, 50)}...`);
          return result;
        }
      }
    }
  }

  static async generateComprehensiveEvaluation(
    session: InterviewSession,
    messages: InterviewMessage[]
  ): Promise<Partial<AiEvaluationResult>> {
    const conversationHistory = messages
      .map(msg => ({
        role: msg.messageType === 'ai' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      }));

    const context = {
      stage: "perform-simulation",
      jobRole: session.userJobPosition || "Software Engineer",
      company: session.userCompanyName || "Technology Company",
      candidateBackground: "Experienced professional",
      keyObjectives: `Comprehensive evaluation for ${session.userJobPosition} at ${session.userCompanyName}`,
      userJobPosition: session.userJobPosition,
      userCompanyName: session.userCompanyName,
    };

    const language = session.interviewLanguage || 'en';

    try {
      // Generate comprehensive assessment using Bedrock
      const assessment = await bedrockService.generateSTARAssessment(
        context,
        conversationHistory,
        language
      );

      // Parse and structure the assessment for our 10-feature evaluation
      return {
        overallScore: assessment.overallScore || 7.5,
        overallRating: assessment.overallRating || "Good Performance",
        communicationScore: assessment.scores?.communication || 7.5,
        empathyScore: assessment.scores?.empathy || 7.5,
        problemSolvingScore: assessment.scores?.problemSolving || 7.5,
        culturalAlignmentScore: assessment.scores?.culturalAlignment || 7.5,
        qualitativeObservations: assessment.qualitativeFeedback || "Candidate demonstrated solid understanding of the role requirements.",
        actionableInsights: assessment.recommendations || [
          `Focus on demonstrating specific examples relevant to ${session.userJobPosition}`,
          `Research ${session.userCompanyName}'s recent initiatives and values`,
          "Practice articulating your problem-solving approach using the STAR method"
        ],
        personalizedDrills: [
          "Practice behavioral questions with specific metrics and outcomes",
          `Research ${session.userCompanyName}'s technical challenges and propose solutions`,
          "Conduct mock technical discussions with peers",
          "Practice explaining complex concepts in simple terms"
        ],
        reflectionPrompts: [
          `How would you adapt your experience to ${session.userCompanyName}'s unique culture?`,
          "What specific value would you bring to this role that others might not?",
          "How do you plan to grow in this position over the next 2 years?"
        ],
        badgeEarned: assessment.overallScore >= 8 ? "Interview Excellence" : 
                     assessment.overallScore >= 7 ? "Strong Candidate" : 
                     "Interview Participant",
        pointsEarned: Math.floor((assessment.overallScore || 7.5) * 10),
        strengths: assessment.strengths || [
          "Clear communication style",
          "Relevant experience",
          "Professional demeanor"
        ],
        improvementAreas: assessment.improvements || [
          "Provide more specific examples",
          "Ask more insightful questions",
          "Connect experience to company needs"
        ]
      };
    } catch (error) {
      console.error('Error generating comprehensive evaluation:', error);
      return {
        overallScore: 7.0,
        overallRating: "Good",
        communicationScore: 7.0,
        empathyScore: 7.0,
        problemSolvingScore: 7.0,
        culturalAlignmentScore: 7.0,
        qualitativeObservations: "Interview completed successfully. Detailed evaluation processing encountered an issue.",
        actionableInsights: ["Continue practicing interview skills", "Research company-specific information"],
        personalizedDrills: ["Practice behavioral questions", "Prepare technical examples"],
        reflectionPrompts: ["How did you feel about this interview?", "What would you do differently?"],
        badgeEarned: "Interview Participant",
        pointsEarned: 70,
        strengths: ["Engaged in the conversation", "Completed the interview"],
        improvementAreas: ["Continue practicing", "Prepare more examples"]
      };
    }
  }

  static async shouldCompleteInterview(messageCount: number): Promise<boolean> {
    // Complete after 8-12 questions depending on conversation flow
    return messageCount >= 16; // 8 Q&A pairs
  }
}