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
    <div className="min-h-screen bg-gradient-to-br from-[#2D5F3F] via-[#D4AF37] to-[#2D5F3F] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2D5F3F] to-[#D4AF37] rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-white" fill="white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#2D5F3F] to-[#5E9B76] bg-clip-text text-transparent">
              SN COLLECTIONS
            </CardTitle>
            <CardDescription className="mt-2">Welcome back! Please login to continue</CardDescription>
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
              className="w-full h-12 bg-[#2D5F3F] hover:bg-[#5E9B76] text-lg"
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
                  className="text-sm text-[#2D5F3F] hover:underline"
                >
                  Forgot Password?
                </button>
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => window.location.href = '/register'}
                    className="text-[#2D5F3F] font-semibold hover:underline"
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
