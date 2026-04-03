'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Package, ShoppingBag, Upload, Trash2, Edit, LogOut, AlertCircle } from 'lucide-react';

const categories = [
  'Earrings',
  'Finger Rings',
  'Necklace',
  'Chain',
  'Anklets',
  'Rubber Bands',
  'Clutches'
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  
  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    images: [] // Array of base64 images
  });
  const [existingImages, setExistingImages] = useState([]); // For edit mode
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Category form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Check if user has admin email (admin check)
    if (parsedUser.email !== 'sncollections7411@gmail.com') {
      alert('Access denied. Admin only.');
      window.location.href = '/';
      return;
    }
    
    setUser(parsedUser);
    fetchProducts();
    fetchOrders();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
        // Set first category as default if available
        if (data.categories.length > 0 && !productForm.category) {
          setProductForm(prev => ({ ...prev, category: data.categories[0].name }));
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    
    // Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/heic', 'image/heif', 'image/tiff'];
    
    let invalidFiles = [];
    let oversizedFiles = [];
    
    files.forEach((file) => {
      // Check file size
      if (file.size > maxSize) {
        oversizedFiles.push(file.name);
        return;
      }
      
      // Check file type (allow all image types)
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(file.name);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result);
        if (newImages.length === files.length - invalidFiles.length - oversizedFiles.length) {
          setProductForm({ ...productForm, images: [...productForm.images, ...newImages] });
        }
      };
      reader.onerror = () => {
        alert(`Failed to read file: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
    
    // Show validation errors
    if (invalidFiles.length > 0) {
      alert(`Invalid file type(s): ${invalidFiles.join(', ')}\n\nPlease upload image files only.`);
    }
    if (oversizedFiles.length > 0) {
      alert(`File(s) too large (max 10MB): ${oversizedFiles.join(', ')}`);
    }
  };

  const removeImage = (index) => {
    const newImages = productForm.images.filter((_, i) => i !== index);
    setProductForm({ ...productForm, images: newImages });
  };

  const removeExistingImage = (index) => {
    const newExisting = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExisting);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setUploadingImage(true);

    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productForm.name,
          price: parseFloat(productForm.price),
          description: productForm.description,
          category: productForm.category,
          images: productForm.images, // Array of base64 images
          existingImages: editingProduct ? existingImages : []
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(editingProduct ? 'Product updated!' : 'Product added!');
        setProductForm({ name: '', price: '', description: '', category: 'Earrings', images: [] });
        setExistingImages([]);
        setEditingProduct(null);
        fetchProducts();
      } else {
        alert(data.error || 'Failed to save product');
      }
    } catch (error) {
      alert('Error saving product');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Product deleted!');
        fetchProducts();
      }
    } catch (error) {
      alert('Error deleting product');
    }
  };

  const handleEditProduct = (product) => {
    const productImages = product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : [];
    
    setProductForm({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      images: []
    });
    setExistingImages(productImages);
    setEditingProduct(product);
    setActiveTab('add-product');
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Order status updated!');
        fetchOrders();
      }
    } catch (error) {
      alert('Error updating order status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setCategoryLoading(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Category added!');
        setNewCategoryName('');
        fetchCategories();
      } else {
        alert(data.error || 'Failed to add category');
      }
    } catch (error) {
      alert('Error adding category');
    } finally {
      setCategoryLoading(false);
    }
  };
  
  const handleUpdateCategory = async (categoryId, updates) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Category updated!');
        fetchCategories();
      } else {
        alert(data.error || 'Failed to update category');
      }
    } catch (error) {
      alert('Error updating category');
    }
  };
  
  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Category deleted!');
        fetchCategories();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      alert('Error deleting category');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4A7C59] via-[#9BC1A3] to-[#4A7C59] flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A7C59] via-[#9BC1A3] to-[#4A7C59]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-[#4A7C59]" fill="#4A7C59" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-white/80">SN COLLECTIONS</p>
            </div>
          </div>
          <Button variant="outline" className="bg-white" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Products</p>
                  <p className="text-3xl font-bold text-[#4A7C59]">{products.length}</p>
                </div>
                <ShoppingBag className="w-12 h-12 text-[#4A7C59]/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold text-[#4A7C59]">{orders.length}</p>
                </div>
                <Package className="w-12 h-12 text-[#4A7C59]/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending Orders</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
                <AlertCircle className="w-12 h-12 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="add-product">Add/Edit Product</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Products List */}
          <TabsContent value="products">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-square bg-gray-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4A7C59] to-[#9BC1A3]">
                            <Star className="w-12 h-12 text-white/50" />
                          </div>
                        )}
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-semibold mb-2">{product.name}</h3>
                        <Badge className="mb-2">{product.category}</Badge>
                        <p className="text-xl font-bold text-[#4A7C59] mb-4">
                          ₹{parseFloat(product.price).toLocaleString('en-IN')}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add/Edit Product */}
          <TabsContent value="add-product">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(value) => setProductForm({ ...productForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => cat.is_active).map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Product Images (Multiple)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.heic,.heif,.tiff,.tif,.ico"
                      multiple
                      onChange={handleImageChange}
                    />
                    <p className="text-sm text-gray-500">
                      Supported formats: JPG, JPEG, PNG, WEBP, GIF, BMP, HEIC, HEIF, TIFF, SVG (all image types)
                    </p>
                    <p className="text-sm text-gray-500">You can select multiple images at once</p>
                    
                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div className="mt-4">
                        <Label className="mb-2 block">Current Images:</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {existingImages.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img.url}
                                alt={`Existing ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                onClick={() => removeExistingImage(index)}
                              >
                                ✕
                              </Button>
                              {img.isPrimary && (
                                <Badge className="absolute bottom-1 left-1 text-xs">Primary</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* New Images Preview */}
                    {productForm.images.length > 0 && (
                      <div className="mt-4">
                        <Label className="mb-2 block">New Images to Upload:</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {productForm.images.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-green-200"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                onClick={() => removeImage(index)}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-[#4A7C59] hover:bg-[#3A6047]"
                      disabled={uploadingImage}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? 'Uploading...' : editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                    {editingProduct && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(null);
                          setExistingImages([]);
                          setProductForm({ name: '', price: '', description: '', category: 'Earrings', images: [] });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Management */}
          <TabsContent value="categories">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle>Category Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add New Category */}
                  <form onSubmit={handleAddCategory} className="flex gap-2">
                    <Input
                      placeholder="Enter new category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                    />
                    <Button
                      type="submit"
                      className="bg-[#4A7C59] hover:bg-[#3A6047]"
                      disabled={categoryLoading}
                    >
                      {categoryLoading ? 'Adding...' : 'Add Category'}
                    </Button>
                  </form>

                  {/* Categories List */}
                  <div className="space-y-2">
                    <h3 className="font-semibold mb-3">All Categories ({categories.length})</h3>
                    {categories.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No categories yet. Add your first category above.</p>
                    ) : (
                      <div className="grid gap-2">
                        {categories.map((category) => (
                          <Card key={category.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {editingCategory === category.id ? (
                                  <Input
                                    defaultValue={category.name}
                                    onBlur={(e) => {
                                      if (e.target.value !== category.name) {
                                        handleUpdateCategory(category.id, { name: e.target.value });
                                      }
                                      setEditingCategory(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateCategory(category.id, { name: e.target.value });
                                        setEditingCategory(null);
                                      }
                                    }}
                                    autoFocus
                                    className="w-64"
                                  />
                                ) : (
                                  <>
                                    <span className="font-semibold text-lg">{category.name}</span>
                                    <Badge variant={category.is_active ? "default" : "secondary"}>
                                      {category.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {editingCategory !== category.id && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingCategory(category.id)}
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Rename
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={category.is_active ? "secondary" : "default"}
                                      onClick={() => handleUpdateCategory(category.id, { is_active: !category.is_active })}
                                    >
                                      {category.is_active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteCategory(category.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Note:</strong> You cannot delete categories that are being used by products. Deactivated categories won't appear in product selection.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Management */}
          <TabsContent value="orders">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => {
                    const products = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
                    return (
                      <Card key={order.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                            <div>
                              <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                              <p className="text-sm text-gray-600">Customer: {order.user_name || 'N/A'}</p>
                              <p className="text-sm text-gray-600">Phone: {order.user_phone || 'N/A'}</p>
                              <p className="text-sm text-gray-600">
                                Date: {new Date(order.created_at).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            {products.map((product, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{product.name} x {product.quantity}</span>
                                <span className="font-semibold">₹{(product.price * product.quantity).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t pt-3 space-y-1">
                            <div className="flex justify-between font-bold text-lg">
                              <span>Total Amount:</span>
                              <span className="text-[#4A7C59]">₹{parseFloat(order.final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {order.transaction_id && (
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Transaction ID:</span>
                                <span className="font-mono">{order.transaction_id}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
