#!/usr/bin/env tsx

/**
 * Seed Script: Credit Costs Configuration
 *
 * This script initializes the credit_costs table with default values for
 * the Admin Subscription System (Phase 1).
 *
 * Usage:
 *   npx tsx server/scripts/seed-credit-costs.ts
 *
 * Default Credit Costs:
 *   - practice-session: 1 credit
 *   - prepare-session: 1 credit
 *   - self-intro-polish: 3 credits
 *   - self-intro-analyze-video: 5 credits
 *   - resume-analysis: 5 credits
 *   - resume-generation: 10 credits
 */

import { db } from '../db';
import { creditCosts } from '../../shared/schema';
import { eq } from 'drizzle-orm';

async function seedCreditCosts() {
  console.log('🌱 Seeding credit costs configuration...\n');

  const defaultCosts = [
    {
      featureName: 'practice-session',
      creditCost: 1,
      description: 'Credits required to start an AI-powered practice interview session',
      isActive: true,
    },
    {
      featureName: 'prepare-session',
      creditCost: 1,
      description: 'Credits required to start an AI-powered preparation session',
      isActive: true,
    },
    {
      featureName: 'self-intro-polish',
      creditCost: 3,
      description: 'Credits required to polish self-introduction script with AI',
      isActive: true,
    },
    {
      featureName: 'self-intro-analyze-video',
      creditCost: 5,
      description: 'Credits required to analyze self-introduction video with AI',
      isActive: true,
    },
    {
      featureName: 'resume-analysis',
      creditCost: 5,
      description: 'Credits required to analyze resume with AI',
      isActive: true,
    },
     {
       featureName: 'resume-generation',
       creditCost: 10,
       description: 'Credits required to generate improved resume with AI',
       isActive: true,
     },
     {
       featureName: 'module-coaching',
       creditCost: 2,
       description: 'Credits required to get AI coaching on learning module answers',
       isActive: true,
     },
  ];

  try {
    for (const cost of defaultCosts) {
      // Check if the cost already exists
      const existing = await db
        .select()
        .from(creditCosts)
        .where(eq(creditCosts.featureName, cost.featureName))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Skipping "${cost.featureName}" (already exists)`);
        continue;
      }

      // Insert new credit cost
      await db.insert(creditCosts).values({
        featureName: cost.featureName,
        creditCost: cost.creditCost,
        description: cost.description,
        isActive: cost.isActive,
      });

      console.log(`✅ Created credit cost: ${cost.featureName} = ${cost.creditCost} credit(s)`);
    }

    console.log('\n✨ Credit costs seeded successfully!');
    console.log('\nCurrent configuration:');

    // Display all credit costs
    const allCosts = await db.select().from(creditCosts);
    allCosts.forEach(cost => {
      const status = cost.isActive ? '🟢 Active' : '🔴 Inactive';
      console.log(`  ${status} | ${cost.featureName}: ${cost.creditCost} credit(s)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding credit costs:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCreditCosts();
