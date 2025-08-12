import { db } from "./db";
import { assessments, assessmentCriteria, interviewSessions, interviewScenarios, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Seed assessment data for testing
export async function seedAssessments() {
  try {
    console.log("Seeding assessment data...");

    // Check if assessments already exist
    const existingAssessments = await db.select().from(assessments).limit(1);
    if (existingAssessments.length > 0) {
      console.log("Assessment data already exists, skipping seed");
      return;
    }

    // Get some existing sessions to create assessments for
    const sessions = await db.select().from(interviewSessions).limit(5);
    
    if (sessions.length === 0) {
      console.log("No sessions found, cannot create assessment data");
      return;
    }

    const assessmentData = [
      {
        sessionId: sessions[0].id,
        userId: "dev-user-123",
        relevanceScore: 4,
        structuredScore: 3,
        specificScore: 4,
        honestScore: 5,
        confidentScore: 3,
        alignedScore: 4,
        outcomeOrientedScore: 3,
        overallScore: "3.71",
        overallGrade: "B",
        strengths: "Excellent authenticity and honesty in responses. Good use of specific examples and strong alignment with role requirements.",
        improvements: "Focus on improving STAR method structure. Work on demonstrating more confidence in delivery and emphasize measurable outcomes.",
        specificFeedback: "Your responses showed genuine experience and good technical knowledge. The examples you provided were relevant and specific. To improve, practice structuring your answers using the STAR method more consistently, and try to quantify your achievements where possible.",
        nextSteps: "Practice behavioral questions using STAR format. Prepare specific metrics and outcomes for your key accomplishments. Work on confident delivery techniques."
      },
      {
        sessionId: sessions[1]?.id || sessions[0].id,
        userId: "dev-user-123", 
        relevanceScore: 5,
        structuredScore: 4,
        specificScore: 3,
        honestScore: 4,
        confidentScore: 4,
        alignedScore: 5,
        outcomeOrientedScore: 4,
        overallScore: "4.14",
        overallGrade: "B",
        strengths: "Outstanding relevance to questions asked and excellent role alignment. Good confidence level and well-structured responses using STAR method.",
        improvements: "Provide more specific details and concrete examples. Focus on quantifiable results and outcomes to strengthen your responses.",
        specificFeedback: "You demonstrated strong understanding of the role and provided highly relevant answers. Your STAR method usage was good, showing clear situation and task description. To enhance your performance, include more specific metrics and detailed examples that showcase your impact.",
        nextSteps: "Prepare a portfolio of specific achievements with metrics. Practice storytelling with concrete details. Research industry-specific examples relevant to your target role."
      },
      {
        sessionId: sessions[2]?.id || sessions[0].id,
        userId: "dev-user-123",
        relevanceScore: 3,
        structuredScore: 5,
        specificScore: 5,
        honestScore: 4,
        confidentScore: 5,
        alignedScore: 3,
        outcomeOrientedScore: 5,
        overallScore: "4.29",
        overallGrade: "B",
        strengths: "Exceptional use of STAR method and outstanding specificity in examples. Very confident delivery with strong focus on measurable outcomes and results.",
        improvements: "Improve relevance to specific questions asked and better align responses with target role requirements. Ensure authenticity while maintaining confidence.",
        specificFeedback: "Your structured approach using STAR method was excellent, and the specific details you provided were very compelling. Your confidence came through clearly, and the focus on results was impressive. Work on tailoring your responses more closely to the specific questions and role requirements.",
        nextSteps: "Research the target company and role more thoroughly. Practice active listening to ensure responses directly address questions. Maintain your excellent structure while improving relevance."
      }
    ];

    // Insert assessments
    for (const assessment of assessmentData) {
      const [insertedAssessment] = await db.insert(assessments).values(assessment).returning();
      
      // Insert criteria details for each assessment
      const criteriaData = [
        {
          assessmentId: insertedAssessment.id,
          criteriaName: "relevance",
          score: assessment.relevanceScore,
          feedback: `Relevance score: ${assessment.relevanceScore}/5 - How well responses addressed specific questions`,
          examples: "Provided relevant examples that directly answered the interviewer's questions"
        },
        {
          assessmentId: insertedAssessment.id,
          criteriaName: "structured",
          score: assessment.structuredScore,
          feedback: `STAR method score: ${assessment.structuredScore}/5 - Use of Situation, Task, Action, Result structure`,
          examples: "Used clear structure in storytelling with identifiable STAR components"
        },
        {
          assessmentId: insertedAssessment.id,
          criteriaName: "specific",
          score: assessment.specificScore,
          feedback: `Specificity score: ${assessment.specificScore}/5 - Providing concrete details and examples`,
          examples: "Included specific metrics, timelines, and detailed examples"
        },
        {
          assessmentId: insertedAssessment.id,
          criteriaName: "honest",
          score: assessment.honestScore,
          feedback: `Authenticity score: ${assessment.honestScore}/5 - Genuine and truthful responses`,
          examples: "Responses felt authentic and reflected real experiences"
        },
        {
          assessmentId: insertedAssessment.id,
          criteriaName: "confident",
          score: assessment.confidentScore,
          feedback: `Confidence score: ${assessment.confidentScore}/5 - Self-assured delivery without arrogance`,
          examples: "Demonstrated appropriate confidence level in responses"
        },
        {
          assessmentId: insertedAssessment.id,
          criteriaName: "aligned",
          score: assessment.alignedScore,
          feedback: `Role alignment score: ${assessment.alignedScore}/5 - Responses align with target role`,
          examples: "Showed understanding of role requirements and company culture"
        },
        {
          assessmentId: insertedAssessment.id,
          criteriaName: "outcomeOriented",
          score: assessment.outcomeOrientedScore,
          feedback: `Results focus score: ${assessment.outcomeOrientedScore}/5 - Emphasis on outcomes and achievements`,
          examples: "Highlighted measurable results and positive outcomes"
        }
      ];
      
      await db.insert(assessmentCriteria).values(criteriaData);
    }

    console.log(`✅ Seeded ${assessmentData.length} assessments with criteria`);

  } catch (error) {
    console.error("❌ Error seeding assessment data:", error);
  }
}

// Run seeding
seedAssessments().then(() => process.exit(0)).catch(console.error);