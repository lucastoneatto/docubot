'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminApi, api } from '@/lib/api';

const TOKEN_COOKIE = 'docubot_token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

function setToken(token: string) {
  return cookies().then((store) =>
    store.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: TOKEN_MAX_AGE,
      path: '/',
    }),
  );
}

export async function loginAction(
  _prev: { error: string | null },
  formData: FormData,
) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  try {
    const { token } = await api.login(email, password);
    await setToken(token);
  } catch {
    return { error: 'Invalid credentials' };
  }
  redirect('/dashboard');
}

export async function registerAction(
  _prev: { error: string | null },
  formData: FormData,
) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }
  try {
    const { token } = await api.register(email, password);
    await setToken(token);
  } catch (error) {
    return { error: (error as Error).message.includes('409') ? 'Email already registered' : 'Could not register' };
  }
  redirect('/dashboard');
}

export async function logoutAction() {
  (await cookies()).delete(TOKEN_COOKIE);
  redirect('/login');
}

export async function createCollectionAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  let collection: Awaited<ReturnType<typeof api.createCollection>>;
  try {
    collection = await api.createCollection(name);
  } catch {
    // Transient API failure (e.g. a redeploy mid-request): stay on the
    // dashboard instead of crashing to the generic error boundary.
    revalidatePath('/dashboard');
    return;
  }
  revalidatePath('/dashboard');
  redirect(`/dashboard/collections/${collection.id}`);
}

export async function deleteCollectionAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  try {
    await api.deleteCollection(id);
  } catch {
    // Transient API failure: collection stays listed, user can retry.
    revalidatePath('/dashboard');
    return;
  }
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

/**
 * Accepts a FormData built client-side from either a loose multi-file
 * `<input type="file" multiple>` or a whole-folder
 * `<input type="file" webkitdirectory>`. Each entry is a "files" field
 * (the File itself) with a matching "paths" field carrying its relative
 * path, which for a folder upload is `file.webkitRelativePath`.
 */
export async function uploadFilesAction(id: string, formData: FormData) {
  if (!id) return;
  try {
    await api.uploadFiles(id, formData);
  } catch {
    // Transient API failure: user can retry the upload.
  }
  revalidatePath(`/dashboard/collections/${id}`);
}

export async function deleteDocumentAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const documentId = String(formData.get('documentId') ?? '');
  if (!id || !documentId) return;
  try {
    await api.deleteDocument(id, documentId);
  } catch {
    // Transient API failure: document stays listed, user can retry.
  }
  revalidatePath(`/dashboard/collections/${id}`);
}

export async function updateSettingsAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const origins = String(formData.get('allowedOrigins') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  try {
    await api.updateCollection(id, {
      name: String(formData.get('name') ?? '').trim() || undefined,
      allowedOrigins: origins,
      settings: {
        color: String(formData.get('color') ?? '').trim() || undefined,
        greeting: String(formData.get('greeting') ?? '').trim() || undefined,
        // Empty string = the user cleared their prompt, must be persisted.
        customPrompt: String(formData.get('customPrompt') ?? '').trim(),
        temperature: formData.get('temperature')
          ? Number(formData.get('temperature'))
          : undefined,
        maxFiles: formData.get('maxFiles')
          ? Number(formData.get('maxFiles'))
          : undefined,
        maxFileSizeMb: formData.get('maxFileSizeMb')
          ? Number(formData.get('maxFileSizeMb'))
          : undefined,
      },
    });
  } catch {
    // Transient API failure: settings keep their previous values, user can retry.
  }
  revalidatePath(`/dashboard/collections/${id}`);
  revalidatePath(`/dashboard/collections/${id}/preview`);
}

export async function regenerateSummaryAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  try {
    await api.regenerateSummary(id);
  } catch {
    // Still no indexed documents; UI shows the empty state.
  }
  revalidatePath(`/dashboard/collections/${id}`);
  revalidatePath(`/dashboard/collections/${id}/preview`);
}

export async function forgotPasswordAction(
  _prev: { sent: boolean; error: string | null },
  formData: FormData,
) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { sent: false, error: 'Enter your email' };
  try {
    await api.forgotPassword(email);
  } catch {
    // The API always responds ok to avoid revealing which emails exist.
  }
  return { sent: true, error: null };
}

export async function resetPasswordAction(
  _prev: { error: string | null },
  formData: FormData,
) {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }
  if (password !== String(formData.get('confirm') ?? '')) {
    return { error: 'Passwords do not match' };
  }
  try {
    await api.resetPassword(token, password);
  } catch {
    return { error: 'The link is invalid or has expired' };
  }
  redirect('/login?reset=1');
}

export async function setPlanAction(formData: FormData) {
  const userId = String(formData.get('userId') ?? '');
  const plan = String(formData.get('plan') ?? '');
  if (!userId || (plan !== 'free' && plan !== 'paid')) return;
  try {
    await adminApi.setPlan(userId, plan);
  } catch {
    // Transient API failure: plan keeps its previous value, admin can retry.
  }
  revalidatePath('/admin/users');
}

/** Empty field = no limit (null). */
function parseQuota(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function setQuotaAction(formData: FormData) {
  const collectionId = String(formData.get('collectionId') ?? '');
  if (!collectionId) return;
  try {
    await adminApi.setQuota(collectionId, {
      monthlyMessageLimit: parseQuota(formData.get('monthlyMessageLimit')),
      monthlyBudgetUsd: parseQuota(formData.get('monthlyBudgetUsd')),
    });
  } catch {
    // Transient API failure: quota keeps its previous value, admin can retry.
  }
  revalidatePath('/admin/collections');
}
