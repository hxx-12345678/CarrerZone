'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Calculator, Download, RefreshCw, Info, AlertTriangle, CheckCircle2, BarChart3, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface SalaryProfile {
  ctc?: number;
  basic: number;
  hra: number;
  conveyance: number;
  special_allowances: number;
  lta: number;
  bonus: number;
  other_taxable: number;
  employee_pf_percent: number;
  employer_pf_percent: number;
  nps_employee: number;
  nps_employer: number;
  other_deductions: number;
  investments: {
    '80C': number;
    '80D': number;
    '80CCD1B': number;
  };
  rent_paid: number;
  lives_in_metro: boolean;
  age: number;
  state: string;
  income_from_other_sources: number;
  stcg: number;
  ltcg: number;
}

interface CalculationResult {
  success: boolean;
  fy: string;
  regimes: {
    [key: string]: {
      regime: string;
      grossSalary: number;
      taxableIncome: any;
      incomeTax: any;
      monthlyTDS: any;
      professionalTax: number;
      takeHome: any;
      breakdown: any;
    };
  };
  metadata: {
    rulesSource: string;
    rulesVersion: string;
    fetchedAt: string;
    calculatedAt: string;
  };
  disclaimer: {
    message: string;
    source: string;
    lastUpdated: string;
  };
}

