// ============================================================
// personTimeline API — 共享 TypeScript 类型定义
// 对应 OpenAPI: docs/design/api-spec.yaml
// 版本: 1.0.0
// ============================================================

// ---------- 枚举 ----------

export type TimeType = 'POINT' | 'PERIOD' | 'FUZZY';
export type Granularity = 'YEAR' | 'MONTH' | 'DAY' | 'SEASON';
export type EventType = 'BIRTH' | 'DEATH' | 'EDUCATION' | 'CAREER' | 'CREATION' | 'HISTORICAL' | 'OTHER';
export type PersonStatus = 'draft' | 'published';

// ---------- 通用 ----------

export interface ErrorResponse {
  detail: string;
}

export interface Pagination {
  total: number;
  page: number;
  page_size: number;
}

// ---------- 人物 ----------

export interface Person {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  birth_display: string | null;
  death_display: string | null;
  avatar_url: string | null;
  summary: string | null;
  status: PersonStatus;
  created_at: string;
  updated_at: string;
}

export interface PersonCreate {
  name: string;
  birth_date?: string | null;
  death_date?: string | null;
  birth_display?: string | null;
  death_display?: string | null;
  avatar_url?: string | null;
  summary?: string | null;
}

export interface PersonUpdate {
  name?: string;
  birth_date?: string | null;
  death_date?: string | null;
  birth_display?: string | null;
  death_display?: string | null;
  avatar_url?: string | null;
  summary?: string | null;
  status?: PersonStatus;
}

export interface PersonListItem {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  avatar_url: string | null;
  summary: string | null;
  status: PersonStatus;
  event_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPersons extends Pagination {
  items: PersonListItem[];
}

export interface PersonDetail extends Person {
  event_count: number;
  aliases: string[];
}

// ---------- 事件 ----------

export interface PersonRef {
  id: string;
  name: string;
  role: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  display_time: string | null;
  time_type: TimeType;
  sort_date: string;
  granularity: Granularity;
  event_type: EventType;
  location: Record<string, unknown>;
  is_inferred: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  display_time?: string | null;
  time_type: TimeType;
  granularity: Granularity;
  event_type: EventType;
  location?: Record<string, unknown> | null;
  source?: string | null;
  person_ids?: string[];
}

export interface EventUpdate {
  title?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  display_time?: string | null;
  time_type?: TimeType;
  granularity?: Granularity;
  event_type?: EventType;
  location?: Record<string, unknown> | null;
  source?: string | null;
}

export interface EventListItem {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  display_time: string | null;
  time_type: TimeType;
  event_type: EventType;
  sort_date: string;
  is_inferred: boolean;
  persons: PersonRef[];
  created_at: string;
}

export interface PaginatedEvents extends Pagination {
  items: EventListItem[];
}

export interface EventDetail extends Event {
  persons: PersonRef[];
}

// ---------- 人物-事件关联 ----------

export interface PersonEvent {
  id: string;
  person_id: string;
  event_id: string;
  role: string | null;
  personal_title: string | null;
  personal_display_time: string | null;
  personal_start_date: string | null;
  personal_end_date: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PersonEventCreate {
  event_id: string;
  role?: string | null;
  personal_title?: string | null;
  personal_display_time?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface PersonEventUpdate {
  role?: string | null;
  personal_title?: string | null;
  personal_display_time?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface PersonEventItem {
  event_id: string;
  title: string;
  personal_title: string | null;
  role: string | null;
  sort_order: number;
  start_date: string;
  end_date: string;
  time_type: TimeType;
  event_type: EventType;
  /** 参与该事件的人物名称列表 */
  persons: string[];
  /** 参与该事件的人物 ID 列表（与 persons 一一对应） */
  person_ids: string[];
}

export interface PersonEventList {
  items: PersonEventItem[];
}

// ---------- 别名 ----------

export interface Alias {
  alias: string;
  person_id: string;
}

export interface AliasCreate {
  alias: string;
}

export interface AliasList {
  items: string[];
}

// ---------- 传记文本 ----------

export interface BiographyText {
  id: string;
  person_id: string;
  source_file: string | null;
  page: number | null;
  text_length: number;
  created_at: string;
}

export interface BiographyTextItem {
  id: string;
  source_file: string | null;
  text_length: number;
  created_at: string;
}

export interface BiographyTextList {
  items: BiographyTextItem[];
}

// ---------- AI 抽取 ----------

export interface ExtractRequest {
  biography_id?: string | null;
  model?: 'qwen' | 'gpt' | 'default';
}

export interface ExtractEventItem {
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  display_time: string | null;
  time_type: TimeType;
  granularity: Granularity;
  event_type: EventType;
  location: Record<string, unknown> | null;
  event_id: string;
  is_inferred: boolean;
}

export interface ExtractResult {
  total: number;
  events: ExtractEventItem[];
}

// ---------- API 函数类型 ----------

export interface ListPersonsParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: PersonStatus;
}

export interface ListEventsParams {
  page?: number;
  page_size?: number;
  person_id?: string;
  event_type?: EventType;
  time_type?: TimeType;
  search?: string;
  sort?: 'sort_date' | '-sort_date' | 'created_at' | '-created_at';
}

export interface UploadBiographyParams {
  file: File;
  person_id: string;
}
