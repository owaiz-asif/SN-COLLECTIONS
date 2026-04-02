'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, User, Phone, Menu, X, Star, Heart } from 'lucide-react';

const categories = [
  'All Products',
  'Earrings',
  'Finger Rings',
  'Necklace',
  'Chain',
  'Anklets',
  'Rubber Bands',
  'Clutches'
];

export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
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
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchQuery, products]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7DAACB] via-[#E8D5C4] to-[#7DAACB]">
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#7DAACB] to-[#E8D5C4] rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#7DAACB] to-[#6B8CAD] bg-clip-text text-transparent">
                  SN COLLECTIONS
                </h1>
                <p className="text-xs text-gray-500">Premium Jewelry Collection</p>
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
                    <User className="w-5 h-5 text-[#7DAACB]" />
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
                  <Button className="bg-[#7DAACB] hover:bg-[#6B8CAD]" onClick={() => window.location.href = '/register'}>
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
                  <Button className="w-full bg-[#7DAACB] hover:bg-[#6B8CAD]" onClick={() => window.location.href = '/register'}>
                    Register
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="py-12 md:py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Discover Timeless Elegance
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            Handcrafted Jewelry for Every Occasion
          </p>
          
          <div className="max-w-2xl mx-auto bg-white rounded-full shadow-2xl p-2 flex items-center">
            <Search className="w-5 h-5 ml-3 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for jewelry..."
              className="border-0 focus-visible:ring-0 flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="bg-[#7DAACB] hover:bg-[#6B8CAD] rounded-full">
              Search
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-white text-[#7DAACB] hover:bg-white/90'
                    : 'bg-white/80 hover:bg-white'
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
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7DAACB] to-[#E8D5C4]">
                        <Star className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-5 h-5 text-[#7DAACB]" />
                    </button>
                    <Badge className="absolute bottom-3 left-3 bg-white text-[#7DAACB]">
                      {product.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description || 'Beautiful handcrafted jewelry piece'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#7DAACB]">
                        ₹{parseFloat(product.price).toLocaleString('en-IN')}
                      </span>
                      {user && (
                        <Button 
                          size="sm" 
                          className="bg-[#7DAACB] hover:bg-[#6B8CAD]"
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

      <footer className="bg-white mt-12 py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#7DAACB] to-[#E8D5C4] rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-white" fill="white" />
            </div>
            <h3 className="text-xl font-bold text-[#7DAACB]">SN COLLECTIONS</h3>
          </div>
          <p className="text-gray-600 mb-2">Premium Jewelry Collection</p>
          <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
            <Phone className="w-4 h-4" />
            <span>8660109399</span>
          </div>
          <p className="text-sm text-gray-500">© 2025 SN COLLECTIONS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
