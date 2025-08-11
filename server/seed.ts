import { db } from "./db";
import { interviewScenarios, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const seedScenarios = [
  {
    title: "Retail Sales Associate - Phone Screening",
    interviewStage: "phone-screening",
    industry: "Retail",
    jobRole: "Sales Associate",
    companyBackground: "FastMart is a growing convenience store chain focused on providing quick and friendly service to local communities.",
    roleDescription: "We're looking for an enthusiastic sales associate who can handle customer inquiries, process transactions, and maintain store standards.",
    candidateBackground: "You are applying for a part-time sales associate position. You have some customer service experience from previous jobs or volunteer work.",
    keyObjectives: "Assess basic communication skills, availability, customer service attitude, and reliability.",
    interviewerName: "Sarah Johnson",
    interviewerTitle: "Store Manager",
    interviewerStyle: "friendly and conversational",
    personalityTraits: "patient, encouraging, focused on personality fit",
    status: "active"
  },
  {
    title: "Customer Service Representative - Team Interview",
    interviewStage: "functional-team",
    industry: "Customer Service",
    jobRole: "Customer Service Representative",
    companyBackground: "TechSupport Plus provides 24/7 customer support for various technology companies and their products.",
    roleDescription: "Handle customer inquiries via phone, email, and chat. Resolve technical issues and escalate complex problems appropriately.",
    candidateBackground: "You have 1-2 years of customer service experience and basic technical troubleshooting skills.",
    keyObjectives: "Evaluate problem-solving abilities, technical aptitude, communication under pressure, and team collaboration skills.",
    interviewerName: "Mike Rodriguez",
    interviewerTitle: "Team Lead",
    interviewerStyle: "structured and scenario-focused",
    personalityTraits: "analytical, thorough, team-oriented",
    status: "active"
  },
  {
    title: "Sales Development Representative - Hiring Manager",
    interviewStage: "hiring-manager",
    industry: "Sales",
    jobRole: "Sales Development Representative",
    companyBackground: "CloudTech Solutions sells business software to small and medium enterprises. We're expanding our sales team.",
    roleDescription: "Generate leads, qualify prospects, and schedule meetings for senior sales representatives. Achieve monthly quotas.",
    candidateBackground: "You have some sales experience or strong interest in sales. You're comfortable making cold calls and using CRM systems.",
    keyObjectives: "Assess sales potential, resilience, goal orientation, and cultural fit with the sales team.",
    interviewerName: "Jennifer Chen",
    interviewerTitle: "Sales Manager",
    interviewerStyle: "direct and results-oriented",
    personalityTraits: "ambitious, competitive, focused on metrics",
    status: "active"
  },
  {
    title: "Retail Supervisor - Subject Matter Expert",
    interviewStage: "subject-matter",
    industry: "Retail",
    jobRole: "Retail Supervisor",
    companyBackground: "Fashion Forward is a mid-size clothing retailer with 50+ locations. We pride ourselves on trend-setting fashion and excellent customer experience.",
    roleDescription: "Supervise a team of 8-12 sales associates, manage inventory, handle escalated customer issues, and ensure store operational excellence.",
    candidateBackground: "You have 3+ years of retail experience with at least 1 year in a leadership role. You understand retail operations and team management.",
    keyObjectives: "Evaluate leadership experience, conflict resolution skills, operational knowledge, and ability to drive sales results.",
    interviewerName: "David Park",
    interviewerTitle: "District Manager",
    interviewerStyle: "comprehensive and challenging",
    personalityTraits: "experienced, detail-oriented, leadership-focused",
    status: "active"
  },
  {
    title: "Regional Sales Manager - Executive Interview",
    interviewStage: "executive",
    industry: "Sales",
    jobRole: "Regional Sales Manager",
    companyBackground: "Enterprise Solutions Inc. is a Fortune 500 company providing B2B software solutions across North America.",
    roleDescription: "Lead a regional sales team of 15+ representatives, develop strategic partnerships, and drive $10M+ in annual revenue.",
    candidateBackground: "You have 5+ years of sales management experience with proven track record of exceeding targets and developing high-performing teams.",
    keyObjectives: "Assess strategic thinking, leadership philosophy, revenue impact, and executive presence.",
    interviewerName: "Lisa Thompson",
    interviewerTitle: "VP of Sales",
    interviewerStyle: "strategic and executive-level",
    personalityTraits: "strategic, confident, results-driven",
    status: "active"
  }
];

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create a default admin user for development
    const [adminUser] = await db.select().from(users).where(eq(users.email, "admin@example.com"));
    
    let adminUserId;
    if (!adminUser) {
      const [newAdmin] = await db.insert(users).values({
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin"
      }).returning();
      adminUserId = newAdmin.id;
      console.log("Created admin user");
    } else {
      adminUserId = adminUser.id;
      console.log("Admin user already exists");
    }

    // Check if scenarios already exist
    const existingScenarios = await db.select().from(interviewScenarios);
    
    if (existingScenarios.length === 0) {
      // Insert seed scenarios
      for (const scenario of seedScenarios) {
        await db.insert(interviewScenarios).values({
          ...scenario,
          createdBy: adminUserId
        });
      }
      console.log(`Inserted ${seedScenarios.length} interview scenarios`);
    } else {
      console.log(`${existingScenarios.length} scenarios already exist, skipping seed`);
    }

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}