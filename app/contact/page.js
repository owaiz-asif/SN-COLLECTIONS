'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, Star } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A7C59] via-[#9BC1A3] to-[#4A7C59]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-8 h-8 text-[#4A7C59]" fill="#4A7C59" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-xl text-white/90">We'd love to hear from you!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center text-[#4A7C59]">
                  <Phone className="w-6 h-6 mr-2" />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-2">8660109399</p>
                <p className="text-gray-600">Monday - Saturday: 10 AM - 8 PM</p>
                <p className="text-gray-600">Sunday: 10 AM - 6 PM</p>
                <Button 
                  className="mt-4 bg-[#4A7C59] hover:bg-[#3A6047]"
                  onClick={() => window.location.href = 'tel:8660109399'}
                >
                  Call Now
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center text-[#4A7C59]">
                  <Mail className="w-6 h-6 mr-2" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold mb-2">sncollections7411@gmail.com</p>
                <p className="text-gray-600 mb-4">We'll respond within 24 hours</p>
                <Button 
                  className="bg-[#4A7C59] hover:bg-[#3A6047]"
                  onClick={() => window.location.href = 'mailto:sncollections7411@gmail.com'}
                >
                  Send Email
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-[#4A7C59]">
                <MapPin className="w-6 h-6 mr-2" />
                Visit Our Store
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Experience our exquisite collection in person. Visit our showroom for personalized assistance and exclusive designs.
              </p>
              <p className="text-sm text-gray-500">Appointment recommended for personalized consultation</p>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              className="bg-white hover:bg-gray-100"
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
