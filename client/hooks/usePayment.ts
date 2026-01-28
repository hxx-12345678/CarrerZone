/**
 * usePayment Hook
 * 
 * React hook for handling payment operations
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { 
  processPayment, 
  createPaymentOrder, 
  verifyPayment,
  PaymentOptions 
} from '@/lib/paymentGateway';

interface UsePaymentOptions {
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export const usePayment = (options: UsePaymentOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (
    planType: string,
    quantity: number,
    amount: number,
    customerDetails: {
      name: string;
      email: string;
      phone?: string;
    },
    metadata: Record<string, any> = {}
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create order on backend
      toast.loading('Creating order...', { id: 'payment-process' });
      
      const orderData = await createPaymentOrder(
        planType,
        quantity,
        amount,
        metadata
      );

      // Step 2: Process payment through gateway
      toast.loading('Opening payment gateway...', { id: 'payment-process' });
      
      const paymentOptions: PaymentOptions = {
        amount: orderData.amount,
        orderId: orderData.orderId,
        description: `${planType} - Quantity: ${quantity}`,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        metadata: {
          ...metadata,
          planType,
          quantity
        }
      };

      const paymentResult = await processPayment(paymentOptions);

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Step 3: Verify payment on backend
      toast.loading('Verifying payment...', { id: 'payment-process' });
      
      const verificationResult = await verifyPayment(
        paymentResult.paymentId!,
        paymentResult.orderId!,
        paymentResult.signature!
      );

      if (!verificationResult.success) {
        throw new Error(verificationResult.message);
      }

      // Success
      toast.success('Payment successful!', { id: 'payment-process' });
      
      if (options.onSuccess) {
        options.onSuccess(paymentResult.paymentId!);
      }

      return {
        success: true,
        paymentId: paymentResult.paymentId
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'payment-process' });
      
      if (options.onError) {
        options.onError(errorMessage);
      }

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    initiatePayment,
    isProcessing,
    error
  };
};

