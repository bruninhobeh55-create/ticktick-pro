// ============================================================
// ARQUIVO: src/lib/gemini.ts
// Cole este conteúdo em src/lib/gemini.ts (ao lado de supabase.ts)
// ============================================================

import type { Priority } from '../types';

const API_KEY_STORAGE = 'ticktick_gemini_api_key';
const MODEL_STORAGE = 'ticktick_gemini_model';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
export const GEMINI_MODEL_SUGGESTIONS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

// ---------- Configuração (salva só no navegador) ----------

export function getGeminiConfig(): GeminiConfig {
  if (typeof window === 'undefined') {
    return { apiKey: '', model: DEFAULT_GEMINI_MODEL };
  }
  const apiKey = (localStorage.getItem(API_KEY_STORAGE) || '').trim();
  const model = (localStorage.getItem(MODEL_STORAGE) || '').trim() || DEFAULT_GEMINI_MODEL;
  return { apiKey, model };
}

export function saveGeminiConfig(apiKey: string, model: string): void {
  const k = apiKey.trim();
  const m = model.trim();
  if (k) localStorage.setItem(API_KEY_STORAGE, k);
  else localStorage.removeItem(API_KEY_STORAGE);
  if (m) localStorage.setItem(MODEL_STORAGE, m);
  else localStorage.removeItem(MODEL_STORAGE);
}

// ---------- Tipos ----------

export type GeminiActionType =
  | 'create_task'
  | 'update_task'
  | 'complete_task'
  | 'delete_task'
  | 'duplicate_task'
  | 'add_subtask';

export interface GeminiTaskFields {
  title?: string;
  content?: string;
  listId?: string;
  priority?: 'none' | 'low' | 'medium' | 'high';
  tags?: string[];
  dueDate?: string; // YYYY-MM-DD ('' para limpar, em update)
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  durationMinutes?: number;
  recurrenceRule?: 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly';
  isNote?: boolean;
  isPinned?: boolean;
  estimatedPomos?: number;
  subtasks?: string[];
}

export interface GeminiAction {
  type: GeminiActionType;
  taskId?: string;
  subtaskTitle?: string;
  fields?: GeminiTaskFields;
}

export interface GeminiCommandResult {
  summary: string;
  actions: GeminiAction[];
}

export interface GeminiContext {
  today: string;
  weekday: string;
  now: string;
  lists: { id: string; name: string; type: 'task' | 'note' }[];
  tags: string[];
  tasks: {
    id: string;
    title: string;
    listId: string;
    dueDate?: string;
    status: string;
    priority: Priority;
  }[];
  activeListId?: string;
}

// ---------- Schema e prompt ----------

const PRIORITY_VALUES = ['none', 'low', 'medium', 'high'];
const RECURRENCE_VALUES = ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly'];
const ACTION_TYPES: GeminiActionType[] = [
  'create_task',
  'update_task',
  'complete_task',
  'delete_task',
  'duplicate_task',
  'add_subtask',
];

const FIELDS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    content: { type: 'STRING' },
    listId: { type: 'STRING' },
    priority: { type: 'STRING', enum: PRIORITY_VALUES },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    dueDate: { type: 'STRING' },
    startTime: { type: 'STRING' },
    endTime: { type: 'STRING' },
    durationMinutes: { type: 'INTEGER' },
    recurrenceRule: { type: 'STRING', enum: RECURRENCE_VALUES },
    isNote: { type: 'BOOLEAN' },
    isPinned: { type: 'BOOLEAN' },
    estimatedPomos: { type: 'INTEGER' },
    subtasks: { type: 'ARRAY', items: { type: 'STRING' } },
  },
};

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    actions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          type: { type: 'STRING', enum: ACTION_TYPES },
          taskId: { type: 'STRING' },
          subtaskTitle: { type: 'STRING' },
          fields: FIELDS_SCHEMA,
        },
        required: ['type'],
      },
    },
  },
  required: ['summary', 'actions'],
};

