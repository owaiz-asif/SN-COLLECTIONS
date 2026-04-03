'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, ArrowLeft, Heart, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductDetailsPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState([]);

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
        
        // Extract images array
        let images = [];
        if (data.product.images) {
          images = typeof data.product.images === 'string' 
            ? JSON.parse(data.product.images) 
            : data.product.images;
        }
        
        // Fallback to image_url if no images array
        if (images.length === 0 && data.product.image_url) {
          images = [{ url: data.product.image_url, isPrimary: true }];
        }
        
        setProductImages(images);
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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B87861] via-[#9B6B5F] to-[#B87861] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B87861] via-[#9B6B5F] to-[#B87861] flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Button onClick={() => window.location.href = '/'}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B87861] via-[#9B6B5F] to-[#B87861]">
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
            <div className="relative aspect-square bg-gray-100">
              {productImages.length > 0 ? (
                <>
                  <img
                    src={productImages[currentImageIndex].url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {productImages.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {productImages.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex 
                                ? 'bg-white w-6' 
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B87861] to-[#9B6B5F]">
                  <Star className="w-32 h-32 text-white/50" />
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="p-4 grid grid-cols-5 gap-2">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-[#B87861] scale-105' 
                        : 'border-gray-200 hover:border-[#B87861]/50'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-6 shadow-2xl">
              <Badge className="mb-4 bg-[#B87861]">{product.category}</Badge>
              <h1 className="text-4xl font-bold text-[#B87861] mb-4">{product.name}</h1>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                {product.description || 'Beautiful handcrafted jewelry piece from SN Collections'}
              </p>
              <div className="text-4xl font-bold text-[#B87861] mb-6">
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
                    className="w-full h-14 bg-[#B87861] hover:bg-[#D4A896] text-lg"
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
                    className="w-full h-14 bg-[#B87861] hover:bg-[#D4A896] text-lg"
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
