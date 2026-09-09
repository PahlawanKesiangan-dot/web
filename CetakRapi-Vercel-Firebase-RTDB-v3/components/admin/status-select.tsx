'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { orderStatuses, statusLabels, type OrderStatus } from '@/lib/order-types';

export function StatusSelect({ code, value, onChange }: { code: string; value: OrderStatus; onChange?: (value: OrderStatus) => void }) {
  const [status, setStatus] = useState(value);
  const [saving, setSaving] = useState(false);
  async function update(next: string | null) {
    if (!next || !orderStatuses.includes(next as OrderStatus)) return;
    const previous = status; const typed = next as OrderStatus;
    setStatus(typed); setSaving(true);
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(code)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: typed }) });
    if (!response.ok) setStatus(previous); else onChange?.(typed);
    setSaving(false);
  }
  return <Select value={status} onValueChange={update} disabled={saving}><SelectTrigger aria-label={`Status pesanan ${code}`} className="h-9 w-full min-w-44 bg-white"><SelectValue /></SelectTrigger><SelectContent>{orderStatuses.map((item) => <SelectItem key={item} value={item}>{statusLabels[item]}</SelectItem>)}</SelectContent></Select>;
}
