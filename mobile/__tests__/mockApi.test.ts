import * as mockApi from '../services/mockApi';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-24'));
  mockApi.__resetItems();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('getItems', () => {
  it('returns 8 in_fridge items', async () => {
    const promise = mockApi.getItems();
    jest.runAllTimers();
    const items = await promise;
    expect(items).toHaveLength(8);
    expect(items.every(i => i.status === 'in_fridge')).toBe(true);
  });

  it('predicted_expiry values are ISO date strings', async () => {
    const promise = mockApi.getItems();
    jest.runAllTimers();
    const items = await promise;
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    items.forEach(i => expect(i.predicted_expiry).toMatch(isoDate));
  });
});

describe('updateItem', () => {
  it('marks item as consumed and hides it from getItems', async () => {
    let getPromise = mockApi.getItems();
    jest.runAllTimers();
    const [first] = await getPromise;
    const updatePromise = mockApi.updateItem(first.id, { status: 'consumed' });
    jest.runAllTimers();
    await updatePromise;
    getPromise = mockApi.getItems();
    jest.runAllTimers();
    const after = await getPromise;
    expect(after.find(i => i.id === first.id)).toBeUndefined();
  });
});

describe('deleteItem', () => {
  it('removes item from getItems', async () => {
    let getPromise = mockApi.getItems();
    jest.runAllTimers();
    const [first] = await getPromise;
    const deletePromise = mockApi.deleteItem(first.id);
    jest.runAllTimers();
    await deletePromise;
    getPromise = mockApi.getItems();
    jest.runAllTimers();
    const after = await getPromise;
    expect(after.find(i => i.id === first.id)).toBeUndefined();
    expect(after).toHaveLength(7);
  });
});

describe('createItems', () => {
  it('adds new items that appear in getItems', async () => {
    const createPromise = mockApi.createItems([{
      name: 'Test Item',
      quantity: '1',
      purchase_date: '2026-04-24',
      predicted_expiry: '2026-05-01',
    }]);
    jest.runAllTimers();
    await createPromise;
    const getPromise = mockApi.getItems();
    jest.runAllTimers();
    const items = await getPromise;
    expect(items.some(i => i.name === 'Test Item')).toBe(true);
    expect(items).toHaveLength(9);
  });
});

describe('parseReceipt', () => {
  it('returns 3 parsed items', async () => {
    const promise = mockApi.parseReceipt('fake_base64');
    jest.runAllTimers();
    const result = await promise;
    expect(result.items).toHaveLength(3);
    expect(result.items[0].confidence).toBe('high');
    expect(result.items[1].confidence).toBe('low');
  });
});
