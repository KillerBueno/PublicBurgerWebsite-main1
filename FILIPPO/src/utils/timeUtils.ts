import { format, parse, addDays, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import type { OrariApertura, GiornoSettimana } from '../types';

export const isOpenNow = (openingHours: OrariApertura, now: Date = new Date()): { isOpen: boolean; nextOpen?: Date; closingSoon?: boolean } => {
    const currentDay = getDay(now) as GiornoSettimana;
    const currentTimeString = format(now, 'HH:mm');

    const yesterday = getDay(addDays(now, -1)) as GiornoSettimana;
    const yesterdaySlots = openingHours[yesterday] || [];

    for (const slot of yesterdaySlots) {
        if (slot.close < slot.open) {
            if (currentTimeString < slot.close) {
                return { isOpen: true, closingSoon: false };
            }
        }
    }

    const todaySlots = openingHours[currentDay] || [];
    for (const slot of todaySlots) {
        if (slot.close < slot.open) {
            if (currentTimeString >= slot.open) {
                return { isOpen: true };
            }
        } else {
            if (currentTimeString >= slot.open && currentTimeString < slot.close) {
                return { isOpen: true };
            }
        }
    }

    for (const slot of todaySlots) {
        if (currentTimeString < slot.open) {
            const next = parse(slot.open, 'HH:mm', now);
            return { isOpen: false, nextOpen: next };
        }
    }

    let nextDate = now;
    for (let i = 1; i <= 7; i++) {
        nextDate = addDays(now, i);
        const day = getDay(nextDate) as GiornoSettimana;
        const slots = openingHours[day];
        if (slots && slots.length > 0) {
            const nextOpenStr = slots[0].open;
            const nextOpenDate = parse(nextOpenStr, 'HH:mm', nextDate);
            return { isOpen: false, nextOpen: nextOpenDate };
        }
    }

    return { isOpen: false };
};

export const formatTimeIt = (date: Date) => {
    const now = new Date();
    if (getDay(date) === getDay(now)) {
        return `Oggi alle ${format(date, 'HH:mm')}`;
    }
    return format(date, "EEEE 'alle' HH:mm", { locale: it });
}
