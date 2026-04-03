'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Star, LogIn, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, otpCode: requiresOTP ? otpCode : null })
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresOTP) {
          setRequiresOTP(true);
          setIsAdmin(true);
          setMaskedEmail(data.email);
          setError('');
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          if (data.isAdmin) {
            window.location.href = '/admin/dashboard';
          } else {
            window.location.href = '/';
          }
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EFE7] via-[#FAF6F1] to-[#F5EFE7] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-[#E8DDD0]">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_sn-jewelry-shop/artifacts/ry4pjkmk_WhatsApp%20Image%202026-04-03%20at%2019.34.56.jpeg" 
              alt="SN Collections Logo" 
              className="w-20 h-20 rounded-full object-cover shadow-xl ring-4 ring-[#B87861]"
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#B87861] via-[#9B6B5F] to-[#B87861] bg-clip-text text-transparent">
              SN COLLECTIONS
            </CardTitle>
            <CardDescription className="mt-2 text-[#9B6B5F]">Welcome back! Please login to continue</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {!requiresOTP ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Username or Phone Number</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Enter username or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Admin access detected. OTP sent to {maskedEmail}
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    required
                    className="h-12 text-center text-2xl tracking-widest"
                  />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-[#B87861] hover:bg-[#9B6B5F] text-lg text-white shadow-md"
              disabled={loading}
            >
              {loading ? 'Please wait...' : requiresOTP ? 'Verify OTP' : 'Login'}
              <LogIn className="ml-2 w-5 h-5" />
            </Button>

            {!requiresOTP && (
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => window.location.href = '/forgot-password'}
                  className="text-sm text-[#B87861] hover:underline"
                >
                  Forgot Password?
                </button>
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => window.location.href = '/register'}
                    className="text-[#B87861] font-semibold hover:underline"
                  >
                    Register here
                  </button>
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
