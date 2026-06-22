import React, { useEffect, useState } from 'react';
import { isOpenNow, formatTimeIt } from '../../utils/timeUtils';
import { useConfig } from '../../context/ConfigContext';
import { Clock } from 'lucide-react';
import clsx from 'clsx';

export const OpenStatus: React.FC = () => {
    const { config } = useConfig();
    const [status, setStatus] = useState<{ isOpen: boolean; nextOpen?: Date; closingSoon?: boolean; isManual?: boolean }>({ isOpen: false });

    useEffect(() => {
        if (!config?.openingHours) return;

        const checkStatus = () => {
            if (config.isManualClosed) {
                setStatus({ isOpen: false, isManual: true });
            } else {
                setStatus(isOpenNow(config.openingHours));
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [config]);

    if (!config) return null;

    return (
        <div className={clsx(
            "w-full py-1.5 px-4 text-center text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-colors duration-500",
            status.isOpen ? "bg-green-50 text-green-700 border-b border-green-100" : "bg-red-50 text-red-700 border-b border-red-100"
        )}>
            <Clock size={16} />
            {status.isOpen ? (
                <span>Siamo Aperti! {status.closingSoon && "(Chiudiamo presto)"}</span>
            ) : (
                <span>
                    {status.isManual ? "Chiuso Temporaneamente" : (
                        <>Chiuso • {status.nextOpen ? `Apre ${formatTimeIt(status.nextOpen)}` : "Apre Presto"}</>
                    )}
                </span>
            )}
        </div>
    );
};
