import type { ParsedItem, ParseReceiptResponse } from './api';

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

export type { ParsedItem, ParseReceiptResponse } from './api';

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeInitialItems(): Item[] {
  const t = today();
  return [
    { id: uuid(), name: 'Chicken Breast',  quantity: '2 lbs',    purchase_date: t, predicted_expiry: daysFromNow(1),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Salmon Fillet',   quantity: '1 lb',     purchase_date: t, predicted_expiry: daysFromNow(2),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Strawberries',    quantity: '1 pint',   purchase_date: t, predicted_expiry: daysFromNow(3),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Spinach',         quantity: 'bag',      purchase_date: t, predicted_expiry: daysFromNow(4),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Greek Yogurt',    quantity: '32 oz',    purchase_date: t, predicted_expiry: daysFromNow(6),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Mango',           quantity: '2',        purchase_date: t, predicted_expiry: daysFromNow(8),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Cheddar Cheese',  quantity: '8 oz',     purchase_date: t, predicted_expiry: daysFromNow(12), status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Whole Milk',      quantity: '1 gallon', purchase_date: t, predicted_expiry: daysFromNow(14), status: 'in_fridge', status_at: null, created_at: t },
  ];
}

let items: Item[] = makeInitialItems();

// Exported for tests only
export function __resetItems() {
  items = makeInitialItems();
}

const DELAY = 200;
function wait<T>(v: T): Promise<T> {
  return new Promise(r => setTimeout(() => r(v), DELAY));
}

export async function getItems(): Promise<Item[]> {
  return wait(items.filter(i => i.status === 'in_fridge'));
}

export async function updateItem(id: string, patch: Partial<Item>): Promise<Item> {
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) throw new Error(`Item ${id} not found`);
  items[idx] = {
    ...items[idx],
    ...patch,
    status_at: patch.status && patch.status !== 'in_fridge'
      ? new Date().toISOString()
      : items[idx].status_at,
  };
  return wait(items[idx]);
}

export async function deleteItem(id: string): Promise<void> {
  items = items.filter(i => i.id !== id);
  return wait(undefined as unknown as void);
}

export async function createItems(newItems: ItemCreate[]): Promise<Item[]> {
  const t = today();
  const created: Item[] = newItems.map(item => ({
    ...item,
    id: uuid(),
    status: 'in_fridge' as const,
    status_at: null,
    created_at: t,
  }));
  items = [...items, ...created];
  return wait(created);
}

const MOCK_PARSE_RESULT: ParseReceiptResponse = {
  items: [
    { name: 'Salmon Fillet', quantity: '1 lb',     predicted_expiry_days: 2,  confidence: 'high' },
    { name: 'Mixed Greens',  quantity: 'bag',      predicted_expiry_days: 5,  confidence: 'low'  },
    { name: 'Whole Milk',    quantity: '1 gallon', predicted_expiry_days: 10, confidence: 'high' },
  ],
  parse_notes: null,
};

export async function parseReceipt(_base64: string): Promise<ParseReceiptResponse> {
  return wait(MOCK_PARSE_RESULT);
}
