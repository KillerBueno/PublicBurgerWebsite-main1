// Service Worker Registration and Management
export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

            console.log('Service Worker registered:', registration);

            // Wait for SW to be ready before registering sync
            const readyRegistration = await navigator.serviceWorker.ready;

            // Request periodic background sync if supported
            if ('periodicSync' in readyRegistration) {
                try {
                    await (readyRegistration as any).periodicSync.register('location-update', {
                        minInterval: 10 * 1000 // 10 seconds
                    });
                    console.log('Periodic Background Sync registered');
                } catch (error: any) {
                    // Periodic Sync usually requires the app to be installed
                    if (error.name === 'NotAllowedError') {
                        console.log('Periodic Background Sync permission denied (App not installed?)');
                    } else {
                        console.warn('Periodic Background Sync failed:', error);
                    }
                }
            }

            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    } else {
        throw new Error('Service Workers not supported');
    }
};

export const startBackgroundTracking = async (token: string, apiUrl: string) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'START_TRACKING',
            token,
            apiUrl
        });

        // Also register for background sync
        try {
            const registration = await navigator.serviceWorker.ready;
            await (registration as any).sync.register('sync-location');
            console.log('Background Sync registered');
        } catch (error) {
            console.warn('Background Sync not supported:', error);
        }
    }
};

export const stopBackgroundTracking = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'STOP_TRACKING'
        });
    }
};

// Listen for messages from Service Worker
export const listenToServiceWorker = (callback: (data: any) => void) => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'REQUEST_LOCATION') {
                // Service Worker is requesting current location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            // Send location back to Service Worker with auth token
                            if (navigator.serviceWorker.controller) {
                                const token = localStorage.getItem('auth_token') || '';
                                navigator.serviceWorker.controller.postMessage({
                                    type: 'LOCATION_UPDATE',
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude,
                                    token: token
                                });
                            }
                        },
                        (error) => {
                            console.error('Failed to get location:', error);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        }
                    );
                }
            }

            // Also call the callback for other messages
            callback(event.data);
        });
    }
};

