#!/usr/bin/env tsx
/**
 * Automated Stripe Product Creation Script
 *
 * This script creates all required Stripe products and prices for the
 * P3 Interview Academy subscription system.
 *
 * Usage:
 *   npx tsx server/scripts/setup-stripe-products.ts
 *
 * Prerequisites:
 *   - STRIPE_MODE environment variable set (test or live)
 *   - Appropriate Stripe secret key configured
 *
 * What it creates:
 *   - 2 subscription products (Pro, Advanced)
 *   - 3 one-time top-up products (100, 500, 2000 credits)
 *   - Saves Price IDs to .env file
 */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Stripe mode and key
const STRIPE_MODE = process.env.STRIPE_MODE || 'test';
const isTestMode = STRIPE_MODE === 'test';

const STRIPE_SECRET_KEY = isTestMode
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_LIVE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error(`❌ Error: Missing Stripe secret key for ${STRIPE_MODE} mode`);
  console.error(`   Please set ${isTestMode ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_LIVE_SECRET_KEY'} in .env file`);
  process.exit(1);
}

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

console.log(`\n🚀 Stripe Product Setup Script`);
console.log(`   Mode: ${STRIPE_MODE}`);
console.log(`   API Key: ${STRIPE_SECRET_KEY.substring(0, 20)}...`);
console.log('');

// Product configurations
const PRODUCTS = [
  // Subscription products
  {
    name: 'P3 Pro Monthly',
    description: '100 monthly credits for AI-powered interview practice',
    price: 1000, // $10.00 in cents
    recurring: true,
    credits: 100,
    envKey: 'STRIPE_PRICE_PRO_MONTHLY',
  },
  {
    name: 'P3 Advanced Monthly',
    description: '280 monthly credits for unlimited interview preparation',
    price: 2800, // $28.00 in cents
    recurring: true,
    credits: 280,
    envKey: 'STRIPE_PRICE_ADVANCED_MONTHLY',
  },
  // One-time top-up products
  {
    name: '100 Credits Top-Up',
    description: 'One-time purchase of 100 credits that never expire',
    price: 1000, // $10.00
    recurring: false,
    credits: 100,
    envKey: 'STRIPE_PRICE_TOPUP_100',
  },
  {
    name: '500 Credits Top-Up',
    description: 'One-time purchase of 500 credits that never expire (Best Value - 10% savings)',
    price: 4500, // $45.00
    recurring: false,
    credits: 500,
    envKey: 'STRIPE_PRICE_TOPUP_500',
  },
  {
    name: '2000 Credits Top-Up',
    description: 'One-time purchase of 2000 credits that never expire (20% savings)',
    price: 16000, // $160.00
    recurring: false,
    credits: 2000,
    envKey: 'STRIPE_PRICE_TOPUP_2000',
  },
];

/**
 * Create or retrieve a Stripe product
 */
async function createOrGetProduct(productConfig: typeof PRODUCTS[0]): Promise<{ productId: string; priceId: string }> {
  try {
    // Search for existing product by name
    const existingProducts = await stripe.products.search({
      query: `name:'${productConfig.name}'`,
      limit: 1,
    });

    let product: Stripe.Product;

    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`   ✓ Found existing product: ${product.name} (${product.id})`);
    } else {
      // Create new product
      product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: {
          credits: productConfig.credits.toString(),
          type: productConfig.recurring ? 'subscription' : 'topup',
        },
      });
      console.log(`   ✓ Created product: ${product.name} (${product.id})`);
    }

    // Search for existing price for this product
    const existingPrices = await stripe.prices.list({
      product: product.id,
      limit: 1,
    });

    let price: Stripe.Price;

    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
      console.log(`   ✓ Found existing price: $${productConfig.price / 100} (${price.id})`);
    } else {
      // Create new price
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: productConfig.price,
        currency: 'usd',
        recurring: productConfig.recurring
          ? {
              interval: 'month',
            }
          : undefined,
        metadata: {
          credits: productConfig.credits.toString(),
        },
      });
      console.log(`   ✓ Created price: $${productConfig.price / 100} (${price.id})`);
    }

    return {
      productId: product.id,
      priceId: price.id,
    };
  } catch (error) {
    console.error(`   ❌ Error creating product ${productConfig.name}:`, error);
    throw error;
  }
}

/**
 * Update .env file with Price IDs
 */
function updateEnvFile(priceIds: Record<string, string>): void {
  try {
    const envPath = path.join(__dirname, '..', '..', '.env');

    // Read current .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update or add Price IDs
    for (const [key, value] of Object.entries(priceIds)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');

      if (regex.test(envContent)) {
        // Update existing key
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add new key
        envContent += `\n${key}=${value}`;
      }
    }

    // Write back to .env file
    fs.writeFileSync(envPath, envContent.trim() + '\n');

    console.log(`\n✅ Updated .env file with Price IDs`);
  } catch (error) {
    console.error('❌ Error updating .env file:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('📦 Creating Stripe products and prices...\n');

    const priceIds: Record<string, string> = {};

    // Create all products
    for (const productConfig of PRODUCTS) {
      console.log(`\n🔧 Processing: ${productConfig.name}`);

      const { priceId } = await createOrGetProduct(productConfig);
      priceIds[productConfig.envKey] = priceId;
    }

    // Update .env file
    updateEnvFile(priceIds);

    console.log('\n');
    console.log('🎉 Stripe product setup completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   Products created/verified: ${PRODUCTS.length}`);
    console.log(`   Mode: ${STRIPE_MODE}`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Restart your server to load new Price IDs');
    console.log('   2. Configure webhook endpoints in Stripe dashboard');
    console.log('   3. Test subscription and top-up flows');
    console.log('');
  } catch (error) {
    console.error('\n❌ Fatal error during product setup:', error);
    process.exit(1);
  }
}

// Run the script
main();
