export const orderStatuses = ['new', 'processing', 'ready', 'completed', 'cancelled'] as const;
export type OrderStatus = typeof orderStatuses[number];
export const statusLabels: Record<OrderStatus, string> = {
  new: 'Pesanan baru', processing: 'Sedang diproses', ready: 'Siap diambil/dikirim',
  completed: 'Selesai', cancelled: 'Dibatalkan',
};

export type OrderFileRecord = {
  id: string;
  key: string;
  name: string;
  size: number;
  type: string;
};

export type OrderRecord = {
  id: string; code: string; customer_name: string; whatsapp: string; paper_size: string;
  color_mode: string; page_count: number; copy_count: number; total_pages: number;
  estimated_total: number; notes: string; status: OrderStatus; files?: OrderFileRecord[];
  file_name?: string; file_key?: string; file_type?: string; file_size?: number;
  created_at: string; updated_at: string;
};

export function getOrderFiles(order: OrderRecord): OrderFileRecord[] {
  const files = Array.isArray(order.files) ? order.files.filter(isOrderFile) : [];
  if (files.length) return files;
  if (order.file_name && order.file_key && order.file_type && Number.isInteger(order.file_size) && Number(order.file_size) > 0) {
    return [{ id: 'legacy', key: order.file_key, name: order.file_name, size: Number(order.file_size), type: order.file_type }];
  }
  return [];
}

function isOrderFile(value: unknown): value is OrderFileRecord {
  if (!value || typeof value !== 'object') return false;
  const file = value as Partial<OrderFileRecord>;
  return Boolean(file.id && file.key && file.name && file.type && Number.isInteger(file.size) && Number(file.size) > 0);
}
