"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Eye, Star, Building2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePayment } from '@/hooks/usePayment';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import EmployerAuthNavbar from '@/components/employer-auth-navbar';

export default function JobPostingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedQuantities, setSelectedQuantities] = useState({
    hotVacancy: 1,
    classified: 1,
    standard: 1
  });

  const { initiatePayment, isProcessing } = usePayment({
    onSuccess: () => {
      toast.success('Payment successful! Your credits have been added.');
      setTimeout(() => router.push('/employer-dashboard'), 2000);
    },
    onError: (error) => console.error('Payment error:', error)
  });

  const handleQuantityChange = (plan: string, quantity: number) => {
    setSelectedQuantities(prev => ({ ...prev, [plan]: quantity }));
  };

  const handleBuyNow = async (plan: string, planName: string, price: number) => {
    if (!user) {
      toast.error('Please login to purchase');
      router.push('/employer-login');
      return;
    }
    const quantity = selectedQuantities[plan as keyof typeof selectedQuantities] || 1;
    const totalPrice = price * quantity;
    const discount = quantity >= 5 ? totalPrice * 0.10 : 0;
    const finalPrice = totalPrice - discount;
    await initiatePayment(planName, quantity, finalPrice, {
      name: `${(user as any).first_name || (user as any).firstName || 'User'} ${(user as any).last_name || (user as any).lastName || ''}`,
      email: user.email,
      phone: (user as any).phone || ''
    }, { planId: plan, originalPrice: totalPrice, discount });
  };

  const handlePostFreeJob = () => {
    if (!user) {
      toast.error('Please login to post a free job');
      router.push('/employer-login');
      return;
    }
    toast.success('Redirecting to free job posting...');
    router.push('/employer-dashboard/post-job');
  };

  const pricingPlans = [
    { id: 'hotVacancy', name: 'Hot Vacancy', price: 1650, description: 'Maximum visibility and premium features', validity: '30 days', color: 'border-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-600', features: ['Top placement in search results','Featured company logo','Priority customer support','Advanced analytics','Social media promotion','Email notifications to candidates','Mobile app visibility','Unlimited applications'], icon: Star },
    { id: 'classified', name: 'Classified', price: 990, description: 'Enhanced visibility with key features', validity: '30 days', color: 'border-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600', features: ['Enhanced search placement','Company logo display','Email notifications','Basic analytics','Mobile app visibility','Unlimited applications','Standard customer support'], icon: Eye },
    { id: 'standard', name: 'Standard', price: 550, description: 'Basic job posting with essential features', validity: '30 days', color: 'border-green-500', bgColor: 'bg-green-50', textColor: 'text-green-600', features: ['Standard search placement','Basic job listing','Email notifications','Unlimited applications','Standard customer support'], icon: Building2 },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40">
      <EmployerAuthNavbar />
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Job Posting Plans</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Choose the perfect plan to reach the right candidates and grow your team</p>
          </div>

          <div className="mb-12">
            <Card className="max-w-2xl mx-auto border-2 border-dashed border-slate-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-slate-700">Free Job Posting</CardTitle>
                <CardDescription className="text-lg">Get started with our free plan - no credit card required</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-4">₹0</div>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-center"><Check className="w-5 h-5 text-green-500 mr-2" /><span>Basic job listing</span></div>
                  <div className="flex items-center justify-center"><Check className="w-5 h-5 text-green-500 mr-2" /><span>Standard search placement</span></div>
                  <div className="flex items-center justify-center"><Check className="w-5 h-5 text-green-500 mr-2" /><span>Unlimited applications</span></div>
                </div>
                <Button onClick={handlePostFreeJob} className="w-full bg-slate-600 hover:bg-slate-700">Post Free Job</Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {pricingPlans.map((plan) => {
              const quantity = selectedQuantities[plan.id as keyof typeof selectedQuantities] || 1;
              const totalPrice = plan.price * quantity;
              const discount = quantity >= 5 ? totalPrice * 0.10 : 0;
              const finalPrice = totalPrice - discount;
              const Icon = plan.icon;
              return (
                <Card key={plan.id} className={`relative ${plan.color} ${plan.bgColor} hover:shadow-lg transition-shadow`}>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`w-12 h-12 ${plan.bgColor} rounded-full flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${plan.textColor}`} />
                      </div>
                    </div>
                    <CardTitle className={`text-2xl ${plan.textColor}`}>{plan.name}</CardTitle>
                    <CardDescription className="text-slate-600">{plan.description}</CardDescription>
                    <div className="text-3xl font-bold text-slate-900 mt-4">₹{plan.price.toLocaleString()}</div>
                    <div className="text-sm text-slate-500">per job • {plan.validity}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(plan.id, Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</Button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(plan.id, quantity + 1)}>+</Button>
                      </div>
                      {quantity >= 5 && (
                        <div className="mt-2"><Badge className="bg-green-100 text-green-800">10% Discount Applied</Badge></div>
                      )}
                    </div>
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start"><Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm text-slate-700">{feature}</span></div>
                      ))}
                    </div>
                    <div className="bg-white/50 rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-center mb-2"><span className="text-sm text-slate-600">Subtotal:</span><span className="font-medium">₹{totalPrice.toLocaleString()}</span></div>
                      {discount > 0 && (<div className="flex justify-between items-center mb-2"><span className="text-sm text-green-600">Discount (10%):</span><span className="font-medium text-green-600">-₹{discount.toLocaleString()}</span></div>)}
                      <div className="flex justify-between items-center border-t pt-2"><span className="font-semibold">Total:</span><span className="text-xl font-bold text-slate-900">₹{finalPrice.toLocaleString()}</span></div>
                    </div>
                    <Button onClick={() => handleBuyNow(plan.id, plan.name, plan.price)} disabled={isProcessing} className={`w-full ${plan.bgColor} ${plan.textColor} hover:opacity-90`}>
                      {isProcessing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>) : (`Buy Now - ₹${finalPrice.toLocaleString()}`)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}



