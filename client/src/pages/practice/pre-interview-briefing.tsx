import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Lightbulb, ArrowLeft, Play, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import type { InterviewScenario } from "@shared/schema";

// Language mapping
const languageNames = {
  'en': 'English',
  'ms': 'Bahasa Malaysia', 
  'id': 'Bahasa Indonesia',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'fil': 'Filipino',
  'my': 'Myanmar',
  'km': 'Khmer',
  'lo': 'Lao',
  'zh': 'Chinese (Singapore)',
  'zh-sg': 'Chinese (Singapore)' // Handle both formats
};

const getLanguageName = (code: string) => languageNames[code as keyof typeof languageNames] || 'English';

// Translations for the briefing interface
const translations = {
  'en': {
    title: 'Interview Preparation Session',
    subtitle: "You're about to begin a subject interview simulation. Take your time and respond naturally.",
    scenarioBrief: 'Scenario Brief',
    personalizedInterview: 'Personalized Interview',
    position: 'Position:',
    company: 'Company:',
    interviewStage: 'Interview Stage:',
    duration: 'Duration:',
    dynamicGeneration: 'Dynamic Generation:',
    dynamicGenerationText: 'Questions will be generated in real-time specifically for this {role} role at {company}. Each question adapts to your responses and focuses on actual job requirements and company culture.',
    yourBackground: 'Your Background',
    experiencedProfessional: 'Experienced professional',
    keyObjectives: 'Key Objectives',
    assessCandidate: 'Assess candidate suitability for {role} role at {company}',
    yourInterviewer: 'Your Interviewer',
    aiInterviewer: 'AI Interviewer',
    professionalAssistant: 'Professional Interview Assistant',
    interviewStyle: 'Interview Style:',
    professionalEngaging: 'Professional and engaging',
    personality: 'Personality:',
    thoughtfulSupportive: 'Thoughtful and supportive',
    sessionInformation: 'Session Information',
    questions: 'Questions:',
    estimatedTime: 'Estimated time:',
    interviewLanguage: 'Interview Language:',
    autoSave: 'Auto-save:',
    enabled: 'Enabled',
    interviewLanguageLabel: 'Interview Language',
    startInterview: 'Start Interview',
    backToScenarios: 'Back to Scenarios',
    minutes: 'minutes'
  },
  'ms': {
    title: 'Sesi Persediaan Temuduga',
    subtitle: 'Anda akan memulakan simulasi temuduga subjek. Luangkan masa anda dan jawab secara semula jadi.',
    scenarioBrief: 'Ringkasan Senario',
    personalizedInterview: 'Temuduga Dipersonalisasi',
    position: 'Jawatan:',
    company: 'Syarikat:',
    interviewStage: 'Peringkat Temuduga:',
    duration: 'Tempoh:',
    dynamicGeneration: 'Penjanaan Dinamik:',
    dynamicGenerationText: 'Soalan akan dijana secara masa nyata khusus untuk peranan {role} di {company}. Setiap soalan disesuaikan dengan jawapan anda dan memberi tumpuan kepada keperluan kerja sebenar dan budaya syarikat.',
    yourBackground: 'Latar Belakang Anda',
    experiencedProfessional: 'Profesional berpengalaman',
    keyObjectives: 'Objektif Utama',
    assessCandidate: 'Menilai kesesuaian calon untuk peranan {role} di {company}',
    yourInterviewer: 'Penemuduga Anda',
    aiInterviewer: 'Penemuduga AI',
    professionalAssistant: 'Pembantu Temuduga Profesional',
    interviewStyle: 'Gaya Temuduga:',
    professionalEngaging: 'Profesional dan menarik',
    personality: 'Personaliti:',
    thoughtfulSupportive: 'Berfikir dan menyokong',
    sessionInformation: 'Maklumat Sesi',
    questions: 'Soalan:',
    estimatedTime: 'Anggaran masa:',
    interviewLanguage: 'Bahasa Temuduga:',
    autoSave: 'Auto-simpan:',
    enabled: 'Diaktifkan',
    interviewLanguageLabel: 'Bahasa Temuduga',
    startInterview: 'Mulakan Temuduga',
    backToScenarios: 'Kembali ke Senario',
    minutes: 'minit'
  },
  'th': {
    title: 'เซสชันเตรียมตัวสัมภาษณ์',
    subtitle: 'คุณกำลังจะเริ่มการจำลองการสัมภาษณ์งาน กรุณาใช้เวลาของคุณและตอบอย่างเป็นธรรมชาติ',
    scenarioBrief: 'สรุปสถานการณ์',
    personalizedInterview: 'การสัมภาษณ์ที่ปรับเปลี่ยนได้',
    position: 'ตำแหน่ง:',
    company: 'บริษัท:',
    interviewStage: 'ขั้นตอนการสัมภาษณ์:',
    duration: 'ระยะเวลา:',
    dynamicGeneration: 'การสร้างแบบไดนามิก:',
    dynamicGenerationText: 'คำถามจะถูกสร้างขึ้นแบบเรียลไทม์โดยเฉพาะสำหรับตำแหน่ง {role} ที่ {company} คำถามแต่ละข้อจะปรับตามคำตอบของคุณและมุ่งเน้นไปที่ความต้องการงานจริงและวัฒนธรรมบริษัท',
    yourBackground: 'ประวัติของคุณ',
    experiencedProfessional: 'ผู้เชี่ยวชาญที่มีประสบการณ์',
    keyObjectives: 'วัตถุประสงค์หลัก',
    assessCandidate: 'ประเมินความเหมาะสมของผู้สมัครสำหรับตำแหน่ง {role} ที่ {company}',
    yourInterviewer: 'ผู้สัมภาษณ์ของคุณ',
    aiInterviewer: 'ผู้สัมภาษณ์ AI',
    professionalAssistant: 'ผู้ช่วยการสัมภาษณ์มืออาชีพ',
    interviewStyle: 'สไตล์การสัมภาษณ์:',
    professionalEngaging: 'เป็นมืออาชีพและน่าสนใจ',
    personality: 'บุคลิกภาพ:',
    thoughtfulSupportive: 'ใส่ใจและให้การสนับสนุน',
    sessionInformation: 'ข้อมูลเซสชัน',
    questions: 'คำถาม:',
    estimatedTime: 'เวลาโดยประมาณ:',
    interviewLanguage: 'ภาษาการสัมภาษณ์:',
    autoSave: 'บันทึกอัตโนมัติ:',
    enabled: 'เปิดใช้งาน',
    interviewLanguageLabel: 'ภาษาการสัมภาษณ์',
    startInterview: 'เริ่มการสัมภาษณ์',
    backToScenarios: 'กลับไปยังสถานการณ์',
    minutes: 'นาที'
  },
  'id': {
    title: 'Sesi Persiapan Wawancara',
    subtitle: 'Anda akan memulai simulasi wawancara subjek. Luangkan waktu Anda dan jawab secara alami.',
    scenarioBrief: 'Ringkasan Skenario',
    personalizedInterview: 'Wawancara yang Dipersonalisasi',
    position: 'Posisi:',
    company: 'Perusahaan:',
    interviewStage: 'Tahap Wawancara:',
    duration: 'Durasi:',
    dynamicGeneration: 'Generasi Dinamis:',
    dynamicGenerationText: 'Pertanyaan akan dihasilkan secara real-time khusus untuk peran {role} di {company}. Setiap pertanyaan menyesuaikan dengan jawaban Anda dan berfokus pada persyaratan kerja aktual dan budaya perusahaan.',
    yourBackground: 'Latar Belakang Anda',
    experiencedProfessional: 'Profesional berpengalaman',
    keyObjectives: 'Tujuan Utama',
    assessCandidate: 'Menilai kesesuaian kandidat untuk peran {role} di {company}',
    yourInterviewer: 'Pewawancara Anda',
    aiInterviewer: 'Pewawancara AI',
    professionalAssistant: 'Asisten Wawancara Profesional',
    interviewStyle: 'Gaya Wawancara:',
    professionalEngaging: 'Profesional dan menarik',
    personality: 'Kepribadian:',
    thoughtfulSupportive: 'Perhatian dan mendukung',
    sessionInformation: 'Informasi Sesi',
    questions: 'Pertanyaan:',
    estimatedTime: 'Estimasi waktu:',
    interviewLanguage: 'Bahasa Wawancara:',
    autoSave: 'Simpan otomatis:',
    enabled: 'Diaktifkan',
    interviewLanguageLabel: 'Bahasa Wawancara',
    startInterview: 'Mulai Wawancara',
    backToScenarios: 'Kembali ke Skenario',
    minutes: 'menit'
  },
  'vi': {
    title: 'Phiên Chuẩn Bị Phỏng Vấn',
    subtitle: 'Bạn sắp bắt đầu mô phỏng phỏng vấn chủ đề. Hãy dành thời gian và trả lời tự nhiên.',
    scenarioBrief: 'Tóm Tắt Kịch Bản',
    personalizedInterview: 'Phỏng Vấn Cá Nhân Hóa',
    position: 'Vị trí:',
    company: 'Công ty:',
    interviewStage: 'Giai đoạn Phỏng vấn:',
    duration: 'Thời gian:',
    dynamicGeneration: 'Tạo Động:',
    dynamicGenerationText: 'Câu hỏi sẽ được tạo theo thời gian thực dành riêng cho vai trò {role} tại {company}. Mỗi câu hỏi thích ứng với câu trả lời của bạn và tập trung vào yêu cầu công việc thực tế và văn hóa công ty.',
    yourBackground: 'Lý Lịch Của Bạn',
    experiencedProfessional: 'Chuyên gia có kinh nghiệm',
    keyObjectives: 'Mục Tiêu Chính',
    assessCandidate: 'Đánh giá sự phù hợp của ứng viên cho vai trò {role} tại {company}',
    yourInterviewer: 'Người Phỏng Vấn',
    aiInterviewer: 'Người Phỏng Vấn AI',
    professionalAssistant: 'Trợ Lý Phỏng Vấn Chuyên Nghiệp',
    interviewStyle: 'Phong cách Phỏng vấn:',
    professionalEngaging: 'Chuyên nghiệp và hấp dẫn',
    personality: 'Tính cách:',
    thoughtfulSupportive: 'Chu đáo và hỗ trợ',
    sessionInformation: 'Thông Tin Phiên',
    questions: 'Câu hỏi:',
    estimatedTime: 'Thời gian ước tính:',
    interviewLanguage: 'Ngôn ngữ Phỏng vấn:',
    autoSave: 'Tự động lưu:',
    enabled: 'Đã bật',
    interviewLanguageLabel: 'Ngôn Ngữ Phỏng Vấn',
    startInterview: 'Bắt Đầu Phỏng Vấn',
    backToScenarios: 'Quay Lại Kịch Bản',
    minutes: 'phút'
  },
  'fil': {
    title: 'Session ng Paghahanda sa Interview',
    subtitle: 'Magsisimula ka na ng subject interview simulation. Maglaan ng oras at sumagot nang natural.',
    scenarioBrief: 'Buod ng Scenario',
    personalizedInterview: 'Personalized na Interview',
    position: 'Posisyon:',
    company: 'Kumpanya:',
    interviewStage: 'Stage ng Interview:',
    duration: 'Tagal:',
    dynamicGeneration: 'Dynamic Generation:',
    dynamicGenerationText: 'Ang mga tanong ay bubuo nang real-time na para sa {role} role sa {company}. Ang bawat tanong ay naaayon sa inyong mga sagot at nakatuon sa aktwal na job requirements at company culture.',
    yourBackground: 'Inyong Background',
    experiencedProfessional: 'May karanasang propesyonal',
    keyObjectives: 'Mga Pangunahing Layunin',
    assessCandidate: 'Suriin ang pagkakaangkop ng kandidato para sa {role} role sa {company}',
    yourInterviewer: 'Inyong Interviewer',
    aiInterviewer: 'AI Interviewer',
    professionalAssistant: 'Professional Interview Assistant',
    interviewStyle: 'Interview Style:',
    professionalEngaging: 'Propesyonal at engaging',
    personality: 'Personalidad:',
    thoughtfulSupportive: 'Maalalahanin at sumusuporta',
    sessionInformation: 'Impormasyon ng Session',
    questions: 'Mga Tanong:',
    estimatedTime: 'Tinatayang oras:',
    interviewLanguage: 'Wika ng Interview:',
    autoSave: 'Auto-save:',
    enabled: 'Nakabukas',
    interviewLanguageLabel: 'Wika ng Interview',
    startInterview: 'Simulan ang Interview',
    backToScenarios: 'Bumalik sa mga Scenario',
    minutes: 'minuto'
  },
  'my': {
    title: 'အင်တာဗျူးပြင်ဆင်ခြင်း အစည်းအဝေး',
    subtitle: 'သင်သည် အင်တာဗျူး သရုပ်ဆောင်ခြင်းကို စတင်မည်ဖြစ်သည်။ အချိန်ယူ၍ သဘာဝကျကျ ဖြေဆိုပါ။',
    scenarioBrief: 'အခြေအနေ အကျဉ်းချုပ်',
    personalizedInterview: 'ကိုယ်ပိုင်အင်တာဗျူး',
    position: 'ရာထူး:',
    company: 'ကုမ္ပဏီ:',
    interviewStage: 'အင်တာဗျူးအဆင့်:',
    duration: 'ကြာချိန်:',
    dynamicGeneration: 'Dynamic Generation:',
    dynamicGenerationText: '{company} ရှိ {role} အလုပ်အတွက် အချိန်နှင့်တပြေးညီ မေးခွန်းများ ဖန်တီးမည်ဖြစ်သည်။ မေးခွန်းတစ်ခုစီသည် သင်၏ ဖြေကြားချက်များနှင့် ကိုက်ညီစေပြီး အမှန်တကယ် အလုပ်လိုအပ်ချက်များနှင့် ကုမ္ပဏီ ယဉ်ကျေးမှုကို အဓိကထား၍ ပြုလုပ်မည်ဖြစ်သည်။',
    yourBackground: 'သင်၏နောက်ခံ',
    experiencedProfessional: 'အတွေ့အကြုံရှိ ပညာရှင်',
    keyObjectives: 'အဓိက ရည်မှန်းချက်များ',
    assessCandidate: '{company} ရှိ {role} အလုပ်အတွက် ကိုယ်စားလှယ်၏ သင့်လျော်မှုကို အကဲဖြတ်ခြင်း',
    yourInterviewer: 'သင်၏ အင်တာဗျူးယူသူ',
    aiInterviewer: 'AI အင်တာဗျူးယူသူ',
    professionalAssistant: 'ပရော်ဖက်ရှင်နယ် အင်တာဗျူး လက်ထောက်',
    interviewStyle: 'အင်တာဗျူး ပုံစံ:',
    professionalEngaging: 'ပရော်ဖက်ရှင်နယ်နှင့် စိတ်ဝင်စားဖွယ်',
    personality: 'စရိုက်:',
    thoughtfulSupportive: 'စဉ်းစားတတ်ပြီး ပံ့ပိုးပေးသော',
    sessionInformation: 'အစည်းအဝေး အချက်အလက်',
    questions: 'မေးခွန်းများ:',
    estimatedTime: 'ခန့်မှန်းချိန်:',
    interviewLanguage: 'အင်တာဗျူး ဘာသာစကား:',
    autoSave: 'အလိုအလျောက် သိမ်းဆည်းခြင်း:',
    enabled: 'ဖွင့်ထားသည်',
    interviewLanguageLabel: 'အင်တာဗျူး ဘာသာစကား',
    startInterview: 'အင်တာဗျူး စတင်ပါ',
    backToScenarios: 'အခြေအနေများသို့ ပြန်သွားပါ',
    minutes: 'မိနစ်'
  },
  'km': {
    title: 'សេសសកម្មរៀបចំសំណួរសម្ភាសន៍',
    subtitle: 'អ្នកនឹងចាប់ផ្តើមសម្ភាសន៍ប្រធានបទ។ សូមចំណាយពេលនិងឆ្លើយធម្មជាតិ។',
    scenarioBrief: 'សង្ខេបស្ថានការណ៍',
    personalizedInterview: 'សម្ភាសន៍ផ្ទាល់ខ្លួន',
    position: 'តួនាទី:',
    company: 'ក្រុមហ៊ុន:',
    interviewStage: 'ដំណាក់កាលសម្ភាសន៍:',
    duration: 'ពេលវេលា:',
    dynamicGeneration: 'បង្កើតថាមពល:',
    dynamicGenerationText: 'សំណួរនឹងត្រូវបានបង្កើតជាលក្ខណៈពេលវេលាពិតប្រាកដសម្រាប់តួនាទី {role} នៅ {company}។ សំណួរនីមួយៗត្រូវបានសម្របទៅនឹងចម្លើយរបស់អ្នកនិងផ្តោតលើតម្រូវការការងារពិតនិងវប្បធម៌ក្រុមហ៊ុន។',
    yourBackground: 'ប្រវត្តិរបស់អ្នក',
    experiencedProfessional: 'អ្នកជំនាញមានបទពិសោធន៍',
    keyObjectives: 'គោលបំណងសំខាន់',
    assessCandidate: 'វាយតម្លៃភាពសមរម្យរបស់បេក្ខជនសម្រាប់តួនាទី {role} នៅ {company}',
    yourInterviewer: 'អ្នកសម្ភាសន៍របស់អ្នក',
    aiInterviewer: 'អ្នកសម្ភាសន៍ AI',
    professionalAssistant: 'ជំនួយការសម្ភាសន៍វិជ្ជាជីវៈ',
    interviewStyle: 'រចនាប័ទ្មសម្ភាសន៍:',
    professionalEngaging: 'វិជ្ជាជីវៈនិងគួរឱ្យចាប់អារម្មណ៍',
    personality: 'បុគ្គលិកលក្ខណៈ:',
    thoughtfulSupportive: 'ចេះគិតនិងគាំទ្រ',
    sessionInformation: 'ព័ត៌មានសេសសកម្ម',
    questions: 'សំណួរ:',
    estimatedTime: 'ពេលវេលាប្រមាណ:',
    interviewLanguage: 'ភាសាសម្ភាសន៍:',
    autoSave: 'រក្សាទុកស្វ័យប្រវត្តិ:',
    enabled: 'បើកដំណើរការ',
    interviewLanguageLabel: 'ភាសាសម្ភាសន៍',
    startInterview: 'ចាប់ផ្តើមសម្ភាសន៍',
    backToScenarios: 'ត្រលប់ទៅស្ថានការណ៍',
    minutes: 'នាទី'
  },
  'lo': {
    title: 'ກອງປະຊຸມກະກຽມສໍາພາດ',
    subtitle: 'ທ່ານກໍາລັງຈະເລີ່ມຕົ້ນການຈໍາລອງການສໍາພາດຫົວຂໍ້. ໃຊ້ເວລາຂອງທ່ານແລະຕອບຢ່າງທໍາມະຊາດ.',
    scenarioBrief: 'ສຸຸພາບສະຖານະການ',
    personalizedInterview: 'ການສໍາພາດສ່ວນບຸກຄົນ',
    position: 'ຕໍາແໜ່ງ:',
    company: 'ບໍລິສັດ:',
    interviewStage: 'ຂັ້ນຕອນການສໍາພາດ:',
    duration: 'ໄລຍະເວລາ:',
    dynamicGeneration: 'ການສ້າງແບບເຄື່ອນໄຫວ:',
    dynamicGenerationText: 'ຄໍາຖາມຈະຖືກສ້າງຂື້ນໃນເວລາຈິງທີ່ສະເພາະສໍາລັບພາລະໜ້າທີ່ {role} ທີ່ {company}. ຄໍາຖາມແຕ່ລະຄໍາຖາມຈະປັບຕົວຕາມຄໍາຕອບຂອງທ່ານແລະສຸມໃສ່ຄວາມຕ້ອງການວຽກທີ່ແທ້ຈິງແລະວັດທະນະທໍາຂອງບໍລິສັດ.',
    yourBackground: 'ປະຫວັດຂອງທ່ານ',
    experiencedProfessional: 'ຜູ້ຊ່ຽວຊານທີ່ມີປະສົບການ',
    keyObjectives: 'ຈຸດປະສົງຫຼັກ',
    assessCandidate: 'ປະເມີນຄວາມເໝາະສົມຂອງຜູ້ສະໝັກສໍາລັບພາລະໜ້າທີ່ {role} ທີ່ {company}',
    yourInterviewer: 'ຜູ້ສໍາພາດຂອງທ່ານ',
    aiInterviewer: 'ຜູ້ສໍາພາດ AI',
    professionalAssistant: 'ຜູ້ຊ່ວຍການສໍາພາດວິຊາຊີບ',
    interviewStyle: 'ຮູບແບບການສໍາພາດ:',
    professionalEngaging: 'ວິຊາຊີບແລະໜ້າສົນໃຈ',
    personality: 'ບຸກຄະລິກະພາບ:',
    thoughtfulSupportive: 'ຄິດໄຕ່ຕອງແລະສະໜັບສະໜູນ',
    sessionInformation: 'ຂໍ້ມູນກອງປະຊຸມ',
    questions: 'ຄໍາຖາມ:',
    estimatedTime: 'ເວລາທີ່ປະມານ:',
    interviewLanguage: 'ພາສາການສໍາພາດ:',
    autoSave: 'ບັນທຶກອັດຕະໂນມັດ:',
    enabled: 'ເປີດໃຊ້ງານ',
    interviewLanguageLabel: 'ພາສາການສໍາພາດ',
    startInterview: 'ເລີ່ມການສໍາພາດ',
    backToScenarios: 'ກັບໄປຫາສະຖານະການ',
    minutes: 'ນາທີ'
  },
  'zh-sg': {
    title: '面试准备会议',
    subtitle: '您即将开始主题面试模拟。请花时间自然地回答。',
    scenarioBrief: '情景简介',
    personalizedInterview: '个性化面试',
    position: '职位：',
    company: '公司：',
    interviewStage: '面试阶段：',
    duration: '时长：',
    dynamicGeneration: '动态生成：',
    dynamicGenerationText: '问题将专门为{company}的{role}职位实时生成。每个问题都会根据您的回答进行调整，并专注于实际工作要求和公司文化。',
    yourBackground: '您的背景',
    experiencedProfessional: '经验丰富的专业人员',
    keyObjectives: '主要目标',
    assessCandidate: '评估候选人是否适合{company}的{role}职位',
    yourInterviewer: '您的面试官',
    aiInterviewer: 'AI面试官',
    professionalAssistant: '专业面试助理',
    interviewStyle: '面试风格：',
    professionalEngaging: '专业且引人入胜',
    personality: '性格：',
    thoughtfulSupportive: '体贴且支持',
    sessionInformation: '会议信息',
    questions: '问题：',
    estimatedTime: '预计时间：',
    interviewLanguage: '面试语言：',
    autoSave: '自动保存：',
    enabled: '已启用',
    interviewLanguageLabel: '面试语言',
    startInterview: '开始面试',
    backToScenarios: '返回情景',
    minutes: '分钟'
  }
};

