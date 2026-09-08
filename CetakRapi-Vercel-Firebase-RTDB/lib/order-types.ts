export const orderStatuses = ['new', 'processing', 'ready', 'completed', 'cancelled'] as const;
export type OrderStatus = typeof orderStatuses[number];
export const statusLabels: Record<OrderStatus, string> = {
  new: 'Pesanan baru', processing: 'Sedang diproses', ready: 'Siap diambil/dikirim',
  completed: 'Selesai', cancelled: 'Dibatalkan',
};

export type OrderRecord = {
  id: string; code: string; customer_name: string; whatsapp: string; paper_size: string;
  color_mode: string; page_count: number; copy_count: number; total_pages: number;
  estimated_total: number; notes: string; status: OrderStatus; file_name: string;
  file_key: string; file_type: string; file_size: number; created_at: string; updated_at: string;
};
