import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ASEAN_LANGUAGES } from '@/components/LanguageSelector';

// Translation dictionaries for static UI text
const translations = {
  en: {
    // Header
    title: 'Your AI Interview Performance Report',
    backToDashboard: 'Back to Dashboard',
    startNewPractice: 'Start New Practice',
    exportReport: 'Export Report',
    reportLanguage: 'Report Language',
    
    // Overall Performance
    overallPerformance: 'Overall Performance',
    score: 'Score',
    pass: 'Pass',
    borderline: 'Borderline',
    needsImprovement: 'Needs Improvement',
    passThreshold: 'Pass Threshold: ≥ 3.5',
    borderlineRange: 'Borderline: 3.0 - 3.4',
    
    // Tabs
    overview: 'Overview',
    analytics: 'Analytics',
    detailedFeedback: 'Detailed Feedback',
    practice: 'Practice',
    reflect: 'Reflect',
    
    // Session Statistics
    questions: 'Questions',
    duration: 'Duration',
    language: 'Language',
    status: 'Status',
    
    // Overview Section
    keyStrengths: 'Key Strengths',
    strengthsSubtitle: 'What you excel at in interviews',
    buildingStrengths: 'Building Your Strengths',
    buildingStrengthsDesc: 'Complete more practice sessions to identify your key strengths.',
    
    growthOpportunities: 'Growth Opportunities',
    growthSubtitle: 'Areas to focus on for improvement',
    identifyingGrowth: 'Identifying Growth Areas',
    identifyingGrowthDesc: 'Your improvement opportunities will be highlighted after evaluation.',
    
    aiAssessmentNotes: 'AI Assessment Notes',
    aiNotesSubtitle: 'Detailed observations from your interview performance',
    generatingAnalysis: 'Generating Detailed Analysis',
    generatingAnalysisDesc: 'Our AI is processing your responses to provide comprehensive observations and insights.',
    
    // Charts and Analytics
    interviewPerformanceScore: 'Interview Performance Score',
    performanceRadar: 'Performance Radar',
    performanceRadarDesc: 'Your score across all 9 evaluation criteria (1-5 scale)',
    weightedContribution: 'Weighted Contribution',
    weightedContributionDesc: 'How each criteria contributes to your overall score',
    detailedScoreBreakdown: 'Detailed Score Breakdown',
    detailedScoreBreakdownDesc: 'Individual scores and feedback for each evaluation criteria',
    
    // Criteria Names
    relevance: 'Relevance',
    starStructure: 'STAR Structure',
    evidence: 'Evidence',
    roleAlignment: 'Role Alignment',
    outcomes: 'Outcomes',
    communication: 'Communication',
    problemSolving: 'Problem-Solving',
    culturalFit: 'Cultural Fit',
    learningAgility: 'Learning Agility',
    
    // Score Descriptions
    exceedsExpectations: 'Exceeds expectations',
    meetsBasicExpectations: 'Meets basic expectations',
    belowExpectations: 'Below expectations',
    
    // Chart Labels
    yourScore: 'Your Score',
    remaining: 'Remaining',
    weightedScore: 'Weighted Score',
    
    // Common
    completed: 'Completed',
    inProgress: 'In Progress',
    pending: 'Pending',
    noDataAvailable: 'No data available',
    loadingTranslation: 'Translating content...',
  },
  
  ms: {
    // Header
    title: 'Laporan Prestasi Temuduga AI Anda',
    backToDashboard: 'Kembali ke Papan Pemuka',
    startNewPractice: 'Mulakan Latihan Baharu',
    exportReport: 'Eksport Laporan',
    reportLanguage: 'Bahasa Laporan',
    
    // Overall Performance
    overallPerformance: 'Prestasi Keseluruhan',
    score: 'Markah',
    pass: 'Lulus',
    borderline: 'Had Sempadan',
    needsImprovement: 'Perlu Diperbaiki',
    passThreshold: 'Had Lulus: ≥ 3.5',
    borderlineRange: 'Had Sempadan: 3.0 - 3.4',
    
    // Tabs
    overview: 'Gambaran Keseluruhan',
    analytics: 'Analitik',
    detailedFeedback: 'Maklum Balas Terperinci',
    practice: 'Latihan',
    reflect: 'Refleksi',
    
    // Session Statistics
    questions: 'Soalan',
    duration: 'Tempoh',
    language: 'Bahasa',
    status: 'Status',
    
    // Overview Section
    keyStrengths: 'Kekuatan Utama',
    strengthsSubtitle: 'Apa yang anda cemerlang dalam temuduga',
    buildingStrengths: 'Membina Kekuatan Anda',
    buildingStrengthsDesc: 'Lengkapkan lebih banyak sesi latihan untuk mengenal pasti kekuatan utama anda.',
    
    growthOpportunities: 'Peluang Pertumbuhan',
    growthSubtitle: 'Bidang untuk fokus bagi penambahbaikan',
    identifyingGrowth: 'Mengenal Pasti Bidang Pertumbuhan',
    identifyingGrowthDesc: 'Peluang penambahbaikan anda akan diserlahkan selepas penilaian.',
    
    aiAssessmentNotes: 'Nota Penilaian AI',
    aiNotesSubtitle: 'Pemerhatian terperinci dari prestasi temuduga anda',
    generatingAnalysis: 'Menjana Analisis Terperinci',
    generatingAnalysisDesc: 'AI kami sedang memproses respons anda untuk memberikan pemerhatian dan pandangan yang komprehensif.',
    
    // Charts and Analytics
    interviewPerformanceScore: 'Skor Prestasi Temuduga',
    performanceRadar: 'Radar Prestasi',
    performanceRadarDesc: 'Skor anda merentas semua 9 kriteria penilaian (skala 1-5)',
    weightedContribution: 'Sumbangan Berwajaran',
    weightedContributionDesc: 'Bagaimana setiap kriteria menyumbang kepada skor keseluruhan anda',
    detailedScoreBreakdown: 'Pecahan Skor Terperinci',
    detailedScoreBreakdownDesc: 'Skor individu dan maklum balas untuk setiap kriteria penilaian',
    
    // Criteria Names
    relevance: 'Relevan',
    starStructure: 'Struktur STAR',
    evidence: 'Bukti',
    roleAlignment: 'Penjajaran Peranan',
    outcomes: 'Hasil',
    communication: 'Komunikasi',
    problemSolving: 'Penyelesaian Masalah',
    culturalFit: 'Kesesuaian Budaya',
    learningAgility: 'Kelincahan Pembelajaran',
    
    // Score Descriptions
    exceedsExpectations: 'Melebihi jangkaan',
    meetsBasicExpectations: 'Memenuhi jangkaan asas',
    belowExpectations: 'Di bawah jangkaan',
    
    // Chart Labels
    yourScore: 'Skor Anda',
    remaining: 'Baki',
    weightedScore: 'Skor Berwajaran',
    
    // Common
    completed: 'Selesai',
    inProgress: 'Dalam Kemajuan',
    pending: 'Menunggu',
    noDataAvailable: 'Tiada data tersedia',
    loadingTranslation: 'Menterjemah kandungan...',
  },
  
  id: {
    // Header
    title: 'Laporan Performa Wawancara AI Anda',
    backToDashboard: 'Kembali ke Dashboard',
    startNewPractice: 'Mulai Latihan Baru',
    exportReport: 'Ekspor Laporan',
    reportLanguage: 'Bahasa Laporan',
    
    // Overall Performance
    overallPerformance: 'Performa Keseluruhan',
    score: 'Skor',
    pass: 'Lulus',
    borderline: 'Batas',
    needsImprovement: 'Perlu Diperbaiki',
    passThreshold: 'Batas Lulus: ≥ 3.5',
    borderlineRange: 'Batas: 3.0 - 3.4',
    
    // Tabs
    overview: 'Ringkasan',
    analytics: 'Analitik',
    detailedFeedback: 'Umpan Balik Terperinci',
    practice: 'Latihan',
    reflect: 'Refleksi',
    
    // Session Statistics
    questions: 'Pertanyaan',
    duration: 'Durasi',
    language: 'Bahasa',
    status: 'Status',
    
    // Overview Section
    keyStrengths: 'Kekuatan Utama',
    strengthsSubtitle: 'Apa yang Anda kuasai dalam wawancara',
    buildingStrengths: 'Membangun Kekuatan Anda',
    buildingStrengthsDesc: 'Selesaikan lebih banyak sesi latihan untuk mengidentifikasi kekuatan utama Anda.',
    
    growthOpportunities: 'Peluang Pertumbuhan',
    growthSubtitle: 'Area untuk difokuskan demi perbaikan',
    identifyingGrowth: 'Mengidentifikasi Area Pertumbuhan',
    identifyingGrowthDesc: 'Peluang perbaikan Anda akan disoroti setelah evaluasi.',
    
    aiAssessmentNotes: 'Catatan Penilaian AI',
    aiNotesSubtitle: 'Observasi terperinci dari performa wawancara Anda',
    generatingAnalysis: 'Menghasilkan Analisis Terperinci',
    generatingAnalysisDesc: 'AI kami sedang memproses respons Anda untuk memberikan observasi dan wawasan yang komprehensif.',
    
    // Charts and Analytics
    interviewPerformanceScore: 'Skor Performa Wawancara',
    performanceRadar: 'Radar Performa',
    performanceRadarDesc: 'Skor Anda di seluruh 9 kriteria evaluasi (skala 1-5)',
    weightedContribution: 'Kontribusi Berbobot',
    weightedContributionDesc: 'Bagaimana setiap kriteria berkontribusi pada skor keseluruhan Anda',
    detailedScoreBreakdown: 'Rincian Skor Detail',
    detailedScoreBreakdownDesc: 'Skor individu dan umpan balik untuk setiap kriteria evaluasi',
    
    // Criteria Names
    relevance: 'Relevansi',
    starStructure: 'Struktur STAR',
    evidence: 'Bukti',
    roleAlignment: 'Penyelarasan Peran',
    outcomes: 'Hasil',
    communication: 'Komunikasi',
    problemSolving: 'Pemecahan Masalah',
    culturalFit: 'Kesesuaian Budaya',
    learningAgility: 'Kelincahan Belajar',
    
    // Score Descriptions
    exceedsExpectations: 'Melebihi ekspektasi',
    meetsBasicExpectations: 'Memenuhi ekspektasi dasar',
    belowExpectations: 'Di bawah ekspektasi',
    
    // Chart Labels
    yourScore: 'Skor Anda',
    remaining: 'Sisa',
    weightedScore: 'Skor Berbobot',
    
    // Common
    completed: 'Selesai',
    inProgress: 'Sedang Berlangsung',
    pending: 'Menunggu',
    noDataAvailable: 'Tidak ada data tersedia',
    loadingTranslation: 'Menerjemahkan konten...',
  },
  
  th: {
    // Header
    title: 'รายงานผลการสัมภาษณ์ด้วย AI ของคุณ',
    backToDashboard: 'กลับไปหน้าหลัก',
    startNewPractice: 'เริ่มการฝึกใหม่',
    exportReport: 'ส่งออกรายงาน',
    reportLanguage: 'ภาษารายงาน',
    
    // Overall Performance
    overallPerformance: 'ผลงานโดยรวม',
    score: 'คะแนน',
    pass: 'ผ่าน',
    borderline: 'เส้นขอบ',
    needsImprovement: 'ต้องปรับปรุง',
    passThreshold: 'เกณฑ์ผ่าน: ≥ 3.5',
    borderlineRange: 'เส้นขอบ: 3.0 - 3.4',
    
    // Tabs
    overview: 'ภาพรวม',
    analytics: 'การวิเคราะห์',
    detailedFeedback: 'ความคิดเห็นโดยละเอียด',
    practice: 'การฝึกฝน',
    reflect: 'การสะท้อน',
    
    // Session Statistics
    questions: 'คำถาม',
    duration: 'ระยะเวลา',
    language: 'ภาษา',
    status: 'สถานะ',
    
    // Overview Section
    keyStrengths: 'จุดแข็งหลัก',
    strengthsSubtitle: 'สิ่งที่คุณเก่งในการสัมภาษณ์',
    buildingStrengths: 'การสร้างจุดแข็งของคุณ',
    buildingStrengthsDesc: 'ทำแบบฝึกหัดเพิ่มเติมเพื่อระบุจุดแข็งหลักของคุณ',
    
    growthOpportunities: 'โอกาสในการเติบโต',
    growthSubtitle: 'พื้นที่ที่ควรมุ่งเน้นเพื่อการปรับปรุง',
    identifyingGrowth: 'การระบุพื้นที่เติบโต',
    identifyingGrowthDesc: 'โอกาสในการปรับปรุงของคุณจะถูกเน้นหลังจากการประเมิน',
    
    aiAssessmentNotes: 'บันทึกการประเมินด้วย AI',
    aiNotesSubtitle: 'ข้อสังเกตโดยละเอียดจากผลการสัมภาษณ์ของคุณ',
    generatingAnalysis: 'กำลังสร้างการวิเคราะห์โดยละเอียด',
    generatingAnalysisDesc: 'AI ของเรากำลังประมวลผลคำตอบของคุณเพื่อให้ข้อสังเกตและความเข้าใจที่ครอบคลุม',
    
    // Charts and Analytics
    interviewPerformanceScore: 'คะแนนผลการสัมภาษณ์',
    performanceRadar: 'เรดาร์ผลงาน',
    performanceRadarDesc: 'คะแนนของคุณทั้ง 9 เกณฑ์การประเมิน (สเกล 1-5)',
    weightedContribution: 'การมีส่วนร่วมถ่วงน้ำหนัก',
    weightedContributionDesc: 'แต่ละเกณฑ์มีส่วนร่วมต่อคะแนนรวมของคุณอย่างไร',
    detailedScoreBreakdown: 'การแยกคะแนนโดยละเอียด',
    detailedScoreBreakdownDesc: 'คะแนนรายบุคคลและข้อเสนอแนะสำหรับแต่ละเกณฑ์การประเมิน',
    
    // Criteria Names
    relevance: 'ความเกี่ยวข้อง',
    starStructure: 'โครงสร้าง STAR',
    evidence: 'หลักฐาน',
    roleAlignment: 'การจัดตำแหน่งบทบาท',
    outcomes: 'ผลลัพธ์',
    communication: 'การสื่อสาร',
    problemSolving: 'การแก้ปัญหา',
    culturalFit: 'ความเหมาะสมทางวัฒนธรรม',
    learningAgility: 'ความคล่องตัวในการเรียนรู้',
    
    // Score Descriptions
    exceedsExpectations: 'เกินความคาดหวัง',
    meetsBasicExpectations: 'ตรงตามความคาดหวังพื้นฐาน',
    belowExpectations: 'ต่ำกว่าความคาดหวัง',
    
    // Chart Labels
    yourScore: 'คะแนนของคุณ',
    remaining: 'ที่เหลือ',
    weightedScore: 'คะแนนถ่วงน้ำหนัก',
    
    // Common
    completed: 'เสร็จสิ้น',
    inProgress: 'กำลังดำเนินการ',
    pending: 'รอดำเนินการ',
    noDataAvailable: 'ไม่มีข้อมูล',
    loadingTranslation: 'กำลังแปลเนื้อหา...',
  },
  
  vi: {
    // Header
    title: 'Báo Cáo Hiệu Suất Phỏng Vấn AI Của Bạn',
    backToDashboard: 'Quay Lại Bảng Điều Khiển',
    startNewPractice: 'Bắt Đầu Thực Hành Mới',
    exportReport: 'Xuất Báo Cáo',
    reportLanguage: 'Ngôn Ngữ Báo Cáo',
    
    // Overall Performance
    overallPerformance: 'Hiệu Suất Tổng Thể',
    score: 'Điểm',
    pass: 'Đạt',
    borderline: 'Biên Giới',
    needsImprovement: 'Cần Cải Thiện',
    passThreshold: 'Ngưỡng Đạt: ≥ 3.5',
    borderlineRange: 'Biên Giới: 3.0 - 3.4',
    
    // Tabs
    overview: 'Tổng Quan',
    analytics: 'Phân Tích',
    detailedFeedback: 'Phản Hồi Chi Tiết',
    practice: 'Thực Hành',
    reflect: 'Suy Ngẫm',
    
    // Session Statistics
    questions: 'Câu Hỏi',
    duration: 'Thời Gian',
    language: 'Ngôn Ngữ',
    status: 'Trạng Thái',
    
    // Overview Section
    keyStrengths: 'Điểm Mạnh Chính',
    strengthsSubtitle: 'Những gì bạn xuất sắc trong phỏng vấn',
    buildingStrengths: 'Xây Dựng Điểm Mạnh Của Bạn',
    buildingStrengthsDesc: 'Hoàn thành thêm các phiên thực hành để xác định điểm mạnh chính của bạn.',
    
    growthOpportunities: 'Cơ Hội Phát Triển',
    growthSubtitle: 'Các lĩnh vực cần tập trung để cải thiện',
    identifyingGrowth: 'Xác Định Lĩnh Vực Phát Triển',
    identifyingGrowthDesc: 'Cơ hội cải thiện của bạn sẽ được làm nổi bật sau khi đánh giá.',
    
    aiAssessmentNotes: 'Ghi Chú Đánh Giá AI',
    aiNotesSubtitle: 'Quan sát chi tiết từ hiệu suất phỏng vấn của bạn',
    generatingAnalysis: 'Đang Tạo Phân Tích Chi Tiết',
    generatingAnalysisDesc: 'AI của chúng tôi đang xử lý phản hồi của bạn để cung cấp quan sát và hiểu biết toàn diện.',
    
    // Charts and Analytics
    interviewPerformanceScore: 'Điểm Hiệu Suất Phỏng Vấn',
    performanceRadar: 'Radar Hiệu Suất',
    performanceRadarDesc: 'Điểm của bạn trên tất cả 9 tiêu chí đánh giá (thang điểm 1-5)',
    weightedContribution: 'Đóng Góp Có Trọng Số',
    weightedContributionDesc: 'Mỗi tiêu chí đóng góp như thế nào vào điểm tổng thể của bạn',
    detailedScoreBreakdown: 'Phân Tích Điểm Chi Tiết',
    detailedScoreBreakdownDesc: 'Điểm cá nhân và phản hồi cho từng tiêu chí đánh giá',
    
    // Criteria Names
    relevance: 'Liên Quan',
    starStructure: 'Cấu Trúc STAR',
    evidence: 'Bằng Chứng',
    roleAlignment: 'Phù Hợp Vai Trò',
    outcomes: 'Kết Quả',
    communication: 'Giao Tiếp',
    problemSolving: 'Giải Quyết Vấn Đề',
    culturalFit: 'Phù Hợp Văn Hóa',
    learningAgility: 'Khả Năng Học Hỏi',
    
    // Score Descriptions
    exceedsExpectations: 'Vượt kỳ vọng',
    meetsBasicExpectations: 'Đáp ứng kỳ vọng cơ bản',
    belowExpectations: 'Dưới kỳ vọng',
    
    // Chart Labels
    yourScore: 'Điểm Của Bạn',
    remaining: 'Còn Lại',
    weightedScore: 'Điểm Có Trọng Số',
    
    // Common
    completed: 'Hoàn Thành',
    inProgress: 'Đang Tiến Hành',
    pending: 'Chờ Xử Lý',
    noDataAvailable: 'Không có dữ liệu',
    loadingTranslation: 'Đang dịch nội dung...',
  },
  
  tl: {
    // Header
    title: 'Ang Inyong AI Interview Performance Report',
    backToDashboard: 'Balik sa Dashboard',
    startNewPractice: 'Magsimula ng Bagong Practice',
    exportReport: 'I-export ang Report',
    reportLanguage: 'Wika ng Report',
    
    // Overall Performance
    overallPerformance: 'Kabuuang Performance',
    score: 'Score',
    pass: 'Pumasa',
    borderline: 'Borderline',
    needsImprovement: 'Kailangan ng Pagpapabuti',
    passThreshold: 'Passing Threshold: ≥ 3.5',
    borderlineRange: 'Borderline: 3.0 - 3.4',
    
    // Tabs
    overview: 'Overview',
    analytics: 'Analytics',
    detailedFeedback: 'Detalyadong Feedback',
    practice: 'Practice',
    reflect: 'Pagninilay',
    
    // Session Statistics
    questions: 'Mga Tanong',
    duration: 'Tagal',
    language: 'Wika',
    status: 'Status',
    
    // Overview Section
    keyStrengths: 'Mga Pangunahing Lakas',
    strengthsSubtitle: 'Kung saan kayo nangingibabaw sa mga interview',
    buildingStrengths: 'Pagbuo ng Inyong Lakas',
    buildingStrengthsDesc: 'Kumpletuhin ang higit pang practice sessions para matukoy ang inyong mga pangunahing lakas.',
    
    growthOpportunities: 'Mga Pagkakataong Lumago',
    growthSubtitle: 'Mga lugar na dapat pagtuunan ng pansin para sa pagpapabuti',
    identifyingGrowth: 'Pagtukoy sa mga Lugar ng Paglago',
    identifyingGrowthDesc: 'Ang inyong mga pagkakataong mapabuti ay mabibigyang-diin pagkatapos ng evaluation.',
    
    aiAssessmentNotes: 'Mga Tala ng AI Assessment',
    aiNotesSubtitle: 'Detalyadong mga obserbasyon mula sa inyong interview performance',
    generatingAnalysis: 'Gumagawa ng Detalyadong Analysis',
    generatingAnalysisDesc: 'Ang aming AI ay nag-process ng inyong mga sagot para magbigay ng komprehensibong mga obserbasyon at insight.',
    
    // Charts and Analytics
    interviewPerformanceScore: 'Score ng Interview Performance',
    performanceRadar: 'Performance Radar',
    performanceRadarDesc: 'Ang inyong score sa lahat ng 9 evaluation criteria (1-5 scale)',
    weightedContribution: 'Weighted Contribution',
    weightedContributionDesc: 'Paano nag-contribute ang bawat criteria sa inyong overall score',
    detailedScoreBreakdown: 'Detalyadong Score Breakdown',
    detailedScoreBreakdownDesc: 'Individual na scores at feedback para sa bawat evaluation criteria',
    
    // Criteria Names
    relevance: 'Relevance',
    starStructure: 'STAR Structure',
    evidence: 'Evidence',
    roleAlignment: 'Role Alignment',
    outcomes: 'Outcomes',
    communication: 'Communication',
    problemSolving: 'Problem-Solving',
    culturalFit: 'Cultural Fit',
    learningAgility: 'Learning Agility',
    
    // Score Descriptions
    exceedsExpectations: 'Lumampas sa expectations',
    meetsBasicExpectations: 'Naabot ang basic expectations',
    belowExpectations: 'Nasa ilalim ng expectations',
    
    // Chart Labels
    yourScore: 'Inyong Score',
    remaining: 'Natitira',
    weightedScore: 'Weighted Score',
    
    // Common
    completed: 'Tapos Na',
    inProgress: 'Ginagawa',
    pending: 'Naghihintay',
    noDataAvailable: 'Walang available na data',
    loadingTranslation: 'Sinasalin ang content...',
  }
} as const;

