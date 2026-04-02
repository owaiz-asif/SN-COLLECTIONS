# SN COLLECTIONS - Premium Jewelry E-Commerce Platform

🌟 **Live Demo**: [https://sn-jewelry-shop.preview.emergentagent.com](https://sn-jewelry-shop.preview.emergentagent.com)

## 📱 Project Overview

A full-stack e-commerce web application for **SN COLLECTIONS**, a luxury jewelry brand. Built with modern technologies and a beautiful, responsive UI featuring a luxury blue and cream color scheme.

## ✨ Features

### 🛍️ Customer Features
- **Public Product Browsing** - View all products without login
- **User Registration & Authentication** - Secure JWT-based auth
- **Category Filtering** - 7 jewelry categories (Earrings, Finger Rings, Necklace, Chain, Anklets, Rubber Bands, Clutches)
- **Product Search** - Real-time search functionality
- **Shopping Cart** - Add, update, remove items with quantity management
- **Secure Checkout** - QR code payment with transaction ID verification
- **Order Tracking** - View order history and status
- **Password Recovery** - OTP-based password reset

### 👨‍💼 Admin Features
- **Unified Login** - Auto-detects admin credentials (no separate admin login page)
- **2-Step Authentication** - Email OTP verification for admin access
- **Product Management** - Add, edit, delete products with Cloudinary image upload
- **Order Management** - View all orders and update status (pending/confirmed/cancelled)
- **Dashboard Analytics** - View total products, orders, and pending orders
- **Real-time Updates** - Instant sync across all operations

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Lucide React** - Modern icon system

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **PostgreSQL (Supabase)** - Robust relational database
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing

### Integrations
- **Cloudinary** - Image upload and CDN
- **Nodemailer** - Email service for OTP
- **Gmail SMTP** - Email delivery

## 📁 Project Structure

```
/app
├── app/
│   ├── page.js                    # Landing page
│   ├── login/page.js              # Login (auto-detects admin/user)
│   ├── register/page.js           # User registration
│   ├── forgot-password/page.js    # Password reset
│   ├── contact/page.js            # Contact information
│   ├── product/[id]/page.js       # Product details
│   ├── cart/page.js               # Shopping cart
│   ├── payment/page.js            # Payment & checkout
│   ├── orders/page.js             # User orders
│   ├── admin/dashboard/page.js    # Admin dashboard
│   └── api/[[...path]]/route.js   # All API endpoints
├── lib/
│   ├── db.js                      # PostgreSQL connection
│   ├── auth.js                    # JWT & password utils
│   ├── email.js                   # Email service
│   └── cloudinary.js              # Image upload
└── components/ui/                 # shadcn components
```

## 🔐 Admin Access

**Login Credentials:**
- Username: `sncollections_official`
- Password: `nabeel@ERT456789`
- Email: `sncollections7411@gmail.com`

**Admin Flow:**
1. Go to Login page
2. Enter admin credentials
3. Receive OTP via email
4. Enter OTP to access admin dashboard

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login (auto-detects admin/user)
- `POST /api/auth/forgot-password` - Send OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/category/:category` - Get products by category

### Cart
- `POST /api/cart` - Add to cart
- `GET /api/cart/:userId` - Get user cart
- `PUT /api/cart/:itemId` - Update quantity
- `DELETE /api/cart/:itemId` - Remove item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:userId` - Get user orders

### Admin
- `POST /api/admin/products` - Add product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id` - Update order status

## 🎨 Design System

**Color Scheme:**
- Primary Blue: `#7DAACB`
- Accent Cream: `#E8D5C4`
- Dark Blue: `#6B8CAD`

**Typography:**
- Sans-serif system fonts
- Bold brand name with gradient

## 🗃️ Database Schema

### Users
```sql
id UUID PRIMARY KEY
username VARCHAR(255) UNIQUE
name VARCHAR(255)
phone VARCHAR(20) UNIQUE
password VARCHAR(255)
address TEXT
email VARCHAR(255)
created_at TIMESTAMP
```

### Products
```sql
id UUID PRIMARY KEY
name VARCHAR(255)
price DECIMAL(10,2)
description TEXT
category VARCHAR(100)
image_url TEXT
created_at TIMESTAMP
```

### Orders
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
products JSONB
total_price DECIMAL(10,2)
gst_amount DECIMAL(10,2)
final_amount DECIMAL(10,2)
transaction_id VARCHAR(255)
status VARCHAR(50)
created_at TIMESTAMP
```

### Cart
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
product_id UUID REFERENCES products(id)
quantity INTEGER
created_at TIMESTAMP
```

## 📞 Contact Information

- **Phone**: 8660109399
- **Email**: sncollections7411@gmail.com
- **Business**: Premium Jewelry Collection

## ✅ Tested & Verified

- ✅ User registration and login
- ✅ Admin authentication with OTP
- ✅ Product CRUD operations
- ✅ Cart management
- ✅ Order creation and tracking
- ✅ Payment flow with QR code
- ✅ Category filtering
- ✅ Search functionality
- ✅ Password recovery
- ✅ Responsive design

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- OTP email verification for admin
- Transaction ID validation
- Input sanitization
- SQL injection protection

## 📦 Environment Variables

```env
# PostgreSQL
DATABASE_URL=postgresql://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=dtn519lqo
CLOUDINARY_API_KEY=957237556767749
CLOUDINARY_API_SECRET=1_0eUFw4Spd-W9k1aIrA5hDBYJM

# Email
MAIL_FROM=sncollections7411@gmail.com
MAIL_PASSWORD=Zaina@123#

# JWT
JWT_SECRET=sn_collections_secret_key_2025_secure_jewelry_store

# Admin
ADMIN_USERNAME=sncollections_official
ADMIN_PASSWORD=nabeel@ERT456789
ADMIN_EMAIL=sncollections7411@gmail.com

# OTP
OTP_EXPIRY_MINUTES=5
```

## 🎯 Next Steps (Optional Enhancements)

- [ ] Add product reviews and ratings
- [ ] Implement wishlist functionality
- [ ] Add multiple payment methods
- [ ] Email notifications for order updates
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Inventory management

## 📄 License

© 2025 SN COLLECTIONS. All rights reserved.

---

Built with ❤️ for premium jewelry shopping experience.