const SYSTEM_PROMPT = `You convert a user's request (Brazilian Portuguese, typed or spoken) into task manager actions.
Return ONLY JSON matching the response schema. No text outside the JSON.

Rules:
- "summary": one short sentence in Brazilian Portuguese saying what you did, or why nothing was done.
- Only use the action types allowed by the schema.
- create_task: fill "fields" with what the user said or clearly implied. Omit anything not mentioned. Never invent details.
- update_task, complete_task, delete_task, duplicate_task, add_subtask: set "taskId" to the id of the matching task in CONTEXT.tasks. If no task matches, do not create the action and say so in summary.
- add_subtask: put the checklist item text in "subtaskTitle" (one item per action).
- listId must be an id from CONTEXT.lists. If the user names a list, pick the closest one by name. If unsure, omit it.
- Convert relative dates ("hoje", "amanhã", "depois de amanhã", "sexta", "semana que vem", "em 3 dias") into dueDate in YYYY-MM-DD, using CONTEXT.today as the reference.
- Times are 24h "HH:mm". "15h" and "3 da tarde" both become 15:00. If the user gives a range, fill startTime and endTime. If they give a duration, fill durationMinutes.
- priority: "high" for alta/urgente/!high, "medium" for média/!med, "low" for baixa/!low, otherwise "none".
- recurrenceRule: "daily" (todo dia), "weekdays" (dias úteis), "weekly" (toda semana), "monthly" (todo mês), "yearly" (todo ano). Use "none" to remove recurrence on update.
- To clear dueDate or startTime/endTime on update, use an empty string.
- tags: lowercase, without "#". Reuse tags from CONTEXT.tags when they match.
- title: short, without date, time or priority words.
- isNote: true only if the user asks for a note.
- Put several actions in one response when the user asks for several things.`;

const RESPONSE_SCHEMA_FOR_TEST = undefined;

// ---------- Chamada à API ----------

async function callGemini(
  cfg: GeminiConfig,
  systemText: string,
  userText: string,
  schema?: object
): Promise<string> {
  if (!cfg.apiKey) {
    throw new Error('Configure sua API key do Gemini nas Configurações.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    cfg.model
  )}:generateContent`;

  const generationConfig: Record<string, unknown> = { temperature: 0.2 };
  if (schema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = schema;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': cfg.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemText }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig,
    }),
  });

  if (!res.ok) {
    let message = `Erro ${res.status} na API do Gemini.`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* resposta sem JSON: mantém a mensagem padrão */
    }
    throw new Error(message);
  }

  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('O Gemini não retornou conteúdo. Tente reformular o pedido.');
  }
  return text;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('O Gemini retornou um formato inválido. Tente de novo.');
  }
}

function isValidAction(a: unknown): a is GeminiAction {
  return (
    !!a &&
    typeof a === 'object' &&
    ACTION_TYPES.includes((a as GeminiAction).type)
  );
}

function sanitizeResult(raw: unknown): GeminiCommandResult {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const summary =
    typeof obj.summary === 'string' && obj.summary.trim() ? obj.summary.trim() : 'Pronto.';
  const actions = Array.isArray(obj.actions) ? obj.actions.filter(isValidAction) : [];
  return { summary, actions };
}

/**
 * Converte um pedido em texto/voz em ações de task.
 */
export async function runGeminiTaskCommand(
  text: string,
  context: GeminiContext,
  cfg: GeminiConfig
): Promise<GeminiCommandResult> {
  const userText = `CONTEXT:\n${JSON.stringify(context)}\n\nUSER REQUEST:\n${text}`;
  const raw = await callGemini(cfg, SYSTEM_PROMPT, userText, RESPONSE_SCHEMA);
  return sanitizeResult(parseJson(raw));
}

/**
 * Testa se a chave e o modelo funcionam. Retorna a resposta do modelo.
 */
export async function testGeminiConnection(cfg: GeminiConfig): Promise<string> {
  return callGemini(cfg, 'Reply with exactly the word OK.', 'Ping', RESPONSE_SCHEMA_FOR_TEST);
}
