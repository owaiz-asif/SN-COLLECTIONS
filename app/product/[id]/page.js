'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, ArrowLeft, Heart, Minus, Plus } from 'lucide-react';

export default function ProductDetailsPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.product);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          quantity: quantity
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Added to cart!');
        window.location.href = '/cart';
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7DAACB] via-[#E8D5C4] to-[#7DAACB] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7DAACB] via-[#E8D5C4] to-[#7DAACB] flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Button onClick={() => window.location.href = '/'}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7DAACB] via-[#E8D5C4] to-[#7DAACB]">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          className="mb-6 bg-white hover:bg-gray-100"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="overflow-hidden shadow-2xl">
            <div className="aspect-square bg-gray-100">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7DAACB] to-[#E8D5C4]">
                  <Star className="w-32 h-32 text-white/50" />
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 shadow-2xl">
              <Badge className="mb-4 bg-[#7DAACB]">{product.category}</Badge>
              <h1 className="text-4xl font-bold text-[#7DAACB] mb-4">{product.name}</h1>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                {product.description || 'Beautiful handcrafted jewelry piece from SN Collections'}
              </p>
              <div className="text-4xl font-bold text-[#7DAACB] mb-6">
                ₹{parseFloat(product.price).toLocaleString('en-IN')}
              </div>

              {user && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">Quantity:</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 bg-[#7DAACB] hover:bg-[#6B8CAD] text-lg"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>

                  <Button variant="outline" className="w-full h-14">
                    <Heart className="w-5 h-5 mr-2" />
                    Add to Wishlist
                  </Button>
                </div>
              )}

              {!user && (
                <div className="space-y-2">
                  <p className="text-gray-600 text-center">Please login to add to cart</p>
                  <Button
                    className="w-full h-14 bg-[#7DAACB] hover:bg-[#6B8CAD] text-lg"
                    onClick={() => window.location.href = '/login'}
                  >
                    Login to Buy
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
