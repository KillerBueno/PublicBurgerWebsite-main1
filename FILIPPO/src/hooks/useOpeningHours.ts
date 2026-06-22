import { useMemo, useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';


export interface FasciaOrariaSlot {
    label: string;
    value: number; // minuti dalla mezzanotte
    sortValue: number; // aggiustato per il passaggio della mezzanotte
}

export const useOpeningHours = () => {
    const { config } = useConfig();
    const openingHours = config?.openingHours;

    // Stato per forzare il ricalcolo ogni minuto
    const [nowMinutes, setNowMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setNowMinutes(now.getHours() * 60 + now.getMinutes());
        }, 30000); // Controlla ogni 30 secondi per precisione
        return () => clearInterval(interval);
    }, []);

    const validSlots = useMemo(() => {
        if (!openingHours) return [];

        const today = new Date().getDay();
        const yesterday = today === 0 ? 6 : today - 1;

        const todayConfig = openingHours[today as unknown as number];
        const yesterdayConfig = openingHours[yesterday as unknown as number];

        const slots: FasciaOrariaSlot[] = [];

        const addSlots = (startMin: number, endMin: number, isNextDay: boolean) => {
            let current = startMin;
            while (current <= endMin) {
                const displayH = Math.floor(current / 60) % 24;
                const displayM = current % 60;
                const timeString = `${displayH.toString().padStart(2, '0')}:${displayM.toString().padStart(2, '0')}`;
                const sortValue = isNextDay ? current + 1440 : current;

                if (!slots.some(s => s.sortValue === sortValue)) {
                    slots.push({
                        label: timeString,
                        value: current % 1440,
                        sortValue: sortValue
                    });
                }
                current += 15;
            }
        };

        if (yesterdayConfig) {
            yesterdayConfig.forEach((slot: { open: string, close: string }) => {
                const [openH, openM] = slot.open.split(':').map(Number);
                const [closeH, closeM] = slot.close.split(':').map(Number);
                const openMin = openH * 60 + openM;
                let closeMin = closeH * 60 + closeM;

                if (closeMin < openMin) {
                    addSlots(0, closeMin, false);
                }
            });
        }

        if (todayConfig) {
            todayConfig.forEach((slot: { open: string, close: string }) => {
                const [openH, openM] = slot.open.split(':').map(Number);
                const [closeH, closeM] = slot.close.split(':').map(Number);

                const openMin = openH * 60 + openM;
                let closeMin = closeH * 60 + closeM;

                if (closeMin <= openMin) {
                    const actualCloseMin = closeMin === 0 ? 1440 : closeMin + 1440;
                    addSlots(openMin, 1440, false);
                    if (actualCloseMin > 1440) {
                        addSlots(0, actualCloseMin - 1440, true);
                    }
                } else {
                    addSlots(openMin, closeMin, false);
                }
            });
        }

        // Ridotto preavviso a 20 minuti per essere più reattivi
        const MARGIN_MINUTES = 20;

        return slots
            .filter(s => s.sortValue > (nowMinutes + MARGIN_MINUTES))
            .sort((a, b) => a.sortValue - b.sortValue);
    }, [openingHours, nowMinutes]);

    return { validSlots };
};
