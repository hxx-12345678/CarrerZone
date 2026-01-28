#!/usr/bin/env node

/**
 * Script: Call API and capture server logs
 * =======================================
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:8000/api';
const EMPLOYER_EMAIL = 'vinod@keshavencon.com';
const EMPLOYER_PASSWORD = 'Keshav@123';

async function test() {
  try {
    // Login
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMPLOYER_EMAIL, password: EMPLOYER_PASSWORD })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    
    // Call candidates API
    const req_id = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb';
    const response = await fetch(`${API_URL}/requirements/${req_id}/candidates?page=1&limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    console.log('\n✅ API Response:');
    console.log(`  Success: ${data.success}`);
    console.log(`  Candidates found: ${data.data?.candidates?.length}`);
    console.log(`  Total: ${data.data?.pagination?.total}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
