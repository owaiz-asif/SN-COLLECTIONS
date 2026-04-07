'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, User, Phone, Menu, X, Star, Heart } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const categories = ['All Products']; // Will be populated dynamically

export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState(['All Products']);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    fetchCategories();
    fetchProducts();
    recordVisit();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchQuery, products]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        const catNames = ['All Products', ...data.categories.map(c => c.name)];
        setDynamicCategories(catNames);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        setFilteredProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'All Products') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  const recordVisit = async () => {
    try {
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('sessionId', sessionId);
      }

      const userData = localStorage.getItem('user');
      const parsedUser = userData ? JSON.parse(userData) : null;

      await fetch('/api/analytics/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: parsedUser?.id || null,
          path: '/'
        })
      });
    } catch (error) {
      // silent fail
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6F1] via-white to-[#F5EFE7]">
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-[#9B6B5F]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_sn-jewelry-shop/artifacts/ry4pjkmk_WhatsApp%20Image%202026-04-03%20at%2019.34.56.jpeg" 
                alt="SN Collections Logo" 
                className="w-14 h-14 rounded-full object-cover shadow-lg ring-2 ring-[#B87861]"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#B87861] via-[#9B6B5F] to-[#B87861] bg-clip-text text-transparent">
                  SN COLLECTIONS
                </h1>
                <p className="text-xs text-[#C4A18A] font-medium">Premium Jewelry Collection</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="ghost" onClick={() => window.location.href = '/cart'}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Cart
                  </Button>
                  <Button variant="ghost" onClick={() => window.location.href = '/orders'}>
                    Orders
                  </Button>
                  <Button variant="ghost" onClick={() => window.location.href = '/contact'}>
                    <Phone className="w-5 h-5 mr-2" />
                    Contact
                  </Button>
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-[#B87861]" />
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => window.location.href = '/contact'}>
                    <Phone className="w-5 h-5 mr-2" />
                    Contact
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/login'}>
                    Login
                  </Button>
                  <Button className="bg-[#B87861] hover:bg-[#9B6B5F] text-white shadow-md font-semibold" onClick={() => window.location.href = '/register'}>
                    Register
                  </Button>
                </>
              )}
            </div>

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2">
              {user ? (
                <>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => window.location.href = '/cart'}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Cart
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => window.location.href = '/orders'}>
                    Orders
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => window.location.href = '/contact'}>
                    <Phone className="w-5 h-5 mr-2" />
                    Contact
                  </Button>
                  <div className="px-4 py-2 text-sm font-medium">
                    Hello, {user.name}
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => window.location.href = '/contact'}>
                    <Phone className="w-5 h-5 mr-2" />
                    Contact
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/login'}>
                    Login
                  </Button>
                  <Button className="w-full bg-[#B87861] hover:bg-[#D4A896]" onClick={() => window.location.href = '/register'}>
                    Register
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="py-12 md:py-20 text-center bg-gradient-to-r from-[#F5EFE7] via-[#FAF6F1] to-[#F5EFE7]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-bold text-[#B87861] mb-4 drop-shadow-md">
            Discover Timeless Elegance
          </h2>
          <p className="text-xl md:text-2xl text-[#9B6B5F] mb-8 font-medium">
            Handcrafted Jewelry for Every Occasion
          </p>
          
          <div className="max-w-2xl mx-auto bg-white rounded-full shadow-2xl p-2 flex items-center border-2 border-[#B87861]">
            <Search className="w-5 h-5 ml-3 text-[#C4A18A]" />
            <Input
              type="text"
              placeholder="Search for jewelry..."
              className="border-0 focus-visible:ring-0 flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="bg-[#B87861] hover:bg-[#9B6B5F] rounded-full text-white font-semibold shadow-md">
              Search
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gradient-to-r from-[#F5EFE7] to-[#FAF6F1]">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {dynamicCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`whitespace-nowrap font-semibold ${
                  selectedCategory === category
                    ? 'bg-[#B87861] text-white hover:bg-[#9B6B5F] shadow-md'
                    : 'bg-white text-[#9B6B5F] border-2 border-[#E8DDD0] hover:border-[#B87861] hover:text-[#B87861]'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-white/80 rounded-2xl p-12 max-w-md mx-auto">
                <p className="text-xl text-gray-600 mb-4">No products found</p>
                <p className="text-gray-500">Try adjusting your search or category filter</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white overflow-hidden"
                  onClick={() => window.location.href = `/product/${product.id}`}
                >
                  <div className="relative overflow-hidden bg-gray-100 aspect-square">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B87861] to-[#9B6B5F]">
                        <Star className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-5 h-5 text-[#B87861]" />
                    </button>
                    <Badge className="absolute bottom-3 left-3 bg-[#D4A896] text-white shadow-md">
                      {product.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description || 'Beautiful handcrafted jewelry piece'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#B87861]">
                        ₹{parseFloat(product.price).toLocaleString('en-IN')}
                      </span>
                      {user && (
                        <Button 
                          size="sm" 
                          className="bg-[#B87861] hover:bg-[#9B6B5F] text-white shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Added to cart!');
                          }}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-[#B87861] mt-12 py-8 border-t-4 border-[#9B6B5F]">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_sn-jewelry-shop/artifacts/ry4pjkmk_WhatsApp%20Image%202026-04-03%20at%2019.34.56.jpeg" 
              alt="SN Collections Logo" 
              className="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-white"
            />
            <h3 className="text-2xl font-bold text-white">SN COLLECTIONS</h3>
          </div>
          <p className="text-[#FAF6F1] mb-2 font-medium">Premium Jewelry Collection</p>
          <div className="flex items-center justify-center space-x-2 text-white mb-4">
            <Phone className="w-4 h-4" />
            <span className="font-semibold">8660109399</span>
          </div>
          <p className="text-sm text-[#E8DDD0]">© 2025 SN COLLECTIONS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
