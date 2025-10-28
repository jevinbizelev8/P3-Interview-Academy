import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  __dirname,
  "../../migrations/2025-10-redesign/phase1.sql",
);
const migrationSql = readFileSync(migrationPath, "utf8");

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
});
