'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function PaymentPage() {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchCart(JSON.parse(userData).id);
  }, []);

  const fetchCart = async (userId) => {
    try {
      const response = await fetch(`/api/cart/${userId}`);
      const data = await response.json();
      if (data.success) {
        setCartItems(data.cart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    if (!transactionId.trim()) {
      setError('Please enter transaction ID');
      setProcessing(false);
      return;
    }

    try {
      const products = cartItems.map(item => ({
        id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          products: products,
          totalPrice: calculateTotal(),
          transactionId: transactionId
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/orders';
        }, 2000);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2D5F3F] via-[#D4AF37] to-[#2D5F3F] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2D5F3F] via-[#D4AF37] to-[#2D5F3F] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-600">Order Placed Successfully!</h2>
            <p className="text-gray-600">Your order is pending approval. Redirecting to orders page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = calculateTotal();
  const gst = subtotal * 0.05;
  const finalAmount = subtotal + gst;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D5F3F] via-[#D4AF37] to-[#2D5F3F]">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          className="mb-6 bg-white hover:bg-gray-100"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-[#2D5F3F] to-[#D4AF37] p-6 rounded-lg text-white text-center">
                <p className="mb-4">Scan QR Code to Pay</p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img
                    src="https://customer-assets.emergentagent.com/job_8b3a1860-dad5-4f14-b2bb-a8184131bc6a/artifacts/b9sf9ti5_WhatsApp%20Image%202026-04-02%20at%2000.39.35.jpeg"
                    alt="Payment QR Code"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID *</Label>
                  <Input
                    id="transactionId"
                    type="text"
                    placeholder="Enter your transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                    className="h-12"
                  />
                  <p className="text-sm text-gray-600">
                    Enter the transaction ID from your payment app
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#2D5F3F] hover:bg-[#5E9B76] text-lg"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Confirm Order'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-semibold">
                      ₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>GST (5%):</span>
                  <span className="font-semibold">₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-2xl font-bold">
                  <span>Total Amount:</span>
                  <span className="text-[#2D5F3F]">₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your order will be pending until admin approves the payment.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
