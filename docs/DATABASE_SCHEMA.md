# Database Schema

> Auto-generated from `src/lib/supabase/types.ts`

## chapter_hearts

| Field | Type |
|-------|------|
| chapter_id | `string` |
| created_at | `string | null` |
| id | `string` |
| updated_at | `string | null` |
| user_id | `string` |

## chapter_sequence_map

| Field | Type |
|-------|------|
| chapter_id | `string` |
| chapter_index | `number` |
| created_at | `string | null` |
| id | `string` |
| sequence_id | `string` |
| updated_at | `string | null` |

## chapters

| Field | Type |
|-------|------|
| author | `string` |
| content | `string` |
| created_at | `string | null` |
| description | `string | null` |
| embedding | `string | null` |
| generation_progress | `number | null` |
| generation_status | `string | null` |
| id | `string` |
| parent_id | `string | null` |
| title | `string | null` |
| updated_at | `string | null` |

## comments

| Field | Type |
|-------|------|
| author | `string` |
| chapter_id | `string` |
| content | `string` |
| created_at | `string | null` |
| id | `string` |
| parent_id | `string | null` |
| updated_at | `string | null` |

## generation_jobs

| Field | Type |
|-------|------|
| bullet_progress | `number | null` |
| chapter_id | `string` |
| completed_at | `string | null` |
| created_at | `string | null` |
| current_step | `string | null` |
| error_message | `string | null` |
| id | `string` |
| progress | `number | null` |
| sequence_id | `string | null` |
| started_at | `string | null` |
| status | `string` |
| updated_at | `string | null` |
| user_id | `string | null` |

## sequences

| Field | Type |
|-------|------|
| chapters | `Json | null` |
| created_at | `string | null` |
| created_by | `string` |
| description | `string | null` |
| embedding | `string | null` |
| id | `string` |
| is_sexually_explicit | `boolean` |
| name | `string | null` |
| tags | `string[]` |
| title | `string | null` |
| trigger_warnings | `string[]` |
| updated_at | `string | null` |
| user_prompt_history | `Json | null` |

## user_preferences

| Field | Type |
|-------|------|
| created_at | `string | null` |
| id | `string` |
| ignored_trigger_warnings | `string[] | null` |
| story_points | `number` |
| theme | `string | null` |
| updated_at | `string | null` |
| user_id | `string` |
| username | `string` |

