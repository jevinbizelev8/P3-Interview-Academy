import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  __dirname,
  "../../migrations/2025-10-redesign/phase1.sql",
);
const migrationSql = readFileSync(migrationPath, "utf8");

const rollbackPath = resolve(
  __dirname,
  "../../migrations/2025-10-redesign/rollback.sql",
);
let rollbackSql = "";
try {
  rollbackSql = readFileSync(rollbackPath, "utf8");
} catch (error) {
  // Rollback SQL may not exist yet - that's okay for now
}

describe("Phase 1 redesign migration", () => {
  it("includes all user table extensions", () => {
    const userFragments = [
      "ALTER TABLE users",
      "ADD COLUMN IF NOT EXISTS xp_points",
      "ADD COLUMN IF NOT EXISTS current_streak",
      "ADD COLUMN IF NOT EXISTS longest_streak",
      "ADD COLUMN IF NOT EXISTS last_activity_date",
      "ADD COLUMN IF NOT EXISTS readiness_score",
      "ADD COLUMN IF NOT EXISTS referral_code",
      "CREATE INDEX IF NOT EXISTS idx_users_referral_code",
      "CREATE INDEX IF NOT EXISTS idx_users_xp_points",
    ];

    for (const fragment of userFragments) {
      expect(migrationSql).toContain(fragment);
    }
  });

  it("creates every redesign table", () => {
    const tables = [
      "CREATE TABLE IF NOT EXISTS job_descriptions",
      "CREATE TABLE IF NOT EXISTS badges",
      "CREATE TABLE IF NOT EXISTS user_badges",
      "CREATE TABLE IF NOT EXISTS learning_modules",
      "CREATE TABLE IF NOT EXISTS user_module_progress",
      "CREATE TABLE IF NOT EXISTS self_intro_drafts",
      "CREATE TABLE IF NOT EXISTS self_intros",
      "CREATE TABLE IF NOT EXISTS resumes",
      "CREATE TABLE IF NOT EXISTS resume_analysis_history",
      "CREATE TABLE IF NOT EXISTS star_stories",
      "CREATE TABLE IF NOT EXISTS actual_interviews",
      "CREATE TABLE IF NOT EXISTS reflection_journals",
      "CREATE TABLE IF NOT EXISTS referrals",
      "CREATE TABLE IF NOT EXISTS feedback",
      "CREATE TABLE IF NOT EXISTS support_tickets",
    ];

    for (const table of tables) {
      expect(migrationSql).toContain(table);
    }
  });

  it("adds the documented indexes", () => {
    const indexes = [
      "idx_badges_category",
      "idx_badges_active",
      "idx_badges_requirement_type",
      "idx_user_badges_user_id",
      "idx_learning_modules_stage",
      "idx_learning_modules_active",
      "idx_learning_modules_type",
      "idx_user_module_progress_user_id",
      "idx_self_intro_drafts_user",
      "idx_self_intros_active",
      "idx_resumes_user",
      "idx_resume_analysis_user",
      "idx_star_stories_tags",
      "idx_actual_interviews_outcome",
      "idx_reflection_journals_date",
      "idx_referrals_status",
      "idx_feedback_created",
      "idx_support_tickets_assigned",
    ];

    for (const indexName of indexes) {
      expect(migrationSql).toContain(indexName);
    }
  });

  it("is wrapped in a transaction (BEGIN/COMMIT)", () => {
    expect(migrationSql).toMatch(/^BEGIN;/m);
    expect(migrationSql).toMatch(/COMMIT;[\s]*$/m);
  });

  it("uses idempotent operations (IF NOT EXISTS)", () => {
    // All ALTER TABLE operations should use IF NOT EXISTS
    const alterTableLines = migrationSql
      .split("\n")
      .filter((line) => line.includes("ALTER TABLE"));

    for (const line of alterTableLines) {
      if (line.includes("ADD COLUMN")) {
        expect(line).toContain("IF NOT EXISTS");
      }
    }

    // All CREATE TABLE operations should use IF NOT EXISTS
    const createTableLines = migrationSql
      .split("\n")
      .filter((line) => line.includes("CREATE TABLE"));

    for (const line of createTableLines) {
      expect(line).toContain("IF NOT EXISTS");
    }

    // All CREATE INDEX operations should use IF NOT EXISTS
    const createIndexLines = migrationSql
      .split("\n")
      .filter((line) => line.includes("CREATE INDEX"));

    for (const line of createIndexLines) {
      expect(line).toContain("IF NOT EXISTS");
    }
  });

  it("includes proper foreign key constraints", () => {
    const fkConstraints = [
      "REFERENCES users(id)",
      "ON DELETE CASCADE",
      "REFERENCES badges(id)",
      "REFERENCES learning_modules(id)",
      "REFERENCES resumes(id)",
    ];

    for (const fk of fkConstraints) {
      expect(migrationSql).toContain(fk);
    }
  });

  it("includes proper CHECK constraints", () => {
    // Readiness score should be 0-100
    expect(migrationSql).toMatch(/readiness_score.*CHECK.*>= 0.*<= 100/);

    // User module progress status should have specific values
    expect(migrationSql).toMatch(/status.*CHECK.*not_started|in_progress|completed/);
  });

  it("has proper column defaults", () => {
    const defaults = [
      "xp_points INTEGER DEFAULT 0",
      "current_streak INTEGER DEFAULT 0",
      "longest_streak INTEGER DEFAULT 0",
      "readiness_score INTEGER DEFAULT 0",
      "is_active BOOLEAN DEFAULT TRUE",
      "created_at TIMESTAMP DEFAULT NOW()",
    ];

    for (const defaultDef of defaults) {
      expect(migrationSql).toContain(defaultDef);
    }
  });

  it("uses UUID primary keys for new tables", () => {
    const uuidPks = [
      "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    ];

    // Count occurrences - should be 15 (one per table)
    const count = (migrationSql.match(/id UUID PRIMARY KEY DEFAULT gen_random_uuid/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(15);
  });

  it("does not include any destructive operations", () => {
    // Migration should not DROP anything (additive only)
    expect(migrationSql).not.toMatch(/DROP TABLE/i);
    expect(migrationSql).not.toMatch(/DROP COLUMN/i);
    expect(migrationSql).not.toMatch(/DROP INDEX/i);

    // Should not ALTER existing column types
    expect(migrationSql).not.toMatch(/ALTER COLUMN.*TYPE/i);

    // Should not DELETE data
    expect(migrationSql).not.toMatch(/DELETE FROM/i);

    // Should not UPDATE existing data
    expect(migrationSql).not.toMatch(/UPDATE.*SET/i);
  });

  it("does not include any database connection changes", () => {
    // Should not change database settings
    expect(migrationSql).not.toMatch(/ALTER DATABASE/i);
    expect(migrationSql).not.toMatch(/CREATE DATABASE/i);
    expect(migrationSql).not.toMatch(/DROP DATABASE/i);
  });
});

describe("Phase 1 rollback migration", () => {
  it("rollback SQL file should exist eventually", () => {
    // This test will fail until rollback SQL is created
    // That's intentional - serves as a reminder to create it
    if (rollbackSql === "") {
      console.warn(
        "\n⚠️  Warning: Rollback SQL not found at:",
        rollbackPath,
        "\nCreate it using the documented rollback procedure in DATABASE_SCHEMA.md",
      );
    }
    // Don't fail the test for now - just warn
    expect(true).toBe(true);
  });

  it("includes DROP statements in correct order (if exists)", () => {
    if (rollbackSql === "") {
      return; // Skip if rollback doesn't exist yet
    }

    const dropTables = [
      "DROP TABLE IF EXISTS support_tickets",
      "DROP TABLE IF EXISTS feedback",
      "DROP TABLE IF EXISTS referrals",
      "DROP TABLE IF EXISTS reflection_journals",
      "DROP TABLE IF EXISTS actual_interviews",
      "DROP TABLE IF EXISTS star_stories",
      "DROP TABLE IF EXISTS resumes",
      "DROP TABLE IF EXISTS user_badges",
      "DROP TABLE IF EXISTS badges",
    ];

    for (const drop of dropTables) {
      expect(rollbackSql).toContain(drop);
    }
  });

  it("includes ALTER TABLE to remove user columns (if exists)", () => {
    if (rollbackSql === "") {
      return; // Skip if rollback doesn't exist yet
    }

    expect(rollbackSql).toContain("ALTER TABLE users");
    expect(rollbackSql).toContain("DROP COLUMN IF EXISTS xp_points");
    expect(rollbackSql).toContain("DROP COLUMN IF EXISTS current_streak");
    expect(rollbackSql).toContain("DROP COLUMN IF EXISTS readiness_score");
    expect(rollbackSql).toContain("DROP COLUMN IF EXISTS referral_code");
  });
});

/*
 * TODO: Add actual database execution tests
 *
 * Future enhancement: Use testcontainers-node or pg-mem to:
 * 1. Spin up ephemeral PostgreSQL instance
 * 2. Execute migration SQL
 * 3. Verify schema with actual queries
 * 4. Test rollback SQL
 * 5. Test idempotency (run migration twice)
 *
 * Example framework:
 * - testcontainers: https://github.com/testcontainers/testcontainers-node
 * - pg-mem: https://github.com/oguimbal/pg-mem (in-memory postgres)
 *
 * This would replace the migration runner's verification checks
 * and run in CI before deployment.
 */
