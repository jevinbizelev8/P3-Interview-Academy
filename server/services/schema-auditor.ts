import { executeQuery } from "../db.js";

const TABLE_SCHEMA = "public";

type QueryRows = Array<Record<string, any>>;

async function runQuery(sql: string): Promise<QueryRows> {
  const result = await executeQuery<any>(sql);
  if (Array.isArray(result?.rows)) {
    return result.rows as QueryRows;
  }
  if (Array.isArray(result)) {
    return result as QueryRows;
  }
  return [];
}

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await runQuery(
    `select to_regclass('${TABLE_SCHEMA}.${tableName}') as regclass`);
  return Boolean(rows[0]?.regclass);
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const rows = await runQuery(
    `select column_name from information_schema.columns where table_schema = '${TABLE_SCHEMA}' and table_name = '${tableName}' and column_name = '${columnName}' limit 1`);
  return rows.length > 0;
}

async function renameColumnIfNeeded(tableName: string, from: string, to: string): Promise<void> {
  const targetExists = await columnExists(tableName, to);
  if (targetExists) {
    return;
  }

  const sourceExists = await columnExists(tableName, from);
  if (!sourceExists) {
    return;
  }

  await executeQuery(
    `alter table ${tableName} rename column "${from}" to "${to}";`);
}

async function addColumnIfMissing(tableName: string, definition: string): Promise<void> {
  await executeQuery(
    `alter table ${tableName} add column if not exists ${definition};`);
}

async function ensurePerformModuleSchema(): Promise<void> {
  const tableName = "interview_sessions";

  if (!(await tableExists(tableName))) {
    return;
  }

  const renamePairs: Array<[string, string]> = [
    ["userId", "user_id"],
    ["scenarioId", "scenario_id"],
    ["userJobPosition", "user_job_position"],
    ["userCompanyName", "user_company_name"],
    ["interviewLanguage", "interview_language"],
    ["currentQuestion", "current_question"],
    ["totalQuestions", "total_questions"],
    ["overallScore", "overall_score"],
    ["situationScore", "situation_score"],
    ["taskScore", "task_score"],
    ["actionScore", "action_score"],
    ["resultScore", "result_score"],
    ["flowScore", "flow_score"],
    ["createdAt", "created_at"],
    ["updatedAt", "updated_at"],
    ["completedAt", "completed_at"],
    ["autoSavedAt", "auto_saved_at"],
    ["startedAt", "started_at"],
    ["lastActivityAt", "last_activity_at"],
  ];

  for (const [from, to] of renamePairs) {
    try {
      await renameColumnIfNeeded(tableName, from, to);
    } catch (error) {
      console.error(`Failed to rename column ${from} -> ${to}`, error);
    }
  }

  const columnDefinitions: string[] = [
    "duration integer",
    "situation_score numeric(5,2)",
    "task_score numeric(5,2)",
    "action_score numeric(5,2)",
    "result_score numeric(5,2)",
    "flow_score numeric(5,2)",
    "qualitative_feedback text",
    "strengths jsonb",
    "improvements jsonb",
    "recommendations jsonb",
    "transcript jsonb"
  ];

  for (const definition of columnDefinitions) {
    try {
      await addColumnIfMissing(tableName, definition);
    } catch (error) {
      console.error(`Failed to add column ${definition}`, error);
    }
  }
}

