import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import WGLLSingleQuestion from "@/components/WGLLSingleQuestion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function WGLL() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { data: session } = useQuery({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  const { data: responses } = useQuery({
    queryKey: ['/api/responses/session', sessionId],
    enabled: !!sessionId,
  });

  const { data: questions } = useQuery({
    queryKey: ['/api/questions', (session as any)?.interviewType, (session as any)?.industry],
    queryFn: async () => {
      if (!(session as any)?.interviewType) return [];
      
      // For subject-matter-expertise interviews, include industry filter
      let url = `/api/questions?type=${(session as any).interviewType}`;
      if ((session as any)?.interviewType === 'subject-matter-expertise' && (session as any)?.industry) {
        url += `&industry=${(session as any).industry}`;
      }
      
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!(session as any)?.interviewType,
  });

  if (!session || !responses || !questions) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900">Loading WGLL Content...</h2>
          </div>
        </main>
      </div>
    );
  }

  const interviewTypeDisplay = {
    'phone-screening': 'Phone/Initial Screening (HR)',
    'functional-team': 'Functional/Team Interview',
    'hiring-manager': 'Hiring Manager Interview',
    'subject-matter-expertise': 'Subject-Matter Expertise Interview',
    'executive-final': 'Executive/Final Round'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/review/${sessionId}`)}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Review
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">What Good Looks Like (WGLL)</h1>
            <p className="text-gray-600 mt-2">
              {(session as any)?.interviewType ? interviewTypeDisplay[(session as any).interviewType as keyof typeof interviewTypeDisplay] : 'Interview'} - Expert guidance and model answers
            </p>
          </div>
        </div>

        {/* Overview Card */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-6 h-6 text-purple-600" />
              <span>Premium Content Unlocked</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Congratulations on completing your practice session! You now have access to expert-level content 
              that will help you understand what high-performing candidates do differently.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <TrendingUp className="w-8 h-8 text-warning-yellow mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Model Answers</h3>
                <p className="text-sm text-gray-600">See exemplary responses</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <MessageSquare className="w-8 h-8 text-primary-blue mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Communication Tips</h3>
                <p className="text-sm text-gray-600">Advanced techniques</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <BarChart className="w-8 h-8 text-success-green mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Performance Analysis</h3>
                <p className="text-sm text-gray-600">Industry benchmarks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expert Model Answers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-warning-yellow" />
              <span>Expert Model Answers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array.isArray(questions) && questions.map((question: any, index: number) => (
                <WGLLQuestionCard key={question.id} question={question} index={index} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Communication Excellence */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-6 h-6 text-primary-blue" />
              <span>Communication Excellence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Voice & Tone</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Confident yet humble in delivery
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Use specific examples with quantifiable results
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Show enthusiasm for challenges and growth
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Demonstrate self-awareness and learning mindset
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Structure & Flow</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Start with context and end with impact
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Use transitions to guide the interviewer
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Balance detail with conciseness
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Connect examples to role requirements
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Benchmarks */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="w-6 h-6 text-success-green" />
              <span>Industry Performance Benchmarks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-success-green mb-2">78%</div>
                <div className="text-sm font-medium text-gray-900 mb-1">Success Rate</div>
                <div className="text-xs text-gray-600">Of candidates who follow WGLL guidance</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-primary-blue mb-2">2.3x</div>
                <div className="text-sm font-medium text-gray-900 mb-1">Interview Performance</div>
                <div className="text-xs text-gray-600">Improvement vs. non-prepared candidates</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-warning-yellow mb-2">94%</div>
                <div className="text-sm font-medium text-gray-900 mb-1">Confidence Level</div>
                <div className="text-xs text-gray-600">Reported by WGLL users post-interview</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <Link to={`/review/${sessionId}`}>
            <Button variant="outline" size="lg">
              Back to Review
            </Button>
          </Link>
          <Link to="/">
            <Button size="lg">
              Start New Session
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

// Individual question card with dynamic WGLL content loading
function WGLLQuestionCard({ question, index }: { question: any; index: number }) {
  const { data: wgllContent, isLoading, error } = useQuery({
    queryKey: ['/api/wgll', question.id],
    queryFn: async () => {
      const response = await fetch(`/api/wgll/${question.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch WGLL content');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">
            Question {index + 1}: {question.question}
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {question.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            <Badge variant="outline" className="text-xs">
              {question.difficulty}
            </Badge>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-2" />
            Expert Model Answer
          </h5>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Generating industry-specific expert guidance...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !wgllContent) {
    return (
      <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">
            Question {index + 1}: {question.question}
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {question.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            <Badge variant="outline" className="text-xs">
              {question.difficulty}
            </Badge>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-red-600">Failed to load expert guidance for this question.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">
          Question {index + 1}: {question.question}
        </h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {question.tags?.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs">
            {question.difficulty}
          </Badge>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 mb-4">
        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
          <Star className="w-4 h-4 text-yellow-500 mr-2" />
          Expert Model Answer
        </h5>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {wgllContent.modelAnswer}
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-4 mb-4">
        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
          <Target className="w-4 h-4 text-green-600 mr-2" />
          Key Success Factors
        </h5>
        <ul className="text-sm text-gray-700 space-y-1">
          {wgllContent.performanceMetrics?.map((factor: string, i: number) => (
            <li key={i} className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              {factor}
            </li>
          ))}
        </ul>
      </div>

      {wgllContent.expertTips && wgllContent.expertTips.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
            <Lightbulb className="w-4 h-4 text-yellow-600 mr-2" />
            Expert Tips
          </h5>
          <ul className="text-sm text-gray-700 space-y-1">
            {wgllContent.expertTips.map((tip: string, i: number) => (
              <li key={i} className="flex items-start">
                <Lightbulb className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Clean model answer generation using database WGLL content
function getModelAnswer(question: any, session: any): string {
  // First try to use WGLL content from database if available
  if (question.wgll_content?.model_answer) {
    return question.wgll_content.model_answer;
  }

  const company = session?.company || "the company";
  const position = session?.position || "this role";
  const questionText = question.question.toLowerCase();
  const interviewType = session?.interviewType || "";

  // For subject-matter-expertise (Stage 4) with industry-specific questions
  if (interviewType === 'subject-matter-expertise' && session?.industry) {
    return getIndustrySpecificAnswer(questionText, session.industry, company, position);
  }

  // Stage-specific answers based on interview type
  if (interviewType === 'phone-screening') {
    return getPhoneScreeningAnswer(questionText, company, position);
  } else if (interviewType === 'functional-team') {
    return getFunctionalTeamAnswer(questionText, company, position);
  } else if (interviewType === 'hiring-manager') {
    return getHiringManagerAnswer(questionText, company, position);
  } else if (interviewType === 'technical-specialist') {
    return getTechnicalSpecialistAnswer(questionText, company, position);
  } else if (interviewType === 'executive-final') {
    return getExecutiveFinalAnswer(questionText, company, position);
  }

  // Default fallback
  return getDefaultAnswer(questionText, company, position);
}

// Phone/Initial Screening specific answers
function getPhoneScreeningAnswer(questionText: string, company: string, position: string): string {
  if (questionText.includes('tell me about yourself')) {
    return `I'm a passionate ${position} with 5+ years of experience building scalable systems and leading cross-functional teams. What initially drew me to technology was the opportunity to solve complex problems that have real business impact. In my current role, I've been responsible for architecting and deploying systems that process millions of data points daily, directly contributing to measurable improvements in performance metrics. I'm particularly excited about ${company} because of your leadership in innovation and commitment to responsible technology development. The opportunity to work on cutting-edge projects while contributing to solutions that benefit millions of users aligns perfectly with my career goals. I thrive in collaborative environments where I can both contribute my technical expertise and learn from diverse perspectives.`;
  }

  if (questionText.includes('why are you interested in leaving')) {
    return `I've thoroughly enjoyed my current role and have learned tremendously, but I've reached a point where I'm seeking new challenges that align with my long-term career aspirations. Specifically, I'm looking for opportunities to work on more sophisticated systems at greater scale and complexity. ${company} represents the perfect next step because of your reputation for technical excellence and innovation. While my current company has been great for developing my foundational skills, I'm ready to tackle the kind of complex, large-scale challenges that ${company} is known for solving. This represents a strategic career move that builds on my existing experience while opening doors to new areas of expertise.`;
  }

  if (questionText.includes('salary expectations')) {
    return `I'm looking for a compensation package that reflects the market rate for senior ${position} roles at top-tier technology companies like ${company}. Based on my research and understanding of the current market, I believe a competitive range would be appropriate, depending on the specific requirements and scope of the role. However, I'm more interested in the total compensation package, including equity participation, given ${company}'s strong growth trajectory and market position. I'm open to discussing the details and finding a structure that works well for both parties, as I'm genuinely excited about the opportunity to contribute to ${company}'s initiatives.`;
  }

  if (questionText.includes('questions about the company culture')) {
    return `I have several questions that would help me understand how I can contribute most effectively to ${company}'s mission. First, I'd love to learn more about the team structure - how do cross-functional teams typically collaborate, and what's the balance between research-focused work and production-oriented development? Second, I'm curious about ${company}'s approach to innovation and experimentation. How much autonomy do engineers have to explore new technologies and methodologies? Third, given the rapid pace of advancement in our field, how does ${company} approach continuous learning and professional development? These insights would help me understand not just the role itself, but how I can make the most meaningful contribution to the team's success.`;
  }

  if (questionText.includes('greatest strengths')) {
    return `My greatest strength is my ability to bridge the gap between complex technical concepts and practical business applications. I have a unique combination of deep technical expertise and the communication skills necessary to translate capabilities into business value. For example, in my current role, I led the development of a system that increased efficiency by 45%, but equally important was my ability to present the technical approach and business impact to executives in terms they could understand and support. My second key strength is my systematic approach to problem-solving. I break down complex challenges into manageable components, establish clear success metrics, and iterate based on data-driven insights.`;
  }

  if (questionText.includes('challenge you faced') && questionText.includes('overcame')) {
    return `I encountered a significant challenge when our production system started showing degraded performance, causing customer satisfaction scores to drop. The issue was particularly complex because the system had initially performed excellently, and the degradation was gradual rather than sudden. I took ownership of the investigation and discovered that the root cause was data drift - the characteristics of incoming data had shifted significantly from our baseline. I developed a comprehensive solution that involved implementing automated monitoring, designing a continuous improvement pipeline, and establishing a comprehensive testing framework. The implementation took three months, but the results exceeded expectations. Not only did we restore the original performance levels, but we also built a more resilient system.`;
  }

  if (questionText.includes('stay current with industry trends')) {
    return `I maintain my expertise through a multi-faceted approach that combines academic research, practical experimentation, and industry networking. First, I regularly read leading publications and follow key conferences to stay abreast of cutting-edge developments. Second, I dedicate time each week to hands-on experimentation with new tools and frameworks. I maintain a personal repository where I implement interesting concepts and explore emerging technologies. Third, I actively participate in the community through local meetups, online forums, and professional organizations. This approach has helped me identify promising technologies early while avoiding the pitfalls of adopting unproven solutions.`;
  }

  if (questionText.includes('motivates you')) {
    return `What motivates me most is the opportunity to solve complex problems that have measurable positive impact. I'm energized by the potential to build systems that can process and understand data at scales impossible for humans, ultimately making better decisions and creating better experiences. I'm also deeply motivated by continuous learning and the rapid pace of innovation in our field. Additionally, I find great satisfaction in mentoring others and building systems that enable teams to be more effective. Finally, I'm motivated by working on problems that push the boundaries of what's technically possible.`;
  }

  if (questionText.includes('work under pressure') || questionText.includes('tight deadlines')) {
    return `I encountered a high-pressure situation when our team was tasked with deploying a critical system three weeks before a major product launch, with zero tolerance for delays. The challenge was compounded by the fact that we discovered data quality issues just one week into the project. I immediately assembled a cross-functional team to ensure complete alignment and rapid decision-making. I broke down the problem into parallel workstreams and established daily standups with clear success criteria. The key was maintaining transparent communication with leadership about progress and risks while ensuring the team stayed focused on technical execution. We delivered the system on schedule with excellent performance metrics.`;
  }

  if (questionText.includes('handle feedback') && questionText.includes('criticism')) {
    return `I view feedback and criticism as essential for professional growth and technical excellence. In my current role, I actively seek feedback from multiple sources - code reviews from peers, architecture reviews from senior staff, and user feedback from product teams. When receiving technical criticism, I focus on understanding the underlying concern rather than just the surface feedback. I've found that the best feedback often comes from people with different perspectives or experience levels. I've made it a practice to document lessons learned from feedback and share them with the team, which creates a culture of continuous learning.`;
  }

  if (questionText.includes('know about our company') && questionText.includes('want to work here')) {
    return `I'm genuinely excited about ${company} because of your leadership position in innovation and your commitment to responsible technology development. What particularly attracts me is ${company}'s approach to scaling solutions that benefit millions of users while maintaining high standards. I've been following your recent work and I'm impressed by the technical depth and practical impact of these initiatives. Your company culture of empowering engineers to work on challenging problems while collaborating across diverse, world-class teams aligns perfectly with how I do my best work. The opportunity to work on systems at ${company}'s scale represents exactly the kind of challenge I'm looking for in my next role.`;
  }

  if (questionText.includes('ideal work environment') && questionText.includes('management style')) {
    return `My ideal work environment combines intellectual challenge with collaborative problem-solving and clear communication. I thrive in settings where I have autonomy to explore technical solutions while being part of a team that values diverse perspectives and rigorous peer review. I prefer working with managers who set clear objectives and success metrics, then trust me to determine the best technical approach to achieve those goals. I value regular one-on-ones focused on both immediate project needs and long-term career development. The combination of technical autonomy, collaborative culture, clear communication, and growth opportunities creates the environment where I can deliver my best work.`;
  }

  if (questionText.includes('career goals') && questionText.includes('position help')) {
    return `My long-term career goal is to become a technical leader who can drive innovation at scale while building and mentoring world-class engineering teams. This position at ${company} represents a crucial step toward that goal because it would give me exposure to cutting-edge research and the opportunity to work on systems that impact millions of users. In the short term, I want to deepen my expertise in areas where ${company} is at the forefront. Medium-term, I see myself taking on increasing technical leadership responsibilities, architecting complex systems, and helping define strategic direction. The opportunity to work at ${company}'s scale would accelerate my learning and prepare me for increasingly impactful roles in technical leadership.`;
  }

  if (questionText.includes('adapt to') && questionText.includes('significant change')) {
    return `I experienced a major organizational change when our company decided to pivot our technical approach, requiring our entire engineering team to rapidly upskill within six months. Rather than resist the change, I saw it as an exciting opportunity to grow professionally and contribute to the company's future success. I immediately created a systematic learning plan that included courses, hands-on projects, and finding internal mentors. I also volunteered to be part of the pilot team that would build our first implementation. Within four months, I had successfully contributed to shipping our first system, and within a year, I was leading a team of engineers on related projects. This experience taught me that successful adaptation requires both technical learning and mindset shifts.`;
  }

  if (questionText.includes('biggest professional achievement')) {
    return `My biggest professional achievement was leading the development and deployment of a real-time system that prevented significant losses while improving user experience by 75%. This project was particularly challenging because it required building a system that could make accurate decisions in under 100 milliseconds while processing millions of transactions daily. The technical complexity involved designing a distributed architecture that could handle extreme scale, developing models that balanced accuracy with speed, and implementing robust monitoring and alerting systems. The key to success was breaking down the complex system into manageable components, establishing clear testing and validation procedures, and maintaining transparent communication with stakeholders throughout the process.`;
  }

  // Default response for phone screening questions
  return `Based on my experience in ${position} roles, I would approach this systematically by first understanding the specific requirements and constraints. I'd leverage my background in building scalable systems and cross-functional collaboration to develop a solution that addresses the core objectives while managing risks. My methodology emphasizes clear communication, data-driven decision making, and iterative improvement to ensure alignment with ${company}'s goals and deliver measurable results.`;
}

// Industry-specific answer generation for Stage 4
function getIndustrySpecificAnswer(questionText: string, industry: string, company: string, position: string): string {
  const industryContext = getIndustryContext(industry);
  
  if (questionText.includes('sustainable') && questionText.includes('tourism')) {
    return `Based on my experience as a ${industryContext.title}, I approach sustainable tourism development through comprehensive environmental impact assessments and stakeholder engagement. I implement green certification programs, establish partnerships with local communities, and develop eco-friendly service standards that maintain exceptional guest experiences while protecting natural resources and cultural heritage.`;
  }
  
  if (questionText.includes('market research') && questionText.includes('feasibility')) {
    return `In my role as ${industryContext.title}, I conduct thorough market research using visitor surveys, competitor analysis, and destination benchmarking. I collaborate with tourism boards, analyze demographic trends, and assess infrastructure requirements to develop feasibility studies that inform strategic tourism development and investment decisions.`;
  }
  
  if (questionText.includes('hotel technology') || questionText.includes('property management')) {
    return `As a ${industryContext.title}, I implement integrated property management systems that streamline operations from reservation to checkout. I focus on mobile-first solutions, contactless technologies, and data analytics platforms that enhance both operational efficiency and guest satisfaction through personalized experiences.`;
  }
  
  // Default industry-specific response
  return `Based on my extensive experience as a ${industryContext.title}, I approach this challenge systematically by first assessing industry standards and ${industryContext.focus}. I develop comprehensive strategies that balance operational efficiency with exceptional service delivery, ensuring all initiatives contribute to measurable improvements in both ${industryContext.metrics} and business performance.`;
}

// Industry context helper
function getIndustryContext(industry: string) {
  const contexts: { [key: string]: { title: string, focus: string, metrics: string } } = {
    'hospitality-tourism': { title: 'Hospitality Manager', focus: 'guest expectations', metrics: 'guest satisfaction' },
    'marketing-digital': { title: 'Marketing Director', focus: 'campaign performance', metrics: 'conversion rates' },
    'cybersecurity': { title: 'Cybersecurity Director', focus: 'threat landscape', metrics: 'security metrics' },
    'healthcare-medical': { title: 'Healthcare Administrator', focus: 'patient care', metrics: 'patient outcomes' },
    'finance-banking': { title: 'Finance Director', focus: 'regulatory compliance', metrics: 'financial performance' }
  };
  
  return contexts[industry] || { title: 'Industry Professional', focus: 'industry standards', metrics: 'performance indicators' };
}

// Success factors generation using database content or fallback patterns
function getSuccessFactors(question: any, session: any): string[] {
  // First try to use expert tips from database WGLL content
  if (question.wgll_content?.expert_tips && Array.isArray(question.wgll_content.expert_tips)) {
    return question.wgll_content.expert_tips;
  }
  const questionText = question.question.toLowerCase();
  
  if (questionText.includes('tell me about yourself')) {
    return [
      "Start with a compelling professional narrative that connects your experience to the role",
      "Include specific achievements with quantifiable metrics to demonstrate impact",
      "Show genuine enthusiasm for the company and explain why you're specifically interested",
      "End with how your experience positions you to contribute meaningfully to their mission"
    ];
  }

  if (questionText.includes('why are you interested in leaving')) {
    return [
      "Frame the move as career progression rather than dissatisfaction with current role",
      "Demonstrate you've researched the company and understand what makes them unique",
      "Connect your career aspirations to specific opportunities at the target company",
      "Show strategic thinking about your career trajectory and long-term goals"
    ];
  }

  if (questionText.includes('salary expectations')) {
    return [
      "Research market rates thoroughly and present a reasonable range based on data",
      "Express interest in total compensation package including equity and benefits",
      "Show flexibility and willingness to negotiate while maintaining your value",
      "Focus on mutual benefit and excitement about the opportunity beyond just compensation"
    ];
  }

  if (questionText.includes('questions about the company culture')) {
    return [
      "Ask thoughtful questions that demonstrate research and genuine interest in the company",
      "Focus on how you can contribute rather than just what you can get from the role",
      "Inquire about growth opportunities, collaboration styles, and innovation processes",
      "Show interest in understanding success metrics and team dynamics"
    ];
  }

  if (questionText.includes('greatest strengths')) {
    return [
      "Choose strengths that directly align with the role requirements and company needs",
      "Provide specific examples with measurable outcomes to validate your claims",
      "Connect your strengths to how you can solve problems or add value in this position",
      "Balance technical expertise with soft skills like communication and collaboration"
    ];
  }

  if (questionText.includes('challenge you faced') && questionText.includes('overcame')) {
    return [
      "Choose a complex challenge that demonstrates problem-solving skills relevant to the role",
      "Use a clear structure: situation, action, result with specific metrics where possible",
      "Show systematic thinking and ability to break down complex problems into manageable parts",
      "Emphasize lessons learned and how the experience prepared you for future challenges"
    ];
  }

  if (questionText.includes('stay current with industry trends')) {
    return [
      "Demonstrate multiple learning channels: formal education, experimentation, and community engagement",
      "Show practical application of new knowledge through projects or implementations",
      "Balance staying informed with discerning which trends are worth investing time in",
      "Emphasize continuous learning mindset and ability to adapt to technological changes"
    ];
  }

  if (questionText.includes('motivates you')) {
    return [
      "Connect your motivations to the type of work and impact you'll have in this role",
      "Show intrinsic motivation beyond just career advancement or compensation",
      "Demonstrate passion for solving meaningful problems and creating positive impact",
      "Balance personal fulfillment with business objectives and team success"
    ];
  }

  if (questionText.includes('work under pressure') || questionText.includes('tight deadlines')) {
    return [
      "Demonstrate systematic approach to managing competing priorities and time constraints",
      "Show ability to maintain quality standards while meeting aggressive timelines",
      "Emphasize communication and team coordination skills during high-pressure situations",
      "Highlight specific project management techniques and tools that ensure successful delivery"
    ];
  }

  if (questionText.includes('handle feedback') && questionText.includes('criticism')) {
    return [
      "Show growth mindset and active seeking of feedback for continuous improvement",
      "Demonstrate ability to separate personal feelings from professional development opportunities",
      "Provide examples of how you've implemented feedback to achieve better outcomes",
      "Emphasize your role in creating feedback culture and helping others grow as well"
    ];
  }

  if (questionText.includes('know about our company') && questionText.includes('want to work here')) {
    return [
      "Demonstrate thorough research about the company's mission, values, and recent achievements",
      "Connect your skills and experience to specific ways you can contribute to their goals",
      "Show understanding of their competitive position and industry challenges",
      "Express genuine enthusiasm for their culture, technology, and growth trajectory"
    ];
  }

  if (questionText.includes('ideal work environment') && questionText.includes('management style')) {
    return [
      "Describe preferences that align with the company's known culture and management approach",
      "Balance need for autonomy with appreciation for collaboration and team support",
      "Show flexibility and ability to adapt to different working styles and environments",
      "Emphasize desire for clear communication, growth opportunities, and meaningful work"
    ];
  }

  if (questionText.includes('career goals') && questionText.includes('position help')) {
    return [
      "Present clear short-term and long-term career objectives that align with the role",
      "Show how this position provides specific skills, experience, or exposure you need",
      "Demonstrate commitment to growing with the company rather than just using it as a stepping stone",
      "Connect your career progression to increasing value you can provide to the organization"
    ];
  }

  if (questionText.includes('adapt to') && questionText.includes('significant change')) {
    return [
      "Choose an example that shows resilience and positive attitude toward change",
      "Demonstrate proactive learning and skill development during transitions",
      "Show leadership qualities by helping others adapt and succeed during change",
      "Emphasize the positive outcomes and growth that resulted from embracing change"
    ];
  }

  if (questionText.includes('biggest professional achievement')) {
    return [
      "Select an achievement that showcases skills directly relevant to the target role",
      "Provide comprehensive context including challenges, actions taken, and measurable results",
      "Demonstrate both individual contribution and collaborative leadership skills",
      "Connect the achievement to broader business impact and lessons learned for future success"
    ];
  }

  // Stage 2 (Functional/Team Interview) specific success factors
  if (questionText.includes('collaborate with cross-functional teams') || (questionText.includes('cross-functional') && questionText.includes('deliver'))) {
    return [
      "Establish clear communication protocols and shared documentation from project start",
      "Proactively identify and address potential conflicts between different team priorities",
      "Build trust through consistent delivery on commitments and transparent progress updates",
      "Translate complex technical concepts into business terms that drive informed decision-making"
    ];
  }

  if (questionText.includes('disagreed with a team decision') || questionText.includes('disagree')) {
    return [
      "Present disagreement constructively with data-driven analysis and alternative solutions",
      "Ensure full understanding of original decision rationale before proposing changes",
      "Focus on achieving best project outcomes rather than being right or winning arguments",
      "Demonstrate collaboration by incorporating team feedback into proposed alternatives"
    ];
  }

  if (questionText.includes('give difficult feedback') || questionText.includes('difficult feedback')) {
    return [
      "Focus on specific behaviors and their business impact rather than personal characteristics",
      "Create safe, private environments for honest conversations about performance concerns",
      "Listen actively to understand underlying causes behind performance issues",
      "Develop collaborative improvement plans with clear expectations and support systems"
    ];
  }

  if (questionText.includes('deliver bad news') || questionText.includes('bad news')) {
    return [
      "Communicate transparently about business reasons while acknowledging team emotional impact",
      "Provide clear action plans for moving forward rather than just delivering disappointing news",
      "Recognize and validate team contributions even when projects are deprioritized",
      "Pivot quickly to exciting future opportunities that leverage team skills and interests"
    ];
  }

  if (questionText.includes('onboard new team members') || questionText.includes('help them integrate')) {
    return [
      "Create structured 30-60-90 day plans balancing technical ramp-up with cultural integration",
      "Pair new members with experienced teammates for knowledge transfer and relationship building",
      "Provide gradually increasing responsibility with clear success metrics and regular feedback",
      "Balance supportive structure with autonomy to build confidence and independent contribution"
    ];
  }

  if (questionText.includes('coordinate multiple stakeholders') || questionText.includes('competing priorities')) {
    return [
      "Conduct individual stakeholder interviews to understand constraints and success criteria",
      "Create visual roadmaps showing how each team's contributions connect to overall outcomes",
      "Facilitate data-driven discussions about trade-offs when priorities conflict",
      "Maintain regular cross-functional communication to prevent misalignment and surprises"
    ];
  }

  if (questionText.includes('successful team project') || questionText.includes('your specific role')) {
    return [
      "Clearly articulate your individual technical contributions alongside collaborative leadership",
      "Provide specific metrics demonstrating both project success and personal impact",
      "Show how technical decisions enabled broader team success and business outcomes",
      "Demonstrate knowledge transfer and documentation practices that benefit the entire team"
    ];
  }

  if (questionText.includes('difficult team member') || questionText.includes('work with a difficult')) {
    return [
      "Address behavioral issues directly while recognizing and leveraging individual strengths",
      "Understand underlying causes behind difficult behavior before implementing solutions",
      "Create structured opportunities for difficult team members to contribute positively",
      "Modify team processes to channel diverse working styles into productive outcomes"
    ];
  }

  if (questionText.includes('effective communication') && questionText.includes('remote')) {
    return [
      "Establish core overlap hours while using asynchronous tools for continuous progress",
      "Create comprehensive documentation practices so context is never lost across time zones",
      "Implement structured communication rituals that maintain personal connections and team cohesion",
      "Rotate meeting times fairly and use collaborative tools to maintain creative energy"
    ];
  }

  if (questionText.includes('advocate for your team') || questionText.includes('senior management')) {
    return [
      "Translate technical concerns into business impact with quantified cost and productivity metrics",
      "Present multiple options with clear trade-offs rather than just identifying problems",
      "Bring supporting data from customer success and operational metrics to strengthen arguments",
      "Provide actionable recommendations that balance technical needs with business constraints"
    ];
  }

  if (questionText.includes('building trust') || questionText.includes('new team')) {
    return [
      "Listen more than you speak initially to understand team dynamics and individual working styles",
      "Follow through consistently on all commitments regardless of size to establish reliability",
      "Share knowledge openly through mentoring and code reviews without being condescending",
      "Give credit publicly to others' contributions while presenting disagreements with data and reasoning"
    ];
  }

  if (questionText.includes('mentoring') || questionText.includes('teammates who are struggling')) {
    return [
      "Focus on developing problem-solving skills rather than just providing immediate solutions",
      "Create regular learning opportunities through code reviews and collaborative problem-solving",
      "Build confidence gradually through smaller group discussions before larger team meetings",
      "Connect mentees with diverse team members to expand learning networks beyond single mentor"
    ];
  }

  if (questionText.includes('step outside your comfort zone') || questionText.includes('help your team')) {
    return [
      "Volunteer for challenges outside your expertise when team needs require it",
      "Invest personal time in learning new domains to contribute effectively to team success",
      "Collaborate with domain experts while taking ownership of unfamiliar technical areas",
      "Document learning process and create monitoring systems to prevent similar issues"
    ];
  }

  if (questionText.includes('agile') || questionText.includes('fast-paced environments')) {
    return [
      "Balance speed with sustainability by including technical debt and infrastructure work",
      "Implement automated testing and deployment practices that enable rapid iteration without sacrificing quality",
      "Facilitate trade-off discussions when stakeholders request mid-sprint scope changes",
      "Lead retrospectives focused on process improvement rather than just problem identification"
    ];
  }

  if (questionText.includes('different working styles') || questionText.includes('team members have different')) {
    return [
      "Adapt team processes to accommodate different styles while maintaining overall cohesion",
      "Create multiple communication channels to support both structured and organic collaboration preferences",
      "Pair complementary working styles to leverage diversity as a strength for better solutions",
      "Ensure all team members have appropriate channels to contribute ideas regardless of communication style"
    ];
  }

  // Stage 3 (Hiring Manager Interview) specific success factors
  if (questionText.includes('stay informed about industry trends') || questionText.includes('industry trends and their potential impact')) {
    return [
      "Demonstrate multiple information sources including publications, conferences, and peer networks",
      "Show translation of trends into actionable business insights and strategic recommendations",
      "Provide specific examples of anticipating and capitalizing on technological shifts",
      "Connect industry awareness to competitive advantage and organizational positioning"
    ];
  }

  if (questionText.includes('prioritize your work when everything seems urgent') || questionText.includes('everything seems urgent')) {
    return [
      "Use systematic prioritization frameworks that evaluate impact, dependencies, and strategic alignment",
      "Demonstrate transparent decision-making with clear rationale communicated to stakeholders",
      "Show ability to distinguish between true urgency and reactive pressure from stakeholders",
      "Balance short-term crisis management with long-term strategic objectives and team sustainability"
    ];
  }

  if (questionText.includes('ensure your team maintains high performance during periods of uncertainty') || questionText.includes('high performance during uncertainty')) {
    return [
      "Increase communication frequency while providing stability through consistent processes and leadership presence",
      "Connect daily work to stable long-term objectives that transcend temporary organizational changes",
      "Model calm decisive leadership by making controllable decisions while acknowledging external constraints",
      "Celebrate incremental progress and maintain team morale through visible support and career development focus"
    ];
  }

  if (questionText.includes('developing and mentoring high-potential team members') || questionText.includes('high-potential team members')) {
    return [
      "Create structured development plans with stretch assignments and cross-functional exposure opportunities",
      "Provide strategic business exposure beyond technical skills to accelerate leadership readiness",
      "Connect individuals with organizational mentors and networks to expand perspective and career opportunities",
      "Link individual development to succession planning and organizational capability building"
    ];
  }

  if (questionText.includes('setting and communicating goals for your team') || questionText.includes('communicating goals')) {
    return [
      "Balance organizational objectives with team input through collaborative goal-setting processes",
      "Break down larger objectives into weekly milestones with clear success criteria and regular check-ins",
      "Connect team goals to individual career development to create personal investment in outcomes",
      "Use multiple communication channels and visual dashboards to maintain visibility and accountability"
    ];
  }

  if (questionText.includes('lead a project or initiative with limited authority') || questionText.includes('limited authority')) {
    return [
      "Build influence through understanding stakeholder motivations and aligning project benefits with their objectives",
      "Establish value delivery and expertise demonstration rather than positional authority for gaining cooperation",
      "Create clear communication protocols and celebrate early wins to build momentum and stakeholder confidence",
      "Address resistance through direct engagement and solution modification rather than compliance enforcement"
    ];
  }

  if (questionText.includes('identified and drove a process improvement') || questionText.includes('process improvement')) {
    return [
      "Use data analysis to identify root causes rather than addressing symptoms of process inefficiencies",
      "Start with pilot implementations to demonstrate value before organization-wide rollout",
      "Customize solutions for different stakeholder needs while maintaining core process improvements",
      "Establish metrics and monitoring to track ongoing improvement and prevent regression"
    ];
  }

  if (questionText.includes('navigate organizational politics to achieve your objectives') || questionText.includes('organizational politics')) {
    return [
      "Treat organizational dynamics as coordination challenges requiring stakeholder interest understanding",
      "Build coalitions by demonstrating mutual benefit rather than competing for limited resources",
      "Maintain transparency in decision-making while addressing legitimate concerns from all perspectives",
      "Create advisory structures with stakeholder representation to ensure ongoing alignment and feedback"
    ];
  }

  if (questionText.includes('make an unpopular decision') || questionText.includes('unpopular decision')) {
    return [
      "Provide transparent rationale including business imperatives and comprehensive impact analysis",
      "Acknowledge emotional aspects while maintaining focus on organizational needs and long-term benefits",
      "Offer transition support and alternative solutions to minimize negative impact on affected stakeholders",
      "Use decisions as teaching opportunities about strategic thinking and organizational sustainability"
    ];
  }

  if (questionText.includes('manage a underperforming team member') || questionText.includes('underperforming team member')) {
    return [
      "Diagnose root causes through individual investigation before implementing performance management processes",
      "Balance empathy and support with clear accountability and protection of team performance standards",
      "Provide appropriate resources, mentoring, and adjusted responsibilities to enable improvement",
      "Document interactions and progress while maintaining fairness to both individual and team needs"
    ];
  }

  if (questionText.includes('make a difficult decision with incomplete information') || questionText.includes('incomplete information')) {
    return [
      "Gather available data quickly while consulting with subject matter experts for risk assessment",
      "Implement decisions with parallel contingency planning and rollback procedures to manage uncertainty",
      "Communicate transparently about information limitations and mitigation strategies to stakeholders",
      "Build organizational capabilities for better future decision-making through improved monitoring and documentation"
    ];
  }

  if (questionText.includes('adapt your leadership style for different team members') || questionText.includes('adapt your leadership style')) {
    return [
      "Assess individual experience levels, communication preferences, and motivational drivers for tailored approaches",
      "Provide appropriate levels of context, autonomy, and support based on individual needs and development stage",
      "Establish different communication rhythms and feedback approaches while maintaining consistent standards",
      "Leverage diverse working styles as team strength through strategic pairing and complementary role assignments"
    ];
  }

  if (questionText.includes('turn around a failing project or initiative') || questionText.includes('failing project')) {
    return [
      "Conduct comprehensive assessment including technical, stakeholder, and team analysis to identify root causes",
      "Redefine success criteria and establish realistic milestones based on current capabilities and constraints",
      "Focus on early wins and transparent progress reporting to rebuild stakeholder confidence",
      "Balance immediate delivery pressure with long-term sustainability and team development needs"
    ];
  }

  if (questionText.includes('build a business case for a new initiative') || questionText.includes('business case')) {
    return [
      "Quantify current costs and projected benefits with comprehensive data analysis and financial modeling",
      "Address potential objections proactively with risk assessment and mitigation strategies",
      "Include competitive analysis and strategic positioning to strengthen value proposition",
      "Provide multiple investment options with different scope and timeline trade-offs for executive flexibility"
    ];
  }

  if (questionText.includes('manage competing deadlines and resource constraints') || questionText.includes('competing deadlines and resource constraints')) {
    return [
      "Conduct stakeholder analysis to understand true constraints and consequences of different prioritization choices",
      "Develop multiple scenarios showing resource allocation strategies and their business implications",
      "Negotiate scope adjustments and additional resources while maintaining transparent communication about trade-offs",
      "Sequence work to maximize stakeholder value while identifying opportunities for parallel execution and efficiency gains"
    ];
  }

  // Stage 5 (Executive/Final Round) specific success factors
  if (questionText.includes('building high-performing teams and culture') || questionText.includes('high-performing teams')) {
    return [
      "Balance psychological safety with high performance standards and clear accountability measures",
      "Implement systematic talent development programs that scale individual and organizational capabilities",
      "Create transparent communication systems and career progression paths that retain exceptional talent",
      "Build diverse teams with complementary strengths while maintaining shared commitment to excellence and innovation"
    ];
  }

  if (questionText.includes('drive organizational change') || questionText.includes('organizational change')) {
    return [
      "Build coalition support through early wins and systematic expansion of successful practices",
      "Maintain transparent communication about progress, challenges, and plan adjustments throughout transformation",
      "Address both technical and cultural aspects with comprehensive training and knowledge transfer programs",
      "Demonstrate measurable value early and consistently while managing stakeholder concerns and resistance"
    ];
  }

  if (questionText.includes('balance short-term pressures with long-term strategic objectives') || questionText.includes('short-term pressures with long-term')) {
    return [
      "Use portfolio approach allocating resources across immediate, medium-term, and long-term strategic priorities",
      "Establish transparent stakeholder communication about trade-offs and consistent progress metrics across all horizons",
      "Implement quarterly reviews for priority adjustment while protecting minimum investment in strategic capabilities",
      "Ensure tactical decisions align with rather than compromise long-term strategic direction and competitive positioning"
    ];
  }

  if (questionText.includes('questions about our company culture and leadership philosophy') || questionText.includes('company culture and leadership')) {
    return [
      "Ask thoughtful questions about innovation processes, decision-making autonomy, and strategic alignment practices",
      "Inquire about talent development, risk-taking philosophy, and maintaining cultural DNA during organizational growth",
      "Understand how leadership stays connected to technical realities and customer needs at scale",
      "Assess cultural fit and growth opportunities while demonstrating genuine interest in organizational success"
    ];
  }

  if (questionText.includes('budget management and resource allocation') || questionText.includes('budget management')) {
    return [
      "Combine rigorous financial discipline with strategic flexibility using portfolio theory for investment allocation",
      "Implement zero-based budgeting for operational expenses and clear ROI metrics for strategic investments",
      "Establish quarterly reviews for resource reallocation based on changing priorities and emerging opportunities",
      "Maintain transparent stakeholder communication about trade-offs while tracking actual versus projected returns"
    ];
  }

  if (questionText.includes('measure success and what metrics matter most') || questionText.includes('measure success')) {
    return [
      "Use balanced scorecard capturing customer value, operational excellence, and organizational health metrics",
      "Focus on leading indicators that predict future performance alongside lagging indicators measuring results",
      "Connect metrics to strategic objectives ensuring short-term optimizations don't compromise long-term capabilities",
      "Implement regular stakeholder reviews for alignment and rapid course correction when performance diverges"
    ];
  }

  if (questionText.includes('building and maintaining relationships with key stakeholders') || questionText.includes('key stakeholders')) {
    return [
      "Map stakeholder interests and influence levels then establish appropriate communication rhythms for each relationship",
      "Adapt information depth and frequency based on different stakeholder decision-making styles and success criteria",
      "Build trust through consistent transparent communication and reliable follow-through on all commitments",
      "Invest time understanding stakeholder perspectives during decision-making to ensure broad organizational support"
    ];
  }

  if (questionText.includes('questions about our leadership team and company direction') || questionText.includes('leadership team and company direction')) {
    return [
      "Ask strategic questions about market opportunities, competitive challenges, and organizational positioning plans",
      "Understand decision-making processes for major initiatives and how leadership balances competing priorities",
      "Inquire about innovation philosophy, experimentation at scale, and connection to customer needs and technical realities",
      "Connect role expectations to broader strategic objectives while assessing mutual alignment and growth opportunities"
    ];
  }

  if (questionText.includes('philosophy on risk-taking and innovation') || questionText.includes('risk-taking and innovation')) {
    return [
      "Implement portfolio strategies balancing proven approaches with experimental initiatives using clear success criteria",
      "Create organizational cultures that reward intelligent failure and rapid learning from unsuccessful experiments",
      "Establish systematic innovation processes encouraging diverse perspectives and rapid customer feedback integration",
      "Balance innovation with operational excellence ensuring breakthrough capabilities don't compromise core business performance"
    ];
  }

  if (questionText.includes('career in the next 3-5 years') || questionText.includes('how does this role fit')) {
    return [
      "Articulate clear career progression from tactical execution to strategic organizational impact and business leadership",
      "Connect role opportunities to specific skill development goals and long-term leadership preparation needs",
      "Demonstrate understanding of company's strategic importance and how it accelerates professional growth",
      "Show commitment to mutual value creation rather than just using position as career stepping stone"
    ];
  }

  if (questionText.includes('influenced a major business decision or change') || questionText.includes('influenced a major business decision')) {
    return [
      "Build comprehensive business cases quantifying current constraints and projected benefits of proposed changes",
      "Address stakeholder concerns proactively while demonstrating viability through pilot projects and early wins",
      "Translate technical concepts into business impact facilitating stakeholder alignment and executive approval",
      "Connect technical improvements to measurable business value demonstrating strategic leadership capabilities"
    ];
  }

  if (questionText.includes('decision with significant business impact') || questionText.includes('significant business impact')) {
    return [
      "Conduct comprehensive analysis including technical feasibility, market implications, and opportunity cost evaluation",
      "Present multiple options with clear trade-offs enabling informed executive decision-making about priority and resources",
      "Manage team and stakeholder expectations while extracting valuable learning from discontinued initiatives",
      "Focus on long-term strategic positioning over short-term optimization or sunk cost considerations"
    ];
  }

  if (questionText.includes('contributing to our company\'s long-term strategic goals') || questionText.includes('long-term strategic goals')) {
    return [
      "Build technical capabilities creating sustainable competitive advantages while enabling rapid market opportunity response",
      "Develop organizational capabilities for consistent innovation and execution at pace required for market leadership",
      "Create technical assets and intellectual property providing structural advantages over competitors",
      "Connect technical initiatives to measurable business outcomes supporting revenue growth and market expansion"
    ];
  }

  if (questionText.includes('decisions align with company values and ethics') || questionText.includes('company values and ethics')) {
    return [
      "Implement systematic decision-making frameworks explicitly evaluating choices against company values and stakeholder impact",
      "Prioritize long-term organizational health and stakeholder trust over short-term convenience or optimization",
      "Address ethical concerns proactively through transparent communication and appropriate resource engagement",
      "Balance technical capabilities with user rights, privacy expectations, and broader community impact considerations"
    ];
  }

  if (questionText.includes('crisis management or handling unexpected challenges') || questionText.includes('crisis management')) {
    return [
      "Establish clear crisis response protocols with defined roles, communication channels, and decision-making authority",
      "Balance urgent containment actions with careful analysis ensuring proper regulatory and stakeholder notification",
      "Maintain transparent communication with stakeholders even when full situation details are unclear or evolving",
      "Extract valuable learning from crisis situations to improve preparation, response capabilities, and prevention measures"
    ];
  }

  // Stage 4 (Technical/Specialist Interview) specific success factors
  if (questionText.includes('stay current with emerging technologies') || questionText.includes('decide which ones to adopt')) {
    return [
      "Use structured evaluation framework assessing technical maturity, ecosystem support, and strategic alignment",
      "Balance innovation opportunities with practical delivery constraints and team learning curves",
      "Conduct proof-of-concept implementations to validate technology claims against real requirements",
      "Leverage industry relationships and community knowledge to understand real-world implementation experiences"
    ];
  }

  if (questionText.includes('debug a critical system failure') || questionText.includes('system failure')) {
    return [
      "Implement systematic debugging approach using distributed tracing and comprehensive diagnostic information collection",
      "Coordinate incident response with clear communication protocols and stakeholder updates",
      "Balance immediate mitigation actions with root cause analysis to prevent future occurrences",
      "Document findings and improve monitoring systems to enable faster detection and response"
    ];
  }

  if (questionText.includes('approach to solving a complex technical problem') || questionText.includes('complex technical problem')) {
    return [
      "Use systematic problem decomposition with comprehensive analysis of business context and technical constraints",
      "Implement iterative solution development with performance benchmarking and validation at each phase",
      "Maintain detailed documentation and conduct knowledge transfer to ensure team understanding",
      "Connect technical solutions to measurable business outcomes and long-term strategic goals"
    ];
  }

  if (questionText.includes('cloud platforms and DevOps practices') || questionText.includes('DevOps practices')) {
    return [
      "Demonstrate expertise across multiple cloud platforms with infrastructure-as-code and container orchestration",
      "Implement comprehensive security practices including infrastructure scanning and secret management",
      "Build self-service deployment platforms that scale with organizational growth while maintaining reliability",
      "Emphasize automation, observability, and developer experience in DevOps philosophy and implementation"
    ];
  }

  if (questionText.includes('balance technical excellence with business requirements') || questionText.includes('business requirements and deadlines')) {
    return [
      "Use risk-based approach categorizing technical decisions by business impact and implementation cost",
      "Communicate transparently about technical trade-offs and long-term implications to business stakeholders",
      "Document technical debt systematically and establish regular review sessions for continuous improvement",
      "Demonstrate reliability in delivering business objectives to build trust for technical excellence advocacy"
    ];
  }

  if (questionText.includes('technical documentation and knowledge sharing') || questionText.includes('knowledge sharing')) {
    return [
      "Create living documentation that evolves with systems using documentation-as-code practices",
      "Implement multiple documentation layers for different audiences: strategic, technical, and operational",
      "Combine formal documentation with informal knowledge transfer through pairing and review sessions",
      "Measure success through team onboarding time, incident resolution speed, and reduced knowledge dependencies"
    ];
  }

  if (questionText.includes('implement security best practices') || questionText.includes('security best practices')) {
    return [
      "Start with threat modeling to identify attack vectors and implement security-by-design principles",
      "Balance security requirements with user experience and development velocity through developer-friendly tools",
      "Implement comprehensive security practices including authentication, authorization, encryption, and monitoring",
      "Achieve compliance certifications while maintaining development agility through automation and training"
    ];
  }

  if (questionText.includes('learn a new technology quickly') || questionText.includes('new technology quickly')) {
    return [
      "Create structured learning plan balancing theoretical understanding with hands-on experimentation",
      "Engage with developer communities and subject matter experts to understand real-world implementation patterns",
      "Build proof-of-concept implementations to validate technical approaches and identify integration challenges",
      "Document learning process and conduct knowledge transfer to accelerate team understanding"
    ];
  }

  if (questionText.includes('integrate multiple systems or APIs') || questionText.includes('multiple systems or APIs')) {
    return [
      "Use event-driven architecture with message buses to enable loose coupling and resilient communication",
      "Implement dedicated adapter services handling API-specific concerns like rate limiting and data transformation",
      "Handle partial failures and maintain data consistency using patterns like Saga for distributed transactions",
      "Provide comprehensive monitoring and operational visibility into complex distributed workflows"
    ];
  }

  if (questionText.includes('ensure code quality and maintainability') || questionText.includes('code quality')) {
    return [
      "Implement comprehensive automated quality practices including static analysis, test coverage, and peer reviews",
      "Make quality tools fast and developer-friendly rather than burdensome obstacles to development velocity",
      "Establish team coding standards through collaborative sessions and regular architectural reviews",
      "Balance quality standards with development velocity by treating quality as enabler rather than overhead"
    ];
  }

  if (questionText.includes('complex technical problem you solved that others struggled with') || questionText.includes('others struggled with')) {
    return [
      "Use systematic investigation approach with comprehensive data collection and distributed tracing",
      "Recognize that distributed systems failures often result from subtle timing and ordering issues",
      "Implement solutions that handle network partitions, clock inconsistencies, and concurrent operations gracefully",
      "Document root causes and solutions to prevent similar issues and accelerate future problem resolution"
    ];
  }

  if (questionText.includes('refactor legacy code or systems') || questionText.includes('legacy code')) {
    return [
      "Use strangler fig pattern for gradual extraction while maintaining business continuity and data consistency",
      "Start with comprehensive system analysis to understand data flows, business logic, and integration points",
      "Prioritize extraction based on business impact and technical complexity with comprehensive testing",
      "Implement feature flags and monitoring to enable safe migration with immediate rollback capabilities"
    ];
  }

  if (questionText.includes('database design and optimization') || questionText.includes('database optimization')) {
    return [
      "Choose appropriate technologies for different access patterns using lambda architecture for hot and cold data",
      "Implement intelligent indexing strategies, materialized views, and query result caching for performance",
      "Design for horizontal scalability from the beginning with automated partition management",
      "Establish comprehensive monitoring for query performance and implement automated optimization strategies"
    ];
  }

  if (questionText.includes('optimize system performance or scalability') || questionText.includes('performance or scalability')) {
    return [
      "Conduct systematic performance profiling to identify actual bottlenecks rather than assumed problems",
      "Implement architectural redesign for scalability including pre-computed embeddings and distributed caching",
      "Use comprehensive monitoring with distributed tracing and custom metrics for visibility into all components",
      "Validate optimizations through performance benchmarking and gradual rollout with monitoring"
    ];
  }

  if (questionText.includes('testing strategies and quality assurance') || questionText.includes('testing strategies')) {
    return [
      "Implement comprehensive testing pyramid including unit, integration, and end-to-end tests with clear coverage goals",
      "Use property-based testing for complex calculations and chaos engineering for system resilience validation",
      "Establish automated testing in CI/CD pipelines with quality gates preventing deployment of inadequate code",
      "Treat testing as strategic investment in system reliability rather than development overhead"
    ];
  }

  // Default success factors for unmatched questions
  return [
    "Use specific examples with quantifiable outcomes and clear business impact",
    "Show systematic approach connecting situation, action, and measurable results",
    "Demonstrate stakeholder management and transparent communication throughout the process",
    "Connect experience directly to the company's specific challenges and strategic objectives"
  ];
}

// Functional/Team Interview specific answers
function getFunctionalTeamAnswer(questionText: string, company: string, position: string): string {
  if (questionText.includes('tell me about yourself')) {
    return `I'm a collaborative ${position} with 5+ years of experience building cross-functional partnerships and delivering team-based solutions. What drives me in team environments is the opportunity to combine diverse perspectives into breakthrough outcomes. In my current role, I work closely with product managers, designers, and other engineers to transform complex requirements into scalable solutions. For example, I recently led a cross-functional initiative that improved our deployment pipeline, reducing release cycles by 40% while increasing team productivity. What excites me about ${company} is your reputation for fostering collaborative innovation and empowering teams to take ownership of end-to-end solutions. I thrive in environments where knowledge sharing and collective problem-solving drive results, and I'm particularly drawn to how ${company} structures teams around shared outcomes rather than just individual contributions.`;
  }

  if (questionText.includes('collaborate with cross-functional teams') || (questionText.includes('cross-functional') && questionText.includes('deliver'))) {
    return `I recently led a cross-functional project to launch a customer onboarding platform that required close collaboration with product, design, data analytics, and customer success teams. The challenge was coordinating multiple stakeholders with different priorities and timelines while ensuring technical feasibility. My approach involved establishing clear communication protocols from day one: I set up weekly alignment meetings, created shared documentation spaces, and implemented milestone checkpoints that kept everyone informed of progress and blockers. When the design team proposed user flows that would require complex backend changes, I facilitated joint technical sessions where we explored alternative approaches that achieved the user experience goals while maintaining system performance. The result was a 40% improvement in customer activation rates and 25% reduction in support tickets. The key success factors were early stakeholder alignment, transparent communication about technical constraints, and building trust through consistent delivery on commitments. This experience reinforced my belief that successful cross-functional projects require both strong technical execution and the ability to translate complex requirements into shared understanding across diverse teams.`;
  }

  if (questionText.includes('describe your experience working') && (questionText.includes('cross-functional') || questionText.includes('teams'))) {
    return `I've had extensive experience working in cross-functional environments, particularly in a recent project where I collaborated with product, design, marketing, and data teams to launch a new feature that increased user engagement by 35%. My approach to cross-functional work focuses on three key areas: first, establishing clear communication channels and shared vocabulary so technical and non-technical stakeholders can collaborate effectively; second, creating transparent progress tracking that keeps everyone aligned on timelines and dependencies; and third, proactively identifying and addressing potential conflicts before they impact delivery. For instance, when our design team proposed a feature that would require significant backend changes, I facilitated technical design sessions that helped us find a solution that met user experience goals while maintaining system performance. I've learned that successful cross-functional collaboration requires both strong technical skills and the ability to translate complex concepts into business terms that drive decision-making.`;
  }

  if (questionText.includes('disagreed with a team decision') || questionText.includes('disagree')) {
    return `I encountered a situation where our team decided to implement a feature using a third-party service that I believed would create long-term technical debt and potential security vulnerabilities. Rather than simply voicing opposition, I took a constructive approach: I first made sure I fully understood the reasoning behind the decision by asking clarifying questions about the timeline pressures and business requirements driving it. Then I prepared a comprehensive analysis comparing the proposed approach with alternatives, including implementation timelines, maintenance costs, and risk assessments. I presented this analysis to the team, not as criticism of their decision, but as additional data to inform our choice. I also proposed a hybrid solution that could meet the immediate business needs while providing a migration path to a more sustainable long-term architecture. The team appreciated the thorough analysis and we ultimately adopted the hybrid approach, which allowed us to ship on time while avoiding the technical debt I was concerned about. This experience taught me that disagreement can strengthen team decisions when it's based on data, presented constructively, and focused on achieving the best outcome for the project.`;
  }

  if (questionText.includes('handle disagreements') || questionText.includes('conflict')) {
    return `I approach team disagreements as opportunities to find better solutions through diverse perspectives. In my experience, most conflicts arise from misaligned priorities or incomplete information rather than fundamental incompatibilities. I use a structured approach: first, I ensure everyone's perspective is heard and understood by facilitating open dialogue; second, I focus on identifying shared objectives and success criteria; third, I work with the team to evaluate options based on data and business impact rather than personal preferences. For example, when our team disagreed about architectural approaches for a high-traffic feature, I organized a technical design review where each approach was evaluated against performance, maintainability, and timeline criteria. This led us to a hybrid solution that incorporated the best elements of both proposals. The key is maintaining focus on team goals while respecting individual expertise and creating an environment where disagreement leads to better outcomes rather than interpersonal tension.`;
  }

  if (questionText.includes('motivate') || questionText.includes('team members')) {
    return `I believe motivation comes from connecting individual contributions to meaningful team outcomes and providing opportunities for growth and recognition. My approach involves understanding what drives each team member personally and professionally, then creating opportunities for them to leverage their strengths while developing new skills. For instance, I mentored a junior developer who was interested in system architecture by involving them in design discussions and gradually increasing their responsibility for architectural decisions. I also establish team rituals that celebrate both individual achievements and collective milestones - like code review sessions that focus on learning, or retrospectives that highlight how each person's contributions moved us toward our goals. When team members feel that their work has impact and that they're growing professionally, motivation follows naturally. I also make sure to provide constructive feedback regularly and advocate for team members' career advancement opportunities within the organization.`;
  }

  if (questionText.includes('give difficult feedback') || questionText.includes('difficult feedback')) {
    return `I had to give difficult feedback to a senior colleague who was consistently missing deadlines and impacting team morale. Rather than letting the situation continue, I scheduled a private one-on-one conversation in a neutral setting. I prepared by documenting specific instances and their impacts, focusing on behaviors rather than personal characteristics. I opened the conversation by acknowledging their expertise and contributions, then clearly outlined the specific concerns with concrete examples. I listened to their perspective and discovered they were overwhelmed with competing priorities from multiple stakeholders. Together, we developed a plan that included better priority alignment with their manager, clearer deadline communication, and regular check-ins to ensure support. The key was maintaining respect for their dignity while being direct about the impact on team performance. Over the following months, their performance improved significantly, and they thanked me for addressing the issues constructively rather than letting them persist.`;
  }

  if (questionText.includes('deliver bad news') || questionText.includes('bad news')) {
    return `I had to inform my team that a major feature we'd been working on for three months would be deprioritized due to shifting business requirements. I knew this would be demoralizing, so I prepared carefully. I first met with each team member individually to deliver the news personally and answer questions, then held a team meeting to discuss next steps. I was transparent about the business reasons while acknowledging their disappointment and validating their hard work. I emphasized that the technical foundation they built would be valuable for future projects and worked with product management to ensure team members got recognition for their contributions. I also immediately pivoted to discussing exciting upcoming projects where their skills would be crucial. The key was combining honesty about the situation with clear action plans for moving forward, ensuring the team felt supported rather than abandoned during the transition.`;
  }

  if (questionText.includes('onboard new team members') || questionText.includes('help them integrate')) {
    return `My onboarding approach focuses on both technical ramp-up and cultural integration. I create a structured 30-60-90 day plan that includes technical training, codebase familiarization, and gradual responsibility increases. In the first week, I pair new members with experienced teammates for shadowing and code reviews, ensuring they understand our development practices and team dynamics. I also schedule informal coffee chats with various team members to help them build relationships across different functions. For example, when onboarding a new engineer, I started with small, well-defined tasks that touched multiple parts of our system, helping them understand architecture while contributing meaningfully. I maintained weekly one-on-ones to address questions and adjust the plan based on their progress. By month three, they were leading feature development and mentoring newer team members. The key is balancing structure with flexibility, ensuring new members feel supported while gradually building their autonomy and confidence.`;
  }

  if (questionText.includes('coordinate multiple stakeholders') || questionText.includes('competing priorities')) {
    return `I managed a complex project involving engineering, product, design, marketing, and customer success teams, each with different timeline expectations and success metrics. The challenge was aligning five different stakeholder groups around a single delivery plan while managing competing resource demands. I started by conducting individual stakeholder interviews to understand their constraints, priorities, and success criteria. Then I facilitated a series of alignment workshops where we mapped dependencies, identified conflicts, and established shared success metrics. I created a visual project roadmap that showed how each team's contributions connected to the overall outcome and implemented weekly cross-functional standups to maintain alignment. When marketing requested an earlier launch date that conflicted with engineering quality standards, I facilitated a data-driven discussion about risk trade-offs that led to a compromise timeline with staged feature releases. The project delivered on time with all stakeholders feeling their priorities were addressed, demonstrating that transparent communication and collaborative problem-solving can align even competing interests.`;
  }

  if (questionText.includes('successful team project') || questionText.includes('your specific role')) {
    return `I contributed to a team project that redesigned our customer onboarding flow, resulting in a 45% increase in user activation rates. My specific role was technical lead for the backend systems and cross-functional liaison with the data and product teams. I was responsible for architecting the new user journey tracking system, implementing A/B testing infrastructure, and ensuring seamless integration with existing customer success tools. Beyond the technical contributions, I facilitated weekly technical reviews where we evaluated progress against success metrics and identified potential risks. When we discovered that our initial design couldn't handle peak traffic loads, I led the team through a rapid redesign that maintained the user experience goals while improving system scalability. I also created comprehensive documentation and conducted knowledge transfer sessions to ensure the entire team could maintain and extend the system. The project's success came from combining individual expertise with collaborative problem-solving, and my role demonstrated how technical leadership includes both hands-on contribution and team enablement.`;
  }

  if (questionText.includes('difficult team member') || questionText.includes('work with a difficult')) {
    return `I worked with a team member who was technically skilled but frequently dismissed others' ideas and created tension during meetings. Rather than avoiding the situation, I took a systematic approach to understand and address the behavior. First, I scheduled a private conversation to understand their perspective and discovered they felt their expertise wasn't being properly recognized. I acknowledged their technical contributions while explaining how their communication style was impacting team dynamics and decision-making effectiveness. I worked with them to develop strategies for sharing their expertise in more collaborative ways, such as leading technical deep-dive sessions and mentoring junior team members. I also modified our team meeting structure to include more structured technical discussions where their knowledge could shine. Over time, they became one of our most effective technical mentors and their communication style became more inclusive. The key was addressing the behavior while recognizing and channeling their strengths in ways that benefited the entire team.`;
  }

  if (questionText.includes('effective communication') && questionText.includes('remote')) {
    return `Leading a distributed team across three time zones, I developed structured communication practices that ensured information sharing and team cohesion. I established core overlap hours for synchronous collaboration and used asynchronous communication tools effectively for continuous progress. Our daily standups became brief video check-ins with written summaries for those who couldn't attend live, and I implemented detailed documentation practices so context was never lost. I also created virtual coffee chat sessions and online team building activities to maintain personal connections. When a critical issue arose requiring immediate collaboration, I coordinated follow-the-sun handoffs where team members in different time zones could continue progress seamlessly. I made sure to rotate meeting times so no single time zone was always inconvenienced, and used collaborative tools like shared whiteboards and pair programming sessions to maintain the creative energy of in-person collaboration. The result was a team that performed as cohesively as any co-located team, with the added advantage of diverse perspectives and extended working hours.`;
  }

  if (questionText.includes('advocate for your team') || questionText.includes('senior management')) {
    return `When our team's technical debt reduction work was being deprioritized in favor of new features, I advocated to senior management for dedicated engineering time to address infrastructure issues. I prepared a comprehensive business case that translated technical concerns into business impact: I quantified how technical debt was slowing feature delivery by 30% and increasing bug rates, costing the company approximately $200K in engineering productivity quarterly. I presented three options with different time investments and ROI projections, recommending a balanced approach that addressed critical issues while maintaining feature velocity. I also brought in customer success data showing how infrastructure instability was affecting user satisfaction. During the presentation, I emphasized how technical debt reduction would accelerate future product development and reduce operational costs. Senior management approved a 20% time allocation for infrastructure work, resulting in improved system reliability and 25% faster feature delivery within six months. The key was speaking the language of business impact while maintaining technical credibility and providing actionable options rather than just identifying problems.`;
  }

  if (questionText.includes('building trust') || questionText.includes('new team')) {
    return `When joining a new team as a senior engineer, I focused on building trust through consistent delivery and transparent communication. I started by listening more than speaking, taking time to understand existing team dynamics, processes, and individual working styles before suggesting changes. I made sure to follow through on every commitment, no matter how small, and proactively communicated when timelines or deliverables might be affected. I also shared my knowledge openly through code reviews, technical discussions, and informal mentoring without being condescending. When I disagreed with technical decisions, I presented alternative approaches with data and reasoning rather than just criticism. I made sure to give credit to others' ideas and contributions publicly, especially in meetings with leadership. Within the first month, I had earned enough trust that team members began seeking my input on technical decisions and process improvements. The foundation of trust enabled us to have more honest discussions about challenges and opportunities, ultimately leading to significantly improved team performance and job satisfaction.`;
  }

  if (questionText.includes('mentoring') || questionText.includes('teammates who are struggling')) {
    return `I mentored a junior developer who was struggling with code quality and confidence in technical discussions. Rather than just providing solutions, I focused on developing their problem-solving skills and technical reasoning. I started by pairing with them on complex tasks, thinking out loud about my approach and asking questions that guided them toward solutions. I also established regular code review sessions where we examined both their code and production examples, discussing trade-offs and best practices. When they felt intimidated speaking up in technical meetings, I created smaller group discussions where they could practice presenting ideas and gradually built their confidence. I also connected them with other team members who had complementary expertise, expanding their learning network beyond just me. Over six months, their code quality improved dramatically and they began contributing innovative solutions to team discussions. They eventually became a mentor themselves, demonstrating how effective mentoring creates a multiplier effect across the team. The key was patient, consistent support that built their capabilities rather than creating dependency.`;
  }

  if (questionText.includes('step outside your comfort zone') || questionText.includes('help your team')) {
    return `When our team faced a critical customer issue that required domain expertise in machine learning (outside my usual backend focus), I volunteered to lead the investigation despite my limited ML background. The customer was experiencing inconsistent recommendation quality that was affecting their revenue, and our ML engineer was unavailable due to a family emergency. I spent the weekend learning about our recommendation algorithms and debugging tools, then collaborated with our data science team to understand the issue. I discovered that recent changes to our data pipeline were causing feature drift in the model inputs. While I couldn't fix the ML model directly, I coordinated with data engineering to restore data quality and worked with customer success to implement a temporary workaround. I also documented the entire debugging process and created monitoring alerts to prevent similar issues. By stepping outside my comfort zone, I not only helped resolve a critical customer issue but also gained valuable cross-functional knowledge that made me more effective in future projects involving ML systems.`;
  }

  if (questionText.includes('agile') || questionText.includes('fast-paced environments')) {
    return `In our transition to agile development, I helped establish practices that balanced speed with quality and sustainability. I advocated for proper estimation techniques, retrospective processes, and continuous improvement practices that prevented agile from becoming just "moving fast without thinking." During sprint planning, I ensured technical debt and infrastructure work were included alongside feature development, preventing the accumulation of shortcuts that slow teams down over time. I also implemented automated testing and deployment practices that enabled rapid iteration without sacrificing quality. When stakeholders requested scope changes mid-sprint, I facilitated discussions about trade-offs and impact, helping the team maintain focus while remaining responsive to business needs. I led retrospectives that focused on process improvements rather than just identifying problems, resulting in increased team velocity and job satisfaction. The key was understanding that sustainable agility requires discipline and continuous improvement, not just speed, and helping the team develop practices that supported both rapid delivery and long-term success.`;
  }

  if (questionText.includes('different working styles') || questionText.includes('team members have different')) {
    return `I managed a team with diverse working styles: one member preferred detailed upfront planning, another thrived with flexible, iterative approaches, and a third needed frequent check-ins for confidence. Rather than enforcing a single approach, I adapted our processes to accommodate different styles while maintaining team cohesion. I established flexible planning sessions where detail-oriented members could contribute comprehensive specifications while iterative workers could identify areas for experimentation. I created multiple communication channels - scheduled check-ins for those who needed structure, and informal availability for those who preferred organic collaboration. For example, during a complex feature development, I paired the detailed planner with the iterative developer, which resulted in well-architected solutions that could adapt to changing requirements. I also ensured that introverted team members had written channels to contribute ideas, while giving extroverted members opportunities to lead discussions. The key was recognizing that diversity in working styles is a strength when properly managed, leading to more robust solutions and a team where everyone could contribute their best work.`;
  }

  if (questionText.includes('communication') && questionText.includes('stakeholders')) {
    return `Effective stakeholder communication requires adapting your message to your audience while maintaining technical accuracy and business relevance. I use a layered approach: executive summaries that focus on business impact and resource requirements, technical deep-dives for engineering stakeholders, and progress updates that keep everyone informed without overwhelming them with unnecessary detail. For example, when communicating about a performance optimization project, I provided executives with metrics on user experience improvements and cost savings, gave the engineering team technical details about implementation approaches, and kept product managers informed about feature delivery impacts. I also establish regular communication rhythms - like weekly stakeholder updates and monthly architectural reviews - that prevent surprises and maintain alignment. The key is proactive communication that anticipates stakeholder needs and provides the right level of detail for decision-making.`;
  }

  return `Based on my experience in collaborative ${position} roles, I approach this by leveraging team dynamics and cross-functional partnerships. I focus on building consensus through data-driven discussions and ensuring all stakeholders understand both the technical and business implications. My methodology emphasizes transparent communication, shared accountability, and iterative improvement based on team feedback. This collaborative approach has consistently delivered results that exceed individual capabilities and align with ${company}'s team-oriented culture.`;
}

// Hiring Manager Interview specific answers
function getHiringManagerAnswer(questionText: string, company: string, position: string): string {
  if (questionText.includes('stay informed about industry trends') || questionText.includes('industry trends and their potential impact')) {
    return `I maintain strategic awareness through a multi-layered approach combining formal research, industry networking, and practical experimentation. I subscribe to key industry publications, attend quarterly conferences, and participate in technology leadership forums where I can engage with peers facing similar challenges. I also establish relationships with analysts and vendors who provide insights into emerging trends and their business implications. More importantly, I translate this knowledge into actionable insights for our organization. For example, when I identified the shift toward edge computing through industry research, I initiated a pilot project that demonstrated 40% latency improvements for our mobile applications. I then worked with product and business teams to develop a roadmap that positioned us ahead of competitors. I also created a monthly "Technology Radar" presentation for executive leadership that connects industry trends to our strategic priorities, ensuring we can anticipate and capitalize on technological shifts rather than react to them.`;
  }

  if (questionText.includes('prioritize your work when everything seems urgent') || questionText.includes('everything seems urgent')) {
    return `When facing competing urgent demands, I use a systematic prioritization framework that evaluates impact, dependencies, and strategic alignment. I start by categorizing requests into business-critical, customer-impacting, and strategic initiatives, then assess each against our quarterly objectives and long-term goals. I also analyze dependencies to identify which items enable or block other work. For instance, during a period when we faced simultaneous customer escalations, feature deadlines, and infrastructure failures, I created a decision matrix that weighted customer impact, revenue implications, and technical risk. This revealed that addressing the infrastructure issues first would prevent cascading problems and enable faster resolution of other issues. I communicated this analysis to stakeholders, showing how the prioritization served everyone's interests. I also established weekly prioritization reviews with key stakeholders to ensure alignment and adjust priorities as new information emerges. The key is making prioritization decisions transparent and data-driven rather than reactive to whoever spoke last.`;
  }

  if (questionText.includes('ensure your team maintains high performance during periods of uncertainty') || questionText.includes('high performance during uncertainty')) {
    return `During uncertain periods, I focus on providing stability through clear communication, consistent processes, and visible leadership presence. I increase communication frequency with both individual check-ins and team meetings, ensuring everyone understands what we know, what we don't know, and how decisions will be made as information becomes available. I also maintain team motivation by connecting daily work to stable, long-term objectives that transcend temporary uncertainties. For example, during a major organizational restructuring, I kept my team focused on technical excellence and customer value creation while being transparent about the changes happening around us. I established additional mentoring relationships to ensure team members felt supported in their career development despite organizational uncertainty. I also celebrated small wins more frequently to maintain positive momentum. Most importantly, I modeled calm, decisive leadership by making the decisions I could make while acknowledging what was outside our control. This approach resulted in the team actually improving performance during the uncertainty period, demonstrating resilience that strengthened our reputation across the organization.`;
  }

  if (questionText.includes('developing and mentoring high-potential team members') || questionText.includes('high-potential team members')) {
    return `My approach to developing high-potential talent focuses on providing challenging opportunities, strategic exposure, and structured growth paths that accelerate their leadership readiness. I start by understanding each individual's career aspirations and identifying gaps between their current capabilities and their goals. I then create development plans that include stretch assignments, cross-functional exposure, and leadership opportunities within safe-to-fail environments. For instance, I identified a senior engineer with strong technical skills but limited business exposure and gradually involved them in product planning meetings, customer conversations, and business case development. I also facilitated their presentation of technical recommendations to executive leadership, coaching them on communication strategies. Additionally, I connected them with mentors across the organization to expand their network and perspective. Within 18 months, they successfully transitioned to a technical product manager role. I also establish regular feedback cycles and ensure high-potential team members understand how their development connects to organizational succession planning, creating motivation through clear career progression opportunities.`;
  }

  if (questionText.includes('setting and communicating goals for your team') || questionText.includes('communicating goals')) {
    return `I approach goal-setting as a collaborative process that balances organizational objectives with team input and individual development needs. I start with company and department OKRs, then work with the team to understand how our work contributes to these broader goals while identifying opportunities for innovation and improvement. I facilitate goal-setting sessions where team members contribute ideas and take ownership of specific outcomes. For example, when setting quarterly goals for a platform reliability initiative, I involved engineers in defining both the technical metrics and the business impact measurements, ensuring they understood the "why" behind our work. I then break down larger goals into weekly milestones with clear success criteria and regular check-in points. I communicate goals through multiple channels - team meetings, individual one-on-ones, and written documentation - and ensure they're visible through dashboards and regular progress updates. I also connect individual goals to career development opportunities, showing team members how achieving team objectives advances their personal growth. The key is making goals meaningful, achievable, and clearly connected to both business value and individual success.`;
  }

  if (questionText.includes('lead a project or initiative with limited authority') || questionText.includes('limited authority')) {
    return `Leading without formal authority requires building influence through expertise, relationship-building, and demonstrating value to stakeholders. I focus on understanding what motivates each stakeholder and aligning project benefits with their individual and organizational objectives. For instance, I led a cross-team security initiative where I had no direct authority over the participating engineers. I started by conducting individual meetings with each team lead to understand their constraints, priorities, and concerns about security work. I then developed a project plan that showed how security improvements would reduce each team's operational burden and improve their feature delivery velocity. I also established clear communication protocols, regular progress updates, and celebrated early wins publicly to build momentum. When resistance emerged, I addressed concerns directly and modified approaches based on feedback rather than trying to enforce compliance. By the project's end, we had improved security posture by 60% and established ongoing practices that teams voluntarily maintained. The key was treating influence as earned through value delivery rather than demanded through position.`;
  }

  if (questionText.includes('identified and drove a process improvement') || questionText.includes('process improvement')) {
    return `I identified inefficiencies in our incident response process where coordination delays were extending mean time to resolution by 40%. The existing process involved manual escalation chains and ad-hoc communication during critical outages. I analyzed six months of incident data and discovered that communication overhead, not technical complexity, was the primary driver of resolution delays. I proposed an automated incident response system that integrated our monitoring tools with communication platforms and established clear role assignments. To drive adoption, I started with a pilot during non-critical incidents, demonstrating improved coordination and faster resolution times. I also created training materials and ran simulation exercises to ensure team comfort with the new process. When a major incident occurred during the pilot period, the new process reduced resolution time from 4 hours to 45 minutes, providing compelling evidence for organization-wide adoption. I worked with other engineering teams to customize the process for their specific needs and established metrics to track ongoing improvement. The initiative resulted in 65% faster incident resolution and became a model for process improvement across the engineering organization.`;
  }

  if (questionText.includes('navigate organizational politics to achieve your objectives') || questionText.includes('organizational politics')) {
    return `I approach organizational dynamics by focusing on stakeholder interests, building coalitions around shared objectives, and maintaining transparency in decision-making processes. Rather than viewing politics as obstacles, I see them as information about different perspectives and priorities that need to be understood and addressed. For instance, when advocating for a major architectural modernization that required significant resource investment, I identified that different departments had legitimate concerns about timeline, cost, and risk. I spent time understanding each stakeholder's perspective, then developed a proposal that addressed their concerns while advancing the technical objectives. I created a coalition by showing finance how the modernization would reduce operational costs, demonstrating to product teams how it would accelerate feature delivery, and assuring operations teams that migration would be incremental and low-risk. I also established an advisory committee with representatives from each stakeholder group to ensure ongoing alignment and feedback. By treating organizational dynamics as coordination challenges rather than political battles, I was able to secure executive approval and cross-functional support for a successful 18-month modernization effort.`;
  }

  if (questionText.includes('make an unpopular decision') || questionText.includes('unpopular decision')) {
    return `I had to make the decision to discontinue a popular internal tool that the engineering team had developed and used extensively, because it was becoming a security liability and maintenance burden that was diverting resources from customer-facing features. Despite the team's emotional attachment to the tool, security audits revealed critical vulnerabilities, and maintenance was consuming 20% of our engineering capacity. I started by transparently sharing the security assessment and opportunity cost analysis, showing how continued investment in the internal tool was impacting our ability to deliver customer value. I acknowledged the team's pride in their creation while explaining the business and security imperatives. I also provided a migration path to commercial alternatives and allocated time for proper knowledge transfer. To ease the transition, I worked with team members to identify aspects of the internal tool that could be contributed to open-source projects, preserving their work's legacy. I also used the decision as a teaching moment about technical debt and lifecycle management. While initially unpopular, the decision freed up significant engineering capacity that enabled us to accelerate feature delivery by 30%, ultimately validating the difficult choice and strengthening team trust in leadership decision-making.`;
  }

  if (questionText.includes('manage a underperforming team member') || questionText.includes('underperforming team member')) {
    return `I managed a senior engineer whose performance had declined significantly, impacting both code quality and team morale. Rather than immediately implementing formal performance management, I started with diagnosis to understand the root causes. Through regular one-on-ones, I discovered they were struggling with personal issues that were affecting focus and motivation. I worked with HR to provide appropriate support resources while establishing clear, achievable performance expectations with regular check-in points. I also adjusted their responsibilities temporarily, focusing on areas where they could succeed while providing additional mentoring for areas of struggle. I paired them with a strong technical mentor and ensured they had the tools and training needed to meet expectations. I documented all interactions and progress clearly, both to support the individual and to maintain team fairness. Over four months, their performance gradually improved, and they became a productive team member again. However, I also maintained clear standards and timelines, prepared to escalate to formal performance improvement if necessary. The key was balancing empathy and support with accountability and team protection, demonstrating that management involves both developing talent and maintaining performance standards.`;
  }

  if (questionText.includes('make a difficult decision with incomplete information') || questionText.includes('incomplete information')) {
    return `During a critical system outage affecting major customers, I had to decide whether to implement a rapid fix with unknown side effects or pursue a comprehensive diagnosis that would extend downtime. We had partial information suggesting a database configuration issue, but the root cause analysis would require additional hours while customers remained impacted. I gathered the available data, consulted with senior engineers, and assessed the risk profile of each option. I decided to implement the rapid fix while simultaneously preparing rollback procedures and continuing diagnostic work in parallel. I communicated transparently with stakeholders about the uncertainty and our mitigation strategies. The rapid fix resolved the immediate issue, and subsequent analysis confirmed our diagnosis was correct. However, I also established post-incident reviews to improve our diagnostic capabilities and reduce future dependence on incomplete information decisions. I created runbooks for similar scenarios and invested in better monitoring tools to provide more complete system visibility. The key was making the best decision possible with available information while building capabilities to reduce future uncertainty and managing risk through preparation and communication.`;
  }

  if (questionText.includes('adapt your leadership style for different team members') || questionText.includes('adapt your leadership style')) {
    return `I adapt my leadership approach based on individual team members' experience levels, communication preferences, and motivational drivers. For example, I managed a diverse team including a detail-oriented senior engineer who needed comprehensive context, a high-performing junior developer who thrived on autonomy, and an experienced team lead who preferred strategic discussions. With the senior engineer, I provided detailed background information and collaborative decision-making opportunities, ensuring they understood the broader context and felt their expertise was valued. For the junior developer, I established clear objectives with creative freedom in implementation, providing support when requested but avoiding micromanagement that would stifle their growth. With the team lead, I focused our interactions on strategic alignment and organizational challenges, treating them as a leadership partner rather than a direct report. I also adjusted communication styles - some team members preferred written documentation while others worked better with verbal discussions. I established different meeting rhythms and feedback approaches based on individual preferences while maintaining consistent expectations and standards. This adaptive approach resulted in higher engagement and performance across the team, demonstrating that effective leadership requires flexibility while maintaining core principles of clarity, support, and accountability.`;
  }

  if (questionText.includes('turn around a failing project or initiative') || questionText.includes('failing project')) {
    return `I inherited a customer onboarding platform project that was six months behind schedule, 40% over budget, and had significant quality issues. The team was demoralized, stakeholders had lost confidence, and there was discussion of project cancellation. I started with a comprehensive assessment including technical debt analysis, stakeholder interviews, and team retrospectives to understand root causes. I discovered that unclear requirements, technical complexity underestimation, and insufficient testing had created a cascade of problems. I worked with stakeholders to redefine success criteria and establish realistic milestones based on current capabilities. I also restructured the team, bringing in additional expertise for critical areas and implementing better project management practices. Most importantly, I focused on rebuilding confidence through early wins - we shipped a minimal viable version that addressed core user needs within six weeks. I established regular stakeholder communication and transparent progress reporting that demonstrated steady improvement. Over the following months, we delivered a successful platform that improved customer activation by 35% and became a foundation for subsequent product features. The turnaround required balancing immediate delivery pressure with long-term sustainability, ultimately creating both project success and team growth.`;
  }

  if (questionText.includes('build a business case for a new initiative') || questionText.includes('business case')) {
    return `I developed a business case for implementing automated testing infrastructure that required a $300K investment and six months of engineering time. The challenge was demonstrating ROI for infrastructure work that wouldn't immediately produce customer-visible features. I gathered comprehensive data on our current testing practices, including time spent on manual testing, bug rates in production, and customer impact of quality issues. I quantified the current costs: manual testing consumed 25% of engineering time, production bugs required an average of 12 hours to resolve, and quality issues were affecting customer satisfaction scores. I then projected the benefits of automated testing: 60% reduction in manual testing time, 40% reduction in production bugs, and improved feature velocity through faster feedback cycles. I created financial models showing break-even within 12 months and $500K annual savings thereafter. I also addressed potential objections by outlining implementation risks and mitigation strategies. To strengthen the case, I included competitive analysis showing how automated testing enabled faster innovation cycles. I presented multiple investment options with different scope and timeline trade-offs, giving executives flexibility in decision-making. The business case was approved, and the infrastructure investment delivered the projected benefits, validating the analysis and establishing credibility for future technical initiatives.`;
  }

  if (questionText.includes('manage competing deadlines and resource constraints') || questionText.includes('competing deadlines and resource constraints')) {
    return `I faced simultaneous demands for a customer-critical security fix, a promised product feature for a major client, and infrastructure work needed to prevent system scalability issues. Each had legitimate urgency, but we only had 60% of the engineering capacity needed to address all three simultaneously. I started by conducting stakeholder meetings to understand the true constraints and consequences of each option. I discovered that the security fix was mandatory but could be scoped to minimal viable implementation, the product feature was contractually committed but had some flexibility in specific requirements, and the infrastructure work was critical but could be phased. I developed multiple scenarios showing different resource allocation strategies and their business implications. Working with stakeholders, we agreed on a sequence that prioritized the security fix, implemented the core product feature requirements with follow-up enhancements, and began infrastructure work that could be completed in parallel. I also negotiated additional resources from other teams for the security work and adjusted feature scope to focus on highest-value components. Throughout the process, I maintained transparent communication about trade-offs and progress. All three initiatives were successfully completed within acceptable timeframes, demonstrating that resource constraints can be managed through stakeholder collaboration and creative problem-solving.`;
  }

  return `As someone moving into more senior ${position} responsibilities, I focus on combining technical excellence with business leadership. I approach this by establishing clear strategic vision, building high-performing teams, and ensuring technical decisions drive measurable business value. My methodology emphasizes stakeholder alignment, data-driven decision making, and creating organizational capabilities that scale beyond individual contributions. This leadership approach aligns well with ${company}'s focus on both technical innovation and business results.`;
}

// Technical/Specialist Interview specific answers
function getTechnicalSpecialistAnswer(questionText: string, company: string, position: string): string {
  if (questionText.includes('stay current with emerging technologies') || questionText.includes('decide which ones to adopt')) {
    return `I maintain technical currency through a structured approach combining continuous learning with practical experimentation. I allocate 20% of my time to exploring emerging technologies through industry publications, conference presentations, and hands-on prototyping. My evaluation framework assesses new technologies against five criteria: technical maturity, ecosystem support, team learning curve, business alignment, and long-term strategic value. For example, when evaluating Rust for performance-critical services, I built comparative benchmarks against our existing Go implementation, measured development productivity impact, and assessed team adoption feasibility. The analysis showed 40% performance improvements but identified significant learning curve costs. I recommended a gradual adoption strategy starting with non-critical services to build team expertise. I also maintain relationships with technology leaders at other companies to understand real-world implementation experiences beyond vendor marketing. The key is balancing innovation opportunities with practical delivery constraints, ensuring technology choices enhance rather than complicate our ability to solve business problems effectively.`;
  }

  if (questionText.includes('debug a critical system failure') || questionText.includes('system failure')) {
    return `During a Black Friday traffic surge, our payment processing system experienced cascading failures that threatened to impact millions of transactions. The initial symptom was increased API response times, but within minutes we saw complete service unavailability. I immediately implemented our incident response protocol, establishing a war room and coordinating with infrastructure, database, and application teams. My systematic debugging approach started with service dependency analysis - I used distributed tracing to understand request flows and identified that our Redis cache cluster was experiencing memory pressure, causing frequent evictions and overwhelming the downstream database. The root cause was a recent code deployment that introduced a memory leak in session data handling. While the team worked on a hotfix, I implemented emergency mitigation by scaling Redis clusters and enabling request rate limiting to protect database capacity. I also coordinated with business teams to communicate status to customers and stakeholders. We restored full service within 90 minutes and implemented comprehensive monitoring to prevent similar issues. The incident taught me the importance of load testing deployment changes, implementing circuit breakers for critical dependencies, and maintaining detailed incident runbooks that enable rapid response even under extreme pressure.`;
  }

  if (questionText.includes('approach to solving a complex technical problem') || questionText.includes('complex technical problem')) {
    return `My systematic approach to complex technical problems involves problem decomposition, hypothesis-driven investigation, and iterative solution development. I start with comprehensive problem definition including business context, technical constraints, and success criteria. For example, when tasked with reducing API latency by 50% while handling 10x traffic growth, I began with detailed performance profiling to identify bottlenecks. The analysis revealed three primary issues: inefficient database queries, lack of caching strategy, and synchronous processing of non-critical operations. I developed a multi-phase solution: first, optimized critical database queries and added strategic caching layers; second, implemented asynchronous processing for non-blocking operations; third, redesigned the API architecture using event-driven patterns. Each phase included comprehensive testing, performance benchmarking, and gradual rollout with monitoring. I maintained detailed documentation throughout the process and conducted knowledge transfer sessions to ensure team understanding. The solution achieved 60% latency reduction and successfully handled the traffic increase during peak periods. The key success factors were systematic analysis, iterative implementation with validation, and collaborative team involvement throughout the process.`;
  }

  if (questionText.includes('cloud platforms and DevOps practices') || questionText.includes('DevOps practices')) {
    return `My cloud and DevOps experience spans AWS, Azure, and Google Cloud, with deep expertise in infrastructure-as-code, CI/CD pipelines, and container orchestration. I've led migrations from on-premises infrastructure to cloud-native architectures using Terraform for infrastructure management and Kubernetes for container orchestration. For example, I architected a complete AWS migration that reduced infrastructure costs by 30% while improving system reliability and deployment velocity. The solution included EKS clusters for application hosting, RDS for managed databases, and comprehensive monitoring using CloudWatch and Datadog. I implemented GitOps workflows using ArgoCD that enabled automated deployments with rollback capabilities. I also established comprehensive security practices including infrastructure scanning, secret management using AWS Secrets Manager, and network security through VPC configuration and security groups. My DevOps philosophy emphasizes automation, observability, and developer experience - I've implemented self-service deployment platforms that enable engineering teams to deploy independently while maintaining security and reliability standards. The key is building platforms that scale with organizational growth while maintaining operational excellence and cost efficiency.`;
  }

  if (questionText.includes('balance technical excellence with business requirements') || questionText.includes('business requirements and deadlines')) {
    return `Balancing technical excellence with business delivery requires strategic thinking about technical debt, stakeholder communication, and long-term sustainability. I use a risk-based approach that categorizes technical decisions by business impact and implementation cost. For immediate delivery pressure, I implement minimum viable technical solutions while documenting technical debt for future remediation. For example, when facing an aggressive product launch deadline, I proposed a phased technical approach: deliver core functionality using proven technologies and patterns, then incrementally improve architecture post-launch based on real usage patterns. I maintained technical quality through comprehensive testing and code review while accepting some architectural compromises that could be addressed systematically. I also established regular technical debt review sessions with product stakeholders to ensure continuous improvement alignment. The key is transparent communication about technical trade-offs and their long-term implications, ensuring business partners understand both the benefits and costs of different approaches. I've found that demonstrating reliability in delivering business objectives builds trust that enables advocacy for technical excellence initiatives that create sustainable competitive advantages.`;
  }

  if (questionText.includes('technical documentation and knowledge sharing') || questionText.includes('knowledge sharing')) {
    return `My approach to technical documentation and knowledge sharing focuses on creating living documentation that evolves with systems and enables team scalability. I implement documentation-as-code practices using tools like GitBook, Confluence, and inline code documentation that stays synchronized with implementation changes. For complex systems, I create multiple documentation layers: high-level architectural decisions for strategic context, detailed technical specifications for implementation guidance, and operational runbooks for incident response. For example, I established a comprehensive documentation system for a microservices platform that included service catalogs, API documentation, deployment guides, and troubleshooting runbooks. I also implemented regular documentation reviews and established team processes for updating documentation as part of feature development. For knowledge sharing, I facilitate architecture review sessions, technical brown bag presentations, and pairing sessions that transfer knowledge organically. I've found that combining formal documentation with informal knowledge transfer creates robust institutional knowledge that survives team changes. The key is making documentation valuable enough that teams want to maintain it rather than treating it as overhead. I measure success through team onboarding time, incident resolution speed, and reduced dependency on individual knowledge holders.`;
  }

  if (questionText.includes('implement security best practices') || questionText.includes('security best practices')) {
    return `I implemented comprehensive security measures for a financial services platform handling sensitive customer data and payment information. The challenge involved balancing security requirements with user experience and development velocity. My approach started with threat modeling to identify attack vectors and data flow risks. I established security-by-design principles including least privilege access, defense in depth, and comprehensive audit logging. The technical implementation included OAuth 2.0 with JWT tokens for authentication, role-based access control for authorization, and AES-256 encryption for data at rest. I also implemented comprehensive input validation, SQL injection prevention, and CSRF protection. For infrastructure security, I configured VPC isolation, WAF rules, and comprehensive monitoring using SIEM tools. I established secure development practices including static code analysis, dependency vulnerability scanning, and penetration testing in CI/CD pipelines. The most challenging aspect was implementing PCI DSS compliance while maintaining development agility. I created developer-friendly security tools and comprehensive training that made security practices easy to follow. The implementation achieved SOC 2 Type II certification and passed external security audits without significant findings. The key success factors were early security involvement in design, comprehensive automation, and making security convenient for developers.`;
  }

  if (questionText.includes('learn a new technology quickly') || questionText.includes('new technology quickly')) {
    return `When our team needed to implement real-time collaboration features similar to Google Docs, I had to rapidly learn WebRTC, operational transformation algorithms, and conflict resolution strategies within a three-week deadline. My systematic learning approach started with understanding the business requirements and technical constraints, then identifying key concepts and best practices through authoritative sources and real-world implementations. I created a learning plan that balanced theoretical understanding with hands-on experimentation: I spent the first week studying operational transformation fundamentals and analyzing existing solutions like ShareJS and Yjs. The second week involved building proof-of-concept implementations to validate technical approaches and identify integration challenges. I also engaged with developer communities and subject matter experts through forums and direct outreach to understand common pitfalls and successful patterns. By the third week, I had developed a working implementation that handled concurrent edits, conflict resolution, and network partition recovery. The key success factors were focused learning objectives, rapid prototyping to validate understanding, and leveraging community knowledge to avoid common mistakes. I also documented my learning process and conducted knowledge transfer sessions to accelerate team understanding and prevent single points of failure.`;
  }

  if (questionText.includes('integrate multiple systems or APIs') || questionText.includes('multiple systems or APIs')) {
    return `I led the integration of five disparate systems for a customer onboarding platform that needed to combine CRM data, identity verification services, payment processing, document management, and notification systems. The challenge involved handling different data formats, authentication mechanisms, rate limiting policies, and reliability characteristics across systems with varying SLAs. My integration architecture used an event-driven approach with Apache Kafka as the central message bus, enabling loose coupling and resilient communication patterns. I implemented dedicated adapter services for each external system that handled API-specific concerns like rate limiting, retry logic, and data transformation. For data consistency, I used the Saga pattern to manage distributed transactions and compensation logic. The most complex aspect was handling partial failures and maintaining data consistency across systems with different availability guarantees. I implemented comprehensive monitoring and alerting that provided visibility into each integration point and established clear escalation procedures for system failures. I also created detailed integration testing suites that validated end-to-end workflows and error handling scenarios. The solution successfully processed 50,000+ customer onboarding requests with 99.9% success rate and enabled business expansion into new markets. The key architectural decisions were emphasizing loose coupling, implementing comprehensive error handling, and providing operational visibility into complex distributed workflows.`;
  }

  if (questionText.includes('ensure code quality and maintainability') || questionText.includes('code quality')) {
    return `I establish code quality through comprehensive practices that balance automation with human judgment. My approach includes automated static analysis using tools like SonarQube and Checkmarx, comprehensive test coverage requirements (minimum 80% for critical paths), and mandatory peer code reviews with clear quality criteria. I implement pre-commit hooks that enforce coding standards, run security scans, and validate test coverage before code reaches review. For maintainability, I emphasize consistent architectural patterns, comprehensive documentation, and clear separation of concerns. For example, I established a code quality system for a 50-person engineering team that included automated quality gates, reviewable checklists, and technical debt tracking. I also implemented regular architectural reviews and refactoring sprints to address accumulating technical debt. The challenge was balancing quality standards with development velocity - I addressed this by making quality tools fast and developer-friendly rather than burdensome. I created custom linting rules specific to our codebase patterns and established team coding standards through collaborative sessions rather than top-down mandates. The results included 60% reduction in production bugs, faster onboarding for new team members, and improved development velocity over time. The key is making quality practices feel like enablers rather than obstacles, ensuring tools provide valuable feedback that developers want to use.`;
  }

  if (questionText.includes('complex technical problem you solved that others struggled with') || questionText.includes('others struggled with')) {
    return `I solved a distributed systems issue where our microservices platform experienced intermittent data inconsistencies that only occurred under high load and couldn't be reproduced in testing environments. Multiple senior engineers had investigated for weeks without identifying the root cause, and the issue was impacting customer data integrity. My systematic approach started with comprehensive data collection - I implemented detailed distributed tracing across all services and collected timing information for every database operation. I also analyzed the inconsistency patterns to identify potential correlation with system load, network conditions, and deployment timing. The breakthrough came from recognizing that the issue only occurred when specific services experienced concurrent requests that triggered race conditions in our eventual consistency implementation. The root cause was subtle: our event ordering relied on timestamp-based sequencing, but clock drift between servers caused events to be processed out of order during high concurrency. The solution involved implementing vector clocks for event ordering and adding conflict resolution logic for concurrent operations. I also redesigned the data synchronization protocol to handle network partitions and clock inconsistencies gracefully. The fix eliminated data inconsistencies entirely and improved system resilience under adverse conditions. The key insight was recognizing that distributed systems failures often result from subtle timing and ordering issues that require careful analysis of system behavior under stress.`;
  }

  if (questionText.includes('refactor legacy code or systems') || questionText.includes('legacy code')) {
    return `I led the refactoring of a 200,000-line monolithic e-commerce platform that had become unmaintainable after five years of rapid feature development. The system suffered from tight coupling, inconsistent patterns, and extensive technical debt that was slowing development by 70%. My refactoring strategy used the strangler fig pattern to gradually extract functionality while maintaining business continuity. I started with comprehensive system analysis to understand data flows, business logic, and integration points. I identified natural service boundaries using domain-driven design principles and prioritized extraction based on business impact and technical complexity. The first phase focused on extracting the most isolated components with clear interfaces - user authentication, payment processing, and inventory management. Each extraction included comprehensive testing, performance validation, and gradual traffic migration with rollback capabilities. I implemented feature flags to enable safe migration and established monitoring to detect regressions immediately. The most challenging aspect was maintaining data consistency during the transition - I implemented event sourcing patterns and careful migration scripts to ensure zero data loss. Over 18 months, we successfully extracted 80% of the monolith into 12 microservices, reducing deployment time from hours to minutes and enabling independent team development. The key success factors were gradual migration with safety mechanisms, comprehensive testing, and maintaining business value delivery throughout the transformation.`;
  }

  if (questionText.includes('database design and optimization') || questionText.includes('database optimization')) {
    return `I designed and optimized database architecture for a high-traffic analytics platform that needed to handle 100M+ events per day while supporting real-time queries and batch processing. The challenge involved balancing write performance, query flexibility, and cost efficiency across different access patterns. My architecture used a lambda architecture approach with separate optimizations for hot and cold data paths. For hot data, I implemented a time-series database using InfluxDB that could handle high-velocity writes with automatic data rollups and retention policies. For analytical queries, I used Apache Druid for real-time aggregations and Amazon Redshift for complex analytical workloads. The most complex optimization involved query performance tuning - I implemented intelligent indexing strategies, materialized views for common aggregations, and query result caching. I also optimized data partitioning strategies based on query patterns and implemented automated partition pruning to maintain performance as data volume grew. For write performance, I implemented batching strategies, connection pooling, and async processing patterns that could handle traffic spikes without dropping data. The solution successfully scaled to handle 10x traffic growth while maintaining sub-second query response times for 95% of requests. Key architectural decisions included choosing appropriate technologies for different access patterns, implementing comprehensive monitoring for query performance, and designing for horizontal scalability from the beginning.`;
  }

  if (questionText.includes('optimize system performance or scalability') || questionText.includes('performance or scalability')) {
    return `I optimized a social media platform's recommendation system that was experiencing performance degradation as user base grew from 1M to 10M users. The existing system used collaborative filtering with real-time computation, which couldn't scale beyond our current load. My optimization strategy involved both algorithmic improvements and infrastructure scaling. I analyzed the recommendation pipeline and identified that real-time similarity calculations were the primary bottleneck. I redesigned the architecture using pre-computed user embeddings updated through batch processing, with real-time serving from a distributed cache layer. I implemented Apache Spark for batch processing user embeddings and Redis Cluster for low-latency serving. For the machine learning pipeline, I optimized the model training using distributed computing and implemented incremental learning to handle new user data efficiently. I also implemented sophisticated caching strategies with cache warming and intelligent expiration policies. The infrastructure improvements included horizontal scaling of the API layer with load balancing and auto-scaling based on CPU and memory metrics. I established comprehensive performance monitoring using distributed tracing and custom metrics that provided visibility into every component. The optimizations achieved 80% latency reduction and successfully handled 10x traffic growth while improving recommendation quality by 25%. The key success factors were systematic performance profiling, architectural redesign for scalability, and comprehensive monitoring to validate improvements.`;
  }

  if (questionText.includes('testing strategies and quality assurance') || questionText.includes('testing strategies')) {
    return `I established comprehensive testing strategies for a financial trading platform where system reliability and data accuracy were critical business requirements. My testing pyramid approach included unit tests for individual components, integration tests for service interactions, and end-to-end tests for complete user workflows. The challenge was balancing comprehensive coverage with execution speed and maintenance overhead. I implemented property-based testing using Hypothesis for complex financial calculations, ensuring correctness across edge cases that traditional example-based tests might miss. For performance testing, I used JMeter and custom load testing frameworks that simulated realistic trading patterns and validated system behavior under stress. I also implemented chaos engineering practices using tools like Chaos Monkey to validate system resilience under failure conditions. The most critical aspect was data quality testing - I created comprehensive data validation frameworks that checked mathematical consistency, regulatory compliance, and business rule adherence. I implemented automated testing in CI/CD pipelines with quality gates that prevented deployment of code that didn't meet coverage or performance criteria. I also established comprehensive monitoring and alerting that detected regressions in production immediately. The testing strategy achieved 99.99% system uptime and zero data consistency issues over two years of operation. The key was treating testing as a strategic investment in system reliability rather than development overhead, ensuring tests provided valuable feedback for both correctness and performance.`;
  }

  return `As a technical specialist in ${position}, I approach complex technical challenges through systematic analysis, data-driven decision making, and rigorous implementation practices. I focus on building scalable, maintainable solutions that meet both immediate requirements and long-term architectural goals. My methodology emphasizes comprehensive testing, performance optimization, and knowledge transfer to ensure solutions can be successfully maintained and evolved by the broader team.`;
}

// Executive/Final Round specific answers
function getExecutiveFinalAnswer(questionText: string, company: String, position: string): string {
  if (questionText.includes('building high-performing teams and culture') || questionText.includes('high-performing teams')) {
    return `My approach to building high-performing teams centers on creating psychological safety, establishing clear accountability, and fostering continuous learning cultures that attract and retain exceptional talent. I believe the most effective teams combine diverse perspectives with shared commitment to excellence, where individuals feel empowered to take calculated risks while maintaining collective responsibility for outcomes. In practice, this means implementing transparent communication systems, investing significantly in professional development, and creating career progression paths that reward both individual contributions and collaborative leadership. For example, I've successfully scaled engineering organizations by establishing technical mentorship programs, implementing peer code review processes that prioritize learning over criticism, and creating cross-functional project opportunities that broaden individual expertise while strengthening team cohesion. The key is balancing high performance standards with sustainable work practices, ensuring that excellence becomes a cultural norm rather than an unsustainable sprint. At ${company}, I see tremendous opportunity to build upon your existing culture of innovation while scaling the organizational capabilities needed to achieve your ambitious long-term vision.`;
  }

  if (questionText.includes('drive organizational change') || questionText.includes('organizational change')) {
    return `I led a comprehensive digital transformation at a traditional enterprise that required migrating from monolithic legacy systems to cloud-native microservices architecture while simultaneously retraining 200+ engineers and maintaining business continuity. The challenge was not just technical but cultural - convincing seasoned engineers to embrace new development practices while managing executive concerns about disruption and cost. My approach began with building a coalition of early adopters who could demonstrate value through pilot projects, then systematically expanding successful practices across the organization. I established clear communication channels that kept all stakeholders informed of progress, challenges, and adjustments to the plan. I also created comprehensive training programs and paired experienced engineers with cloud-native experts to accelerate knowledge transfer. Over 18 months, we successfully migrated 80% of critical systems, reduced infrastructure costs by 40%, and improved deployment frequency from monthly to daily releases. Most importantly, the change positioned the organization to innovate at a pace that matched market demands. The key lessons were the importance of visible leadership commitment, transparent communication about both successes and setbacks, and ensuring that change initiatives deliver measurable value early and consistently.`;
  }

  if (questionText.includes('balance short-term pressures with long-term strategic objectives') || questionText.includes('short-term pressures with long-term')) {
    return `Balancing immediate delivery pressures with strategic positioning requires a portfolio approach that allocates resources across multiple time horizons while maintaining clear decision-making frameworks for trade-off situations. I typically structure this as a three-tier strategy: immediate tactical responses that address urgent business needs, medium-term capability building that strengthens competitive position, and long-term strategic investments that create new market opportunities. For example, when facing immediate customer escalations while trying to modernize our technology stack, I allocated 60% of engineering capacity to tactical fixes and customer requests, 30% to systematic technical debt reduction and infrastructure improvements, and 10% to experimental projects exploring emerging technologies. The key is transparent stakeholder communication about these trade-offs and consistent metrics that demonstrate progress across all three horizons. I also established quarterly reviews where we could adjust allocations based on changing business priorities while protecting minimum investment levels in long-term capabilities. This approach enabled us to maintain customer satisfaction and competitive positioning while building the foundation for breakthrough innovations. The discipline required is saying no to good short-term opportunities that would compromise strategic objectives, and ensuring that tactical decisions align with rather than contradict long-term direction.`;
  }

  if (questionText.includes('questions about our company culture and leadership philosophy') || questionText.includes('company culture and leadership')) {
    return `I'm deeply interested in understanding how ${company} fosters innovation while scaling operational excellence, particularly how you balance autonomous decision-making with strategic alignment across your growing organization. What are the key cultural principles that guide difficult trade-off decisions, especially when balancing speed of execution with long-term architectural quality? I'm also curious about your approach to talent development - how do you identify and nurture future leaders while maintaining the cultural DNA that has driven your success? Additionally, I'd like to understand how ${company} approaches risk-taking and failure - what does intelligent experimentation look like at your scale, and how do you maintain entrepreneurial thinking while operating mission-critical systems? Finally, how does your leadership team stay connected to technical realities and customer needs as the organization continues to grow? Understanding these aspects would help me assess how I can most effectively contribute to your continued success while growing professionally in an environment that aligns with my values and working style.`;
  }

  if (questionText.includes('budget management and resource allocation') || questionText.includes('budget management')) {
    return `My approach to budget management combines rigorous financial discipline with strategic flexibility, ensuring that resource allocation decisions drive both immediate business results and long-term competitive advantage. I start with comprehensive planning that maps resource needs to business objectives, then establish clear metrics for measuring ROI across different types of investments. For operational expenses, I implement zero-based budgeting principles that require justification for all expenditures rather than incremental adjustments to previous budgets. For strategic investments, I use portfolio theory to balance high-certainty/moderate-return projects with higher-risk/higher-potential initiatives. For example, in managing a $50M technology budget, I allocated 70% to proven operational needs and incremental improvements, 20% to strategic capability building with measurable 18-month ROI targets, and 10% to experimental projects with longer payback periods but significant potential impact. I also established quarterly budget reviews that could reallocate resources based on changing priorities and emerging opportunities. The key success factors were transparent stakeholder communication about trade-offs, rigorous tracking of actual versus projected returns, and maintaining sufficient flexibility to capitalize on unexpected opportunities while meeting committed objectives. This approach consistently delivered budget targets while funding innovations that created lasting competitive advantages.`;
  }

  if (questionText.includes('measure success and what metrics matter most') || questionText.includes('measure success')) {
    return `I measure success through a balanced scorecard that captures both quantitative business impact and qualitative organizational health, recognizing that sustainable high performance requires excellence across multiple dimensions. My primary metrics focus on customer value creation - user engagement, satisfaction scores, and revenue impact - because these ultimately determine long-term business viability. I also track operational excellence indicators including system reliability, feature delivery velocity, and cost efficiency, as these enable consistent value delivery. Equally important are organizational health metrics like employee engagement, talent retention, and skills development, because sustainable success depends on building capabilities that compound over time. For example, in my current role, I track monthly active users, customer lifetime value, system uptime, deployment frequency, engineering productivity metrics, and team satisfaction scores. The key is connecting these metrics to strategic objectives and ensuring that short-term optimizations don't compromise long-term capabilities. I also believe in leading indicators that predict future performance, such as innovation pipeline strength, technical debt accumulation, and competitive positioning metrics. Regular metric reviews with stakeholders ensure alignment on priorities and enable rapid course corrections when performance diverges from expectations. Success ultimately means building sustainable competitive advantages that create lasting value for customers, employees, and shareholders.`;
  }

  if (questionText.includes('building and maintaining relationships with key stakeholders') || questionText.includes('key stakeholders')) {
    return `Effective stakeholder relationship management requires understanding that different stakeholders have different information needs, decision-making styles, and success criteria, then adapting communication and engagement approaches accordingly. My framework involves first mapping stakeholder interests and influence levels, then establishing regular communication rhythms that provide appropriate depth and frequency for each relationship. With executive stakeholders, I focus on strategic updates that connect technical initiatives to business outcomes, quarterly reviews that address both successes and challenges, and proactive escalation of issues that require their attention or resources. With peer leaders, I emphasize collaboration opportunities, resource sharing, and joint problem-solving on organizational challenges. With technical teams, I provide context about business priorities, career development opportunities, and technical autonomy within clear strategic boundaries. For example, I maintain monthly one-on-ones with key executives, quarterly cross-functional leadership meetings, and weekly team communication that cascades strategic context throughout the organization. The key is consistent, transparent communication that builds trust through reliable follow-through on commitments. I also invest significant time in understanding stakeholder perspectives during decision-making processes, ensuring that different viewpoints are considered and that final decisions have broad organizational support. Building these relationships requires genuine interest in others' success and willingness to invest time in understanding their challenges and objectives.`;
  }

  if (questionText.includes('questions about our leadership team and company direction') || questionText.includes('leadership team and company direction')) {
    return `I'm particularly interested in understanding ${company}'s strategic priorities for the next 3-5 years and how technology leadership can most effectively contribute to achieving those goals. What are the key market opportunities or competitive challenges that will shape your strategic direction, and how is the leadership team positioning the organization to capitalize on them? I'd also like to understand the decision-making processes for major strategic initiatives - how does the leadership team balance different perspectives and navigate complex trade-offs between competing priorities? Additionally, I'm curious about how ${company} approaches innovation and experimentation at scale - what's your philosophy on balancing proven approaches with breakthrough initiatives? How does the leadership team stay connected to both customer needs and technical realities as the organization continues to grow? Finally, what does success look like for this role in the context of your broader strategic objectives, and how will progress be measured? Understanding these aspects would help me assess how my experience and approach align with your organization's needs and culture, while also giving me insight into the growth opportunities and challenges that would make this role compelling for my career development.`;
  }

  if (questionText.includes('philosophy on risk-taking and innovation') || questionText.includes('risk-taking and innovation')) {
    return `My philosophy on risk and innovation centers on intelligent experimentation within clear strategic frameworks - taking calculated risks that have asymmetric upside potential while maintaining operational excellence in core business areas. I believe the greatest risk is actually avoiding risk entirely, as this leads to competitive stagnation and missed opportunities. However, effective risk-taking requires systematic approaches that maximize learning while minimizing potential downside. I implement portfolio strategies that balance high-certainty improvements with experimental initiatives, establishing clear success criteria and decision points for continuing, pivoting, or discontinuing projects. For example, I typically allocate 70% of resources to proven approaches with predictable returns, 20% to adjacent innovations that extend current capabilities, and 10% to transformational experiments that could create new business opportunities. The key is creating organizational cultures that reward intelligent failure - where teams learn rapidly from unsuccessful experiments and apply those insights to future initiatives. I also establish innovation processes that encourage diverse perspectives, rapid prototyping, and customer feedback integration to validate assumptions early. At ${company}, I see significant opportunities to build systematic innovation capabilities that can consistently identify and develop breakthrough solutions while maintaining the operational excellence that customers depend on. The goal is making innovation a sustainable competitive advantage rather than sporadic lucky breaks.`;
  }

  if (questionText.includes('career in the next 3-5 years') || questionText.includes('how does this role fit')) {
    return `My career vision centers on becoming a technology leader who can drive organizational transformation at scale while building sustainable competitive advantages through exceptional team development and strategic innovation. Over the next 3-5 years, I see myself progressing from tactical execution excellence to strategic organizational impact, taking on increasing responsibility for business outcomes and market positioning. This role at ${company} represents an ideal next step because it combines the technical challenges I'm passionate about with the organizational scale and strategic importance that will accelerate my leadership development. I'm particularly excited about the opportunity to work on problems that impact millions of users while building the technical capabilities and organizational culture needed to maintain ${company}'s competitive advantage. I see this role as enabling me to contribute to significant business outcomes while developing skills in areas like large-scale system design, cross-functional leadership, and strategic planning that will prepare me for eventually leading entire technology organizations. The learning opportunities around ${company}'s scale, technical complexity, and market position align perfectly with my goal of understanding how exceptional technology capabilities create business value. Additionally, I'm drawn to your culture of innovation and excellence, which provides an environment where I can grow while contributing to meaningful impact. Long-term, I aspire to roles where I can influence industry direction and build organizations that consistently deliver breakthrough innovations.`;
  }

  if (questionText.includes('influenced a major business decision or change') || questionText.includes('influenced a major business decision')) {
    return `I influenced our company's decision to adopt a microservices architecture, which ultimately became a $15M transformation initiative that repositioned us for cloud-native scalability. The existing monolithic system was limiting our ability to scale development teams and respond to market demands, but executives were concerned about the complexity and cost of architectural changes. I built a comprehensive business case that quantified the current constraints - development velocity had decreased 50% as the codebase grew, deployment cycles were monthly instead of the daily releases competitors achieved, and infrastructure costs were growing faster than user adoption. I proposed a gradual migration strategy using the strangler fig pattern, starting with new feature development in microservices while incrementally extracting functionality from the monolith. To demonstrate viability, I led a pilot project that showed 3x faster feature delivery and 40% lower infrastructure costs for equivalent functionality. I also addressed executive concerns by creating detailed risk mitigation plans and establishing clear success metrics. Throughout the process, I facilitated stakeholder alignment by translating technical concepts into business impact and ensuring all concerns were addressed. The initiative received unanimous executive approval and ultimately enabled us to reduce time-to-market by 60% while supporting 10x user growth without proportional infrastructure cost increases. The key success factors were building coalition support through early wins, addressing stakeholder concerns proactively, and connecting technical improvements to clear business value. This experience demonstrated how strategic technical leadership can drive organizational transformation when coupled with effective stakeholder communication and business impact focus.`;
  }

  if (questionText.includes('decision with significant business impact') || questionText.includes('significant business impact')) {
    return `I made the decision to abandon a $2M AI initiative that had consumed 18 months of development but was not delivering the promised business value, despite significant organizational investment and executive expectations. The project aimed to implement predictive analytics for customer behavior, but early results showed accuracy rates of only 60% - insufficient for the automated decision-making we had envisioned. The team was deeply invested in the technical challenges and believed more time could improve outcomes, while executives were concerned about sunk costs and competitive implications of delays. I conducted a comprehensive analysis including technical feasibility assessment, competitive market analysis, and opportunity cost evaluation. The data showed that even with optimistic projections, achieving production-ready accuracy would require another 12 months and significant additional resources, while alternative approaches could deliver 80% of the business value in 6 months with proven technologies. I presented three options to executives: continue with the current approach, pivot to a simpler but more reliable solution, or discontinue entirely and reallocate resources to higher-impact initiatives. I recommended the pivot strategy, which involved using established machine learning techniques for customer segmentation while building organizational capabilities for future AI initiatives. The decision required managing team disappointment while maintaining morale and extracting valuable learning from the experience. The pivot delivered successful customer segmentation capabilities within 6 months, improved marketing campaign effectiveness by 35%, and positioned us for more strategic AI investments based on practical experience and proven ROI models.`;
  }

  if (questionText.includes('contributing to our company\'s long-term strategic goals') || questionText.includes('long-term strategic goals')) {
    return `I see my contribution to ${company}'s long-term strategic goals centered on building technical capabilities that create sustainable competitive advantages while enabling rapid response to market opportunities. Based on my understanding of your strategic priorities, I would focus on three key areas: first, developing scalable technology platforms that can support exponential growth while maintaining performance and reliability standards; second, building organizational capabilities that can consistently innovate and execute at the pace required to maintain market leadership; third, creating technical assets and intellectual property that provide structural advantages over competitors. Specifically, I would invest in next-generation architecture capabilities that enable faster experimentation and deployment, establish comprehensive testing and monitoring systems that ensure reliability at scale, and develop data analytics platforms that provide superior insights for product and business decisions. I also see significant opportunity to contribute to talent development and organizational scaling, helping to build the engineering culture and capabilities needed to execute on ambitious technical visions. My approach would emphasize connecting technical initiatives to measurable business outcomes, ensuring that technology investments directly support revenue growth, market expansion, and customer satisfaction objectives. I'm particularly excited about the potential to work on technical challenges that impact millions of users while building the foundational capabilities that will enable ${company} to maintain its competitive position as markets and technologies continue to evolve. The key is balancing innovation with execution excellence, ensuring that technical capabilities enable rather than constrain business strategy.`;
  }

  if (questionText.includes('decisions align with company values and ethics') || questionText.includes('company values and ethics')) {
    return `I ensure ethical alignment through systematic decision-making frameworks that explicitly evaluate choices against both company values and broader stakeholder impact, recognizing that sustainable business success requires maintaining trust and integrity across all relationships. My approach begins with clearly understanding and internalizing organizational values, then establishing decision-making processes that consistently apply these principles even under pressure. I implement stakeholder impact analysis for significant decisions, considering effects on customers, employees, shareholders, and broader communities rather than optimizing for single metrics. For example, when facing pressure to ship features faster by reducing testing protocols, I advocate for approaches that maintain quality standards while improving development efficiency, ensuring that short-term pressures don't compromise long-term customer trust. I also establish transparent communication practices that acknowledge trade-offs and ensure that stakeholders understand the reasoning behind difficult decisions. When ethical concerns arise, I prioritize addressing them directly rather than hoping they resolve themselves, engaging appropriate resources including legal, compliance, and executive leadership when necessary. I believe ethical leadership requires proactive consideration of unintended consequences and willingness to make difficult decisions that prioritize long-term organizational health over short-term convenience. At ${company}, I would contribute to ethical decision-making by advocating for technical approaches that prioritize user privacy and security, ensuring that AI and data analytics initiatives respect user rights and expectations, and maintaining transparent communication about technical limitations and risks. The goal is building technology capabilities that create value while earning and maintaining stakeholder trust.`;
  }

  if (questionText.includes('crisis management or handling unexpected challenges') || questionText.includes('crisis management')) {
    return `I managed a critical security incident where unauthorized access was detected in our customer data systems during peak business hours, requiring immediate response to protect customer information while maintaining business operations. The incident triggered our crisis management protocols, but the scope and timeline were initially unclear, creating pressure to balance urgent action with careful analysis. I immediately assembled our incident response team including security, engineering, legal, and communications specialists, establishing a war room with clear roles and communication protocols. My first priority was containing the potential breach - we temporarily restricted access to affected systems while implementing additional monitoring to understand the scope of compromise. Simultaneously, I coordinated with legal and compliance teams to ensure proper regulatory notification procedures while preparing customer communication that balanced transparency with accuracy. The technical investigation revealed that the access was caused by a misconfigured API that had been exposed during a recent deployment, not a sophisticated attack. However, we discovered that customer email addresses had been accessible for approximately 6 hours before detection. I made the decision to proactively notify all potentially affected customers within 12 hours of discovery, implement additional security measures, and conduct a comprehensive review of our deployment procedures. Throughout the crisis, I maintained regular communication with executives, provided hourly updates to stakeholders, and ensured that team members had the resources and support needed for sustained response efforts. The incident was resolved within 18 hours with no evidence of data misuse, and our transparent communication approach actually strengthened customer trust. The key lessons were the importance of preparation through established protocols, clear decision-making authority during emergencies, and the value of transparent communication even when the full situation is unclear.`;
  }

  return `From an executive perspective on ${position} leadership, I focus on building sustainable competitive advantages through exceptional technology capabilities and organizational excellence. My approach emphasizes long-term strategic thinking, talent development, and innovation systems that create compound value over time. I believe ${company} is positioned to define the next generation of technology leadership through thoughtful investment in both technical capabilities and organizational culture.`;
}

// Default answers for fallback
function getDefaultAnswer(questionText: string, company: string, position: string): string {
  return `Based on my experience as a ${position}, I would approach this situation systematically. First, I'd assess the specific requirements and constraints, gathering input from relevant stakeholders to understand all perspectives. Then I'd develop a structured plan that addresses the core objectives while managing risks and building stakeholder alignment. The key is balancing strategic thinking with tactical execution, ensuring that all decisions support ${company}'s broader objectives while delivering measurable results.`;
}