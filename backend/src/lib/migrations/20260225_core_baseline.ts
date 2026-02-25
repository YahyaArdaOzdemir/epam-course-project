export const CORE_BASELINE_MIGRATION_ID = '20260225_core_baseline';

export const CORE_BASELINE_NOTES = [
  'Consolidates core authentication and idea workflow schema expectations for spec 002.',
  'Executable schema migrations are maintained in SQL files consumed by migrate.ts.',
  'This artifact preserves traceability between the implementation plan and runtime migrations.',
] as const;