async function ensurePrepareModuleSchema(): Promise<void> {
  const ensureExtension = "create extension if not exists \"pgcrypto\";";

  try {
    await executeQuery(ensureExtension);
  } catch (error) {
    console.error("Failed to ensure pgcrypto extension", error);
  }

  const sessionTable = "ai_prepare_sessions";
  const questionTable = "ai_prepare_questions";
  const responseTable = "ai_prepare_responses";
  const analyticsTable = "ai_prepare_analytics";

  if (!(await tableExists(sessionTable))) {
    await executeQuery(`
      create table ${sessionTable} (
        id uuid primary key default gen_random_uuid(),
        user_id varchar not null references users(id),
        session_name varchar(255),
        job_position varchar(200) not null,
        company_name varchar(200),
        interview_stage varchar(50) not null,
        experience_level varchar(20) not null,
        preferred_language varchar(10) default 'en',
        difficulty_level varchar(20) default 'adaptive',
        focus_areas jsonb default '[]'::jsonb,
        question_categories jsonb default '[]'::jsonb,
        max_questions integer default 20,
        time_limit_minutes integer default 60,
        status varchar(20) default 'active',
        current_question_number integer default 1,
        total_questions_asked integer default 0,
        session_progress numeric(5,2) default 0.00,
        average_star_score numeric(3,2),
        total_time_spent integer default 0,
        questions_answered integer default 0,
        voice_enabled boolean default true,
        preferred_voice varchar(50),
        speech_rate numeric(2,1) default 1.0,
        auto_play_questions boolean default true,
        created_at timestamp default now(),
        updated_at timestamp default now(),
        started_at timestamp,
        paused_at timestamp,
        completed_at timestamp
      );
    `);
  }

  if (!(await tableExists(questionTable))) {
    await executeQuery(`
      create table ${questionTable} (
        id uuid primary key default gen_random_uuid(),
        session_id uuid not null references ${sessionTable}(id) on delete cascade,
        question_text text not null,
        question_text_translated text,
        question_category varchar(50) not null,
        question_type varchar(30) not null,
        difficulty_level varchar(20) not null,
        expected_answer_time integer default 180,
        star_method_relevant boolean default true,
        cultural_context text,
        industry_specific boolean default false,
        follow_up_questions jsonb default '[]'::jsonb,
        question_number integer not null,
        is_answered boolean default false,
        time_spent integer default 0,
        attempts integer default 0,
        generated_by varchar(20) default 'sealion',
        generation_prompt text,
        generation_timestamp timestamp default now(),
        created_at timestamp default now()
      );
    `);
  }

  if (!(await tableExists(responseTable))) {
    await executeQuery(`
      create table ${responseTable} (
        id uuid primary key default gen_random_uuid(),
        session_id uuid not null references ${sessionTable}(id) on delete cascade,
        question_id uuid not null references ${questionTable}(id) on delete cascade,
        response_text text not null,
        response_language varchar(10) default 'en',
        input_method varchar(20) default 'text',
        audio_file_url text,
        audio_duration integer,
        transcription_confidence numeric(3,2),
        star_scores jsonb not null,
        detailed_feedback jsonb not null,
        model_answer text,
        model_answer_translated text,
        relevance_score numeric(3,2),
        communication_score numeric(3,2),
        completeness_score numeric(3,2),
        improvement_areas jsonb default '[]'::jsonb,
        evaluated_by varchar(20) default 'sealion',
        evaluation_timestamp timestamp default now(),
        evaluation_duration integer,
        time_taken integer not null,
        word_count integer,
        retry_count integer default 0,
        created_at timestamp default now(),
        updated_at timestamp default now()
      );
    `);
  }

  if (!(await tableExists(analyticsTable))) {
    await executeQuery(`
      create table ${analyticsTable} (
        id uuid primary key default gen_random_uuid(),
        session_id uuid not null references ${sessionTable}(id) on delete cascade,
        user_id varchar not null references users(id),
        overall_performance jsonb not null,
        category_scores jsonb default '{}'::jsonb,
        improvement_over_time jsonb default '[]'::jsonb,
        response_patterns jsonb default '{}'::jsonb,
        strengths_identified jsonb default '[]'::jsonb,
        areas_for_improvement jsonb default '[]'::jsonb,
        personalized_recommendations jsonb default '[]'::jsonb,
        voice_metrics jsonb default '{}'::jsonb,
        total_session_time integer not null,
        average_response_time numeric(5,2),
        questions_answered integer not null,
        questions_skipped integer default 0,
        created_at timestamp default now(),
        updated_at timestamp default now()
      );
    `);
  }
}

export async function ensureCriticalSchema(): Promise<void> {
  try {
    await ensurePerformModuleSchema();
  } catch (error) {
    console.error("Failed to ensure perform module schema", error);
  }

  try {
    await ensurePrepareModuleSchema();
  } catch (error) {
    console.error("Failed to ensure prepare module schema", error);
  }
}
