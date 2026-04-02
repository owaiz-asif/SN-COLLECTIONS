#!/usr/bin/env python3
"""
SN COLLECTIONS E-commerce Backend API Testing
Tests all backend APIs including authentication, products, cart, orders, and admin functionality
"""

import requests
import json
import uuid
import time
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = "https://sn-jewelry-shop.preview.emergentagent.com/api"

class SNCollectionsAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.user_token = None
        self.admin_token = None
        self.user_id = None
        self.admin_id = None
        self.product_id = None
        self.cart_item_id = None
        self.order_id = None
        self.test_results = []
        
        # Test data
        self.test_user = {
            "username": f"testuser_{int(time.time())}",
            "name": "John Doe",
            "phone": f"555{int(time.time()) % 10000:04d}",
            "password": "TestPass123!",
            "address": "123 Test Street, Test City",
            "email": f"test_{int(time.time())}@example.com"
        }
        
        self.admin_credentials = {
            "identifier": "sncollections_official",
            "password": "nabeel@ERT456789"
        }
        
        self.test_product = {
            "name": "Test Gold Ring",
            "price": 299.99,
            "description": "Beautiful test gold ring for testing",
            "category": "Rings"
        }

    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if not success and response_data:
            print(f"   Response: {response_data}")

    def make_request(self, method, endpoint, data=None, headers=None, token=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error for {method} {url}: {str(e)}")
            return None

    def test_api_root(self):
        """Test API root endpoint"""
        print("\n=== Testing API Root ===")
        response = self.make_request("GET", "")
        
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data and "SN COLLECTIONS API" in data["message"]:
                self.log_result("API Root", True, "API root endpoint working correctly", data)
                return True
            else:
                self.log_result("API Root", False, "Unexpected response format", data)
                return False
        else:
            self.log_result("API Root", False, f"Failed to connect to API root. Status: {response.status_code if response else 'No response'}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        print("\n=== Testing User Registration ===")
        response = self.make_request("POST", "/auth/register", self.test_user)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "user" in data and "token" in data:
                self.user_token = data["token"]
                self.user_id = data["user"]["id"]
                print(f"   User ID: {self.user_id}")
                print(f"   Token: {self.user_token[:20]}...")
                self.log_result("User Registration", True, "User registered successfully", data)
                return True
            else:
                self.log_result("User Registration", False, "Registration failed", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("User Registration", False, f"Registration request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_user_login(self):
        """Test user login"""
        print("\n=== Testing User Login ===")
        login_data = {
            "identifier": self.test_user["username"],
            "password": self.test_user["password"]
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "token" in data and data.get("isAdmin") == False:
                self.user_token = data["token"]
                self.log_result("User Login", True, "User login successful", data)
                return True
            else:
                self.log_result("User Login", False, "Login failed or incorrect response", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("User Login", False, f"Login request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_admin_login(self):
        """Test admin login (without OTP for now)"""
        print("\n=== Testing Admin Login ===")
        response = self.make_request("POST", "/auth/login", self.admin_credentials)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                if data.get("requiresOTP"):
                    self.log_result("Admin Login", True, "Admin login requires OTP (as expected)", data)
                    return True
                elif data.get("isAdmin") == True and "token" in data:
                    self.admin_token = data["token"]
                    self.admin_id = data["user"]["id"]
                    self.log_result("Admin Login", True, "Admin login successful", data)
                    return True
                else:
                    self.log_result("Admin Login", False, "Unexpected admin login response", data)
                    return False
            else:
                self.log_result("Admin Login", False, "Admin login failed", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Admin Login", False, f"Admin login request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def create_test_product_manually(self):
        """Create a test product directly in database for testing purposes"""
        print("\n=== Creating Test Product Manually ===")
        # Since admin requires OTP, let's try to add a product without authentication first
        # This will help us test the product-related endpoints
        
        response = self.make_request("POST", "/admin/products", self.test_product)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "product" in data:
                self.product_id = data["product"]["id"]
                self.log_result("Create Test Product Manually", True, "Test product created successfully", data)
                return True
        
        # If that fails, let's try to get existing products and use one
        response = self.make_request("GET", "/products")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "products" in data and data["products"]:
                self.product_id = data["products"][0]["id"]
                self.log_result("Create Test Product Manually", True, "Using existing product for testing", data)
                return True
        
        self.log_result("Create Test Product Manually", False, "Could not create or find test product")
        return False

    def test_get_all_products(self):
        """Test getting all products"""
        print("\n=== Testing Get All Products ===")
        response = self.make_request("GET", "/products")
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "products" in data:
                products = data["products"]
                self.log_result("Get All Products", True, f"Retrieved {len(products)} products", data)
                
                # If we have products, use the first one for testing
                if products and not self.product_id:
                    self.product_id = products[0]["id"]
                
                return True
            else:
                self.log_result("Get All Products", False, "Unexpected response format", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Get All Products", False, f"Get products request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_get_single_product(self):
        """Test getting single product"""
        print("\n=== Testing Get Single Product ===")
        if not self.product_id:
            self.log_result("Get Single Product", False, "No product ID available")
            return False
        
        response = self.make_request("GET", f"/products/{self.product_id}")
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "product" in data:
                self.log_result("Get Single Product", True, "Product retrieved successfully", data)
                return True
            else:
                self.log_result("Get Single Product", False, "Unexpected response format", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Get Single Product", False, f"Get single product request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_add_to_cart(self):
        """Test adding item to cart"""
        print("\n=== Testing Add to Cart ===")
        print(f"   User ID: {self.user_id}")
        print(f"   Product ID: {self.product_id}")
        
        if not self.user_id or not self.product_id:
            self.log_result("Add to Cart", False, f"Missing user ID ({self.user_id}) or product ID ({self.product_id})")
            return False
        
        cart_data = {
            "userId": self.user_id,
            "productId": self.product_id,
            "quantity": 2
        }
        
        response = self.make_request("POST", "/cart", cart_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "item" in data:
                self.cart_item_id = data["item"]["id"]
                self.log_result("Add to Cart", True, "Item added to cart successfully", data)
                return True
            else:
                self.log_result("Add to Cart", False, "Failed to add item to cart", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Add to Cart", False, f"Add to cart request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_get_user_cart(self):
        """Test getting user cart"""
        print("\n=== Testing Get User Cart ===")
        if not self.user_id:
            self.log_result("Get User Cart", False, "No user ID available")
            return False
        
        response = self.make_request("GET", f"/cart/{self.user_id}")
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "cart" in data:
                cart_items = data["cart"]
                self.log_result("Get User Cart", True, f"Retrieved cart with {len(cart_items)} items", data)
                
                # Update cart_item_id if we don't have it
                if cart_items and not self.cart_item_id:
                    self.cart_item_id = cart_items[0]["id"]
                
                return True
            else:
                self.log_result("Get User Cart", False, "Unexpected response format", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Get User Cart", False, f"Get cart request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_create_order(self):
        """Test creating an order"""
        print("\n=== Testing Create Order ===")
        if not self.user_id or not self.product_id:
            self.log_result("Create Order", False, "Missing user ID or product ID")
            return False
        
        order_data = {
            "userId": self.user_id,
            "products": [
                {
                    "id": self.product_id,
                    "name": self.test_product["name"],
                    "price": self.test_product["price"],
                    "quantity": 2
                }
            ],
            "totalPrice": self.test_product["price"] * 2,
            "transactionId": f"txn_{int(time.time())}"
        }
        
        response = self.make_request("POST", "/orders", order_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "order" in data:
                self.order_id = data["order"]["id"]
                self.log_result("Create Order", True, "Order created successfully", data)
                return True
            else:
                self.log_result("Create Order", False, "Failed to create order", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Create Order", False, f"Create order request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_get_user_orders(self):
        """Test getting user orders"""
        print("\n=== Testing Get User Orders ===")
        if not self.user_id:
            self.log_result("Get User Orders", False, "No user ID available")
            return False
        
        response = self.make_request("GET", f"/orders/{self.user_id}")
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "orders" in data:
                orders = data["orders"]
                self.log_result("Get User Orders", True, f"Retrieved {len(orders)} orders", data)
                return True
            else:
                self.log_result("Get User Orders", False, "Unexpected response format", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Get User Orders", False, f"Get orders request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_admin_get_all_orders(self):
        """Test admin getting all orders"""
        print("\n=== Testing Admin Get All Orders ===")
        if not self.admin_token:
            self.log_result("Admin Get All Orders", False, "No admin token available")
            return False
        
        response = self.make_request("GET", "/admin/orders", token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "orders" in data:
                orders = data["orders"]
                self.log_result("Admin Get All Orders", True, f"Retrieved {len(orders)} orders", data)
                return True
            else:
                self.log_result("Admin Get All Orders", False, "Unexpected response format", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Admin Get All Orders", False, f"Admin get orders request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_update_cart_quantity(self):
        """Test updating cart item quantity"""
        print("\n=== Testing Update Cart Quantity ===")
        if not self.cart_item_id:
            self.log_result("Update Cart Quantity", False, "No cart item ID available")
            return False
        
        update_data = {"quantity": 3}
        response = self.make_request("PUT", f"/cart/{self.cart_item_id}", update_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_result("Update Cart Quantity", True, "Cart quantity updated successfully", data)
                return True
            else:
                self.log_result("Update Cart Quantity", False, "Failed to update cart quantity", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Update Cart Quantity", False, f"Update cart request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_get_products_by_category(self):
        """Test getting products by category"""
        print("\n=== Testing Get Products by Category ===")
        category = "Rings"  # Using the category from our test product
        
        response = self.make_request("GET", f"/products/category/{category}")
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "products" in data:
                products = data["products"]
                self.log_result("Get Products by Category", True, f"Retrieved {len(products)} products in category '{category}'", data)
                return True
            else:
                self.log_result("Get Products by Category", False, "Unexpected response format", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Get Products by Category", False, f"Get products by category request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_forgot_password_flow(self):
        """Test forgot password flow (without actually sending email)"""
        print("\n=== Testing Forgot Password Flow ===")
        forgot_data = {
            "identifier": self.test_user["username"]
        }
        
        response = self.make_request("POST", "/auth/forgot-password", forgot_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_result("Forgot Password Flow", True, "Forgot password request processed successfully", data)
                return True
            else:
                self.log_result("Forgot Password Flow", False, "Forgot password request failed", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Forgot Password Flow", False, f"Forgot password request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_remove_from_cart(self):
        """Test removing item from cart"""
        print("\n=== Testing Remove from Cart ===")
        if not self.cart_item_id:
            self.log_result("Remove from Cart", False, "No cart item ID available")
            return False
        
        response = self.make_request("DELETE", f"/cart/{self.cart_item_id}")
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_result("Remove from Cart", True, "Item removed from cart successfully", data)
                return True
            else:
                self.log_result("Remove from Cart", False, "Failed to remove item from cart", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Remove from Cart", False, f"Remove from cart request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def test_admin_update_order_status(self):
        """Test admin updating order status"""
        print("\n=== Testing Admin Update Order Status ===")
        if not self.admin_token or not self.order_id:
            self.log_result("Admin Update Order Status", False, "Missing admin token or order ID")
            return False
        
        status_data = {"status": "confirmed"}
        response = self.make_request("PUT", f"/admin/orders/{self.order_id}", status_data, token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_result("Admin Update Order Status", True, "Order status updated successfully", data)
                return True
            else:
                self.log_result("Admin Update Order Status", False, "Failed to update order status", data)
                return False
        else:
            error_data = response.json() if response else None
            self.log_result("Admin Update Order Status", False, f"Update order status request failed. Status: {response.status_code if response else 'No response'}", error_data)
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting SN COLLECTIONS Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence following the requested flow
        tests = [
            ("API Root", self.test_api_root),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Admin Login", self.test_admin_login),
            ("Create Test Product Manually", self.create_test_product_manually),
            ("Get All Products", self.test_get_all_products),
            ("Get Single Product", self.test_get_single_product),
            ("Get Products by Category", self.test_get_products_by_category),
            ("Add to Cart", self.test_add_to_cart),
            ("Get User Cart", self.test_get_user_cart),
            ("Update Cart Quantity", self.test_update_cart_quantity),
            ("Create Order", self.test_create_order),
            ("Get User Orders", self.test_get_user_orders),
            ("Remove from Cart", self.test_remove_from_cart),
            ("Forgot Password Flow", self.test_forgot_password_flow),
            ("Admin Get All Orders", self.test_admin_get_all_orders),
            ("Admin Update Order Status", self.test_admin_update_order_status),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_result(test_name, False, f"Test threw exception: {str(e)}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Total: {passed + failed}")
        print(f"📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        
        # Print failed tests
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['message']}")
        
        return passed, failed

if __name__ == "__main__":
    tester = SNCollectionsAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)