export default function PreInterviewBriefing() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get job context from session storage
  const [jobContext, setJobContext] = useState(() => {
    const jobContextStr = sessionStorage.getItem('jobContext');
    return jobContextStr ? JSON.parse(jobContextStr) : { jobPosition: '', companyName: '', interviewLanguage: 'en' };
  });

  // Get current language and translations
  const currentLanguage = jobContext.interviewLanguage || 'en';
  const t = translations[currentLanguage as keyof typeof translations] || translations['en'];
  
  console.log('PreInterviewBriefing rendering with scenarioId:', scenarioId);

  const { data: scenario, isLoading, error } = useQuery<InterviewScenario>({
    queryKey: [`/api/practice/scenarios/${scenarioId}`, jobContext.jobPosition, jobContext.companyName],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (jobContext.jobPosition?.trim()) params.append('jobPosition', jobContext.jobPosition.trim());
      if (jobContext.companyName?.trim()) params.append('companyName', jobContext.companyName.trim());
      
      const response = await fetch(`/api/practice/scenarios/${scenarioId}?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [error, toast]);

  const handleStartInterview = async () => {
    try {
      if (!scenarioId) {
        toast({
          title: "Error",
          description: "Scenario ID is missing",
          variant: "destructive",
        });
        return;
      }

      // Get job context from session storage
      const jobContextStr = sessionStorage.getItem('jobContext');
      const jobContext = jobContextStr ? JSON.parse(jobContextStr) : { jobPosition: '', companyName: '', interviewLanguage: 'en' };
      
      // Create new interview session
      const response = await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scenarioId: scenarioId,
          status: "in_progress",
          currentQuestion: 1,
          totalQuestions: 15,
          userJobPosition: jobContext.jobPosition,
          userCompanyName: jobContext.companyName,
          interviewLanguage: jobContext.interviewLanguage || 'en',
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create interview session");
      }

      const session = await response.json();
      setLocation(`/practice/interview/${session.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to start interview session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 rounded-xl h-48"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Scenario Not Found</h2>
            <p className="text-gray-600 mb-6">
              The interview scenario you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/practice")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scenarios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 rounded-xl p-8 text-primary-foreground mb-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">{t.title}</h2>
          <p className="text-lg opacity-90">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Scenario Brief */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 text-primary mr-2" />
                {t.scenarioBrief}
              </h3>
              <div className="prose prose-sm text-gray-700 max-w-none">
                {/* Show personalized job context if available, otherwise show scenario defaults */}
                {jobContext.jobPosition || jobContext.companyName ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="text-green-800 font-medium mb-2">✓ {t.personalizedInterview}</h4>
                      <p><strong>{t.position}</strong> {jobContext.jobPosition || scenario.jobRole}</p>
                      <p><strong>{t.company}</strong> {jobContext.companyName || 'Not specified'}</p>
                      <p><strong>{t.interviewStage}</strong> {scenario.interviewStage.replace('-', ' ')}</p>
                      <p><strong>{t.duration}</strong> 15-20 {t.minutes}</p>
                      <p className="text-sm text-green-700 mt-2">
                        <strong>✨ {t.dynamicGeneration}</strong> {t.dynamicGenerationText.replace('{role}', jobContext.jobPosition).replace('{company}', jobContext.companyName)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p><strong>{t.position}</strong> {scenario.jobRole}</p>
                    <p><strong>{t.company}</strong> {scenario.companyBackground}</p>
                    <p><strong>{t.interviewStage}</strong> {scenario.interviewStage.replace('-', ' ')}</p>
                    <p><strong>{t.duration}</strong> 15-20 {t.minutes}</p>
                  </>
                )}
                
                <h4 className="text-lg font-medium text-gray-900 mt-4 mb-2">{t.yourBackground}</h4>
                <p>{scenario.candidateBackground}</p>
                
                <h4 className="text-lg font-medium text-gray-900 mt-4 mb-2">{t.keyObjectives}</h4>
                <div dangerouslySetInnerHTML={{
                  __html: scenario.keyObjectives
                    .split('\n')
                    .filter((line: string) => line.trim())
                    .map((line: string) => `<p>• ${line.replace(/^[•-]\s*/, '')}</p>`)
                    .join('')
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Interview Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                Interview Tips
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Use the STAR method for behavioural questions</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Speak clearly and at a moderate pace</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Prepare specific examples from your experience</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Show enthusiasm and genuine interest</span>
                </li>
                {jobContext.jobPosition && jobContext.companyName && (
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <span>Questions are dynamically generated - each interview will be unique and tailored to your specific role</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Interviewer Profile */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.yourInterviewer}</h3>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg font-medium text-gray-600">
                    {scenario.interviewerName ? scenario.interviewerName.split(' ').map(n => n[0]).join('') : 'AI'}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{scenario.interviewerName || t.aiInterviewer}</h4>
                  <p className="text-sm text-gray-600">{scenario.interviewerTitle || t.professionalAssistant}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>{t.interviewStyle}</strong> {scenario.interviewerStyle || t.professionalEngaging}</p>
                <p><strong>{t.personality}</strong> {scenario.personalityTraits || t.thoughtfulSupportive}</p>
              </div>
            </CardContent>
          </Card>

          {/* Session Controls */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.sessionInformation}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.questions}</span>
                  <span className="font-medium">15 questions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.estimatedTime}</span>
                  <span className="font-medium">15-20 {t.minutes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.interviewLanguage}</span>
                  <span className="font-medium">{getLanguageName(jobContext.interviewLanguage || 'en')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.autoSave}</span>
                  <span className="font-medium text-green-600">{t.enabled}</span>
                </div>
              </div>
              
              {/* Language Selection */}
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    {t.interviewLanguageLabel}
                  </label>
                  <Select 
                    value={jobContext.interviewLanguage || 'en'}
                    onValueChange={(value) => {
                      const newContext = { ...jobContext, interviewLanguage: value };
                      setJobContext(newContext);
                      sessionStorage.setItem('jobContext', JSON.stringify(newContext));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="ms">🇲🇾 Bahasa Malaysia</SelectItem>
                      <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                      <SelectItem value="th">🇹🇭 Thai</SelectItem>
                      <SelectItem value="vi">🇻🇳 Vietnamese</SelectItem>
                      <SelectItem value="fil">🇵🇭 Filipino</SelectItem>
                      <SelectItem value="my">🇲🇲 Myanmar</SelectItem>
                      <SelectItem value="km">🇰🇭 Khmer</SelectItem>
                      <SelectItem value="lo">🇱🇦 Lao</SelectItem>
                      <SelectItem value="zh-sg">🇸🇬 Chinese (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <Button 
                  onClick={handleStartInterview}
                  className="w-full"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t.startInterview}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/practice")}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t.backToScenarios}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
