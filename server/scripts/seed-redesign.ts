#!/usr/bin/env tsx

/**
 * Seed Script: Redesign Phase 1 Reference Data
 *
 * Populates initial badges and learning modules required for the Base44 redesign.
 * The script is idempotent and can be run multiple times without duplicating data.
 *
 * Usage:
 *   npx tsx server/scripts/seed-redesign.ts
 */

import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  badges,
  learningModules,
  type Badge,
  type LearningModule,
} from "@shared/schema";

const badgeSeeds: Array<Pick<Badge, "name" | "description" | "iconName" | "category" | "requirementType" | "requirementValue" | "xpReward" | "rarity" | "sortOrder">> = [
  {
    name: "First Steps",
    description: "Complete your first learning module",
    iconName: "Footprints",
    category: "learning",
    requirementType: "modules",
    requirementValue: 1,
    xpReward: 50,
    rarity: "common",
    sortOrder: 1,
  },
  {
    name: "Quick Learner",
    description: "Complete 5 learning modules",
    iconName: "Brain",
    category: "learning",
    requirementType: "modules",
    requirementValue: 5,
    xpReward: 100,
    rarity: "uncommon",
    sortOrder: 2,
  },
  {
    name: "Simulation Starter",
    description: "Complete your first interview simulation",
    iconName: "Play",
    category: "practice",
    requirementType: "simulations",
    requirementValue: 1,
    xpReward: 50,
    rarity: "common",
    sortOrder: 3,
  },
  {
    name: "Interview Ready",
    description: "Complete 10 interview simulations",
    iconName: "Target",
    category: "practice",
    requirementType: "simulations",
    requirementValue: 10,
    xpReward: 200,
    rarity: "rare",
    sortOrder: 4,
  },
  {
    name: "Streak Warrior",
    description: "Maintain a 7-day practice streak",
    iconName: "Flame",
    category: "achievement",
    requirementType: "streak",
    requirementValue: 7,
    xpReward: 150,
    rarity: "uncommon",
    sortOrder: 5,
  },
  {
    name: "Century Club",
    description: "Earn 1000 XP points",
    iconName: "Trophy",
    category: "milestone",
    requirementType: "xp",
    requirementValue: 1000,
    xpReward: 100,
    rarity: "rare",
    sortOrder: 6,
  },
  {
    name: "Module Master",
    description: "Complete all learning modules in one stage",
    iconName: "GraduationCap",
    category: "learning",
    requirementType: "modules",
    requirementValue: 25,
    xpReward: 250,
    rarity: "epic",
    sortOrder: 7,
  },
];

