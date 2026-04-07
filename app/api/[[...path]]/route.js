import { NextResponse } from 'next/server';
import { query, initializeDatabase } from '@/lib/db';
import { hashPassword, comparePassword, generateToken, verifyToken, generateOTP } from '@/lib/auth';
import { sendOTPEmail } from '@/lib/email';
import { uploadToCloudinary, generateSignature } from '@/lib/cloudinary';

// Initialize database on server start
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    
    // Create default admin if not exists
    const adminCheck = await query(
      'SELECT * FROM admin WHERE username = $1',
      [process.env.ADMIN_USERNAME || 'sncollections_official']
    );
    
    if (adminCheck.rows.length === 0) {
      const hashedPassword = hashPassword(process.env.ADMIN_PASSWORD || 'nabeel@ERT456789');
      await query(
        'INSERT INTO admin (username, password, email) VALUES ($1, $2, $3)',
        [
          process.env.ADMIN_USERNAME || 'sncollections_official',
          hashedPassword,
          process.env.ADMIN_EMAIL || 'sncollections7411@gmail.com'
        ]
      );
      console.log('Default admin created');
    }
    
    dbInitialized = true;
  }
}

// Helper function to get request body
async function getBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// Main router
export async function GET(request) {
  await ensureDbInitialized();
  
  const { pathname } = new URL(request.url);
  const { searchParams } = new URL(request.url);
  const segments = pathname.split('/').filter(Boolean);
  
  // Root API
  if (segments.length === 1 && segments[0] === 'api') {
    return NextResponse.json({ message: 'SN COLLECTIONS API v1.0' });
  }
  
  // GET /api/products - Get all products
  if (segments[1] === 'products' && segments.length === 2) {
    try {
      const result = await query(
        'SELECT * FROM products ORDER BY created_at DESC'
      );
      return NextResponse.json({ success: true, products: result.rows });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // GET /api/products/[id] - Get single product
  if (segments[1] === 'products' && segments.length === 3) {
    try {
      const productId = segments[2];
      const result = await query(
        'SELECT * FROM products WHERE id = $1',
        [productId]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, product: result.rows[0] });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // GET /api/products/[id]/social - Likes + reviews summary
  if (segments[1] === 'products' && segments.length === 4 && segments[3] === 'social') {
    try {
      const productId = segments[2];
      const userId = searchParams.get('userId');

      const likeCountRes = await query(
        'SELECT COUNT(*)::int AS count FROM product_likes WHERE product_id = $1',
        [productId]
      );

      const reviewSummaryRes = await query(
        `SELECT 
           COUNT(*)::int AS count,
           COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS average
         FROM product_reviews
         WHERE product_id = $1`,
        [productId]
      );

      let userLiked = false;
      if (userId) {
        const likedRes = await query(
          'SELECT 1 FROM product_likes WHERE product_id = $1 AND user_id = $2',
          [productId, userId]
        );
        userLiked = likedRes.rows.length > 0;
      }

      const latestReviewsRes = await query(
        `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
         FROM product_reviews r
         LEFT JOIN users u ON u.id = r.user_id
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [productId]
      );

      return NextResponse.json({
        success: true,
        likes: {
          count: likeCountRes.rows[0].count,
          userLiked
        },
        reviews: {
          count: reviewSummaryRes.rows[0].count,
          average: reviewSummaryRes.rows[0].average,
          items: latestReviewsRes.rows
        }
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // GET /api/products/category/[category] - Get products by category
  if (segments[1] === 'products' && segments[2] === 'category' && segments.length === 4) {
    try {
      const category = decodeURIComponent(segments[3]);
      const result = await query(
        'SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC',
        [category]
      );
      return NextResponse.json({ success: true, products: result.rows });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // GET /api/cart/[userId] - Get user cart
  if (segments[1] === 'cart' && segments.length === 3) {
    try {
      const userId = segments[2];
      const result = await query(`
        SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.description, p.category, p.image_url
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = $1
      `, [userId]);
      
      return NextResponse.json({ success: true, cart: result.rows });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // GET /api/orders/[userId] - Get user orders
  if (segments[1] === 'orders' && segments.length === 3) {
    try {
      const userId = segments[2];
      const result = await query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return NextResponse.json({ success: true, orders: result.rows });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // GET /api/admin/orders - Get all orders
  if (segments[1] === 'admin' && segments[2] === 'orders' && segments.length === 3) {
    try {
      const result = await query(`
        SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `);
      return NextResponse.json({ success: true, orders: result.rows });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // GET /api/categories - Get all active categories
  if (segments[1] === 'categories' && segments.length === 2) {
    try {
      const result = await query(
        'SELECT * FROM categories WHERE is_active = TRUE ORDER BY display_order, name'
      );
      return NextResponse.json({ success: true, categories: result.rows });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // GET /api/admin/categories - Get all categories (including inactive)
  if (segments[1] === 'admin' && segments[2] === 'categories' && segments.length === 3) {
    try {
      const result = await query(
        'SELECT * FROM categories ORDER BY display_order, name'
      );
      return NextResponse.json({ success: true, categories: result.rows });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // GET /api/cloudinary/signature - Get Cloudinary upload signature
  if (segments[1] === 'cloudinary' && segments[2] === 'signature') {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureData = generateSignature(timestamp);
      return NextResponse.json({ success: true, ...signatureData });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // GET /api/admin/analytics - Site views summary
  if (segments[1] === 'admin' && segments[2] === 'analytics' && segments.length === 3) {
    try {
      const totalRes = await query('SELECT COUNT(*)::int AS total FROM site_visits');
      const uniqueSessionsRes = await query('SELECT COUNT(DISTINCT session_id)::int AS total FROM site_visits');
      const uniqueMembersRes = await query('SELECT COUNT(DISTINCT user_id)::int AS total FROM site_visits WHERE user_id IS NOT NULL');
      const loginRes = await query('SELECT COUNT(*)::int AS total FROM login_events');
      const usersRes = await query('SELECT COUNT(*)::int AS total FROM users');

      return NextResponse.json({
        success: true,
        visits: {
          total: totalRes.rows[0].total,
          uniqueSessions: uniqueSessionsRes.rows[0].total,
          uniqueMembers: uniqueMembersRes.rows[0].total
        },
        logins: {
          total: loginRes.rows[0].total
        },
        users: {
          total: usersRes.rows[0].total
        }
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // GET /api/admin/reviews - Latest reviews (admin)
  if (segments[1] === 'admin' && segments[2] === 'reviews' && segments.length === 3) {
    try {
      const result = await query(
        `SELECT r.id, r.rating, r.comment, r.created_at,
                u.name as user_name, u.phone as user_phone,
                p.id as product_id, p.name as product_name, p.image_url as product_image
         FROM product_reviews r
         LEFT JOIN users u ON u.id = r.user_id
         LEFT JOIN products p ON p.id = r.product_id
         ORDER BY r.created_at DESC
         LIMIT 200`
      );

      return NextResponse.json({ success: true, reviews: result.rows });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // GET /api/migrate-db - Add images column (run once)
  if (segments[1] === 'migrate-db') {
    try {
      // Add images column
      await query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb
      `);
      
      // Migrate existing image_url to images array
      await query(`
        UPDATE products 
        SET images = jsonb_build_array(
          jsonb_build_object('url', image_url, 'isPrimary', true)
        )
        WHERE image_url IS NOT NULL 
          AND image_url != '' 
          AND (images IS NULL OR images = '[]'::jsonb)
      `);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database migrated successfully - images column added' 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request) {
  await ensureDbInitialized();
  
  const { pathname } = new URL(request.url);
  const segments = pathname.split('/').filter(Boolean);
  const body = await getBody(request);
  
  // POST /api/auth/register - User registration
  if (segments[1] === 'auth' && segments[2] === 'register') {
    try {
      const { username, name, phone, password, address, email } = body;
      
      // Check if user exists
      const existingUser = await query(
        'SELECT * FROM users WHERE username = $1 OR phone = $2',
        [username, phone]
      );
      
      if (existingUser.rows.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Username or phone already exists' 
        }, { status: 400 });
      }
      
      // Hash password
      const hashedPassword = hashPassword(password);
      
      // Insert user
      const result = await query(
        'INSERT INTO users (username, name, phone, password, address, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, name, phone, address, email',
        [username, name, phone, hashedPassword, address || '', email || '']
      );
      
      const user = result.rows[0];
      const token = generateToken({ userId: user.id, username: user.username });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Registration successful',
        user,
        token 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/auth/login - Unified login (auto-detects admin vs user)
  if (segments[1] === 'auth' && segments[2] === 'login') {
    try {
      const { identifier, password, otpCode } = body; // identifier can be username or phone
      
      // Check if this is an admin login
      const adminResult = await query(
        'SELECT * FROM admin WHERE username = $1',
        [identifier]
      );
      
      if (adminResult.rows.length > 0) {
        // This is an admin login
        const admin = adminResult.rows[0];
        
        // Verify admin password
        if (!comparePassword(password, admin.password)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid credentials' 
          }, { status: 401 });
        }
        
        // If no OTP provided, send OTP
        if (!otpCode) {
          const otp = generateOTP();
          const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60000));
          
          // Delete old OTPs
          await query(
            'DELETE FROM otp_codes WHERE identifier = $1 AND purpose = $2',
            [admin.email, 'admin_login']
          );
          
          // Store OTP
          await query(
            'INSERT INTO otp_codes (identifier, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [admin.email, otp, 'admin_login', expiresAt]
          );
          
          // Send OTP email
          await sendOTPEmail(admin.email, otp, 'admin_login');
          
          return NextResponse.json({ 
            success: true, 
            requiresOTP: true,
            message: 'OTP sent to admin email',
            email: admin.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            isAdmin: true
          });
        } else {
          // Verify OTP
          const otpResult = await query(
            'SELECT * FROM otp_codes WHERE identifier = $1 AND otp_code = $2 AND purpose = $3 AND verified = FALSE AND expires_at > NOW()',
            [admin.email, otpCode, 'admin_login']
          );
          
          if (otpResult.rows.length === 0) {
            return NextResponse.json({ 
              success: false, 
              error: 'Invalid or expired OTP' 
            }, { status: 400 });
          }
          
          // Mark OTP as verified
          await query(
            'UPDATE otp_codes SET verified = TRUE WHERE id = $1',
            [otpResult.rows[0].id]
          );
          
          const token = generateToken({ 
            adminId: admin.id, 
            username: admin.username,
            isAdmin: true 
          });
          
          delete admin.password;

          // Track admin login
          await query(
            'INSERT INTO login_events (admin_id, kind) VALUES ($1, $2)',
            [admin.id, 'admin']
          );
          
          return NextResponse.json({ 
            success: true, 
            message: 'Admin login successful',
            isAdmin: true,
            user: admin,
            token 
          });
        }
      }
      
      // Regular user login
      const userResult = await query(
        'SELECT * FROM users WHERE username = $1 OR phone = $1',
        [identifier]
      );
      
      if (userResult.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid credentials' 
        }, { status: 401 });
      }
      
      const user = userResult.rows[0];
      
      // Verify password
      if (!comparePassword(password, user.password)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid credentials' 
        }, { status: 401 });
      }
      
      const token = generateToken({ userId: user.id, username: user.username, isAdmin: false });
      
      // Remove password from response
      delete user.password;

      // Track user login
      await query(
        'INSERT INTO login_events (user_id, kind) VALUES ($1, $2)',
        [user.id, 'user']
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        isAdmin: false,
        user,
        token 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/auth/forgot-password - Send OTP for password reset
  if (segments[1] === 'auth' && segments[2] === 'forgot-password') {
    try {
      const { identifier } = body; // username or phone
      
      // Find user
      const result = await query(
        'SELECT * FROM users WHERE username = $1 OR phone = $1',
        [identifier]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'User not found' 
        }, { status: 404 });
      }
      
      const user = result.rows[0];
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60000));
      
      // Delete old OTPs for this user
      await query(
        'DELETE FROM otp_codes WHERE identifier = $1 AND purpose = $2',
        [identifier, 'forgot_password']
      );
      
      // Store OTP
      await query(
        'INSERT INTO otp_codes (identifier, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
        [identifier, otp, 'forgot_password', expiresAt]
      );
      
      // Send OTP email
      if (user.email) {
        await sendOTPEmail(user.email, otp, 'forgot_password');
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent to your email',
        email: user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/auth/verify-otp - Verify OTP and return reset token
  if (segments[1] === 'auth' && segments[2] === 'verify-otp') {
    try {
      const { identifier, otp } = body;
      
      const result = await query(
        'SELECT * FROM otp_codes WHERE identifier = $1 AND otp_code = $2 AND purpose = $3 AND verified = FALSE AND expires_at > NOW()',
        [identifier, otp, 'forgot_password']
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid or expired OTP' 
        }, { status: 400 });
      }
      
      // Mark OTP as verified
      await query(
        'UPDATE otp_codes SET verified = TRUE WHERE id = $1',
        [result.rows[0].id]
      );
      
      // Generate reset token
      const resetToken = generateToken({ 
        identifier, 
        purpose: 'password_reset',
        exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'OTP verified',
        resetToken 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/auth/reset-password - Reset password with token
  if (segments[1] === 'auth' && segments[2] === 'reset-password') {
    try {
      const { resetToken, newPassword } = body;
      
      // Verify reset token
      const decoded = verifyToken(resetToken);
      if (!decoded || decoded.purpose !== 'password_reset') {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid or expired reset token' 
        }, { status: 400 });
      }
      
      // Update password
      const hashedPassword = hashPassword(newPassword);
      await query(
        'UPDATE users SET password = $1 WHERE username = $2 OR phone = $2',
        [hashedPassword, decoded.identifier]
      );
      
      // Delete used OTPs
      await query(
        'DELETE FROM otp_codes WHERE identifier = $1 AND purpose = $2',
        [decoded.identifier, 'forgot_password']
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Password reset successful' 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/admin/login - Admin login (step 1)
  if (segments[1] === 'admin' && segments[2] === 'login') {
    try {
      const { username, password } = body;
      
      const result = await query(
        'SELECT * FROM admin WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0 || !comparePassword(password, result.rows[0].password)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid credentials' 
        }, { status: 401 });
      }
      
      const admin = result.rows[0];
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60000));
      
      // Delete old OTPs
      await query(
        'DELETE FROM otp_codes WHERE identifier = $1 AND purpose = $2',
        [admin.email, 'admin_login']
      );
      
      // Store OTP
      await query(
        'INSERT INTO otp_codes (identifier, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
        [admin.email, otp, 'admin_login', expiresAt]
      );
      
      // Send OTP email
      await sendOTPEmail(admin.email, otp, 'admin_login');
      
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent to admin email',
        requiresOTP: true,
        email: admin.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/admin/verify-otp - Admin OTP verification (step 2)
  if (segments[1] === 'admin' && segments[2] === 'verify-otp') {
    try {
      const { email, otp } = body;
      
      const result = await query(
        'SELECT * FROM otp_codes WHERE identifier = $1 AND otp_code = $2 AND purpose = $3 AND verified = FALSE AND expires_at > NOW()',
        [email, otp, 'admin_login']
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid or expired OTP' 
        }, { status: 400 });
      }
      
      // Mark OTP as verified
      await query(
        'UPDATE otp_codes SET verified = TRUE WHERE id = $1',
        [result.rows[0].id]
      );
      
      // Get admin details
      const adminResult = await query(
        'SELECT id, username, email FROM admin WHERE email = $1',
        [email]
      );
      
      const token = generateToken({ 
        adminId: adminResult.rows[0].id, 
        username: adminResult.rows[0].username,
        isAdmin: true 
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Admin login successful',
        admin: adminResult.rows[0],
        token 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/admin/products - Add product
  if (segments[1] === 'admin' && segments[2] === 'products') {
    try {
      const { name, price, description, category, images, videos } = body; // images/videos are arrays of base64
      
      let imageUrls = [];
      if (images && Array.isArray(images) && images.length > 0) {
        // Upload all images to Cloudinary
        for (const imageBase64 of images) {
          if (imageBase64) {
            const imageUrl = await uploadToCloudinary(imageBase64, 'sn_collections/products');
            imageUrls.push({ url: imageUrl, isPrimary: imageUrls.length === 0 });
          }
        }
      }

      let videoUrls = [];
      if (videos && Array.isArray(videos) && videos.length > 0) {
        for (const videoBase64 of videos) {
          if (videoBase64) {
            const videoUrl = await uploadToCloudinary(videoBase64, 'sn_collections/products');
            videoUrls.push({ url: videoUrl });
          }
        }
      }
      
      // Also set first image as image_url for backward compatibility
      const primaryImageUrl = imageUrls.length > 0 ? imageUrls[0].url : null;
      
      const result = await query(
        'INSERT INTO products (name, price, description, category, image_url, images, videos) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, parseFloat(price), description, category, primaryImageUrl, JSON.stringify(imageUrls), JSON.stringify(videoUrls)]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Product added successfully',
        product: result.rows[0] 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // POST /api/products/[id]/like - Toggle like
  if (segments[1] === 'products' && segments.length === 4 && segments[3] === 'like') {
    try {
      const productId = segments[2];
      const { userId } = body;

      if (!userId) {
        return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
      }

      const existing = await query(
        'SELECT id FROM product_likes WHERE product_id = $1 AND user_id = $2',
        [productId, userId]
      );

      if (existing.rows.length > 0) {
        await query('DELETE FROM product_likes WHERE id = $1', [existing.rows[0].id]);
      } else {
        await query('INSERT INTO product_likes (product_id, user_id) VALUES ($1, $2)', [productId, userId]);
      }

      const likeCountRes = await query(
        'SELECT COUNT(*)::int AS count FROM product_likes WHERE product_id = $1',
        [productId]
      );

      return NextResponse.json({
        success: true,
        liked: existing.rows.length === 0,
        likeCount: likeCountRes.rows[0].count
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // POST /api/products/[id]/reviews - Add review
  if (segments[1] === 'products' && segments.length === 4 && segments[3] === 'reviews') {
    try {
      const productId = segments[2];
      const { userId, rating, comment } = body;

      if (!userId) {
        return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
      }

      const intRating = parseInt(rating, 10);
      if (!intRating || intRating < 1 || intRating > 5) {
        return NextResponse.json({ success: false, error: 'Rating must be 1-5' }, { status: 400 });
      }

      const safeComment = (comment || '').toString().slice(0, 2000);

      let result;
      try {
        result = await query(
          'INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
          [productId, userId, intRating, safeComment]
        );
      } catch (e) {
        // If running against an older DB where comment column doesn't exist, migrate and retry.
        if (e?.code === '42703' && typeof e?.message === 'string' && e.message.toLowerCase().includes('comment')) {
          await query('ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS comment TEXT');
          result = await query(
            'INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
            [productId, userId, intRating, safeComment]
          );
        } else {
          throw e;
        }
      }

      return NextResponse.json({ success: true, review: result.rows[0] });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // POST /api/analytics/visit - Record a site visit
  if (segments[1] === 'analytics' && segments[2] === 'visit' && segments.length === 3) {
    try {
      const { sessionId, userId, path } = body;
      if (!sessionId) {
        return NextResponse.json({ success: false, error: 'sessionId required' }, { status: 400 });
      }

      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null;
      const userAgent = request.headers.get('user-agent') || null;

      await query(
        `INSERT INTO site_visits (session_id, user_id, ip, user_agent, path)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (session_id, path) DO NOTHING`,
        [sessionId, userId || null, ip, userAgent, path || '/']
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/cart - Add to cart
  if (segments[1] === 'cart' && segments.length === 2) {
    try {
      const { userId, productId, quantity } = body;
      
      // Check if item already in cart
      const existing = await query(
        'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      
      if (existing.rows.length > 0) {
        // Update quantity
        const result = await query(
          'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
          [quantity || 1, userId, productId]
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Cart updated',
          item: result.rows[0] 
        });
      } else {
        // Add new item
        const result = await query(
          'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
          [userId, productId, quantity || 1]
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Added to cart',
          item: result.rows[0] 
        });
      }
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/orders - Create order
  if (segments[1] === 'orders' && segments.length === 2) {
    try {
      const { userId, products, totalPrice, transactionId } = body;
      
      const gstAmount = totalPrice * 0.05; // 5% GST
      const finalAmount = totalPrice + gstAmount;
      
      const result = await query(
        'INSERT INTO orders (user_id, products, total_price, gst_amount, final_amount, transaction_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, JSON.stringify(products), totalPrice, gstAmount, finalAmount, transactionId, 'pending']
      );
      
      // Clear cart after order
      await query('DELETE FROM cart WHERE user_id = $1', [userId]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Order placed successfully',
        order: result.rows[0] 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // POST /api/admin/categories - Add category
  if (segments[1] === 'admin' && segments[2] === 'categories' && segments.length === 3) {
    try {
      const { name } = body;
      
      // Check if category already exists
      const existing = await query(
        'SELECT * FROM categories WHERE LOWER(name) = LOWER($1)',
        [name]
      );
      
      if (existing.rows.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Category already exists' 
        }, { status: 400 });
      }
      
      // Get max display order
      const maxOrder = await query('SELECT MAX(display_order) as max FROM categories');
      const newOrder = (maxOrder.rows[0].max || 0) + 1;
      
      const result = await query(
        'INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING *',
        [name, newOrder]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Category added successfully',
        category: result.rows[0] 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(request) {
  await ensureDbInitialized();
  
  const { pathname } = new URL(request.url);
  const segments = pathname.split('/').filter(Boolean);
  const body = await getBody(request);
  
  // PUT /api/admin/products/[id] - Update product
  if (segments[1] === 'admin' && segments[2] === 'products' && segments.length === 4) {
    try {
      const productId = segments[3];
      const { name, price, description, category, images, existingImages, videos, existingVideos } = body;
      
      let imageUrls = existingImages || [];
      let videoUrls = existingVideos || [];
      
      // Upload new images if provided
      if (images && Array.isArray(images) && images.length > 0) {
        for (const imageBase64 of images) {
          if (imageBase64) {
            const imageUrl = await uploadToCloudinary(imageBase64, 'sn_collections/products');
            imageUrls.push({ url: imageUrl, isPrimary: imageUrls.length === 0 });
          }
        }
      }

      // Upload new videos if provided
      if (videos && Array.isArray(videos) && videos.length > 0) {
        for (const videoBase64 of videos) {
          if (videoBase64) {
            const videoUrl = await uploadToCloudinary(videoBase64, 'sn_collections/products');
            videoUrls.push({ url: videoUrl });
          }
        }
      }
      
      // Set first image as primary image_url
      const primaryImageUrl = imageUrls.length > 0 ? imageUrls[0].url : null;
      
      const result = await query(
        'UPDATE products SET name = $1, price = $2, description = $3, category = $4, image_url = $5, images = $6, videos = $7 WHERE id = $8 RETURNING *',
        [name, parseFloat(price), description, category, primaryImageUrl, JSON.stringify(imageUrls), JSON.stringify(videoUrls), productId]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Product updated successfully',
        product: result.rows[0] 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // PUT /api/admin/orders/[id] - Update order status
  if (segments[1] === 'admin' && segments[2] === 'orders' && segments.length === 4) {
    try {
      const orderId = segments[3];
      const { status } = body;
      
      const result = await query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [status, orderId]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Order status updated',
        order: result.rows[0] 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // PUT /api/cart/[itemId] - Update cart quantity
  if (segments[1] === 'cart' && segments.length === 3) {
    try {
      const itemId = segments[2];
      const { quantity } = body;
      
      const result = await query(
        'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
        [quantity, itemId]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Cart updated',
        item: result.rows[0] 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // PUT /api/admin/categories/[id] - Update category
  if (segments[1] === 'admin' && segments[2] === 'categories' && segments.length === 4) {
    try {
      const categoryId = segments[3];
      const { name, is_active } = body;
      
      // Check if name is taken by another category
      if (name) {
        const existing = await query(
          'SELECT * FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
          [name, categoryId]
        );
        
        if (existing.rows.length > 0) {
          return NextResponse.json({ 
            success: false, 
            error: 'Category name already exists' 
          }, { status: 400 });
        }
      }
      
      let updateQuery = '';
      let params = [];
      
      if (name !== undefined && is_active !== undefined) {
        updateQuery = 'UPDATE categories SET name = $1, is_active = $2 WHERE id = $3 RETURNING *';
        params = [name, is_active, categoryId];
      } else if (name !== undefined) {
        updateQuery = 'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *';
        params = [name, categoryId];
      } else if (is_active !== undefined) {
        updateQuery = 'UPDATE categories SET is_active = $1 WHERE id = $2 RETURNING *';
        params = [is_active, categoryId];
      }
      
      const result = await query(updateQuery, params);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Category updated successfully',
        category: result.rows[0] 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request) {
  await ensureDbInitialized();
  
  const { pathname } = new URL(request.url);
  const segments = pathname.split('/').filter(Boolean);
  
  // DELETE /api/admin/products/[id] - Delete product
  if (segments[1] === 'admin' && segments[2] === 'products' && segments.length === 4) {
    try {
      const productId = segments[3];
      await query('DELETE FROM products WHERE id = $1', [productId]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Product deleted successfully' 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // DELETE /api/cart/[itemId] - Remove from cart
  if (segments[1] === 'cart' && segments.length === 3) {
    try {
      const itemId = segments[2];
      await query('DELETE FROM cart WHERE id = $1', [itemId]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Item removed from cart' 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  // DELETE /api/admin/categories/[id] - Delete category
  if (segments[1] === 'admin' && segments[2] === 'categories' && segments.length === 4) {
    try {
      const categoryId = segments[3];
      
      // Check if category is used by any products
      const productsUsingCategory = await query(
        'SELECT id FROM products WHERE category = (SELECT name FROM categories WHERE id = $1)',
        [categoryId]
      );
      
      if (productsUsingCategory.rows.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: `Cannot delete category. ${productsUsingCategory.rows.length} product(s) are using this category.` 
        }, { status: 400 });
      }
      
      await query('DELETE FROM categories WHERE id = $1', [categoryId]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Category deleted successfully' 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
