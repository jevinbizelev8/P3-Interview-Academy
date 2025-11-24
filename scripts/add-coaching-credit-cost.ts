import { db } from '../server/db';
import { creditCosts } from '../shared/schema';

async function applyMigration() {
  try {
    console.log('Adding self-intro-coaching credit cost...');

    await db.insert(creditCosts)
      .values({
        featureName: 'self-intro-coaching',
        creditCost: 2,
        description: 'Personalized AI coaching for self-introduction steps',
        isActive: true,
      })
      .onConflictDoUpdate({
        target: creditCosts.featureName,
        set: {
          creditCost: 2,
          description: 'Personalized AI coaching for self-introduction steps',
          isActive: true,
        }
      });

    console.log('✅ Credit cost added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
