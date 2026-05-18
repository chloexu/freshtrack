import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';
import * as ImageManipulator from 'expo-image-manipulator';

const TOKEN_KEY = 'auth_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Auth ---

export async function register(email: string, password: string): Promise<void> {
  const { token } = await request<{ token: string }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false,
  );
  await saveToken(token);
}

export async function login(email: string, password: string): Promise<void> {
  const { token } = await request<{ token: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false,
  );
  await saveToken(token);
}

// --- Items (same signatures as mockApi.ts) ---

export type Item = {
  id: string;
  name: string;
  quantity: string | null;
  purchase_date: string;
  predicted_expiry: string;
  status: 'in_fridge' | 'consumed' | 'discarded';
  status_at: string | null;
  created_at: string;
};

export type ItemCreate = {
  name: string;
  quantity: string | null;
  purchase_date: string;
  predicted_expiry: string;
};

export async function getItems(): Promise<Item[]> {
  return request<Item[]>('/items');
}

export async function updateItem(id: string, patch: Partial<Item>): Promise<Item> {
  return request<Item>(`/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteItem(id: string): Promise<void> {
  return request<void>(`/items/${id}`, { method: 'DELETE' });
}

export async function createItems(items: ItemCreate[]): Promise<Item[]> {
  return request<Item[]>('/items', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// --- Receipt Parsing ---

export type ParsedItem = {
  name: string;
  quantity: string | null;
  predicted_expiry_days: number;
  confidence: 'high' | 'medium' | 'low';
};

export type ParseReceiptResponse = {
  items: ParsedItem[];
  parse_notes: string | null;
};

export async function parseReceipt(photoUri: string): Promise<ParseReceiptResponse> {
  // Constrain the long edge to 1024px to minimise upload size and token cost
  const info = await ImageManipulator.manipulateAsync(photoUri, [], {});
  const isPortrait = info.height > info.width;
  const resize = isPortrait ? { height: 1024 } : { width: 1024 };

  const manipulated = await ImageManipulator.manipulateAsync(
    photoUri,
    [{ resize }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  const image_base64 = manipulated.base64;
  if (!image_base64) throw new Error('Image encoding failed — try again');

  return request<ParseReceiptResponse>('/parse/receipt', {
    method: 'POST',
    body: JSON.stringify({ image_base64 }),
  });
}