const SalaryCalculator = () => {
  const [profile, setProfile] = useState<SalaryProfile>({
    basic: 480000,
    hra: 240000,
    conveyance: 24000,
    special_allowances: 360000,
    lta: 20000,
    bonus: 60000,
    other_taxable: 0,
    employee_pf_percent: 12,
    employer_pf_percent: 12,
    nps_employee: 0,
    nps_employer: 0,
    other_deductions: 0,
    investments: {
      '80C': 150000,
      '80D': 25000,
      '80CCD1B': 0
    },
    rent_paid: 288000,
    lives_in_metro: true,
    age: 30,
    state: 'Maharashtra',
    income_from_other_sources: 0,
    stcg: 0,
    ltcg: 0
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableRegimes, setAvailableRegimes] = useState<string[]>([]);
  const [selectedRegimes, setSelectedRegimes] = useState<string[]>(['old', 'new']);
  const [showDemo, setShowDemo] = useState(false);
  const [showTestSuite, setShowTestSuite] = useState(false);
  
  // Indian states with professional tax
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  useEffect(() => {
    // Use local states array and set default regimes
    setAvailableStates(indianStates);
    setAvailableRegimes(['old', 'new', 'new_post_2025']);
  }, []);

  const fetchAvailableStates = async () => {
    try {
      const response = await fetch('/api/salary/states');
      const data = await response.json();
      if (data.success) {
        setAvailableStates(data.states);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      // Fallback to local states
      setAvailableStates(indianStates);
    }
  };

  const fetchAvailableRegimes = async () => {
    try {
      const response = await fetch('/api/salary/regimes');
      const data = await response.json();
      if (data.success) {
        setAvailableRegimes(data.regimes.map((r: any) => r.key));
      }
    } catch (error) {
      console.error('Error fetching regimes:', error);
      // Fallback to default regimes
      setAvailableRegimes(['old', 'new', 'new_post_2025']);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('investments.')) {
      const investmentKey = field.split('.')[1];
      setProfile(prev => ({
        ...prev,
        investments: {
          ...prev.investments,
          [investmentKey]: parseFloat(value) || 0
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }));
    }
    
    // Clear previous results when inputs change to force recalculation
    setResult(null);
  };

  const loadDemoData = () => {
    const demoProfile = {
      basic: 600000,
      hra: 300000,
      conveyance: 30000,
      special_allowances: 450000,
      lta: 25000,
      bonus: 75000,
      other_taxable: 20000,
      employee_pf_percent: 12,
      employer_pf_percent: 12,
      nps_employee: 0,
      nps_employer: 0,
      other_deductions: 0,
      investments: {
        '80C': 150000,
        '80D': 25000,
        '80CCD1B': 0
      },
      rent_paid: 360000,
      lives_in_metro: true,
      age: 30,
      state: 'Maharashtra',
      income_from_other_sources: 0,
      stcg: 0,
      ltcg: 0
    };
    
    setProfile(demoProfile);
    setShowDemo(true);
    toast.success('Demo data loaded! This shows a typical software engineer salary in Mumbai.');
  };

  const clearAllData = () => {
    setProfile({
      basic: 0,
      hra: 0,
      conveyance: 0,
      special_allowances: 0,
      lta: 0,
      bonus: 0,
      other_taxable: 0,
      employee_pf_percent: 12,
      employer_pf_percent: 12,
      nps_employee: 0,
      nps_employer: 0,
      other_deductions: 0,
      investments: {
        '80C': 0,
        '80D': 0,
        '80CCD1B': 0
      },
      rent_paid: 0,
      lives_in_metro: true,
      age: 30,
      state: 'Maharashtra',
      income_from_other_sources: 0,
      stcg: 0,
      ltcg: 0
    });
    setShowDemo(false);
    setResult(null);
    toast.info('All data cleared. You can start fresh!');
  };

  const calculateSalary = async () => {
    if (selectedRegimes.length === 0) {
      toast.error('Please select at least one tax regime to compare');
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/salary/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fy: '2025-26',
          regimes: selectedRegimes,
          profile
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setResult(data);
        toast.success('Salary calculation completed! This is an approximate calculation.', {
          description: 'Please consult a CA for final tax calculations.',
          duration: 5000,
        });
      } else {
        toast.error(data.message || 'Calculation failed');
      }
    } catch (error) {
      console.error('Error calculating salary:', error);
      toast.error('Failed to calculate salary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBestRegime = () => {
    if (!result || !result.regimes) return null;
    
    let bestRegime = null;
    let lowestTax = Infinity;
    
    Object.entries(result.regimes).forEach(([key, regime]) => {
      const regimeTax = regime.incomeTax?.total || 0;
      if (regimeTax < lowestTax) {
        lowestTax = regimeTax;
        bestRegime = key;
      }
    });
    
    return bestRegime;
  };

  const runComprehensiveTests = async () => {
    setLoading(true);
    const testResults = [];
    
    // Test scenarios
    const testScenarios = [
      {
        name: "Low Income (₹5L)",
        profile: { basic: 300000, hra: 150000, conveyance: 19200, special_allowances: 30000, lta: 0, bonus: 0, other_taxable: 0, employee_pf_percent: 12, employer_pf_percent: 12, nps_employee: 0, nps_employer: 0, other_deductions: 0, investments: { '80C': 0, '80D': 0, '80CCD1B': 0 }, rent_paid: 180000, lives_in_metro: true, age: 30, state: 'Maharashtra', income_from_other_sources: 0, stcg: 0, ltcg: 0 }
      },
      {
        name: "Medium Income (₹10L)",
        profile: { basic: 600000, hra: 300000, conveyance: 30000, special_allowances: 70000, lta: 25000, bonus: 0, other_taxable: 0, employee_pf_percent: 12, employer_pf_percent: 12, nps_employee: 0, nps_employer: 0, other_deductions: 0, investments: { '80C': 150000, '80D': 25000, '80CCD1B': 0 }, rent_paid: 360000, lives_in_metro: true, age: 30, state: 'Maharashtra', income_from_other_sources: 0, stcg: 0, ltcg: 0 }
      },
      {
        name: "High Income (₹20L)",
        profile: { basic: 1200000, hra: 600000, conveyance: 50000, special_allowances: 150000, lta: 50000, bonus: 100000, other_taxable: 0, employee_pf_percent: 12, employer_pf_percent: 12, nps_employee: 0, nps_employer: 0, other_deductions: 0, investments: { '80C': 150000, '80D': 25000, '80CCD1B': 50000 }, rent_paid: 720000, lives_in_metro: true, age: 30, state: 'Maharashtra', income_from_other_sources: 0, stcg: 0, ltcg: 0 }
      },
      {
        name: "Zero Investments",
        profile: { basic: 600000, hra: 300000, conveyance: 30000, special_allowances: 70000, lta: 25000, bonus: 0, other_taxable: 0, employee_pf_percent: 12, employer_pf_percent: 12, nps_employee: 0, nps_employer: 0, other_deductions: 0, investments: { '80C': 0, '80D': 0, '80CCD1B': 0 }, rent_paid: 360000, lives_in_metro: true, age: 30, state: 'Maharashtra', income_from_other_sources: 0, stcg: 0, ltcg: 0 }
      },
      {
        name: "Senior Citizen (65 years)",
        profile: { basic: 600000, hra: 300000, conveyance: 30000, special_allowances: 70000, lta: 25000, bonus: 0, other_taxable: 0, employee_pf_percent: 12, employer_pf_percent: 12, nps_employee: 0, nps_employer: 0, other_deductions: 0, investments: { '80C': 150000, '80D': 50000, '80CCD1B': 0 }, rent_paid: 360000, lives_in_metro: true, age: 65, state: 'Maharashtra', income_from_other_sources: 0, stcg: 0, ltcg: 0 }
      }
    ];

    for (const scenario of testScenarios) {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${API_BASE_URL}/salary/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fy: '2025-26',
            regimes: ['old', 'new', 'new_post_2025'],
            profile: scenario.profile
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const regimeResults = Object.entries(data.regimes).map(([key, regime]: [string, any]) => ({
              regime: key,
              tax: regime.incomeTax?.total || 0,
              takeHome: regime.takeHome?.monthly || 0
            }));
            
            testResults.push({
              scenario: scenario.name,
              success: true,
              results: regimeResults
            });
          } else {
            testResults.push({
              scenario: scenario.name,
              success: false,
              error: data.message
            });
          }
        } else {
          testResults.push({
            scenario: scenario.name,
            success: false,
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        testResults.push({
          scenario: scenario.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }

    setLoading(false);
    setShowTestSuite(true);
    toast.success(`Test suite completed! ${testResults.filter(r => r.success).length}/${testResults.length} tests passed.`);
    
    // Log results for debugging
    console.log('Test Results:', testResults);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 relative overflow-hidden">
      {/* Animated 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Gradient Mesh Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(at 20% 30%, rgba(59, 130, 246, 0.3) 0px, transparent 50%),
              radial-gradient(at 80% 70%, rgba(139, 92, 246, 0.3) 0px, transparent 50%),
              radial-gradient(at 50% 50%, rgba(99, 102, 241, 0.2) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(67, 56, 202, 0.2) 0px, transparent 50%)
            `,
            backgroundSize: '100% 100%',
            animation: 'gradientShift 15s ease infinite'
          }}></div>
        </div>

        {/* 3D Animated Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" 
             style={{ 
               animation: 'float1 20s ease-in-out infinite',
               transform: 'translate(20%, -20%)'
             }}></div>
        
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl" 
             style={{ 
               animation: 'float2 25s ease-in-out infinite',
               transform: 'translate(-20%, 20%)'
             }}></div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/15 rounded-full blur-3xl" 
             style={{ 
               animation: 'float3 30s ease-in-out infinite'
             }}></div>

        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-3xl" 
             style={{ 
               animation: 'float4 22s ease-in-out infinite'
             }}></div>

        {/* 3D Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: 'perspective(1000px) rotateX(60deg)',
          transformOrigin: 'center center',
          animation: 'gridMove 20s linear infinite'
        }}></div>

        {/* Animated Geometric Shapes */}
        <div className="absolute top-20 left-20 w-64 h-64 border-2 border-blue-400/20 rounded-lg" 
             style={{
               transform: 'rotate(45deg) perspective(1000px) rotateY(20deg)',
               animation: 'rotateShape 15s linear infinite'
             }}></div>
        
        <div className="absolute bottom-32 right-32 w-48 h-48 border-2 border-indigo-400/20 rounded-full" 
             style={{
               transform: 'perspective(1000px) rotateX(30deg)',
               animation: 'pulseShape 8s ease-in-out infinite'
             }}></div>

        <div className="absolute top-1/3 right-1/3 w-32 h-32 border-2 border-purple-400/20" 
             style={{
               transform: 'perspective(1000px) rotateZ(45deg) rotateX(60deg)',
               animation: 'spin3D 12s linear infinite'
             }}></div>

        {/* Particle Effects */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/30 rounded-full blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatParticle ${10 + Math.random() * 20}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}

        {/* Animated Wave Pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-64 opacity-10">
          <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path
              d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z"
              fill="rgba(59, 130, 246, 0.3)"
              style={{
                animation: 'wave 8s ease-in-out infinite'
              }}
            ></path>
          </svg>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translate(20%, -20%) scale(1); }
          50% { transform: translate(30%, -30%) scale(1.1); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(-20%, 20%) scale(1); }
          50% { transform: translate(-30%, 30%) scale(1.15); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(10%, -10%) scale(1.1); }
        }
        @keyframes rotateShape {
          0% { transform: rotate(45deg) perspective(1000px) rotateY(0deg); }
          100% { transform: rotate(405deg) perspective(1000px) rotateY(360deg); }
        }
        @keyframes pulseShape {
          0%, 100% { transform: perspective(1000px) rotateX(30deg) scale(1); opacity: 0.2; }
          50% { transform: perspective(1000px) rotateX(30deg) scale(1.3); opacity: 0.4; }
        }
        @keyframes spin3D {
          0% { transform: perspective(1000px) rotateZ(0deg) rotateX(0deg); }
          100% { transform: perspective(1000px) rotateZ(360deg) rotateX(360deg); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { transform: translateY(-50px) translateX(30px); opacity: 0.6; }
          50% { transform: translateY(-100px) translateX(-20px); opacity: 0.4; }
          75% { transform: translateY(-50px) translateX(-40px); opacity: 0.5; }
        }
        @keyframes gridMove {
          0% { transform: perspective(1000px) rotateX(60deg) translateY(0px); }
          100% { transform: perspective(1000px) rotateX(60deg) translateY(50px); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes wave {
          0%, 100% { d: path('M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z'); }
          50% { d: path('M0,60 Q300,100 600,60 T1200,60 L1200,120 L0,120 Z'); }
        }
      `}</style>

      <div className="relative container mx-auto p-6 space-y-6 z-10">
        {/* Hero Section */}
        <div className="text-center space-y-6 pb-8 relative z-10">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur-2xl opacity-60 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20">
                <Calculator className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent mb-2 drop-shadow-lg">
                Salary Calculator
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto rounded-full shadow-lg"></div>
            </div>
          </div>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto font-medium drop-shadow-md">
            Calculate your take-home salary and tax liability across different tax regimes for <span className="font-semibold text-blue-300">FY 2025-26</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            <span className="drop-shadow-md">Accurate calculations • Latest tax rules • Instant results</span>
          </div>
          
          {/* Demo and Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  onClick={loadDemoData}
                  variant="outline" 
                  className="flex items-center gap-2 border-blue-200 hover:bg-blue-50"
                >
                  <Info className="h-4 w-4" />
                  Load Demo Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Demo Data Preview
                  </DialogTitle>
                  <DialogDescription>
                    This demo data represents a typical software engineer's salary structure. Hover over the button to see the values that will be loaded.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Basic Salary:</span>
                          <span className="font-medium">₹6,00,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">HRA:</span>
                          <span className="font-medium">₹3,00,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conveyance:</span>
                          <span className="font-medium">₹30,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Special Allowances:</span>
                          <span className="font-medium">₹4,50,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">LTA:</span>
                          <span className="font-medium">₹25,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bonus:</span>
                          <span className="font-medium">₹75,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Other Taxable:</span>
                          <span className="font-medium">₹20,000</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Tax Saving Investments</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">80C (ELSS/Mutual Funds):</span>
                          <span className="font-medium">₹1,50,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">80D (Health Insurance):</span>
                          <span className="font-medium">₹25,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">80CCD(1B) (NPS):</span>
                          <span className="font-medium">₹50,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Employee PF:</span>
                          <span className="font-medium">12% of Basic</span>
                        </div>
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Personal Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rent Paid:</span>
                          <span className="font-medium">₹3,60,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Metro City:</span>
                          <span className="font-medium">Yes (Mumbai)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">State:</span>
                          <span className="font-medium">Maharashtra</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Age:</span>
                          <span className="font-medium">30 years</span>
                        </div>
                      </div>
                    </div>

                    {/* Expected Results */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Expected Results</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gross Salary:</span>
                          <span className="font-medium">₹15,00,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Old Regime Tax:</span>
                          <span className="font-medium text-red-600">₹1,32,649</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">New Regime Tax:</span>
                          <span className="font-medium text-green-600">₹0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Best Take-Home:</span>
                          <span className="font-medium text-green-600">₹1,18,800/month</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">About This Demo:</p>
                        <p>This represents a typical software engineer's salary structure. The new regime shows better results due to the ₹60,000 rebate for incomes up to ₹12 lakhs. Click "Load Demo Data" to populate the form with these values.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={loadDemoData} className="bg-blue-600 hover:bg-blue-700">
                      Load This Demo Data
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              onClick={clearAllData}
              variant="outline" 
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Clear All
            </Button>
            <Button 
              onClick={runComprehensiveTests}
              variant="outline" 
              className="flex items-center gap-2 border-green-200 hover:bg-green-50"
            >
              <BarChart3 className="h-4 w-4" />
              Run Test Suite
            </Button>
          </div>
          
          {showDemo && (
            <Alert className="max-w-2xl mx-auto border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Demo Mode:</strong> Sample data loaded showing a typical ₹15L software engineer salary in Mumbai. 
                You can modify any values to see how they affect your calculations.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Legal Disclaimer */}
        <Alert className="border-amber-400/50 bg-gradient-to-r from-amber-900/80 via-yellow-900/80 to-orange-900/80 backdrop-blur-md shadow-2xl border-2 border-amber-400/30 relative z-10">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
          <AlertDescription className="text-amber-100 font-medium">
            <strong className="text-amber-200">Legal Disclaimer:</strong> This calculator provides approximate calculations for estimation purposes only. 
            Tax laws are complex and subject to change. Please consult a Chartered Accountant or verify with the 
            Income Tax Department for final tax calculations and compliance.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          {/* Input Form */}
          <Card className="shadow-2xl border border-white/10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
            {/* Decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            <CardHeader className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-lg relative overflow-hidden border-b border-white/20">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }}></div>
              <div className="relative z-10">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  Salary Details
                </CardTitle>
                <CardDescription className="text-blue-100 mt-2 text-base">
                  Enter your salary components and deductions for accurate calculation
                </CardDescription>
              </div>
            </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="allowances">Allowances</TabsTrigger>
                <TabsTrigger value="deductions">Deductions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="basic" className="flex items-center gap-2">
                      Basic Salary (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="basic"
                      type="number"
                      value={profile.basic}
                      onChange={(e) => handleInputChange('basic', e.target.value)}
                      placeholder="e.g., 600000"
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      Base salary component. Usually 40-50% of total CTC.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hra" className="flex items-center gap-2">
                      HRA - House Rent Allowance (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="hra"
                      type="number"
                      value={profile.hra}
                      onChange={(e) => handleInputChange('hra', e.target.value)}
                      placeholder="e.g., 300000"
                    />
                    <p className="text-xs text-gray-500">
                      Rent allowance. Tax-exempt up to certain limits based on actual rent paid.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="conveyance" className="flex items-center gap-2">
                      Conveyance Allowance (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="conveyance"
                      type="number"
                      value={profile.conveyance}
                      onChange={(e) => handleInputChange('conveyance', e.target.value)}
                      placeholder="e.g., 30000"
                    />
                    <p className="text-xs text-gray-500">
                      Transport allowance. Up to ₹1,600/month is tax-exempt.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="special_allowances" className="flex items-center gap-2">
                      Special Allowances (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="special_allowances"
                      type="number"
                      value={profile.special_allowances}
                      onChange={(e) => handleInputChange('special_allowances', e.target.value)}
                      placeholder="e.g., 450000"
                    />
                    <p className="text-xs text-gray-500">
                      Variable pay component. Fully taxable unless specified otherwise.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="flex items-center gap-2">
                      State
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Select value={profile.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Affects professional tax calculation. Different states have different rates.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age" className="flex items-center gap-2">
                      Age
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="e.g., 30"
                    />
                    <p className="text-xs text-gray-500">
                      Used for senior citizen tax benefits (60+ years).
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Checkbox
                    id="lives_in_metro"
                    checked={profile.lives_in_metro}
                    onCheckedChange={(checked) => handleInputChange('lives_in_metro', checked)}
                  />
                  <Label htmlFor="lives_in_metro" className="flex items-center gap-2">
                    Live in Metro City
                    <Info className="h-3 w-3 text-gray-400" />
                  </Label>
                  <p className="text-xs text-gray-500 ml-4">
                    Metro cities: Mumbai, Delhi, Chennai, Kolkata. Affects HRA exemption calculation.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="allowances" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="lta" className="flex items-center gap-2">
                      LTA - Leave Travel Allowance (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="lta"
                      type="number"
                      value={profile.lta}
                      onChange={(e) => handleInputChange('lta', e.target.value)}
                      placeholder="e.g., 25000"
                    />
                    <p className="text-xs text-gray-500">
                      Travel allowance. Tax-exempt only when actual travel occurs with valid bills.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonus" className="flex items-center gap-2">
                      Bonus/Performance Pay (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="bonus"
                      type="number"
                      value={profile.bonus}
                      onChange={(e) => handleInputChange('bonus', e.target.value)}
                      placeholder="e.g., 75000"
                    />
                    <p className="text-xs text-gray-500">
                      Annual bonus or performance incentives. Fully taxable.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="other_taxable" className="flex items-center gap-2">
                      Other Taxable Components (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="other_taxable"
                      type="number"
                      value={profile.other_taxable}
                      onChange={(e) => handleInputChange('other_taxable', e.target.value)}
                      placeholder="e.g., 20000"
                    />
                    <p className="text-xs text-gray-500">
                      Any other taxable allowances (meal coupons, medical, etc.).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rent_paid" className="flex items-center gap-2">
                      Actual Rent Paid (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="rent_paid"
                      type="number"
                      value={profile.rent_paid}
                      onChange={(e) => handleInputChange('rent_paid', e.target.value)}
                      placeholder="e.g., 360000"
                    />
                    <p className="text-xs text-gray-500">
                      Annual rent paid for accommodation. Used for HRA exemption calculation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="stcg" className="flex items-center gap-2">
                      Short Term Capital Gains (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="stcg"
                      type="number"
                      value={profile.stcg}
                      onChange={(e) => handleInputChange('stcg', e.target.value)}
                      placeholder="e.g., 0"
                    />
                    <p className="text-xs text-gray-500">
                      Gains from sale of assets held for less than 1 year (shares, mutual funds).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ltcg" className="flex items-center gap-2">
                      Long Term Capital Gains (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="ltcg"
                      type="number"
                      value={profile.ltcg}
                      onChange={(e) => handleInputChange('ltcg', e.target.value)}
                      placeholder="e.g., 0"
                    />
                    <p className="text-xs text-gray-500">
                      Gains from sale of assets held for more than 1 year.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deductions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="employee_pf_percent" className="flex items-center gap-2">
                      Employee PF %
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="employee_pf_percent"
                      type="number"
                      value={profile.employee_pf_percent}
                      onChange={(e) => handleInputChange('employee_pf_percent', e.target.value)}
                      placeholder="e.g., 12"
                    />
                    <p className="text-xs text-gray-500">
                      EPF contribution rate (typically 12% of basic salary).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nps_employee" className="flex items-center gap-2">
                      NPS Employee Contribution (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="nps_employee"
                      type="number"
                      value={profile.nps_employee}
                      onChange={(e) => handleInputChange('nps_employee', e.target.value)}
                      placeholder="e.g., 0"
                    />
                    <p className="text-xs text-gray-500">
                      Voluntary NPS contribution (eligible for tax deduction under 80C).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="other_deductions" className="flex items-center gap-2">
                      Other Deductions (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="other_deductions"
                      type="number"
                      value={profile.other_deductions}
                      onChange={(e) => handleInputChange('other_deductions', e.target.value)}
                      placeholder="e.g., 0"
                    />
                    <p className="text-xs text-gray-500">
                      Any other pre-tax deductions (insurance, loans, etc.).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income_from_other_sources" className="flex items-center gap-2">
                      Income from Other Sources (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="income_from_other_sources"
                      type="number"
                      value={profile.income_from_other_sources}
                      onChange={(e) => handleInputChange('income_from_other_sources', e.target.value)}
                      placeholder="e.g., 0"
                    />
                    <p className="text-xs text-gray-500">
                      Additional income like interest, rent, freelance, etc.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">Chapter VI-A Tax Saving Investments</h4>
                    <Info className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    These deductions help reduce your taxable income. Available in Old Tax Regime only.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="80C" className="flex items-center gap-2">
                        Section 80C (₹)
                        <Info className="h-3 w-3 text-gray-400" />
                      </Label>
                      <Input
                        id="80C"
                        type="number"
                        value={profile.investments['80C']}
                        onChange={(e) => handleInputChange('investments.80C', e.target.value)}
                        placeholder="e.g., 150000"
                      />
                      <p className="text-xs text-gray-500">
                        Max ₹1.5L: ELSS, PPF, EPF, Life Insurance, Home Loan Principal, etc.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="80D" className="flex items-center gap-2">
                        Section 80D (₹)
                        <Info className="h-3 w-3 text-gray-400" />
                      </Label>
                      <Input
                        id="80D"
                        type="number"
                        value={profile.investments['80D']}
                        onChange={(e) => handleInputChange('investments.80D', e.target.value)}
                        placeholder="e.g., 25000"
                      />
                      <p className="text-xs text-gray-500">
                        Medical insurance premium. Max ₹25K (₹50K for senior citizens).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="80CCD1B" className="flex items-center gap-2">
                      Section 80CCD(1B) - Additional NPS (₹)
                      <Info className="h-3 w-3 text-gray-400" />
                    </Label>
                    <Input
                      id="80CCD1B"
                      type="number"
                      value={profile.investments['80CCD1B']}
                      onChange={(e) => handleInputChange('investments.80CCD1B', e.target.value)}
                      placeholder="e.g., 0"
                    />
                    <p className="text-xs text-gray-500">
                      Additional NPS contribution beyond 80C limit. Max ₹50K (separate from 80C).
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">Select Tax Regimes to Compare</Label>
              <div className="grid grid-cols-1 gap-3">
                {availableRegimes.map((regime) => {
                  const regimeNames = {
                    'old': 'Old Tax Regime (with deductions)',
                    'new': 'New Tax Regime (FY 2024-25)',
                    'new_post_2025': 'New Tax Regime (FY 2025-26)'
                  };
                  
                  const regimeDescriptions = {
                    'old': 'Full Chapter VI-A deductions, HRA exemptions, LTA benefits',
                    'new': 'Higher standard deduction (₹75K), limited deductions, ₹25K rebate up to ₹7L',
                    'new_post_2025': 'Updated slabs (0-4L: 0%, 4-8L: 5%, 8-12L: 10%, 12-16L: 15%, 16-20L: 20%, 20-24L: 25%, 24L+: 30%), ₹60K rebate up to ₹12L'
                  };
                  
                  return (
                    <div
                      key={regime}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedRegimes.includes(regime)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (selectedRegimes.includes(regime)) {
                          setSelectedRegimes(selectedRegimes.filter(r => r !== regime));
                        } else {
                          setSelectedRegimes([...selectedRegimes, regime]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{regimeNames[regime as keyof typeof regimeNames]}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {regimeDescriptions[regime as keyof typeof regimeDescriptions]}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedRegimes.includes(regime)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedRegimes.includes(regime) && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedRegimes.length === 0 && (
                <p className="text-sm text-red-600">Please select at least one tax regime</p>
              )}
            </div>

            <div className="space-y-3">
              {/* Quick Preview */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Quick Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">Gross Annual:</span>
                    <div className="font-semibold">{formatCurrency(profile.basic + profile.hra + profile.conveyance + profile.special_allowances + profile.lta + profile.bonus + profile.other_taxable)}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">Monthly Gross:</span>
                    <div className="font-semibold">{formatCurrency((profile.basic + profile.hra + profile.conveyance + profile.special_allowances + profile.lta + profile.bonus + profile.other_taxable) / 12)}</div>
                  </div>
                </div>
            </div>

            <Button 
              onClick={calculateSalary} 
              disabled={loading || selectedRegimes.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-5 w-5" />
                    Calculate Salary
                  </>
                )}
              </span>
            </Button>
            </div>
          </CardContent>
        </Card>

          {/* Results */}
          <div className="space-y-6">
            {result && (
              <>
                {/* Monthly Salary Display */}
                <Card className="shadow-2xl border-2 border-green-500 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `radial-gradient(circle at 3px 3px, rgb(34 197 94) 1px, transparent 0)`,
                    backgroundSize: '30px 30px'
                  }}></div>
                  <CardHeader className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                      backgroundSize: '20px 20px'
                    }}></div>
                    <CardTitle className="flex items-center gap-3 text-3xl font-bold relative z-10">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <DollarSign className="h-7 w-7" />
                      </div>
                      Your Monthly Take-Home Salary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                        const isBestOption = regimeKey === Object.entries(result.regimes).reduce((best, [key, r]) => 
                          (r.takeHome?.monthly || 0) > (result.regimes[best].takeHome?.monthly || 0) ? key : best, 
                          Object.keys(result.regimes)[0]
                        );
                        
                        return (
                          <div key={regimeKey} className={`relative p-4 rounded-lg border-2 ${
                            isBestOption 
                              ? 'border-green-500 bg-green-100 shadow-lg' 
                              : 'border-gray-200 bg-white'
                          }`}>
                            {isBestOption && (
                              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                                BEST
                              </Badge>
                            )}
                            <div className="text-center">
                              <h3 className={`text-lg font-semibold mb-2 ${
                                isBestOption ? 'text-green-800' : 'text-gray-800'
                              }`}>
                                {regime.regime}
                              </h3>
                              <div className="text-3xl font-bold mb-1 text-green-600">
                                {formatCurrency(regime.takeHome?.monthly || 0)}
                              </div>
                              <p className="text-sm text-gray-600">per month</p>
                              <div className="mt-2 text-sm">
                                <span className="text-gray-500">Annual: </span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(regime.takeHome?.yearly || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3">Quick Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">Lowest Tax</div>
                          <div className="text-gray-600">
                            {Object.entries(result.regimes).reduce((min, [key, r]) => 
                              (r.incomeTax?.total || 0) < (result.regimes[min].incomeTax?.total || 0) ? key : min, 
                              Object.keys(result.regimes)[0]
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">Highest Take-Home</div>
                          <div className="text-gray-600">
                            {Object.entries(result.regimes).reduce((best, [key, r]) => 
                              (r.takeHome?.monthly || 0) > (result.regimes[best].takeHome?.monthly || 0) ? key : best, 
                              Object.keys(result.regimes)[0]
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">Tax Difference</div>
                          <div className="text-gray-600">
                            {(() => {
                              const taxes = Object.values(result.regimes).map(r => r.incomeTax?.total || 0);
                              const maxTax = Math.max(...taxes);
                              const minTax = Math.min(...taxes);
                              return formatCurrency(maxTax - minTax);
                            })()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">Monthly Difference</div>
                          <div className="text-gray-600">
                            {(() => {
                              const monthly = Object.values(result.regimes).map(r => r.takeHome?.monthly || 0);
                              const maxMonthly = Math.max(...monthly);
                              const minMonthly = Math.min(...monthly);
                              return formatCurrency(maxMonthly - minMonthly);
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Regime Comparison */}
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600"></div>
                  <CardHeader className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                      backgroundSize: '20px 20px'
                    }}></div>
                    <CardTitle className="flex items-center justify-between text-2xl font-bold relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                        Tax Regime Comparison
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold">
                        FY {result.fy}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                      const isBest = getBestRegime() === regimeKey;
                      return (
                        <div 
                          key={regimeKey} 
                          className={`p-6 rounded-xl border-2 transition-all ${
                            isBest 
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-lg' 
                              : 'border-gray-200 hover:border-gray-300 shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{regime.regime}</h3>
                            {isBest && (
                              <Badge className="bg-green-500 text-white px-3 py-1">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Best Option
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Gross Salary:</span>
                              <div className="font-medium">{formatCurrency(regime.grossSalary || 0)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Taxable Income:</span>
                              <div className="font-medium">{formatCurrency(regime.taxableIncome.final)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Tax:</span>
                              <div className="font-medium text-red-600">{formatCurrency(regime.incomeTax?.total || 0)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Monthly TDS:</span>
                              <div className="font-medium">{formatCurrency(regime.monthlyTDS.monthly)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Professional Tax:</span>
                              <div className="font-medium">{formatCurrency(regime.professionalTax)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Take Home (Monthly):</span>
                              <div className="font-medium text-green-600">{formatCurrency(regime.takeHome?.monthly || 0)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Comprehensive Comparison Table */}
              <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                <CardHeader className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                  <div className="relative z-10">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Calculator className="h-6 w-6" />
                      </div>
                      Comprehensive Tax Regime Comparison
                    </CardTitle>
                    <p className="text-blue-100 text-base mt-2">
                      Detailed comparison of all tax regimes with savings analysis
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Parameter
                          </th>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => (
                            <th key={regimeKey} className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {regime.regime}
                              {getBestRegime() === regimeKey && (
                                <Badge className="ml-2 bg-green-500 text-white text-xs">
                                  Best
                                </Badge>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Gross Salary */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Gross Salary (Annual)
                          </td>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => (
                            <td key={regimeKey} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {formatCurrency(regime.grossSalary || 0)}
                            </td>
                          ))}
                        </tr>

                        {/* Taxable Income */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Taxable Income (Annual)
                          </td>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => (
                            <td key={regimeKey} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {formatCurrency(regime.taxableIncome.final)}
                            </td>
                          ))}
                        </tr>

                        {/* Total Tax */}
                        <tr className="hover:bg-gray-50 bg-red-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-900">
                            Total Tax (Annual)
                          </td>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                            const bestTax = Math.min(...Object.values(result.regimes).map(r => r.incomeTax?.total || 0));
                            const isLowestTax = (regime.incomeTax?.total || 0) === bestTax;
                            return (
                              <td key={regimeKey} className={`px-6 py-4 whitespace-nowrap text-sm text-center ${isLowestTax ? 'font-bold text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(regime.incomeTax?.total || 0)}
                                {isLowestTax && <Badge className="ml-1 bg-green-500 text-white text-xs">Lowest</Badge>}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Monthly TDS */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Monthly TDS
                          </td>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => (
                            <td key={regimeKey} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {formatCurrency(regime.monthlyTDS.monthly)}
                            </td>
                          ))}
                        </tr>

                        {/* Professional Tax */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Professional Tax (Annual)
                          </td>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => (
                            <td key={regimeKey} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {formatCurrency(regime.professionalTax)}
                            </td>
                          ))}
                        </tr>

                        {/* Take Home Monthly */}
                        <tr className="hover:bg-gray-50 bg-green-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">
                            Monthly Take Home
                          </td>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                            const bestTakeHome = Math.max(...Object.values(result.regimes).map(r => r.takeHome?.monthly || 0));
                            const isHighestTakeHome = (regime.takeHome?.monthly || 0) === bestTakeHome;
                            return (
                              <td key={regimeKey} className={`px-6 py-4 whitespace-nowrap text-sm text-center ${isHighestTakeHome ? 'font-bold text-green-600' : 'text-green-700'}`}>
                                {formatCurrency(regime.takeHome?.monthly || 0)}
                                {isHighestTakeHome && <Badge className="ml-1 bg-green-500 text-white text-xs">Highest</Badge>}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Take Home Annual */}
                        <tr className="hover:bg-gray-50 bg-green-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">
                            Annual Take Home
                          </td>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => (
                            <td key={regimeKey} className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-green-600">
                              {formatCurrency(regime.takeHome?.yearly || 0)}
                            </td>
                          ))}
                        </tr>

                        {/* Tax Savings vs Worst Option */}
                        <tr className="hover:bg-gray-50 bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                            Tax Savings vs Worst Option
                          </td>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                            const worstTax = Math.max(...Object.values(result.regimes).map(r => r.incomeTax?.total || 0));
                            const savings = worstTax - (regime.incomeTax?.total || 0);
                            return (
                              <td key={regimeKey} className={`px-6 py-4 whitespace-nowrap text-sm text-center ${savings > 0 ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                                {savings > 0 ? `+${formatCurrency(savings)}` : formatCurrency(savings)}
                                {savings > 0 && <Badge className="ml-1 bg-blue-500 text-white text-xs">Saved</Badge>}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Available Deductions (Regime-specific) */}
                        {Object.keys(result.regimes).length > 1 && (
                          <tr className="hover:bg-gray-50 bg-yellow-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-900">
                              Available Deductions
                            </td>
                            {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                              const availableDeductions = [];
                              if (regime.breakdown && regime.breakdown.deductions) {
                                if (regime.breakdown.deductions['80C'] > 0) availableDeductions.push('80C');
                                if (regime.breakdown.deductions['80D'] > 0) availableDeductions.push('80D');
                                if (regime.breakdown.deductions['80CCD1B'] > 0) availableDeductions.push('80CCD(1B)');
                              }
                              const hasHRADeduction = regime.breakdown && regime.breakdown.exemptions && regime.breakdown.exemptions.hra > 0;
                              if (hasHRADeduction) availableDeductions.push('HRA');
                              
                              return (
                                <td key={regimeKey} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                  {availableDeductions.length > 0 ? (
                                    <div className="space-y-1">
                                      {availableDeductions.map(deduction => (
                                        <Badge key={deduction} variant="outline" className="text-xs">
                                          {deduction}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-xs">Limited deductions</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        )}

                        {/* Monthly Savings vs Worst Option */}
                        <tr className="hover:bg-gray-50 bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                            Monthly Savings vs Worst Option
                          </td>
                          {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                            const worstTakeHome = Math.min(...Object.values(result.regimes).map(r => r.takeHome?.monthly || 0));
                            const monthlySavings = (regime.takeHome?.monthly || 0) - worstTakeHome;
                            return (
                              <td key={regimeKey} className={`px-6 py-4 whitespace-nowrap text-sm text-center ${monthlySavings > 0 ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                                {monthlySavings > 0 ? `+${formatCurrency(monthlySavings)}` : formatCurrency(monthlySavings)}
                                {monthlySavings > 0 && <Badge className="ml-1 bg-blue-500 text-white text-xs">Extra</Badge>}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Insights */}
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-t">
                    <h4 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-200">
                      💡 Key Insights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                        const bestTax = Math.min(...Object.values(result.regimes).map(r => r.incomeTax?.total || 0));
                        const worstTax = Math.max(...Object.values(result.regimes).map(r => r.incomeTax?.total || 0));
                        const bestTakeHome = Math.max(...Object.values(result.regimes).map(r => r.takeHome?.monthly || 0));
                        const worstTakeHome = Math.min(...Object.values(result.regimes).map(r => r.takeHome?.monthly || 0));
                        const taxSavings = worstTax - (regime.incomeTax?.total || 0);
                        const takeHomeExtra = (regime.takeHome?.monthly || 0) - worstTakeHome;
                        
                        return (
                          <div key={regimeKey} className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                              {regime.regime} Analysis
                            </h5>
                            <div className="space-y-2 text-sm">
                              {taxSavings > 0 && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Saves {formatCurrency(taxSavings)} annually vs worst option</span>
                                </div>
                              )}
                              {takeHomeExtra > 0 && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Takes home {formatCurrency(takeHomeExtra)} extra monthly</span>
                                </div>
                              )}
                              {(regime.incomeTax?.total || 0) === bestTax && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Lowest tax liability among all regimes</span>
                                </div>
                              )}
                              {(regime.takeHome?.monthly || 0) === bestTakeHome && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Highest monthly take-home salary</span>
                                </div>
                              )}
                              
                              {/* Regime-specific features */}
                              {regimeKey === 'old' && regime.breakdown && regime.breakdown.deductions && Object.keys(regime.breakdown.deductions).length > 0 && (
                                <div className="flex items-center gap-2 text-purple-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Full Chapter VI-A deductions available</span>
                                </div>
                              )}
                              {regimeKey === 'new' && (
                                <div className="flex items-center gap-2 text-orange-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Higher standard deduction, limited deductions</span>
                                </div>
                              )}
                              {regimeKey === 'new_post_2025' && (
                                <div className="flex items-center gap-2 text-indigo-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Latest tax slabs and rebate rules</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visual Comparison Charts */}
              <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
                <CardHeader className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                  <div className="relative z-10">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      Visual Comparison
                    </CardTitle>
                    <p className="text-indigo-100 text-base mt-2">
                      Graphical representation of tax regimes comparison
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tax Comparison Bar Chart */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                      📊 Tax Liability Comparison
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                        const maxTax = Math.max(...Object.values(result.regimes).map(r => r.incomeTax?.total || 0));
                        const percentage = maxTax > 0 ? ((regime.incomeTax?.total || 0) / maxTax) * 100 : 0;
                        const isLowest = (regime.incomeTax?.total || 0) === Math.min(...Object.values(result.regimes).map(r => r.incomeTax?.total || 0));
                        
                        return (
                          <div key={regimeKey} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{regime.regime}</span>
                              <span className={`text-sm font-bold ${isLowest ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(regime.incomeTax?.total || 0)}
                                {isLowest && <span className="ml-1 text-xs">💰 Lowest Tax</span>}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-1000 ${
                                  isLowest ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Take Home Comparison */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                      💰 Monthly Take Home Comparison
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(result.regimes).map(([regimeKey, regime]) => {
                        const maxTakeHome = Math.max(...Object.values(result.regimes).map(r => r.takeHome?.monthly || 0));
                        const percentage = maxTakeHome > 0 ? ((regime.takeHome?.monthly || 0) / maxTakeHome) * 100 : 0;
                        const isHighest = (regime.takeHome?.monthly || 0) === maxTakeHome;
                        
                        return (
                          <div key={regimeKey} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{regime.regime}</span>
                              <span className={`text-sm font-bold ${isHighest ? 'text-green-600' : 'text-green-700'}`}>
                                {formatCurrency(regime.takeHome?.monthly || 0)}
                                {isHighest && <span className="ml-1 text-xs">🏆 Highest</span>}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="h-3 rounded-full transition-all duration-1000 bg-gradient-to-r from-green-400 to-green-600"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <h5 className="font-semibold text-red-800 dark:text-red-200 mb-2">💸 Highest Tax</h5>
                      {(() => {
                        const highestTaxRegime = Object.entries(result.regimes).reduce((max: {key: string, regime: any}, [key, regime]) => 
                          (regime.incomeTax?.total || 0) > (max.regime.incomeTax?.total || 0) ? {key, regime} : max, 
                          {key: '', regime: {incomeTax: {total: 0}, regime: ''}}
                        );
                        return (
                          <div>
                            <div className="text-sm text-red-600 dark:text-red-400">
                              {highestTaxRegime.regime.regime}
                            </div>
                            <div className="text-lg font-bold text-red-700 dark:text-red-300">
                              {formatCurrency(highestTaxRegime.regime.incomeTax?.total || 0)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">💰 Lowest Tax</h5>
                      {(() => {
                        const lowestTaxRegime = Object.entries(result.regimes).reduce((min: {key: string, regime: any}, [key, regime]) => 
                          (regime.incomeTax?.total || 0) < (min.regime.incomeTax?.total || Infinity) ? {key, regime} : min, 
                          {key: '', regime: {incomeTax: {total: Infinity}, regime: ''}}
                        );
                        return (
                          <div>
                            <div className="text-sm text-green-600 dark:text-green-400">
                              {lowestTaxRegime.regime.regime}
                            </div>
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                              {formatCurrency(lowestTaxRegime.regime.incomeTax?.total || 0)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💎 Best Take Home</h5>
                      {(() => {
                        const bestTakeHomeRegime = Object.entries(result.regimes).reduce((max: {key: string, regime: any}, [key, regime]) => 
                          (regime.takeHome?.monthly || 0) > (max.regime.takeHome?.monthly || 0) ? {key, regime} : max, 
                          {key: '', regime: {takeHome: {monthly: 0}, regime: ''}}
                        );
                        return (
                          <div>
                            <div className="text-sm text-blue-600 dark:text-blue-400">
                              {bestTakeHomeRegime.regime.regime}
                            </div>
                            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                              {formatCurrency(bestTakeHomeRegime.regime.takeHome?.monthly || 0)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

                {/* Detailed Breakdown */}
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600"></div>
                  <CardHeader className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                      backgroundSize: '20px 20px'
                    }}></div>
                    <CardTitle className="text-2xl font-bold relative z-10">Detailed Breakdown</CardTitle>
                  </CardHeader>
                <CardContent>
                  <Tabs defaultValue={Object.keys(result.regimes)[0]} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      {Object.keys(result.regimes).map((regimeKey) => (
                        <TabsTrigger key={regimeKey} value={regimeKey}>
                          {result.regimes[regimeKey].regime}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {Object.entries(result.regimes).map(([regimeKey, regime]) => (
                      <TabsContent key={regimeKey} value={regimeKey} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Gross Salary Components */}
                          <div>
                            <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Gross Salary Components</h4>
                            <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              {Object.entries(regime.breakdown.grossComponents).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="capitalize text-gray-600 dark:text-gray-400">{key.replace(/_/g, ' ')}:</span>
                                  <span className="font-medium">{formatCurrency(value as number)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Tax Calculation */}
                          <div>
                            <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Tax Calculation</h4>
                            <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Tax Before Rebate:</span>
                                <span className="font-medium">{formatCurrency(regime.incomeTax.beforeRebate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Rebate (87A):</span>
                                <span className="font-medium text-green-600">-{formatCurrency(regime.incomeTax.rebate.amount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Surcharge:</span>
                                <span className="font-medium">{formatCurrency(regime.incomeTax.surcharge.amount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Cess (4%):</span>
                                <span className="font-medium">{formatCurrency(regime.incomeTax.cess.amount)}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between font-medium">
                                <span>Total Tax:</span>
                                <span className="text-red-600">{formatCurrency(regime.incomeTax?.total || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Regime-specific sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Deductions Section - Only show if deductions exist */}
                          {regime.breakdown && regime.breakdown.deductions && Object.keys(regime.breakdown.deductions.breakdown || {}).length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                                Chapter VI-A Deductions
                                {regimeKey === 'old' && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-purple-100 text-purple-700">
                                    Old Regime Only
                                  </Badge>
                                )}
                                {regimeKey === 'new' && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-700">
                                    Limited in New Regime
                                  </Badge>
                                )}
                              </h4>
                              <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                {Object.entries(regime.breakdown.deductions.breakdown || {}).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Section {key}:</span>
                                    <span className="font-medium text-green-600">-{formatCurrency(value as number)}</span>
                                  </div>
                                ))}
                                <Separator />
                                <div className="flex justify-between font-medium">
                                  <span>Total Deductions:</span>
                                  <span className="text-green-600">-{formatCurrency(regime.breakdown.deductions.total)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Exemptions Section - Only show if exemptions exist */}
                          {regime.breakdown && regime.breakdown.exemptions && (regime.breakdown.exemptions.hra > 0 || regime.breakdown.exemptions.lta > 0) && (
                            <div>
                              <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                                Exemptions
                                {regimeKey === 'old' && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-purple-100 text-purple-700">
                                    Available
                                  </Badge>
                                )}
                                {regimeKey === 'new' && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-700">
                                    Limited
                                  </Badge>
                                )}
                              </h4>
                              <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                {regime.breakdown.exemptions.hra > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">HRA Exemption:</span>
                                    <span className="font-medium text-green-600">-{formatCurrency(regime.breakdown.exemptions.hra)}</span>
                                  </div>
                                )}
                                {regime.breakdown.exemptions.lta > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">LTA Exemption:</span>
                                    <span className="font-medium text-green-600">-{formatCurrency(regime.breakdown.exemptions.lta)}</span>
                                  </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-medium">
                                  <span>Total Exemptions:</span>
                                  <span className="text-green-600">-{formatCurrency(regime.breakdown.exemptions.total)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* No Deductions/Exemptions Message for New Regime */}
                          {regimeKey === 'new' && (!regime.breakdown?.deductions?.breakdown || Object.keys(regime.breakdown.deductions.breakdown || {}).length === 0) && (
                            <div>
                              <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Chapter VI-A Deductions</h4>
                              <div className="space-y-2 text-sm bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                  <Info className="h-4 w-4" />
                                  <span className="font-medium">Limited Deductions in New Regime</span>
                                </div>
                                <p className="text-orange-600 dark:text-orange-400 text-xs">
                                  The new tax regime offers higher standard deduction (₹75,000) but limits Chapter VI-A deductions.
                                  Only employer NPS contributions under Section 80CCD(2) are allowed.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Taxable Income Breakdown */}
                          <div className={regimeKey === 'new' && (!regime.breakdown?.deductions?.breakdown || Object.keys(regime.breakdown.deductions.breakdown || {}).length === 0) ? '' : 'md:col-span-2'}>
                            <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Taxable Income Calculation</h4>
                            <div className="space-y-2 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Gross Salary:</span>
                                <span className="font-medium">{formatCurrency(regime.grossSalary)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Employee Contributions (EPF, etc.):</span>
                                <span className="font-medium">-{formatCurrency(regime.breakdown?.employeeContributions?.total || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Exemptions:</span>
                                <span className="font-medium">-{formatCurrency(regime.breakdown?.exemptions?.total || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Standard Deduction:</span>
                                <span className="font-medium">-{formatCurrency(regime.taxableIncome.standardDeduction)}</span>
                              </div>
                              {regime.taxableIncome.chapterVIADeductions > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Chapter VI-A Deductions:</span>
                                  <span className="font-medium">-{formatCurrency(regime.taxableIncome.chapterVIADeductions)}</span>
                                </div>
                              )}
                              <Separator />
                              <div className="flex justify-between font-medium">
                                <span>Final Taxable Income:</span>
                                <span className="text-blue-600">{formatCurrency(regime.taxableIncome.final)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

                {/* Final Disclaimer */}
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>Important:</strong> {result.disclaimer.message}
                  </AlertDescription>
                </Alert>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculator;
