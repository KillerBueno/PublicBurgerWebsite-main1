const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';

const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// Helper per gestire errori con status code
const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const error = new Error(data.error || data.details || `Error ${res.status}`);
        (error as any).status = res.status;
        throw error;
    }
    return res.json();
};

export const api = {
    async getMenu() {
        const res = await fetch(`${API_URL}/api/menu`);
        return handleResponse(res);
    },

    async getConfig() {
        const res = await fetch(`${API_URL}/api/config`);
        return handleResponse(res);
    },

    async createOrder(orderData: any) {
        const res = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(orderData),
        });
        return handleResponse(res);
    },

    async getOrder(orderId: string) {
        const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // --- Auth ---
    async login(credentials: any) {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return handleResponse(res);
    },

    async register(userData: any) {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return handleResponse(res);
    },

    async googleLogin(idToken: string) {
        const res = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });
        return handleResponse(res);
    },

    async getMe() {
        const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async getUserOrders() {
        const res = await fetch(`${API_URL}/api/user/orders`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // --- Admin & Rider ---
    async getAdminOrders() {
        const res = await fetch(`${API_URL}/api/admin/orders`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async updateOrderStatus(orderId: string, status: string, riderId?: string) {
        const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status, riderId })
        });
        return handleResponse(res);
    },

    async getRiderOrders() {
        const res = await fetch(`${API_URL}/api/admin/rider/orders`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async getAvailableOrders() {
        const res = await fetch(`${API_URL}/api/admin/rider/available`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async claimOrder(orderId: string) {
        const res = await fetch(`${API_URL}/api/admin/rider/claim/${orderId}`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async updateRiderLocation(location: {
        lat: number,
        lng: number,
        speed?: number | null,
        heading?: number | null,
        battery?: number | null
    }) {
        const res = await fetch(`${API_URL}/api/admin/rider/location`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(location)
        });
        return handleResponse(res);
    },

    async stopSharingLocation() {
        // Use keepalive to support call during unload/pagehide
        const res = await fetch(`${API_URL}/api/admin/rider/location`, {
            method: 'DELETE',
            headers: getHeaders(),
            keepalive: true
        });
        return handleResponse(res);
    },

    async getRidersLocations() {
        const res = await fetch(`${API_URL}/api/admin/riders/locations`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async getOrderTracking(orderId: string) {
        const res = await fetch(`${API_URL}/api/orders/${orderId}/tracking`);
        return handleResponse(res);
    },

    async updateConfig(configData: any) {
        const res = await fetch(`${API_URL}/api/admin/config`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(configData)
        });
        return handleResponse(res);
    },

    async updateProduct(id: string, productData: any) {
        const res = await fetch(`${API_URL}/api/admin/products/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(productData)
        });
        return handleResponse(res);
    },

    async createProduct(productData: any) {
        const res = await fetch(`${API_URL}/api/admin/products`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(productData)
        });
        return handleResponse(res);
    },

    async deleteProduct(id: string) {
        const res = await fetch(`${API_URL}/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async getStats() {
        const res = await fetch(`${API_URL}/api/admin/stats`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // Maintenance
    async verifyMaintenancePassword(password: string) {
        const res = await fetch(`${API_URL}/api/maintenance/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        // We expect custom behavior here, but let's stick to standard response handling
        // If 401, handleResponse throws error, which we catch in UI
        return handleResponse(res);
    },

    async getMaintenancePassword() {
        const res = await fetch(`${API_URL}/api/admin/maintenance-password`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    }
};





