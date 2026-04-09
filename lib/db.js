import { Pool } from 'pg';

function createPool() {
  // Transaction Pooler connection with required settings
  const p = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // CRITICAL: Required for transaction pooler
    statement_timeout: 30000,
  });

  // Prevent the Node process from crashing on idle client errors
  p.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  return p;
}

let pool = createPool();

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Intentionally avoid logging full SQL for every query in production/dev;
    // it can be noisy and can slow down the server under load.
    console.log('Executed query', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    // In dev, Supabase pooler connections can be dropped.
    // Retry once with a fresh pool for transient connection errors.
    const msg = typeof error?.message === 'string' ? error.message : '';
    const code = error?.code;
    const transient =
      msg.includes('Connection terminated unexpectedly') ||
      msg.includes('ECONNRESET') ||
      msg.includes('Connection terminated') ||
      code === '57P01';
    if (transient) {
      try {
        pool?.end?.();
      } catch {
        // ignore
      }
      pool = createPool();
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query (retry)', { duration, rows: res.rowCount });
      return res;
    }
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        address TEXT,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        image_url TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        videos JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create product likes table
    await query(`
      CREATE TABLE IF NOT EXISTS product_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, user_id)
      )
    `);

    // Create product reviews table
    await query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create site visits table (for admin "views")
    await query(`
      CREATE TABLE IF NOT EXISTS site_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ip VARCHAR(100),
        user_agent TEXT,
        path TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(session_id, path)
      )
    `);

    // Create orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        products JSONB NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        gst_amount DECIMAL(10,2) NOT NULL,
        final_amount DECIMAL(10,2) NOT NULL,
        transaction_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create cart table
    await query(`
      CREATE TABLE IF NOT EXISTS cart (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        product_id UUID REFERENCES products(id),
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);

    // Create wishlist table
    await query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);

    // Create OTP table
    await query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create admin table
    await query(`
      CREATE TABLE IF NOT EXISTS admin (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create categories table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Lightweight migrations for older DBs (safe + idempotent)
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb`);
    await query(`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS comment TEXT`);

    // Track successful logins (for admin analytics)
    await query(`
      CREATE TABLE IF NOT EXISTS login_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        admin_id UUID REFERENCES admin(id) ON DELETE SET NULL,
        kind VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Seed default categories if table is empty
    const categoriesCheck = await query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoriesCheck.rows[0].count) === 0) {
      const defaultCategories = [
        'Earrings', 'Finger Rings', 'Necklace', 'Chain', 
        'Anklets', 'Rubber Bands', 'Clutches'
      ];
      
      for (let i = 0; i < defaultCategories.length; i++) {
        await query(
          'INSERT INTO categories (name, display_order) VALUES ($1, $2)',
          [defaultCategories[i], i + 1]
        );
      }
      console.log('Default categories seeded');
    }

    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export default pool;
