import { db } from "./db";
import { 
  assessments,
  performanceIndicators,
  learningDrills,
  simulationQuestions,
  interviewSessions
} from "@shared/schema";

async function seedNewAssessments() {
  console.log("Seeding new assessment system data...");

  try {
    // Get some existing interview sessions
    const sessions = await db.select().from(interviewSessions).limit(5);
    
    if (sessions.length === 0) {
      console.log("No interview sessions found, skipping assessment seeding");
      return;
    }

    // Clear existing assessment data
    await db.delete(learningDrills);
    await db.delete(performanceIndicators);  
    await db.delete(assessments);
    await db.delete(simulationQuestions);

    console.log("Cleared existing assessment data");

    // Create a sample assessment with proper column names
    const assessmentData = {
      session_id: sessions[0].id,
      user_id: "dev-user-123", 
      communication_score: 4,
      empathy_score: 5,
      problem_solving_score: 4,
      cultural_alignment_score: 5,
      overall_score: "4.50",
      overall_rating: "Competent",
      strengths: "Excellent empathy and cultural alignment. Strong communication skills with clear articulation.",
      improvement_areas: "Continue developing problem-solving methodologies and practice more complex scenarios.",
      qualitative_observations: "Candidate shows natural empathy and excellent alignment with company values. Communication is clear and engaging.",
      actionable_insights: "Practice the STAR method for complex problem-solving questions. Consider taking a structured thinking course.",
      star_method_recommendations: "Focus on more detailed Situation context. Provide specific metrics in Results when possible.",
      personalized_drills: [
        { type: "star_method", title: "Complex Problem Analysis", priority: "high" },
        { type: "technical", title: "System Design Practice", priority: "medium" }
      ],
      self_reflection_prompts: [
        "How do you approach breaking down complex problems into manageable parts?",
        "What methods do you use to ensure stakeholder alignment in challenging situations?",
        "How do you measure the success of your problem-solving approaches?"
      ],
      progress_level: 4,
      performance_badge: "Empathy Expert"
    };

    const [insertedAssessment] = await db.insert(assessments).values(assessmentData).returning();
    console.log("Created assessment:", insertedAssessment.id);

    // Create performance indicators
    const indicatorData = [
      {
        assessment_id: insertedAssessment.id,
        indicator_type: "communication",
        score: 4,
        description: "Clear, articulate communication with appropriate tone",
        visual_data: { type: 'radar', value: 4, maxValue: 5, label: 'Communication' }
      },
      {
        assessment_id: insertedAssessment.id,
        indicator_type: "empathy", 
        score: 5,
        description: "Outstanding ability to understand and relate to others",
        visual_data: { type: 'radar', value: 5, maxValue: 5, label: 'Empathy' }
      },
      {
        assessment_id: insertedAssessment.id,
        indicator_type: "problem_solving",
        score: 4,
        description: "Solid analytical thinking and solution-oriented approach",
        visual_data: { type: 'radar', value: 4, maxValue: 5, label: 'Problem Solving' }
      },
      {
        assessment_id: insertedAssessment.id,
        indicator_type: "cultural_alignment",
        score: 5,
        description: "Excellent alignment with company values and mission",
        visual_data: { type: 'radar', value: 5, maxValue: 5, label: 'Cultural Alignment' }
      }
    ];

    await db.insert(performanceIndicators).values(indicatorData);
    console.log("Created performance indicators");

    // Create learning drills  
    const drillData = [
      {
        assessment_id: insertedAssessment.id,
        user_id: "dev-user-123",
        drill_type: "star_method",
        title: "Complex Problem Analysis",
        description: "Practice breaking down complex problems using structured thinking frameworks",
        scenario: "You're faced with a system outage affecting multiple services. Walk through your problem-solving approach.",
        target_skill: "Problem Solving",
        estimated_duration: 15,
        completed: false
      },
      {
        assessment_id: insertedAssessment.id,
        user_id: "dev-user-123",
        drill_type: "communication",
        title: "Technical Explanation Practice",
        description: "Practice explaining technical concepts to non-technical stakeholders",
        scenario: "Explain a complex technical decision to a business stakeholder who needs to understand the impact.",
        target_skill: "Communication",
        estimated_duration: 10,
        completed: false
      }
    ];

    await db.insert(learningDrills).values(drillData);
    console.log("Created learning drills");

    // Create simulation questions
    const questionData = [
      {
        job_role: "Software Engineer",
        company_name: "Meta",
        question_type: "behavioral",
        question: "Tell me about a time when you had to work with a difficult team member to achieve a common goal.",
        context: "Assess collaboration and conflict resolution skills",
        expected_outcomes: { skills: ["collaboration", "communication", "conflict resolution"] },
        difficulty_level: 3
      },
      {
        job_role: "Product Manager",
        company_name: "Google", 
        question_type: "situational",
        question: "How would you prioritize features for a product with limited engineering resources?",
        context: "Evaluate prioritization and strategic thinking abilities",
        expected_outcomes: { skills: ["prioritization", "strategic thinking", "resource management"] },
        difficulty_level: 4
      }
    ];

    await db.insert(simulationQuestions).values(questionData);
    console.log("Created simulation questions");

    console.log("✅ Successfully seeded new assessment system data");

  } catch (error) {
    console.error("❌ Error seeding new assessment data:", error);
  }
}

seedNewAssessments();