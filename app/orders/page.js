'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Package, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchOrders(JSON.parse(userData).id);
  }, []);

  const fetchOrders = async (userId) => {
    try {
      const response = await fetch(`/api/orders/${userId}`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B87861] via-[#9B6B5F] to-[#B87861] flex items-center justify-center">
        <div className="text-white text-xl">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B87861] via-[#9B6B5F] to-[#B87861]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            className="bg-white hover:bg-gray-100"
            onClick={() => window.location.href = '/'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-white">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center shadow-2xl">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here!</p>
            <Button
              className="bg-[#B87861] hover:bg-[#D4A896]"
              onClick={() => window.location.href = '/'}
            >
              Browse Products
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const products = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
              return (
                <Card key={order.id} className="shadow-2xl">
                  <CardHeader className="bg-gradient-to-r from-[#B87861]/10 to-[#9B6B5F]/10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl mb-2">Order #{order.id.slice(0, 8)}</CardTitle>
                        <p className="text-sm text-gray-600">
                          Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {products.map((product, idx) => (
                        <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B87861] to-[#9B6B5F]">
                                <Star className="w-8 h-8 text-white/50" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-gray-600 text-sm">Quantity: {product.quantity}</p>
                            <p className="font-semibold text-[#B87861]">
                              ₹{parseFloat(product.price).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">₹{parseFloat(order.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold pt-2 border-t">
                        <span>Total Amount:</span>
                        <span className="text-[#B87861]">₹{parseFloat(order.final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {order.transaction_id && (
                        <div className="flex justify-between text-sm text-gray-600 pt-2">
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
        )}
      </div>
    </div>
  );
}
