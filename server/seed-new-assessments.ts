import { db } from "./db";
import { 
  assessments, 
  performanceIndicators, 
  learningDrills, 
  simulationQuestions,
  interviewSessions 
} from "@shared/schema";
import { eq } from "drizzle-orm";

// Seed the new enhanced assessment system
export async function seedNewAssessments() {
  try {
    console.log("Seeding new assessment system data...");

    // Clear existing new-format data
    await db.delete(learningDrills);
    await db.delete(performanceIndicators);
    await db.delete(assessments);

    // Get some existing sessions to create assessments for
    const sessions = await db.select().from(interviewSessions).limit(3);
    
    if (sessions.length === 0) {
      console.log("No sessions found, cannot create assessment data");
      return;
    }

    // Create sample assessments with the new schema
    const assessmentData = [
      {
        sessionId: sessions[0].id,
        userId: "dev-user-123",
        communicationScore: 4,
        empathyScore: 5,
        problemSolvingScore: 3,
        culturalAlignmentScore: 4,
        overallScore: "4.00",
        overallRating: "Competent",
        strengths: "Excellent empathy and authentic communication. Shows strong understanding of team dynamics and collaborative problem-solving approaches.",
        improvementAreas: "Focus on more systematic problem-solving methodologies. Practice breaking down complex problems into smaller, manageable components.",
        qualitativeObservations: "Candidate demonstrated genuine interest in understanding others' perspectives and showed natural leadership qualities. Communication was clear and engaging throughout the session.",
        actionableInsights: "Practice the STAR method with problem-solving examples. Prepare 3-5 specific examples that showcase analytical thinking and systematic approaches to challenges.",
        starMethodRecommendations: "Structure responses: Situation (context + challenge), Task (your specific responsibility), Action (step-by-step approach), Result (quantified outcomes and learnings).",
        personalizedDrills: [
          { type: "problem_solving", title: "Analytical Thinking Practice", priority: "high" },
          { type: "star_method", title: "STAR Method Mastery", priority: "medium" }
        ],
        selfReflectionPrompts: [
          "What specific problem-solving frameworks have you used in past roles?",
          "How do you typically approach breaking down complex challenges?",
          "What metrics have you used to measure your problem-solving success?"
        ],
        progressLevel: 3,
        performanceBadge: "Team Player"
      },
      {
        sessionId: sessions[1]?.id || sessions[0].id,
        userId: "dev-user-123",
        communicationScore: 5,
        empathyScore: 3,
        problemSolvingScore: 5,
        culturalAlignmentScore: 4,
        overallScore: "4.25",
        overallRating: "Competent",
        strengths: "Outstanding communication clarity and exceptional problem-solving skills. Demonstrates strong technical thinking and articulate explanation of complex concepts.",
        improvementAreas: "Develop stronger empathy skills and practice active listening. Work on understanding different perspectives before proposing solutions.",
        qualitativeObservations: "Candidate showed impressive analytical abilities and could explain technical concepts clearly. However, showed some tendency to focus on solutions before fully understanding stakeholder needs.",
        actionableInsights: "Practice empathy-building exercises. Ask clarifying questions about stakeholder needs before jumping to solutions. Role-play scenarios from different perspectives.",
        starMethodRecommendations: "Continue excellent STAR structure. Enhance the 'Situation' section by including more stakeholder perspective and context about different viewpoints.",
        personalizedDrills: [
          { type: "empathy", title: "Stakeholder Perspective Practice", priority: "high" },
          { type: "communication", title: "Active Listening Drills", priority: "medium" }
        ],
        selfReflectionPrompts: [
          "How do you ensure you understand all stakeholders' perspectives before proposing solutions?",
          "What active listening techniques do you use in challenging conversations?",
          "How do you balance technical problem-solving with human-centered approaches?"
        ],
        progressLevel: 4,
        performanceBadge: "Problem Solver"
      },
      {
        sessionId: sessions[2]?.id || sessions[0].id,
        userId: "dev-user-123",
        communicationScore: 3,
        empathyScore: 4,
        problemSolvingScore: 4,
        culturalAlignmentScore: 5,
        overallScore: "4.00",
        overallRating: "Competent",
        strengths: "Excellent cultural alignment and strong understanding of company values. Shows good empathy and solid problem-solving foundation.",
        improvementAreas: "Improve communication clarity and practice articulating ideas more concisely. Work on structuring responses more logically.",
        qualitativeObservations: "Candidate demonstrates strong cultural fit and genuine alignment with company mission. Shows good collaborative instincts but could benefit from more structured communication.",
        actionableInsights: "Practice elevator pitch techniques for clearer communication. Use the pyramid principle: start with conclusion, then supporting details. Practice with a timer to improve conciseness.",
        starMethodRecommendations: "Focus on clearer Action descriptions. Break down your actions into specific, sequential steps. Practice summarizing complex actions in simple terms.",
        personalizedDrills: [
          { type: "communication", title: "Concise Communication Practice", priority: "high" },
          { type: "star_method", title: "Action Step Clarity", priority: "medium" }
        ],
        selfReflectionPrompts: [
          "What techniques help you communicate complex ideas simply?",
          "How do you ensure your key points are clearly understood?",
          "What examples best demonstrate your alignment with company values?"
        ],
        progressLevel: 3,
        performanceBadge: "Culture Champion"
      }
    ];

    // Insert assessments and create related records
    for (const assessment of assessmentData) {
      const [insertedAssessment] = await db.insert(assessments).values(assessment).returning();
      
      // Create performance indicators
      const indicatorData = [
        {
          assessmentId: insertedAssessment.id,
          indicatorType: "communication",
          score: assessment.communicationScore,
          description: "Clear, articulate communication with appropriate tone and structure",
          visualData: {
            type: 'radar',
            value: assessment.communicationScore,
            maxValue: 5,
            label: 'Communication',
            color: '#3b82f6'
          }
        },
        {
          assessmentId: insertedAssessment.id,
          indicatorType: "empathy",
          score: assessment.empathyScore,
          description: "Understanding and relating to others' perspectives and emotions",
          visualData: {
            type: 'radar',
            value: assessment.empathyScore,
            maxValue: 5,
            label: 'Empathy',
            color: '#10b981'
          }
        },
        {
          assessmentId: insertedAssessment.id,
          indicatorType: "problemSolving",
          score: assessment.problemSolvingScore,
          description: "Analytical thinking and systematic solution-oriented approach",
          visualData: {
            type: 'radar',
            value: assessment.problemSolvingScore,
            maxValue: 5,
            label: 'Problem Solving',
            color: '#f59e0b'
          }
        },
        {
          assessmentId: insertedAssessment.id,
          indicatorType: "culturalAlignment",
          score: assessment.culturalAlignmentScore,
          description: "Alignment with company values, mission, and cultural expectations",
          visualData: {
            type: 'radar',
            value: assessment.culturalAlignmentScore,
            maxValue: 5,
            label: 'Cultural Alignment',
            color: '#8b5cf6'
          }
        }
      ];
      
      await db.insert(performanceIndicators).values(indicatorData);

      // Create learning drills based on assessment
      const drillsToCreate = [];
      
      // Add drills based on lowest scores
      const scores = [
        { type: 'communication', score: assessment.communicationScore },
        { type: 'empathy', score: assessment.empathyScore },
        { type: 'problem_solving', score: assessment.problemSolvingScore },
        { type: 'cultural_alignment', score: assessment.culturalAlignmentScore }
      ];
      
      scores.sort((a, b) => a.score - b.score);
      
      // Create drills for the two lowest scoring areas
      for (let i = 0; i < 2; i++) {
        const skillArea = scores[i];
        let drillData;
        
        switch (skillArea.type) {
          case 'communication':
            drillData = {
              assessmentId: insertedAssessment.id,
              userId: "dev-user-123",
              drillType: "communication",
              title: "Clear Communication Practice",
              description: "Practice explaining complex concepts in simple, clear language that any interviewer can understand.",
              scenario: "You need to explain a technical project to a non-technical stakeholder. Practice using analogies, simple language, and logical structure.",
              targetSkill: "Communication Clarity",
              estimatedDuration: 15
            };
            break;
          case 'empathy':
            drillData = {
              assessmentId: insertedAssessment.id,
              userId: "dev-user-123",
              drillType: "empathy",
              title: "Stakeholder Perspective Practice",
              description: "Practice understanding and articulating different stakeholder perspectives in challenging situations.",
              scenario: "A project has conflicting requirements from different teams. Practice identifying each team's underlying needs and concerns.",
              targetSkill: "Empathy & Perspective-Taking",
              estimatedDuration: 20
            };
            break;
          case 'problem_solving':
            drillData = {
              assessmentId: insertedAssessment.id,
              userId: "dev-user-123",
              drillType: "problem_solving",
              title: "Systematic Problem Solving",
              description: "Practice breaking down complex problems using structured methodologies and frameworks.",
              scenario: "You're faced with a system performance issue affecting multiple services. Practice systematic diagnosis and solution approaches.",
              targetSkill: "Analytical Problem Solving",
              estimatedDuration: 25
            };
            break;
          case 'cultural_alignment':
            drillData = {
              assessmentId: insertedAssessment.id,
              userId: "dev-user-123",
              drillType: "cultural_fit",
              title: "Values Alignment Practice",
              description: "Practice articulating how your values and work style align with company culture and mission.",
              scenario: "Describe how you would handle a situation that tests core company values like integrity, customer focus, or innovation.",
              targetSkill: "Cultural Fit Demonstration",
              estimatedDuration: 15
            };
            break;
        }
        
        if (drillData) {
          drillsToCreate.push(drillData);
        }
      }
      
      // Always add a STAR method drill
      drillsToCreate.push({
        assessmentId: insertedAssessment.id,
        userId: "dev-user-123",
        drillType: "star_method",
        title: "STAR Method Mastery",
        description: "Practice structuring behavioral interview responses using the STAR (Situation, Task, Action, Result) method.",
        scenario: "Practice answering 'Tell me about a time when...' questions with clear STAR structure and compelling details.",
        targetSkill: "Structured Response Technique",
        estimatedDuration: 20
      });
      
      await db.insert(learningDrills).values(drillsToCreate);
    }

    // Create some sample simulation questions
    const simulationQuestionsData = [
      {
        jobRole: "Senior Software Engineer",
        companyName: "Meta",
        questionType: "behavioral",
        question: "Tell me about a time when you had to optimize a system for scale at Meta's level of traffic. How did you approach the challenge?",
        context: "This question assesses systems thinking and scalability experience specific to Meta's infrastructure challenges",
        expectedOutcomes: ["Systems architecture knowledge", "Scalability considerations", "Performance optimization", "Meta-specific context"],
        difficultyLevel: 4
      },
      {
        jobRole: "Product Manager",
        companyName: "Google",
        questionType: "situational",
        question: "If you were launching a new Google product feature, how would you measure its success and iterate based on user feedback?",
        context: "Evaluates product thinking and data-driven decision making in Google's product ecosystem",
        expectedOutcomes: ["Metrics definition", "User feedback integration", "A/B testing", "Google product strategy"],
        difficultyLevel: 3
      },
      {
        jobRole: "AI Engineer",
        companyName: "OpenAI",
        questionType: "technical",
        question: "How would you approach building a safety mechanism for a large language model to prevent harmful outputs?",
        context: "Technical question about AI safety and responsible AI development at OpenAI",
        expectedOutcomes: ["AI safety knowledge", "Technical implementation", "Ethical considerations", "OpenAI alignment"],
        difficultyLevel: 5
      }
    ];

    await db.insert(simulationQuestions).values(simulationQuestionsData);

    console.log(`✅ Successfully seeded new assessment system:`);
    console.log(`   - ${assessmentData.length} assessments with enhanced scoring`);
    console.log(`   - ${assessmentData.length * 4} performance indicators`);
    console.log(`   - Multiple learning drills per assessment`);
    console.log(`   - ${simulationQuestionsData.length} AI simulation questions`);

  } catch (error) {
    console.error("❌ Error seeding new assessment data:", error);
  }
}

// Run seeding
seedNewAssessments().then(() => process.exit(0)).catch(console.error);