type TranslationKey = keyof typeof translations.en;
type SupportedLanguage = keyof typeof translations;

interface TranslatedContent {
  strengths?: string[];
  improvementAreas?: string[];
  qualitativeObservations?: string;
  actionableInsights?: string[];
  personalizedDrills?: string[];
}

export function useAssessmentTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Translation mutation for AI-generated content
  const translateContentMutation = useMutation({
    mutationFn: async ({ content, targetLanguage }: { content: any; targetLanguage: string }) => {
      const response = await fetch('/api/voice/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: JSON.stringify(content),
          targetLanguage
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      try {
        const parsed = JSON.parse(data.translatedText);
        setTranslatedContent(parsed);
      } catch (error) {
        console.warn('Failed to parse translated content:', error);
      }
      setIsTranslating(false);
    },
    onError: (error) => {
      console.error('Translation failed:', error);
      setIsTranslating(false);
    }
  });

  // Get static translation for UI text
  const t = useCallback((key: TranslationKey): string => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  }, [currentLanguage]);

  // Change language and translate content if needed
  const changeLanguage = useCallback(async (newLanguage: SupportedLanguage, evaluation?: any) => {
    setCurrentLanguage(newLanguage);
    
    if (newLanguage === 'en' || !evaluation) {
      setTranslatedContent({});
      return;
    }

    // Translate AI-generated content
    const contentToTranslate = {
      strengths: evaluation.strengths || [],
      improvementAreas: evaluation.improvementAreas || [],
      qualitativeObservations: evaluation.qualitativeObservations || '',
      actionableInsights: evaluation.actionableInsights || [],
      personalizedDrills: evaluation.personalizedDrills || []
    };

    setIsTranslating(true);
    translateContentMutation.mutate({
      content: contentToTranslate,
      targetLanguage: newLanguage
    });
  }, [translateContentMutation]);

  // Get translated or original content
  const getTranslatedField = useCallback((field: keyof TranslatedContent, originalValue: any) => {
    if (currentLanguage === 'en' || !translatedContent[field]) {
      return originalValue;
    }
    return translatedContent[field];
  }, [currentLanguage, translatedContent]);

  // Get current language info
  const getCurrentLanguageInfo = useCallback(() => {
    return ASEAN_LANGUAGES.find(lang => lang.code === currentLanguage) || ASEAN_LANGUAGES[0];
  }, [currentLanguage]);

  return {
    currentLanguage,
    t,
    changeLanguage,
    getTranslatedField,
    getCurrentLanguageInfo,
    isTranslating,
    supportedLanguages: ASEAN_LANGUAGES
  };
}