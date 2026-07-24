export function stockStatus(stockQuantity) {
  if (stockQuantity <= 0) return { label: 'Out of stock', className: 'badge-danger' };
  if (stockQuantity <= 5) return { label: 'Low stock', className: 'badge-warn' };
  return { label: 'In stock', className: 'badge-ok' };
}
