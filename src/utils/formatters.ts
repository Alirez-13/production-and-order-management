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
        label: 'پردازش نشده (جدید)',
        bgDark: 'bg-amber-950/60',
        textDark: 'text-amber-200',
        borderDark: 'border-amber-700/80',
        bgLight: 'bg-amber-100/80',
        textLight: 'text-amber-950',
        borderLight: 'border-amber-400',
        bg: 'bg-amber-950/60',
        text: 'text-amber-200',
        border: 'border-amber-700/80',
      };
    case 'queued':
      return {
        label: 'در صف تولید',
        bgDark: 'bg-blue-950/60',
        textDark: 'text-blue-200',
        borderDark: 'border-blue-700/80',
        bgLight: 'bg-blue-100/80',
        textLight: 'text-blue-950',
        borderLight: 'border-blue-400',
        bg: 'bg-blue-950/60',
        text: 'text-blue-200',
        border: 'border-blue-700/80',
      };
    case 'in_production':
      return {
        label: 'در حال ساخت در خط',
        bgDark: 'bg-indigo-950/60',
        textDark: 'text-indigo-200',
        borderDark: 'border-indigo-700/80',
        bgLight: 'bg-indigo-100/80',
        textLight: 'text-indigo-950',
        borderLight: 'border-indigo-400',
        bg: 'bg-indigo-950/60',
        text: 'text-indigo-200',
        border: 'border-indigo-700/80',
      };
    case 'produced':
      return {
        label: 'تولید شده (در انبار)',
        bgDark: 'bg-emerald-950/60',
        textDark: 'text-emerald-200',
        borderDark: 'border-emerald-700/80',
        bgLight: 'bg-emerald-100/80',
        textLight: 'text-emerald-950',
        borderLight: 'border-emerald-400',
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-200',
        border: 'border-emerald-700/80',
      };
    case 'dispatched':
      return {
        label: 'ارسال شده به مشتری',
        bgDark: 'bg-teal-950/60',
        textDark: 'text-teal-200',
        borderDark: 'border-teal-700/80',
        bgLight: 'bg-teal-100/80',
        textLight: 'text-teal-950',
        borderLight: 'border-teal-400',
        bg: 'bg-teal-950/60',
        text: 'text-teal-200',
        border: 'border-teal-700/80',
      };
    case 'cancelled':
      return {
        label: 'لغو شده',
        bgDark: 'bg-rose-950/60',
        textDark: 'text-rose-200',
        borderDark: 'border-rose-700/80',
        bgLight: 'bg-rose-100/80',
        textLight: 'text-rose-950',
        borderLight: 'border-rose-400',
        bg: 'bg-rose-950/60',
        text: 'text-rose-200',
        border: 'border-rose-700/80',
      };
    default:
      return {
        label: status,
        bgDark: 'bg-zinc-900',
        textDark: 'text-zinc-200',
        borderDark: 'border-zinc-700',
        bgLight: 'bg-slate-100',
        textLight: 'text-slate-900',
        borderLight: 'border-slate-300',
        bg: 'bg-zinc-900',
        text: 'text-zinc-200',
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
        label: 'بسیار فوری', 
        bgDark: 'bg-rose-950/70', 
        textDark: 'text-rose-200', 
        borderDark: 'border-rose-700',
        bgLight: 'bg-rose-100',
        textLight: 'text-rose-950',
        borderLight: 'border-rose-400',
        bg: 'bg-rose-950/70', 
        text: 'text-rose-200', 
        border: 'border-rose-700',
      };
    case 'high':
      return { 
        label: 'اولویت بالا', 
        bgDark: 'bg-amber-950/70', 
        textDark: 'text-amber-200', 
        borderDark: 'border-amber-700',
        bgLight: 'bg-amber-100',
        textLight: 'text-amber-950',
        borderLight: 'border-amber-400',
        bg: 'bg-amber-950/70', 
        text: 'text-amber-200', 
        border: 'border-amber-700',
      };
    case 'medium':
      return { 
        label: 'معمولی', 
        bgDark: 'bg-sky-950/70', 
        textDark: 'text-sky-200', 
        borderDark: 'border-sky-700',
        bgLight: 'bg-sky-100',
        textLight: 'text-sky-950',
        borderLight: 'border-sky-400',
        bg: 'bg-sky-950/70', 
        text: 'text-sky-200', 
        border: 'border-sky-700',
      };
    case 'low':
      return { 
        label: 'عادی / کم', 
        bgDark: 'bg-zinc-800/80', 
        textDark: 'text-zinc-200', 
        borderDark: 'border-zinc-700',
        bgLight: 'bg-slate-100',
        textLight: 'text-slate-900',
        borderLight: 'border-slate-300',
        bg: 'bg-zinc-800/80', 
        text: 'text-zinc-200', 
        border: 'border-zinc-700',
      };
    default:
      return { 
        label: priority, 
        bgDark: 'bg-zinc-800/80', 
        textDark: 'text-zinc-200', 
        borderDark: 'border-zinc-700',
        bgLight: 'bg-slate-100',
        textLight: 'text-slate-900',
        borderLight: 'border-slate-300',
        bg: 'bg-zinc-800/80', 
        text: 'text-zinc-200', 
        border: 'border-zinc-700',
      };
  }
}
