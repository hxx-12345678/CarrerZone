/**
 * Payment Gateway Service
 * 
 * This file abstracts payment gateway logic to make it easy to switch providers.
 * Currently uses Razorpay, but can be easily modified to use Stripe, PayPal, etc.
 */

import { toast } from 'sonner';

// Payment Gateway Configuration
export const PAYMENT_GATEWAY = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  PAYPAL: 'paypal'
} as const;

export type PaymentGatewayType = typeof PAYMENT_GATEWAY[keyof typeof PAYMENT_GATEWAY];

// Current active gateway
const ACTIVE_GATEWAY: PaymentGatewayType = PAYMENT_GATEWAY.RAZORPAY;

// Razorpay Configuration
const RAZORPAY_CONFIG = {
  KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_NtAc3GFJLI6NbG',
  KEY_SECRET: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET || 'YKGgIMm1Uyh2KBXkfRDbmUUF'
};

// Payment Gateway Interface
export interface PaymentOptions {
  amount: number; // Amount in currency (e.g., ₹100)
  currency?: string;
  orderId: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

// Load Razorpay Script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Razorpay Payment Handler
const processRazorpayPayment = async (
  options: PaymentOptions
): Promise<PaymentResult> => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    // Create Razorpay options
    const razorpayOptions = {
      key: RAZORPAY_CONFIG.KEY_ID,
      amount: Math.round(options.amount * 100), // Convert to paise (smallest currency unit)
      currency: options.currency || 'INR',
      name: 'Job Portal',
      description: options.description,
      order_id: options.orderId,
      prefill: {
        name: options.customerName,
        email: options.customerEmail,
        contact: options.customerPhone || ''
      },
      notes: options.metadata || {},
      theme: {
        color: '#2563eb' // Blue theme
      },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled by user');
        }
      },
      handler: function (response: any) {
        // This will be handled by the promise
      }
    };

    // Return a promise that resolves when payment is complete
    return new Promise((resolve, reject) => {
      razorpayOptions.handler = function (response: any) {
        resolve({
          success: true,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature
        });
      };

      // Create and open Razorpay checkout
      const rzp = new (window as any).Razorpay(razorpayOptions);
      
      rzp.on('payment.failed', function (response: any) {
        reject({
          success: false,
          error: response.error.description || 'Payment failed'
        });
      });

      rzp.open();
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Payment processing failed'
    };
  }
};

// Main Payment Gateway Function
export const processPayment = async (
  options: PaymentOptions
): Promise<PaymentResult> => {
  try {
    switch (ACTIVE_GATEWAY) {
      case PAYMENT_GATEWAY.RAZORPAY:
        return await processRazorpayPayment(options);
      
      default:
        // For future implementations
        if (ACTIVE_GATEWAY === PAYMENT_GATEWAY.STRIPE) {
          throw new Error('Stripe integration not implemented yet');
        } else if (ACTIVE_GATEWAY === PAYMENT_GATEWAY.PAYPAL) {
          throw new Error('PayPal integration not implemented yet');
        } else {
          throw new Error('Invalid payment gateway');
        }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Payment processing failed'
    };
  }
};

// Helper function to get API base URL
const getApiBaseUrl = (): string => {
  // Match the pattern used in api.ts
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  // Ensure URL ends with /api if not already present
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

// Helper function to create order on backend
export const createPaymentOrder = async (
  planType: string,
  quantity: number,
  amount: number,
  metadata: Record<string, any> = {}
): Promise<{ orderId: string; amount: number }> => {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        planType,
        quantity,
        amount,
        metadata
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create order');
    }

    const data = await response.json();
    return {
      orderId: data.orderId,
      amount: data.amount
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create payment order');
  }
};

// Helper function to verify payment on backend
export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        paymentId,
        orderId,
        signature
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Payment verification failed');
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Payment verified successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Payment verification failed'
    };
  }
};

// Get active payment gateway name
export const getActiveGateway = (): PaymentGatewayType => {
  return ACTIVE_GATEWAY;
};

// Check if payment gateway is configured
export const isPaymentGatewayConfigured = (): boolean => {
  switch (ACTIVE_GATEWAY) {
    case PAYMENT_GATEWAY.RAZORPAY:
      return !!(RAZORPAY_CONFIG.KEY_ID && RAZORPAY_CONFIG.KEY_SECRET);
    default:
      return false;
  }
};

