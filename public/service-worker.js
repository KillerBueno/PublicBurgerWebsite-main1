/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'publicburger-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(self.clients.claim());
});

// Fetch event (Required for PWA installability on Chrome Desktop)
self.addEventListener('fetch', (event) => {
    // Just pass through to network for now
    event.respondWith(fetch(event.request));
});

// Message handler from main thread
let API_URL = null;

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'START_TRACKING') {
        console.log('SW: Starting background tracking');
        API_URL = event.data.apiUrl; // Store API URL from main thread
        startPeriodicUpdates();
    } else if (event.data && event.data.type === 'STOP_TRACKING') {
        console.log('SW: Stopping background tracking');
        stopPeriodicUpdates();
    } else if (event.data && event.data.type === 'LOCATION_UPDATE') {
        // Received location from main thread
        handleLocationUpdate(event.data.lat, event.data.lng, event.data.token);
    }
});

let updateInterval = null;

function startPeriodicUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }

    // Request location updates every 10 seconds
    updateInterval = setInterval(() => {
        requestLocationFromMainThread();
    }, 10000);

    // Immediate first request
    requestLocationFromMainThread();
}

function stopPeriodicUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

async function requestLocationFromMainThread() {
    try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

        if (clients.length === 0) {
            console.log('SW: No clients available');
            return;
        }

        // Send request to all clients
        clients.forEach(client => {
            client.postMessage({
                type: 'REQUEST_LOCATION'
            });
        });
    } catch (error) {
        console.error('SW: Error requesting location:', error);
    }
}

async function handleLocationUpdate(lat, lng, token) {
    try {
        console.log('SW: Updating location to API:', lat, lng);

        // Send to backend API
        const response = await fetch(`${API_URL}/api/admin/rider/location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                lat: lat,
                lng: lng
            })
        });

        if (response.ok) {
            console.log('SW: Location updated successfully via API');

            // Notify all clients of success
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'LOCATION_SYNCED',
                    lat: lat,
                    lng: lng
                });
            });
        } else {
            const errorText = await response.text();
            console.error('SW: Failed to update location', response.status, errorText);
        }
    } catch (error) {
        console.error('SW: Error updating location:', error);
    }
}
