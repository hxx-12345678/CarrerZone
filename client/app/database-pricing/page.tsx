'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Info, Search, Zap, MessageCircle, Users, Filter, Eye, Download, Mail, Database, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePayment } from '@/hooks/usePayment';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import EmployerAuthNavbar from '@/components/employer-auth-navbar';

export default function DatabasePricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const { initiatePayment, isProcessing } = usePayment({
    onSuccess: (paymentId) => {
      toast.success('Payment successful! Your database access has been activated.');
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/employer-dashboard');
      }, 2000);
    },
    onError: (error) => {
      console.error('Payment error:', error);
    }
  });

  const handleQuantityChange = (quantity: number) => {
    setSelectedQuantity(quantity);
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to purchase');
      router.push('/employer-login');
      return;
    }

    const price = 4000;
    const totalPrice = price * selectedQuantity;
    const discount = selectedQuantity >= 3 ? 1500 * selectedQuantity : 0;
    const finalPrice = totalPrice - discount;
    
    // Initiate payment
    await initiatePayment(
      'Database Lite', // Plan type
      selectedQuantity, // Quantity
      finalPrice, // Amount
      {
        name: `${(user as any).first_name || (user as any).firstName || 'User'} ${(user as any).last_name || (user as any).lastName || ''}`,
        email: user.email,
        phone: (user as any).phone || ''
      },
      {
        planId: 'database_lite',
        originalPrice: totalPrice,
        discount: discount
      }
    );
  };

  const handleContactSales = () => {
    toast.success('Redirecting to contact sales...');
    router.push('/contact');
  };

  const databaseLiteFeatures = [
    { icon: Eye, text: '100 CV views per requirement', included: true },
    { icon: Search, text: 'Up to 500 search results', included: true },
    { icon: Users, text: 'Candidates active in last 6 months', included: true },
    { icon: Filter, text: '10+ advanced filters', included: true },
    { icon: Users, text: 'Single user access', included: true },
    { icon: Search, text: '1 search query (role, location) per requirement', included: true }
  ];

  const databaseFeatures = [
    { icon: Eye, text: 'CV views as per plan', included: true },
    { icon: Search, text: 'Unlimited search results', included: true },
    { icon: Users, text: 'All available candidates', included: true },
    { icon: Filter, text: '20+ advanced filters', included: true },
    { icon: Users, text: 'Multiple user access', included: true },
    { icon: Mail, text: 'Email multiple candidates together', included: true },
    { icon: Search, text: 'Boolean keyword search', included: true },
    { icon: Download, text: 'Download CVs in bulk', included: true }
  ];

  const calculateDiscount = () => {
    return selectedQuantity >= 3 ? 1500 * selectedQuantity : 0;
  };

  const calculateTotal = () => {
    const price = 4000;
    const totalPrice = price * selectedQuantity;
    const discount = calculateDiscount();
    return totalPrice - discount;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40">
      <EmployerAuthNavbar />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Resume Database Plans
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Access millions of candidate profiles and find the perfect match for your requirements
            </p>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Database Lite */}
            <Card className="relative border-2 border-blue-500 bg-blue-50 hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
              </div>
              
              <CardHeader className="text-center pt-8">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-blue-600">Database Lite</CardTitle>
                <CardDescription className="text-slate-600">
                  Perfect for small to medium businesses
                </CardDescription>
                <div className="text-3xl font-bold text-slate-900 mt-4">
                  ₹4,000
                </div>
                <div className="text-sm text-slate-500">per requirement</div>
              </CardHeader>
              
              <CardContent>
                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Number of Requirements
                  </label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(Math.max(1, selectedQuantity - 1))}
                      disabled={selectedQuantity <= 1}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium">{selectedQuantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(selectedQuantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                  {selectedQuantity >= 3 && (
                    <div className="mt-2">
                      <Badge className="bg-green-100 text-green-800">
                        ₹1,500 Discount per Requirement
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {databaseLiteFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Price Summary */}
                <div className="bg-white/50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Subtotal:</span>
                    <span className="font-medium">₹{(4000 * selectedQuantity).toLocaleString()}</span>
                  </div>
                  {calculateDiscount() > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-green-600">Discount:</span>
                      <span className="font-medium text-green-600">-₹{calculateDiscount().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold text-slate-900">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                {/* Buy Now Button */}
                <Button
                  onClick={handleBuyNow}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Buy Now - ₹${calculateTotal().toLocaleString()}`
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Database Enterprise */}
            <Card className="relative border-2 border-purple-500 bg-purple-50 hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-500 text-white px-4 py-1">Enterprise</Badge>
              </div>
              
              <CardHeader className="text-center pt-8">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-purple-600">Database Enterprise</CardTitle>
                <CardDescription className="text-slate-600">
                  For large organizations with high-volume hiring
                </CardDescription>
                <div className="text-3xl font-bold text-slate-900 mt-4">
                  Custom Pricing
                </div>
                <div className="text-sm text-slate-500">Contact sales for details</div>
              </CardHeader>
              
              <CardContent>
                {/* Features */}
                <div className="space-y-3 mb-6">
                  {databaseFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Contact Sales Button */}
                <Button
                  onClick={handleContactSales}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
              Why Choose Our Resume Database?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Millions of Profiles</h3>
                <p className="text-slate-600">
                  Access to a vast database of qualified candidates across all industries and experience levels.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Advanced Search</h3>
                <p className="text-slate-600">
                  Powerful search filters to find candidates with specific skills, experience, and qualifications.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Quick Access</h3>
                <p className="text-slate-600">
                  Get instant access to candidate profiles and contact information for faster hiring decisions.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-xl rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  What's included in the Database Lite plan?
                </h3>
                <p className="text-slate-600">
                  Database Lite includes 100 CV views per requirement, up to 500 search results, 
                  candidates active in the last 6 months, 10+ advanced filters, single user access, 
                  and 1 search query per requirement.
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-xl rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  How long is the access valid?
                </h3>
                <p className="text-slate-600">
                  Your database access is valid for 30 days from the date of purchase. 
                  You can use all your CV views and search queries within this period.
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-xl rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Can I upgrade to Enterprise plan later?
                </h3>
                <p className="text-slate-600">
                  Yes, you can upgrade to our Enterprise plan at any time. 
                  Contact our sales team for custom pricing and features based on your requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