const moduleSeeds: Array<Pick<LearningModule, "stage" | "moduleNumber" | "title" | "description" | "moduleType" | "componentName" | "xpReward" | "estimatedMinutes" | "isActive" | "sortOrder">> = [
  {
    stage: "hr_screening",
    moduleNumber: 1,
    title: "Understanding Screening Interviews",
    description: "Learn the purpose and format of HR screening calls",
    moduleType: "content",
    componentName: null,
    xpReward: 10,
    estimatedMinutes: 15,
    isActive: true,
    sortOrder: 1,
  },
  {
    stage: "hr_screening",
    moduleNumber: 2,
    title: "Screening Interview Game",
    description: "Interactive game to practice common screening questions",
    moduleType: "interactive",
    componentName: "ScreeningInterviewGame",
    xpReward: 15,
    estimatedMinutes: 20,
    isActive: true,
    sortOrder: 2,
  },
  {
    stage: "hr_screening",
    moduleNumber: 3,
    title: "Elevator Pitch Builder",
    description: "Craft your perfect 30-second introduction",
    moduleType: "interactive",
    componentName: "ElevatorPitchBuilder",
    xpReward: 15,
    estimatedMinutes: 20,
    isActive: true,
    sortOrder: 3,
  },
  {
    stage: "functional_team",
    moduleNumber: 1,
    title: "Behavioral Interviewing - STAR Method",
    description: "Master the STAR framework for behavioral questions",
    moduleType: "content",
    componentName: null,
    xpReward: 10,
    estimatedMinutes: 15,
    isActive: true,
    sortOrder: 4,
  },
  {
    stage: "functional_team",
    moduleNumber: 2,
    title: "HR Questions Game",
    description: "Practice common HR behavioral questions",
    moduleType: "interactive",
    componentName: "HRQuestionsGame",
    xpReward: 15,
    estimatedMinutes: 20,
    isActive: true,
    sortOrder: 5,
  },
  {
    stage: "functional_team",
    moduleNumber: 3,
    title: "Personal Branding Workshop",
    description: "Build your professional brand story",
    moduleType: "interactive",
    componentName: "BrandingWorkshop",
    xpReward: 20,
    estimatedMinutes: 25,
    isActive: true,
    sortOrder: 6,
  },
  {
    stage: "hiring_manager",
    moduleNumber: 1,
    title: "Team Dynamics Game",
    description: "Navigate team collaboration scenarios",
    moduleType: "interactive",
    componentName: "TeamDynamicsGame",
    xpReward: 15,
    estimatedMinutes: 20,
    isActive: true,
    sortOrder: 7,
  },
  {
    stage: "hiring_manager",
    moduleNumber: 2,
    title: "Manager Perspective Game",
    description: "Understand hiring manager priorities",
    moduleType: "interactive",
    componentName: "ManagerPerspectiveGame",
    xpReward: 15,
    estimatedMinutes: 20,
    isActive: true,
    sortOrder: 8,
  },
  {
    stage: "subject_matter",
    moduleNumber: 1,
    title: "Technical Framework Game",
    description: "Practice explaining technical concepts clearly",
    moduleType: "interactive",
    componentName: "TechnicalFrameworkGame",
    xpReward: 20,
    estimatedMinutes: 25,
    isActive: true,
    sortOrder: 9,
  },
  {
    stage: "subject_matter",
    moduleNumber: 2,
    title: "STAR Story Builder",
    description: "Build your library of behavioral stories",
    moduleType: "practice",
    componentName: "STARStoryBuilder",
    xpReward: 15,
    estimatedMinutes: 20,
    isActive: true,
    sortOrder: 10,
  },
  {
    stage: "executive",
    moduleNumber: 1,
    title: "Executive Presence Builder",
    description: "Develop executive-level communication skills",
    moduleType: "interactive",
    componentName: "ExecutivePresenceBuilder",
    xpReward: 25,
    estimatedMinutes: 25,
    isActive: true,
    sortOrder: 11,
  },
  {
    stage: "practice",
    moduleNumber: 1,
    title: "Conflict Scenario Practice",
    description: "Handle difficult workplace situations",
    moduleType: "practice",
    componentName: "ConflictScenarioPractice",
    xpReward: 15,
    estimatedMinutes: 20,
    isActive: true,
    sortOrder: 12,
  },
  {
    stage: "practice",
    moduleNumber: 2,
    title: "Communication Exercises",
    description: "Improve clarity and confidence",
    moduleType: "practice",
    componentName: "CommunicationExercises",
    xpReward: 10,
    estimatedMinutes: 15,
    isActive: true,
    sortOrder: 13,
  },
  {
    stage: "practice",
    moduleNumber: 3,
    title: "Communication Style Quiz",
    description: "Discover your communication strengths",
    moduleType: "quiz",
    componentName: "CommunicationStyleQuiz",
    xpReward: 10,
    estimatedMinutes: 10,
    isActive: true,
    sortOrder: 14,
  },
];

async function seedBadges() {
  console.log("\n🌟 Seeding redesign badges...");
  for (const badge of badgeSeeds) {
    const existing = await db
      .select({ id: badges.id })
      .from(badges)
      .where(eq(badges.name, badge.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Skipping badge \"${badge.name}\" (already exists)`);
      continue;
    }

    await db.insert(badges).values({
      name: badge.name,
      description: badge.description,
      iconName: badge.iconName,
      category: badge.category,
      requirementType: badge.requirementType,
      requirementValue: badge.requirementValue,
      xpReward: badge.xpReward,
      rarity: badge.rarity,
      sortOrder: badge.sortOrder,
    });
    console.log(`✅ Created badge: ${badge.name}`);
  }
}

async function seedLearningModules() {
  console.log("\n📚 Seeding redesign learning modules...");
  for (const module of moduleSeeds) {
    const existing = await db
      .select({ id: learningModules.id })
      .from(learningModules)
      .where(
        and(
          eq(learningModules.stage, module.stage),
          eq(learningModules.moduleNumber, module.moduleNumber),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(
        `⏭️  Skipping module ${module.stage} #${module.moduleNumber} (already exists)`,
      );
      continue;
    }

    await db.insert(learningModules).values({
      stage: module.stage,
      moduleNumber: module.moduleNumber,
      title: module.title,
      description: module.description,
      moduleType: module.moduleType,
      componentName: module.componentName,
      xpReward: module.xpReward,
      estimatedMinutes: module.estimatedMinutes,
      isActive: module.isActive,
      sortOrder: module.sortOrder,
    });
    console.log(
      `✅ Created module ${module.stage} #${module.moduleNumber} – ${module.title}`,
    );
  }
}

async function main() {
  try {
    await seedBadges();
    await seedLearningModules();
    console.log("\n✨ Redesign seed data up to date!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed redesign data:", error);
    process.exit(1);
  }
}

void main();
