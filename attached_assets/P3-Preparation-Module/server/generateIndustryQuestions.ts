import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { fromIni } from '@aws-sdk/credential-providers';

// Check if we have Bedrock credentials
const hasBedrock = process.env.BEDROCK_API_KEY || process.env.AWS_ACCESS_KEY_ID;

// Initialize Bedrock client
const bedrock = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: fromIni({
    profile: 'default'
  })
});

interface IndustryQuestionRequest {
  industry: string;
  industryDescription: string;
  count: number;
}

export async function generateIndustryQuestions(request: IndustryQuestionRequest) {
  const prompt = `Generate ${request.count} high-quality, industry-specific technical interview questions for the ${request.industry} industry.

Industry Description: ${request.industryDescription}

Requirements:
- Questions must be genuinely technical and specific to this industry
- Each question should test deep professional knowledge and expertise
- Include a mix of difficulty levels (easy: 20%, medium: 50%, hard: 30%)
- Focus on practical, real-world scenarios professionals encounter
- Questions should be suitable for senior/mid-level professionals
- Use British English spelling and terminology throughout

For each question, provide:
1. The technical question
2. 3-4 relevant tags for categorization
3. Difficulty level (easy, medium, hard)
4. STAR method guidance with specific context for this industry

Return the response as a JSON array with this exact structure:
[
  {
    "question": "Technical question text here",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "difficulty": "medium",
    "starGuidance": {
      "situation": "Industry-specific situation context",
      "task": "Your specific responsibility or objective",
      "action": "Technical actions and methodologies to describe",
      "result": "Expected measurable outcomes and impact"
    }
  }
]

Generate exactly ${request.count} questions in valid JSON format.`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  try {
    const response = await bedrock.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Parse the JSON response
    const questions = JSON.parse(content);
    
    return questions.map((q: any) => ({
      type: 'subject-matter-expertise' as const,
      industry: request.industry,
      question: q.question,
      tags: q.tags,
      difficulty: q.difficulty,
      starGuidance: q.starGuidance
    }));
    
  } catch (error) {
    console.error(`Error generating questions for ${request.industry}:`, error);
    
    // Fallback: return a basic question structure
    return [{
      type: 'subject-matter-expertise' as const,
      industry: request.industry,
      question: `Describe a complex technical challenge you solved in the ${request.industry} industry and walk through your problem-solving approach.`,
      tags: ['Problem Solving', 'Technical Expertise', 'Industry Knowledge'],
      difficulty: 'medium' as const,
      starGuidance: {
        situation: `A technical challenge specific to ${request.industry}`,
        task: 'Your responsibility for resolving the technical issue',
        action: 'Technical approach, tools used, and methodology applied',
        result: 'Successful resolution and measurable impact on the project or organisation'
      }
    }];
  }
}

