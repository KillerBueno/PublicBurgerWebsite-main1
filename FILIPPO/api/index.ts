import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sign, verify } from 'hono/jwt'
import { hashPassword, verifyPassword } from './auth_utils'

type Bindings = {
    DB: D1Database,
    JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Helper per ottenere il secret dalle variabili d'ambiente di Cloudflare
const getSecret = (c: any) => c.env.JWT_SECRET || 'publicburger-dev-secret-key'

app.use('/*', cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
}))

// Middleware di autorizzazione
const checkRole = (roles: string[]) => {
    return async (c: any, next: any) => {
        const authHeader = c.req.header('Authorization')
        if (!authHeader) return c.json({ error: 'No token' }, 401)

        try {
            const token = authHeader.replace('Bearer ', '')
            const payload = await verify(token, getSecret(c), 'HS256')
            if (!roles.includes(payload.role as string)) {
                console.log(`Access denied for role: ${payload.role}. Required: ${roles.join(',')}`);
                return c.json({ error: 'Access denied', role: payload.role }, 403)
            }
            c.set('jwtPayload', payload)
            await next()
        } catch (e) {
            return c.json({ error: 'Invalid token' }, 401)
        }
    }
}

// --- Config Route ---
app.get('/api/config', async (c) => {
    try {
        const { results } = await c.env.DB.prepare('SELECT * FROM settings').all();
        const settings: any = {};
        results.forEach((row: any) => {
            settings[row.key] = row.value;
        });

        // Reconstruct complex objects
        const config = {
            restaurantName: settings.restaurant_name,
            phone: settings.phone,
            googleMapsApiKey: settings.google_maps_api_key,
            location: settings.location,
            description: settings.description,
            isMaintenanceMode: settings.is_maintenance_mode === 'true',
            isManualClosed: settings.is_manual_closed === 'true' || settings.is_manual_closed === '1',
            openingHours: JSON.parse(settings.opening_hours || '{}'),
            socials: {
                instagram: settings.social_instagram,
                facebook: settings.social_facebook
            },
            addonPriceDouble: parseFloat(settings.addon_price_double) || 3.00,
            addonPriceTriple: parseFloat(settings.addon_price_triple) || 5.00,
            addonPriceMenu: parseFloat(settings.addon_price_menu) || 3.50,
            addonPriceAlcohol: parseFloat(settings.addon_price_alcohol) || 1.00
        };

        return c.json(config);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// Verify Maintenance Password (Public)
app.post('/api/maintenance/verify', async (c) => {
    try {
        const { password } = await c.req.json();
        const row: any = await c.env.DB.prepare('SELECT value FROM settings WHERE key = "maintenance_password"').first();
        const dbPass = row?.value || 'admin';

        if (password === dbPass) {
            return c.json({ valid: true });
        }
        return c.json({ valid: false }, 401);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// Get Maintenance Password (Owner Only)
app.get('/api/admin/maintenance-password', checkRole(['owner', 'dev']), async (c) => {
    const row: any = await c.env.DB.prepare('SELECT value FROM settings WHERE key = "maintenance_password"').first();
    const dbPass = row?.value || 'admin';
    return c.json({ password: dbPass });
});

// --- Auth Routes ---


app.post('/api/auth/register', async (c) => {
    try {
        const body = await c.req.json()
        const { email, password, name, surname, phone } = body

        // Check if user exists
        const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
        if (existing) return c.json({ error: 'Email già registrata' }, 400)

        const id = crypto.randomUUID()
        const hashedPassword = await hashPassword(password)

        const role = 'user'
        await c.env.DB.prepare(
            'INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, email, hashedPassword, name, surname, phone, role).run()

        const token = await sign({ id, email, name, role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, getSecret(c), 'HS256')
        return c.json({ success: true, token, user: { id, email, name, surname, phone, role } })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.post('/api/auth/login', async (c) => {
    try {
        const { email, password } = await c.req.json()
        const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

        if (!user || !user.password_hash) {
            return c.json({ error: 'Credenziali non valide' }, 401)
        }

        const valid = await verifyPassword(password, user.password_hash)
        if (!valid) return c.json({ error: 'Credenziali non valide' }, 401)

        const token = await sign({ id: user.id, email: user.email, name: user.name, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, getSecret(c), 'HS256')
        return c.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, surname: user.surname, phone: user.phone, role: user.role } })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.post('/api/auth/google', async (c) => {
    try {
        const { idToken } = await c.req.json()
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
        if (!res.ok) return c.json({ error: 'Google token non valido' }, 401)

        const googleUser: any = await res.json()
        const email = googleUser.email

        let user: any = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

        if (!user) {
            // Auto-register
            const id = crypto.randomUUID()
            const role = 'user'
            await c.env.DB.prepare(
                'INSERT INTO users (id, email, name, surname, role) VALUES (?, ?, ?, ?, ?)'
            ).bind(id, email, googleUser.given_name, googleUser.family_name, role).run()
            user = { id, email, name: googleUser.given_name, surname: googleUser.family_name, role }
        }

        const token = await sign({ id: user.id, email: user.email, name: user.name, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, getSecret(c), 'HS256')
        return c.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, surname: user.surname, phone: user.phone, role: user.role } })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.get('/api/auth/me', async (c) => {
    try {
        const authHeader = c.req.header('Authorization')
        if (!authHeader) return c.json({ error: 'No token' }, 401)
        const token = authHeader.replace('Bearer ', '')
        const payload = await verify(token, getSecret(c), 'HS256')

        console.log('Auth Me - Payload ID:', payload.id);
        const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.id).first()
        if (!user) {
            console.log('Auth Me - User not found in DB for ID:', payload.id);
            return c.json({ error: 'User not found' }, 404)
        }

        return c.json({ user: { id: user.id, email: user.email, name: user.name, surname: user.surname, phone: user.phone, role: user.role } })
    } catch (e: any) {
        console.error('Auth Me Error:', e.message);
        return c.json({ error: 'Invalid token', details: e.message }, 401)
    }
})

app.get('/api/menu', async (c) => {
    try {
        const [
            categoriesRes,
            productsRes,
            ingredientsRes,
            prodIngredientsRes,
            prodAllergensRes
        ] = await Promise.all([
            c.env.DB.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all(),
            c.env.DB.prepare('SELECT * FROM products').all(),
            c.env.DB.prepare('SELECT * FROM ingredients WHERE is_available = 1').all(),
            c.env.DB.prepare('SELECT * FROM product_ingredients').all(),
            c.env.DB.prepare('SELECT * FROM product_allergens').all()
        ]);

        const categories = categoriesRes.results;
        const products = productsRes.results;
        const ingredients = ingredientsRes.results;
        const prodIngredients = prodIngredientsRes.results;
        const prodAllergens = prodAllergensRes.results;

        // Helper to get base ingredients for a product
        const getBaseIngredients = (prodId: string) =>
            prodIngredients
                .filter((pi: any) => pi.product_id === prodId)
                .map((pi: any) => pi.ingredient_id);

        // Helper to get allergens for a product
        const getAllergens = (prodId: string) =>
            prodAllergens
                .filter((pa: any) => pa.product_id === prodId)
                .map((pa: any) => pa.allergen);

        // Enhance products with relations and map to frontend structure
        const enhancedProducts = products.map((p: any) => ({
            ...p,
            ingredienti: getBaseIngredients(p.id),
            allergeni: getAllergens(p.id),
            personalizzabile: !!p.allow_customization,
            opzioniCarne: !!p.has_meat_options,
            opzioneMenu: !!p.has_menu_option
        }));

        // Group products by category
        const menu = categories.map((cat: any) => ({
            ...cat,
            items: enhancedProducts.filter((p: any) => p.category_id === cat.id)
        }));

        return c.json({
            categories: menu,
            ingredients: ingredients
        });
    } catch (e: any) {
        return c.json({ error: e.message || 'Unknown error' }, 500)
    }
})

app.post('/api/orders', async (c) => {
    try {
        const body = await c.req.json()
        console.log('Received order body:', JSON.stringify(body))
        const { userId, items, total, address, note, googleMapsLink, deliveryMethod, requestedTime, customerName, customerPhone, latitude, longitude } = body
        const orderId = crypto.randomUUID()

        // Prepare Order Statement
        const finalUserId = (userId === 'guest' || !userId) ? null : userId;
        const orderStmt = c.env.DB.prepare(
            'INSERT INTO orders (id, user_id, status, total, delivery_address, note, google_maps_link, delivery_method, requested_time, customer_name, customer_phone, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(orderId, finalUserId, 'pending', total, address, note || null, googleMapsLink || null, deliveryMethod, requestedTime, customerName, customerPhone, latitude || null, longitude || null)

        // Prepare Items Statements
        const itemStmt = c.env.DB.prepare(
            'INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, options) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )

        const itemBatch = items.map((item: any) =>
            itemStmt.bind(crypto.randomUUID(), orderId, item.id, item.name, item.quantity, item.price, JSON.stringify(item.options))
        )

        // Execute all together in one atomic batch
        await c.env.DB.batch([
            orderStmt,
            ...itemBatch
        ])

        return c.json({ success: true, orderId })
    } catch (err: any) {
        console.error('Order Creation Error:', err.message, err.cause)
        return c.json({ success: false, error: 'Failed to create order', details: err.message }, 500)
    }
})

app.get('/api/orders/:id', async (c) => {
    const orderId = c.req.param('id')
    const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first()

    if (!order) return c.json({ error: 'Order not found' }, 404)

    const { results: items } = await c.env.DB.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all()

    return c.json({ ...order, items })
})

app.get('/api/user/orders', async (c) => {
    try {
        const authHeader = c.req.header('Authorization')
        if (!authHeader) return c.json({ error: 'No token' }, 401)
        const token = authHeader.replace('Bearer ', '')
        const payload = await verify(token, getSecret(c), 'HS256')

        const { results: orders } = await c.env.DB.prepare(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
        ).bind(payload.id).all()

        return c.json(orders)
    } catch (e) {
        return c.json({ error: 'Invalid token' }, 401)
    }
})

// --- Admin & Rider Routes ---

// Get all orders (Admin/Staff/Owner/Dev)
app.get('/api/admin/orders', checkRole(['staff', 'owner', 'dev', 'rider']), async (c) => {
    const { results: orders } = await c.env.DB.prepare(
        'SELECT * FROM orders ORDER BY created_at DESC'
    ).all()
    return c.json(orders)
})

// Update order status and assignment
app.put('/api/admin/orders/:id/status', checkRole(['staff', 'owner', 'dev', 'rider']), async (c) => {
    const id = c.req.param('id')
    const { status, riderId } = await c.req.json()

    let query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP'
    const params = [status]

    if (riderId !== undefined) {
        query += ', assigned_rider_id = ?'
        params.push(riderId)
    }

    query += ' WHERE id = ?'
    params.push(id)

    await c.env.DB.prepare(query).bind(...params).run()
    return c.json({ success: true })
})

// Rider specific orders
app.get('/api/admin/rider/orders', checkRole(['rider', 'dev']), async (c) => {
    const payload = c.get('jwtPayload')
    const { results: orders } = await c.env.DB.prepare(
        "SELECT * FROM orders WHERE assigned_rider_id = ? AND status != 'completed' AND status != 'cancelled' ORDER BY created_at ASC"
    ).bind(payload.id).all()
    return c.json(orders)
})

// Get available orders for riders (ready for delivery)
app.get('/api/admin/rider/available', checkRole(['rider', 'dev']), async (c) => {
    const { results: orders } = await c.env.DB.prepare(
        "SELECT * FROM orders WHERE status = 'ready' AND delivery_method = 'domicilio' AND (assigned_rider_id IS NULL OR assigned_rider_id = '') ORDER BY created_at ASC"
    ).all()
    return c.json(orders)
})

// Rider claims an order
app.post('/api/admin/rider/claim/:id', checkRole(['rider', 'dev']), async (c) => {
    const payload = c.get('jwtPayload')
    const orderId = c.req.param('id')

    // Check if order is still available
    const order: any = await c.env.DB.prepare(
        "SELECT * FROM orders WHERE id = ? AND status = 'ready' AND (assigned_rider_id IS NULL OR assigned_rider_id = '')"
    ).bind(orderId).first()

    if (!order) {
        return c.json({ error: 'Order not available or already assigned' }, 400)
    }

    // Assign rider and change status to on_the_way
    await c.env.DB.prepare(
        'UPDATE orders SET assigned_rider_id = ?, status = ? WHERE id = ?'
    ).bind(payload.id, 'on_the_way', orderId).run()

    return c.json({ success: true, message: 'Order claimed successfully' })
})

// Rider update location
app.post('/api/admin/rider/location', checkRole(['rider', 'dev']), async (c) => {
    const payload = c.get('jwtPayload')
    const { lat, lng, speed, heading, battery } = await c.req.json()

    await c.env.DB.prepare(
        'UPDATE users SET latitude = ?, longitude = ?, speed = ?, heading = ?, battery = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(lat, lng, speed || null, heading || null, battery || null, payload.id).run()

    return c.json({ success: true })
})

// Rider stop sharing location (Go Offline)
app.delete('/api/admin/rider/location', checkRole(['rider', 'dev']), async (c) => {
    const payload = c.get('jwtPayload')
    await c.env.DB.prepare(
        'UPDATE users SET latitude = NULL, longitude = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(payload.id).run()
    return c.json({ success: true })
})

// Admin: Get all active riders locations (active in last 5 mins)
app.get('/api/admin/riders/locations', checkRole(['owner', 'staff', 'dev']), async (c) => {
    const { results } = await c.env.DB.prepare(
        "SELECT id, name, surname, latitude, longitude, speed, heading, battery, updated_at FROM users WHERE role = 'rider' AND latitude IS NOT NULL AND updated_at > datetime('now', '-5 minutes')"
    ).all()
    return c.json(results)
})

// Tracking public endpoint
app.get('/api/orders/:id/tracking', async (c) => {
    const id = c.req.param('id')
    const order: any = await c.env.DB.prepare(
        'SELECT status, assigned_rider_id FROM orders WHERE id = ?'
    ).bind(id).first()

    if (!order) return c.json({ error: 'Order not found' }, 404)
    if (order.status !== 'on_the_way' || !order.assigned_rider_id) {
        return c.json({ tracking: false })
    }

    const rider: any = await c.env.DB.prepare(
        'SELECT latitude, longitude FROM users WHERE id = ?'
    ).bind(order.assigned_rider_id).first()

    return c.json({
        tracking: true,
        location: { lat: rider.latitude, lng: rider.longitude }
    })
})

// Update site config (Owner/Dev)
app.put('/api/admin/config', checkRole(['owner', 'dev']), async (c) => {
    try {
        const body = await c.req.json();
        const {
            restaurant_name, phone, google_maps_api_key, location, description,
            opening_hours, social_instagram, social_facebook, is_manual_closed,
            addon_price_double, addon_price_triple, addon_price_menu, addon_price_alcohol
        } = body;

        const statements = [
            c.env.DB.prepare('UPDATE settings SET value = ? WHERE key = "restaurant_name"').bind(restaurant_name),
            c.env.DB.prepare('UPDATE settings SET value = ? WHERE key = "phone"').bind(phone),
            c.env.DB.prepare('UPDATE settings SET value = ? WHERE key = "google_maps_api_key"').bind(google_maps_api_key),
            c.env.DB.prepare('UPDATE settings SET value = ? WHERE key = "location"').bind(location),
            c.env.DB.prepare('UPDATE settings SET value = ? WHERE key = "description"').bind(description),
            c.env.DB.prepare('UPDATE settings SET value = ? WHERE key = "opening_hours"').bind(opening_hours),
            c.env.DB.prepare('UPDATE settings SET value = ? WHERE key = "social_instagram"').bind(social_instagram),
            c.env.DB.prepare('UPDATE settings SET value = ? WHERE key = "social_facebook"').bind(social_facebook),
            // Global Pricing Upserts - use ?? to handle 0 values correctly
            c.env.DB.prepare('INSERT INTO settings (key, value) VALUES ("addon_price_double", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(String(addon_price_double ?? 3.00)),
            c.env.DB.prepare('INSERT INTO settings (key, value) VALUES ("addon_price_triple", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(String(addon_price_triple ?? 5.00)),
            c.env.DB.prepare('INSERT INTO settings (key, value) VALUES ("addon_price_menu", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(String(addon_price_menu ?? 3.50)),
            c.env.DB.prepare('INSERT INTO settings (key, value) VALUES ("addon_price_alcohol", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(String(addon_price_alcohol ?? 1.00)),
            // Use Upsert for new field to ensure it exists
            c.env.DB.prepare('INSERT INTO settings (key, value) VALUES ("is_manual_closed", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(String(is_manual_closed)),
        ];

        if (body.maintenance_password) {
            statements.push(c.env.DB.prepare('INSERT INTO settings (key, value) VALUES ("maintenance_password", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(body.maintenance_password));
        }

        if (body.hasOwnProperty('is_maintenance_mode')) {
            statements.push(c.env.DB.prepare('INSERT INTO settings (key, value) VALUES ("is_maintenance_mode", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(String(body.is_maintenance_mode)));
        }


        await c.env.DB.batch(statements);
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// --- Menu Management ---

// Update product
app.put('/api/admin/products/:id', checkRole(['owner', 'dev']), async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, description, price, is_available, category_id, image_url, ingredients, allergens } = body;

    const statements = [
        c.env.DB.prepare(
            'UPDATE products SET name = ?, description = ?, price = ?, is_available = ?, category_id = ?, image_url = ? WHERE id = ?'
        ).bind(name, description, price, is_available ? 1 : 0, category_id, image_url, id)
    ];

    // Reset and Update Ingredients
    if (Array.isArray(ingredients)) {
        statements.push(c.env.DB.prepare('DELETE FROM product_ingredients WHERE product_id = ?').bind(id));
        for (const ingId of ingredients) {
            statements.push(c.env.DB.prepare('INSERT INTO product_ingredients (product_id, ingredient_id) VALUES (?, ?)').bind(id, ingId));
        }
    }

    // Reset and Update Allergens
    if (Array.isArray(allergens)) {
        statements.push(c.env.DB.prepare('DELETE FROM product_allergens WHERE product_id = ?').bind(id));
        for (const allergen of allergens) {
            statements.push(c.env.DB.prepare('INSERT INTO product_allergens (product_id, allergen) VALUES (?, ?)').bind(id, allergen));
        }
    }

    await c.env.DB.batch(statements);
    return c.json({ success: true });
});

// Create product
app.post('/api/admin/products', checkRole(['owner', 'dev']), async (c) => {
    const body = await c.req.json();
    const { category_id, name, description, price, image_url, ingredients, allergens } = body;
    const id = crypto.randomUUID();

    const statements = [
        c.env.DB.prepare(
            'INSERT INTO products (id, category_id, name, description, price, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, 1)'
        ).bind(id, category_id, name, description, price, image_url)
    ];

    if (Array.isArray(ingredients)) {
        for (const ingId of ingredients) {
            statements.push(c.env.DB.prepare('INSERT INTO product_ingredients (product_id, ingredient_id) VALUES (?, ?)').bind(id, ingId));
        }
    }

    if (Array.isArray(allergens)) {
        for (const allergen of allergens) {
            statements.push(c.env.DB.prepare('INSERT INTO product_allergens (product_id, allergen) VALUES (?, ?)').bind(id, allergen));
        }
    }

    await c.env.DB.batch(statements);
    return c.json({ success: true, id });
});


// Delete product
app.delete('/api/admin/products/:id', checkRole(['owner', 'dev']), async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

// --- Statistics ---

app.get('/api/admin/stats', checkRole(['owner', 'dev', 'staff', 'rider']), async (c) => {
    try {
        const stats: any = {};

        // Totali (Tutti gli ordini validi vs Solo completati)
        const totals: any = await c.env.DB.prepare(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as total_revenue,
                AVG(CASE WHEN status = 'completed' THEN total END) as avg_order_value
            FROM orders 
            WHERE status != 'cancelled'
        `).first();

        // Stats di Oggi
        const today: any = await c.env.DB.prepare(`
            SELECT 
                COUNT(*) as count,
                SUM(total) as revenue
            FROM orders
            WHERE date(created_at) = date('now') AND status != 'cancelled'
        `).first();

        // Clienti Unici (basato su telefono o userId)
        const customers: any = await c.env.DB.prepare(`
            SELECT COUNT(DISTINCT customer_phone) as count FROM orders
        `).first();

        // Prodotti Attivi
        const activeProds: any = await c.env.DB.prepare(`
            SELECT COUNT(*) as count FROM products WHERE is_available = 1
        `).first();

        stats.totalOrders = totals.total_orders || 0;
        stats.totalRevenue = totals.total_revenue || 0;
        stats.avgOrderValue = totals.avg_order_value || 0;
        stats.todayOrders = today.count || 0;
        stats.todayRevenue = today.revenue || 0;
        stats.totalCustomers = customers.count || 0;
        stats.activeProducts = activeProds.count || 0;

        // Ordini per giorno (ultimi 7 giorni)
        const { results: dailyStats } = await c.env.DB.prepare(`
            SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count, SUM(total) as revenue
            FROM orders
            WHERE created_at >= date('now', '-7 days') AND status != 'cancelled'
            GROUP BY date
            ORDER BY date ASC
        `).all();
        stats.dailyStats = dailyStats;

        // Top Products
        const { results: topProducts } = await c.env.DB.prepare(`
            SELECT product_name as name, SUM(quantity) as sold, SUM(price * quantity) as revenue
            FROM order_items
            JOIN orders ON order_items.order_id = orders.id
            WHERE orders.status != 'cancelled'
            GROUP BY product_id
            ORDER BY sold DESC
            LIMIT 5
        `).all();
        stats.topProducts = topProducts;

        // Ultimi 5 ordini per l'attività recente
        const { results: recentOrders } = await c.env.DB.prepare(`
            SELECT id, customer_name, status, total, created_at, delivery_method
            FROM orders
            ORDER BY created_at DESC
            LIMIT 5
        `).all();
        stats.recentOrders = recentOrders;

        stats.systemStatus = {
            db: 'Online',
            worker: 'Active',
            gps: 'Ready'
        };

        return c.json(stats);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default app
