export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return '۰ تومان';
  return `${amount.toLocaleString('fa-IR')} تومان`;
}

export function formatNumber(num: number): string {
  if (num === undefined || num === null) return '۰';
  return num.toLocaleString('fa-IR');
}

export const formatPersianNumber = formatNumber;

export function formatDateFa(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const date = new Date(isoDateString);
    // Format to Persian Solar string
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoDateString;
  }
}

export function formatDateShortFa(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return isoDateString;
  }
}

export function getOrderStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'unprocessed':
      return {
        label: 'پردازش نشده / جدید',
        bg: 'bg-amber-950/60',
        text: 'text-amber-300',
        border: 'border-amber-700/60',
      };
    case 'queued':
      return {
        label: 'در صف تولید',
        bg: 'bg-blue-950/60',
        text: 'text-blue-300',
        border: 'border-blue-700/60',
      };
    case 'in_production':
      return {
        label: 'در حال ساخت در خط تولید',
        bg: 'bg-indigo-950/60',
        text: 'text-indigo-300',
        border: 'border-indigo-700/60',
      };
    case 'produced':
      return {
        label: 'تولید شده / آماده در انبار',
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-300',
        border: 'border-emerald-700/60',
      };
    case 'dispatched':
      return {
        label: 'ارسال شده برای مشتری',
        bg: 'bg-teal-950/60',
        text: 'text-teal-300',
        border: 'border-teal-700/60',
      };
    case 'cancelled':
      return {
        label: 'لغو شده',
        bg: 'bg-rose-950/60',
        text: 'text-rose-300',
        border: 'border-rose-700/60',
      };
    default:
      return {
        label: status,
        bg: 'bg-zinc-800',
        text: 'text-zinc-300',
        border: 'border-zinc-700',
      };
  }
}

export function getPriorityBadge(priority: string): { label: string; bg: string; text: string; border: string } {
  switch (priority) {
    case 'urgent':
      return { 
        label: 'بسیار فوری (Urgent)', 
        bg: 'bg-rose-950/70', 
        text: 'text-rose-300', 
        border: 'border-rose-800/80' 
      };
    case 'high':
      return { 
        label: 'اولویت بالا', 
        bg: 'bg-amber-950/70', 
        text: 'text-amber-300', 
        border: 'border-amber-800/80' 
      };
    case 'medium':
      return { 
        label: 'معمولی', 
        bg: 'bg-sky-950/70', 
        text: 'text-sky-300', 
        border: 'border-sky-800/80' 
      };
    case 'low':
      return { 
        label: 'عادی / کم', 
        bg: 'bg-zinc-800/80', 
        text: 'text-zinc-300', 
        border: 'border-zinc-700' 
      };
    default:
      return { 
        label: priority, 
        bg: 'bg-zinc-800/80', 
        text: 'text-zinc-300', 
        border: 'border-zinc-700' 
      };
  }
}
