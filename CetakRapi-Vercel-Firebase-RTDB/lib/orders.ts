import 'server-only';

import { adminDatabase } from '@/lib/firebase/admin';
import type { OrderRecord, OrderStatus } from '@/lib/order-types';
export { orderStatuses, statusLabels } from '@/lib/order-types';
export type { OrderRecord, OrderStatus } from '@/lib/order-types';

export async function createOrder(order: OrderRecord): Promise<void> {
  await adminDatabase().ref().update({
    [`orders/${order.id}`]: order,
    [`orderCodes/${order.code}`]: order.id,
  });
}

export async function listOrders(limit = 100): Promise<OrderRecord[]> {
  const snapshot = await adminDatabase().ref('orders').orderByChild('created_at').limitToLast(limit).get();
  const value = snapshot.val() as Record<string, OrderRecord> | null;
  return Object.values(value || {}).sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function getOrder(code: string): Promise<OrderRecord | null> {
  const idSnapshot = await adminDatabase().ref(`orderCodes/${safeKey(code)}`).get();
  const id = idSnapshot.val();
  if (typeof id !== 'string' || !id) return null;
  const orderSnapshot = await adminDatabase().ref(`orders/${id}`).get();
  return orderSnapshot.exists() ? orderSnapshot.val() as OrderRecord : null;
}

export async function setOrderStatus(code: string, status: OrderStatus): Promise<boolean> {
  const idSnapshot = await adminDatabase().ref(`orderCodes/${safeKey(code)}`).get();
  const id = idSnapshot.val();
  if (typeof id !== 'string' || !id) return false;
  await adminDatabase().ref(`orders/${id}`).update({ status, updated_at: new Date().toISOString() });
  return true;
}

function safeKey(value: string) {
  return value.replace(/[.#$[\]/]/g, '');
}
