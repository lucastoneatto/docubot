import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const SERVER_API_URL = process.env.API_URL ?? PUBLIC_API_URL;

export type CollectionStatus = 'pending' | 'processing' | 'ready' | 'error';

export type CollectionSettings = {
  color: string;
  greeting: string;
  customPrompt: string;
  temperature: number;
  maxFiles: number;
  maxFileSizeMb: number;
};

export type Collection = {
  id: string;
  name: string;
  status: CollectionStatus;
  summary: string | null;
  allowedOrigins: string[];
  settings: CollectionSettings;
  lastIngestedAt: string | null;
  /** Quotas set by the operator; read-only for the user. */
  monthlyMessageLimit: number | null;
  monthlyBudgetUsd: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationItem = {
  id: string;
  createdAt: string;
  messageCount: number;
  lastMessageAt: string | null;
  preview: string | null;
  noInfoCount: number;
  thumbsUp: number;
  thumbsDown: number;
};

export type ConversationList = {
  items: ConversationItem[];
  total: number;
  offset: number;
  limit: number;
};

export type ConversationDetail = {
  session: { id: string; createdAt: string };
  messages: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources: { filename: string; path: string }[];
    feedback: 'up' | 'down' | null;
    noInfo: boolean;
    createdAt: string;
  }[];
};

export type AdminOverview = {
  users: number;
  collections: number;
  collectionsError: number;
  collectionsProcessing: number;
  monthlyCost: number;
  monthlyMessages: number;
};

export type AdminUser = {
  id: string;
  email: string;
  plan: 'free' | 'paid';
  createdAt: string;
  collectionCount: number;
  monthlyCost: number;
};

export type AdminCollection = {
  id: string;
  name: string;
  status: CollectionStatus;
  userId: string;
  ownerEmail: string;
  ownerPlan: 'free' | 'paid';
  monthlyMessageLimit: number | null;
  monthlyBudgetUsd: number | null;
  lastIngestedAt: string | null;
  monthlyCost: number;
  monthlyMessages: number;
};

export type CollectionListItem = Collection & { documentCount: number; chunkCount: number };

export type DocumentItem = {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  fileSizeBytes: number;
  extractedText?: string;
  uploadedAt: string;
};

export type DocumentDetail = DocumentItem & { extractedText: string };

export type DocumentList = {
  items: DocumentItem[];
  total: number;
  offset: number;
  limit: number;
};

export type IngestJob = {
  id: string;
  status: 'queued' | 'running' | 'done' | 'error';
  filesFound: number;
  filesProcessed: number;
  filesChanged: number;
  filesFailed: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type UsageSummary = {
  total: number;
  indexing: { cost: number; files: number; tokens: number };
  chat: { cost: number; messages: number; tokens: number };
  summary: { cost: number; generations: number };
  avgPerMessage: number;
  avgPerFile: number;
};

export type CollectionDetail = {
  collection: Collection;
  job: IngestJob | null;
  stats: { documentCount: number; chunkCount: number; messageCount: number };
  usage: UsageSummary;
};

export type AuthResult = { token: string; user: { id: string; email: string } };

async function serverRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('docubot_token')?.value;
  const res = await fetch(`${SERVER_API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SERVER_API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    publicRequest<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    publicRequest<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => serverRequest<{ userId: string; email: string }>('/auth/me'),

  listCollections: () => serverRequest<CollectionListItem[]>('/collections'),
  createCollection: (name: string) =>
    serverRequest<Collection>('/collections', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  getCollection: (id: string) => serverRequest<CollectionDetail>(`/collections/${id}`),
  deleteCollection: (id: string) =>
    serverRequest<{ ok: boolean }>(`/collections/${id}`, { method: 'DELETE' }),
  /**
   * `files` is a FormData built from a `<input type="file">` (loose files)
   * or `<input webkitdirectory>` (a whole folder). Each file part is named
   * "files", and a matching "paths" field carries its relative path
   * (`webkitRelativePath`) so the server can preserve folder structure.
   */
  uploadFiles: (id: string, files: FormData) =>
    serverRequest<{ jobId: string }>(`/collections/${id}/upload`, {
      method: 'POST',
      body: files,
    }),
  regenerateSummary: (id: string) =>
    serverRequest<{ summary: string }>(`/collections/${id}/summary`, {
      method: 'POST',
    }),
  updateCollection: (
    id: string,
    body: Partial<{
      name: string;
      allowedOrigins: string[];
      settings: Partial<CollectionSettings>;
    }>,
  ) =>
    serverRequest<Collection>(`/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  listDocuments: (id: string, offset = 0, limit = 50) =>
    serverRequest<DocumentList>(`/collections/${id}/documents?offset=${offset}&limit=${limit}`),
  getDocument: (id: string, documentId: string) =>
    serverRequest<DocumentDetail>(`/collections/${id}/documents/${documentId}`),
  deleteDocument: (id: string, documentId: string) =>
    serverRequest<{ ok: boolean }>(`/collections/${id}/documents/${documentId}`, {
      method: 'DELETE',
    }),
  getStatus: (id: string) =>
    serverRequest<{ status: CollectionStatus; job: IngestJob | null }>(
      `/collections/${id}/status`,
    ),
  listConversations: (id: string, offset = 0, limit = 50) =>
    serverRequest<ConversationList>(
      `/collections/${id}/conversations?offset=${offset}&limit=${limit}`,
    ),
  getConversation: (id: string, sessionId: string) =>
    serverRequest<ConversationDetail>(
      `/collections/${id}/conversations/${sessionId}`,
    ),
  forgotPassword: (email: string) =>
    publicRequest<{ ok: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    publicRequest<{ ok: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

/**
 * Operator panel. Authenticates with basic auth from the server: the
 * credentials never reach the user's browser.
 */
async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const user = process.env.ADMIN_USER ?? '';
  const password = process.env.ADMIN_PASSWORD ?? '';
  const credentials = Buffer.from(`${user}:${password}`).toString('base64');

  const res = await fetch(`${SERVER_API_URL}/admin${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export const adminApi = {
  overview: () => adminRequest<AdminOverview>('/overview'),
  users: () => adminRequest<AdminUser[]>('/users'),
  setPlan: (userId: string, plan: 'free' | 'paid') =>
    adminRequest<{ id: string }>(`/users/${userId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    }),
  collections: () => adminRequest<AdminCollection[]>('/collections'),
  setQuota: (
    collectionId: string,
    quota: {
      monthlyMessageLimit?: number | null;
      monthlyBudgetUsd?: number | null;
    },
  ) =>
    adminRequest<{ id: string }>(`/collections/${collectionId}/quota`, {
      method: 'PATCH',
      body: JSON.stringify(quota),
    }),
};

export function embedSnippet(collectionId: string): string {
  return `<script src="${PUBLIC_API_URL}/widget.js" data-collection-id="${collectionId}" defer></script>`;
}
