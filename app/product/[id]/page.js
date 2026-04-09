'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, ArrowLeft, Heart, Minus, Plus, ChevronLeft, ChevronRight, Share2, Bookmark } from 'lucide-react';

export default function ProductDetailsPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState([]);
  const [productVideos, setProductVideos] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [userWishlisted, setUserWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ count: 0, average: 0 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

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

        // Extract videos array
        let videos = [];
        if (data.product.videos) {
          videos = typeof data.product.videos === 'string'
            ? JSON.parse(data.product.videos)
            : data.product.videos;
        }
        setProductVideos(Array.isArray(videos) ? videos : []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocial = async (userId) => {
    try {
      const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const response = await fetch(`/api/products/${params.id}/social${qs}`);
      const data = await response.json();
      if (data.success) {
        setLikeCount(data.likes.count);
        setUserLiked(!!data.likes.userLiked);
        setReviews(data.reviews.items || []);
        setReviewSummary({ count: data.reviews.count, average: data.reviews.average });
      }
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    fetchSocial(user?.id);
  }, [user?.id]);

  const toggleLike = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await fetch(`/api/products/${params.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setUserLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      // ignore
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.name || 'SN Collections', url });
        return;
      }
    } catch (e) {
      // fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    } catch {
      alert(url);
    }
  };

  const submitReview = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${params.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to submit review');
        return;
      }
      setReviewForm({ rating: 5, comment: '' });
      await fetchSocial(user.id);
    } catch (error) {
      alert('Failed to submit review');
    } finally {
      setSubmittingReview(false);
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

  const toggleWishlist = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: product.id })
      });
      const data = await res.json();
      if (data.success) {
        setUserWishlisted(!!data.wishlisted);
      } else {
        alert(data.error || 'Failed to update wishlist');
      }
    } catch {
      alert('Failed to update wishlist');
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
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant={userLiked ? "default" : "outline"}
                  className={userLiked ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : ""}
                  onClick={toggleLike}
                >
                  <Heart
                    className={`w-5 h-5 mr-2 ${userLiked ? 'text-white' : 'text-[#B87861]'}`}
                    fill={userLiked ? '#FFFFFF' : 'none'}
                  />
                  Like ({likeCount})
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
                <div className="text-sm text-gray-600">
                  {reviewSummary.count > 0 ? (
                    <span>Reviews: {reviewSummary.average}★ ({reviewSummary.count})</span>
                  ) : (
                    <span>No reviews yet</span>
                  )}
                </div>
              </div>
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

                  <Button variant="outline" className="w-full h-14" onClick={toggleWishlist}>
                    <Bookmark className="w-5 h-5 mr-2" />
                    {userWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
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

            {productVideos.length > 0 && (
              <Card className="p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-[#B87861] mb-4">Videos</h2>
                <div className="grid gap-4">
                  {productVideos.map((v, idx) => (
                    <video key={idx} src={v.url} controls className="w-full rounded-lg bg-black" />
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-[#B87861] mb-4">Reviews</h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className={`flex items-center gap-1 ${!user ? 'opacity-60' : ''}`}>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => user && setReviewForm({ ...reviewForm, rating: r })}
                        className="p-1"
                        aria-label={`${r} star`}
                        disabled={!user}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            r <= reviewForm.rating ? 'text-yellow-500' : 'text-gray-300'
                          }`}
                          fill={r <= reviewForm.rating ? '#EAB308' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{reviewForm.rating}/5</span>
                </div>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={3}
                  placeholder={user ? "Write your review..." : "Login to write a review"}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  disabled={!user}
                />
                <Button
                  className="bg-[#B87861] hover:bg-[#D4A896]"
                  onClick={submitReview}
                  disabled={!user || submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>

              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{r.user_name || 'User'}</div>
                        <div className="text-sm text-gray-600">{r.rating}★</div>
                      </div>
                      {r.comment && <p className="text-gray-700 mt-2">{r.comment}</p>}
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(r.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
