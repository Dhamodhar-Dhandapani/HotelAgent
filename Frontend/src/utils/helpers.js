export function formatTime(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDateTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export function truncate(str, n = 80) {
    return str?.length > n ? str.slice(0, n) + '…' : str;
}