// Industry definitions matching the TechnicalCategorySelector
export const INDUSTRIES_TO_GENERATE = [
  { id: 'data-science-analytics', name: 'Data Science & Analytics', description: 'Machine learning, statistical methods, data manipulation, Python/R/SQL', needCount: 7 },
  { id: 'cybersecurity', name: 'Cybersecurity', description: 'Network security protocols, penetration testing, risk assessment, OWASP', needCount: 14 },
  { id: 'mechanical-engineering', name: 'Mechanical Engineering', description: 'Thermodynamics, fluid mechanics, CAD software, manufacturing processes', needCount: 14 },
  { id: 'healthcare', name: 'Healthcare', description: 'Medical procedures, HIPAA compliance, EHR systems, medical equipment operation', needCount: 14 },
  { id: 'finance-banking', name: 'Finance & Banking', description: 'Financial modelling, valuation methods, market analysis, regulatory compliance', needCount: 14 },
  { id: 'manufacturing', name: 'Manufacturing', description: 'Lean principles, Six Sigma, quality control, supply chain management', needCount: 14 },
  { id: 'electrical-engineering', name: 'Electrical Engineering', description: 'Circuit analysis, electromagnetism, power systems, MATLAB/SPICE', needCount: 15 },
  { id: 'civil-engineering', name: 'Civil Engineering', description: 'Structural analysis, soil mechanics, hydrology, construction project management', needCount: 15 },
  { id: 'aerospace-engineering', name: 'Aerospace Engineering', description: 'Aerodynamics, propulsion systems, structural design, flight dynamics', needCount: 15 },
  { id: 'chemical-engineering', name: 'Chemical Engineering', description: 'Chemical kinetics, thermodynamics, fluid dynamics, process control', needCount: 15 },
  { id: 'telecommunications', name: 'Telecommunications', description: 'Network protocols, wireless communication, network security, hardware/software', needCount: 15 },
  { id: 'biotechnology', name: 'Biotechnology', description: 'Molecular biology, genetics, biochemistry, bioinformatics tools', needCount: 15 },
  { id: 'automotive', name: 'Automotive', description: 'Vehicle dynamics, engine systems, material science, manufacturing processes', needCount: 15 },
  { id: 'energy-oil-gas-renewables', name: 'Energy (Oil & Gas, Renewables)', description: 'Petroleum geology, reservoir engineering, renewable technologies, energy storage', needCount: 15 },
  { id: 'construction', name: 'Construction', description: 'Project management, construction materials, blueprint reading, safety regulations', needCount: 15 },
  { id: 'food-beverage', name: 'Food & Beverage', description: 'Food science, quality assurance, supply chain logistics, processing equipment', needCount: 15 },
  { id: 'pharmaceuticals', name: 'Pharmaceuticals', description: 'Drug development, clinical trials, regulatory affairs, quality control', needCount: 15 },
  { id: 'retail-ecommerce', name: 'Retail & E-commerce', description: 'Supply chain logistics, inventory management, e-commerce platforms, customer analytics', needCount: 15 },
  { id: 'architecture', name: 'Architecture', description: 'Building codes, structural principles, architectural software, material selection', needCount: 15 },
  { id: 'marketing-digital', name: 'Marketing (Digital)', description: 'SEO/SEM strategies, web analytics, social media advertising, CMS platforms', needCount: 15 },
  { id: 'education-stem', name: 'Education (STEM)', description: 'Subject expertise, curriculum development, educational technology, learning systems', needCount: 15 },
  { id: 'environmental-science', name: 'Environmental Science', description: 'Ecology, environmental regulations, data analysis, remediation techniques', needCount: 15 },
  { id: 'consulting-management-it', name: 'Consulting (Management & IT)', description: 'Case study analysis, problem-solving skills, market sizing, industry expertise', needCount: 15 },
  { id: 'media-entertainment', name: 'Media & Entertainment', description: 'Video editing software, audio engineering, digital asset management, broadcasting', needCount: 15 },
  { id: 'public-utilities', name: 'Public Utilities', description: 'Water treatment, power grid operations, SCADA systems, health/safety compliance', needCount: 15 },
  { id: 'logistics-supply-chain', name: 'Logistics & Supply Chain', description: 'Inventory management, transportation optimisation, warehouse systems, demand forecasting', needCount: 15 },
  { id: 'hospitality-tourism', name: 'Hospitality & Tourism', description: 'Property management systems, revenue management, booking trend analysis', needCount: 15 },
  { id: 'government-public-administration', name: 'Government & Public Administration', description: 'Policy analysis, data management/security, regulatory knowledge', needCount: 15 },
  { id: 'agriculture', name: 'Agriculture', description: 'Soil science, crop science, agricultural technology, farm management software', needCount: 15 },
  { id: 'geology-mining', name: 'Geology & Mining', description: 'Geophysics, mineralogy, geological mapping, mining safety/environmental regulations', needCount: 15 },
  { id: 'insurance', name: 'Insurance', description: 'Actuarial science, risk assessment models, claims analytics, insurance regulations', needCount: 15 },
  { id: 'real-estate', name: 'Real Estate', description: 'Property valuation methods, market analysis, zoning laws, property management software', needCount: 15 },
  { id: 'fashion-apparel', name: 'Fashion & Apparel', description: 'Textile science, supply chain management, PLM software, manufacturing processes', needCount: 15 },
  { id: 'retail-banking', name: 'Retail Banking', description: 'Financial products, fraud detection systems, banking regulations', needCount: 15 },
  { id: 'investment-banking', name: 'Investment Banking', description: 'Financial modelling, M&A processes, capital markets knowledge', needCount: 15 },
  { id: 'legal-services-ip', name: 'Legal Services (IP Law)', description: 'Patent law, copyright law, intellectual property technical knowledge', needCount: 15 },
  { id: 'human-resources-hr-tech', name: 'Human Resources (HR Tech)', description: 'HRIS systems, workforce analytics, payroll/benefits software', needCount: 15 },
  { id: 'sports-fitness', name: 'Sports & Fitness', description: 'Exercise physiology, biomechanics, sports data analysis, fitness technology', needCount: 15 },
  { id: 'veterinary-medicine', name: 'Veterinary Medicine', description: 'Animal anatomy/physiology, diagnostic procedures, veterinary practice software', needCount: 15 },
  { id: 'graphic-design-ux-ui', name: 'Graphic Design & UX/UI', description: 'Design principles, Adobe Creative Suite, user research methodologies, wireframing', needCount: 15 },
  { id: 'journalism-publishing-digital', name: 'Journalism & Publishing (Digital)', description: 'Content management systems, SEO for articles, readership/engagement analytics', needCount: 15 },
  { id: 'aviation-airline-operations', name: 'Aviation & Airline Operations', description: 'Air traffic control systems, flight operations, aircraft maintenance procedures', needCount: 15 },
  { id: 'film-television-production', name: 'Film & Television Production', description: 'Camera/lighting equipment, audio engineering, post-production software', needCount: 15 },
  { id: 'robotics', name: 'Robotics', description: 'Control systems, kinematics, robotics programming languages, sensor technologies', needCount: 15 },
  { id: 'machine-vision', name: 'Machine Vision', description: 'Image processing algorithms, camera technologies, computer vision libraries', needCount: 15 },
  { id: 'nanotechnology', name: 'Nanotechnology', description: 'Quantum mechanics, nanoscale material science, specialised equipment like SEM', needCount: 15 },
  { id: 'quantum-computing', name: 'Quantum Computing', description: 'Quantum mechanics, quantum algorithms, quantum programming frameworks', needCount: 15 },
  { id: 'game-development', name: 'Game Development', description: 'C++ and relevant languages, game engines, physics simulation, graphics programming', needCount: 15 },
  { id: 'animation-vfx', name: 'Animation & VFX', description: '3D modelling/rendering software, rigging/animation techniques, compositing software', needCount: 15 }
];