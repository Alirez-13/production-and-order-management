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

export function getOrderStatusBadge(status: string): { 
  label: string; 
  bgDark: string; 
  textDark: string; 
  borderDark: string;
  bgLight: string;
  textLight: string;
  borderLight: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'unprocessed':
      return {
        label: 'پردازش نشده / جدید',
        bgDark: 'bg-amber-950/40',
        textDark: 'text-amber-300',
        borderDark: 'border-amber-700/50',
        bgLight: 'bg-amber-50',
        textLight: 'text-amber-900',
        borderLight: 'border-amber-200',
        bg: 'bg-amber-950/40',
        text: 'text-amber-300',
        border: 'border-amber-700/50',
      };
    case 'queued':
      return {
        label: 'در صف تولید',
        bgDark: 'bg-blue-950/40',
        textDark: 'text-blue-300',
        borderDark: 'border-blue-700/50',
        bgLight: 'bg-blue-50',
        textLight: 'text-blue-900',
        borderLight: 'border-blue-200',
        bg: 'bg-blue-950/40',
        text: 'text-blue-300',
        border: 'border-blue-700/50',
      };
    case 'in_production':
      return {
        label: 'در حال ساخت در خط تولید',
        bgDark: 'bg-indigo-950/40',
        textDark: 'text-indigo-300',
        borderDark: 'border-indigo-700/50',
        bgLight: 'bg-indigo-50',
        textLight: 'text-indigo-900',
        borderLight: 'border-indigo-200',
        bg: 'bg-indigo-950/40',
        text: 'text-indigo-300',
        border: 'border-indigo-700/50',
      };
    case 'produced':
      return {
        label: 'تولید شده / آماده در انبار',
        bgDark: 'bg-emerald-950/40',
        textDark: 'text-emerald-300',
        borderDark: 'border-emerald-700/50',
        bgLight: 'bg-emerald-50',
        textLight: 'text-emerald-900',
        borderLight: 'border-emerald-200',
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-300',
        border: 'border-emerald-700/50',
      };
    case 'dispatched':
      return {
        label: 'ارسال شده برای مشتری',
        bgDark: 'bg-teal-950/40',
        textDark: 'text-teal-300',
        borderDark: 'border-teal-700/50',
        bgLight: 'bg-teal-50',
        textLight: 'text-teal-900',
        borderLight: 'border-teal-200',
        bg: 'bg-teal-950/40',
        text: 'text-teal-300',
        border: 'border-teal-700/50',
      };
    case 'cancelled':
      return {
        label: 'لغو شده',
        bgDark: 'bg-rose-950/40',
        textDark: 'text-rose-300',
        borderDark: 'border-rose-700/50',
        bgLight: 'bg-rose-50',
        textLight: 'text-rose-900',
        borderLight: 'border-rose-200',
        bg: 'bg-rose-950/40',
        text: 'text-rose-300',
        border: 'border-rose-700/50',
      };
    default:
      return {
        label: status,
        bgDark: 'bg-zinc-900',
        textDark: 'text-zinc-300',
        borderDark: 'border-zinc-700',
        bgLight: 'bg-zinc-100',
        textLight: 'text-zinc-800',
        borderLight: 'border-zinc-300',
        bg: 'bg-zinc-900',
        text: 'text-zinc-300',
        border: 'border-zinc-700',
      };
  }
}

export function getPriorityBadge(priority: string): { 
  label: string; 
  bgDark: string; 
  textDark: string; 
  borderDark: string;
  bgLight: string;
  textLight: string;
  borderLight: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case 'urgent':
      return { 
        label: 'بسیار فوری (Urgent)', 
        bgDark: 'bg-rose-950/50', 
        textDark: 'text-rose-300', 
        borderDark: 'border-rose-800/60',
        bgLight: 'bg-rose-50',
        textLight: 'text-rose-800',
        borderLight: 'border-rose-200',
        bg: 'bg-rose-950/50', 
        text: 'text-rose-300', 
        border: 'border-rose-800/60',
      };
    case 'high':
      return { 
        label: 'اولویت بالا', 
        bgDark: 'bg-amber-950/50', 
        textDark: 'text-amber-300', 
        borderDark: 'border-amber-800/60',
        bgLight: 'bg-amber-50',
        textLight: 'text-amber-800',
        borderLight: 'border-amber-200',
        bg: 'bg-amber-950/50', 
        text: 'text-amber-300', 
        border: 'border-amber-800/60',
      };
    case 'medium':
      return { 
        label: 'معمولی', 
        bgDark: 'bg-sky-950/50', 
        textDark: 'text-sky-300', 
        borderDark: 'border-sky-800/60',
        bgLight: 'bg-sky-50',
        textLight: 'text-sky-800',
        borderLight: 'border-sky-200',
        bg: 'bg-sky-950/50', 
        text: 'text-sky-300', 
        border: 'border-sky-800/60',
      };
    case 'low':
      return { 
        label: 'عادی / کم', 
        bgDark: 'bg-zinc-800/60', 
        textDark: 'text-zinc-300', 
        borderDark: 'border-zinc-700/60',
        bgLight: 'bg-zinc-100',
        textLight: 'text-zinc-700',
        borderLight: 'border-zinc-200',
        bg: 'bg-zinc-800/60', 
        text: 'text-zinc-300', 
        border: 'border-zinc-700/60',
      };
    default:
      return { 
        label: priority, 
        bgDark: 'bg-zinc-800/60', 
        textDark: 'text-zinc-300', 
        borderDark: 'border-zinc-700',
        bgLight: 'bg-zinc-100',
        textLight: 'text-zinc-800',
        borderLight: 'border-zinc-200',
        bg: 'bg-zinc-800/60', 
        text: 'text-zinc-300', 
        border: 'border-zinc-700',
      };
  }
}
