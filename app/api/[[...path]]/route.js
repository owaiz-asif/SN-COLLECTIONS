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
      const { name, price, description, category, imageBase64 } = body;
      
      let imageUrl = null;
      if (imageBase64) {
        imageUrl = await uploadToCloudinary(imageBase64, 'sn_collections/products');
      }
      
      const result = await query(
        'INSERT INTO products (name, price, description, category, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, parseFloat(price), description, category, imageUrl]
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
      const { name, price, description, category, imageBase64 } = body;
      
      let imageUrl = null;
      if (imageBase64) {
        imageUrl = await uploadToCloudinary(imageBase64, 'sn_collections/products');
      }
      
      const updateQuery = imageUrl
        ? 'UPDATE products SET name = $1, price = $2, description = $3, category = $4, image_url = $5 WHERE id = $6 RETURNING *'
        : 'UPDATE products SET name = $1, price = $2, description = $3, category = $4 WHERE id = $5 RETURNING *';
      
      const params = imageUrl
        ? [name, parseFloat(price), description, category, imageUrl, productId]
        : [name, parseFloat(price), description, category, productId];
      
      const result = await query(updateQuery, params);
      
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
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
