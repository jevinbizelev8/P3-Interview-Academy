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
