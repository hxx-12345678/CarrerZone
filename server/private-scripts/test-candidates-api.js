#!/usr/bin/env node

/**
 * Test Script: Requirement Candidates API Endpoint
 * ================================================
 * 
 * This script tests the /api/requirements/:id/candidates endpoint
 * to diagnose why candidates are not being returned
 * 
 * Usage:
 *   node server/scripts/test-candidates-api.js
 */

const fetch = require('node-fetch');
const { sequelize, User, Requirement, Company } = require('../config/index');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:8000/api';
const EMPLOYER_EMAIL = 'vinod@keshavencon.com';
const EMPLOYER_PASSWORD = 'Keshav@123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';

async function testAPI() {
  try {
    console.log('\n🔍 === CANDIDATES API ENDPOINT TEST ===\n');
    
    // Step 1: Login to get JWT token
    console.log(`📍 Step 1: Logging in as ${EMPLOYER_EMAIL}...`);
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: EMPLOYER_EMAIL,
        password: EMPLOYER_PASSWORD
      })
    });
    
    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status, loginRes.statusText);
      const errorBody = await loginRes.text();
      console.error('Error:', errorBody);
      process.exit(1);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    
    if (!token) {
      console.error('❌ No token received from login');
      process.exit(1);
    }
    
    console.log('✅ Login successful, token received');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    // Step 2: Get employer info
    console.log(`\n📍 Step 2: Fetching employer info...`);
    const employer = await User.findOne({ where: { email: EMPLOYER_EMAIL } });
    
    if (!employer) {
      console.error(`❌ Employer not found`);
      process.exit(1);
    }
    
    console.log(`✅ Found employer:`, {
      id: employer.id,
      name: employer.first_name,
      companyId: employer.companyId
    });
    
    // Step 3: Get requirements
    console.log(`\n📍 Step 3: Getting requirements for this employer...`);
    const requirements = await Requirement.findAll({
      where: {
        companyId: employer.companyId
      },
      limit: 1
    });
    
    if (requirements.length === 0) {
      console.error('❌ No requirements found for this employer');
      process.exit(1);
    }
    
    const requirement = requirements[0];
    console.log(`✅ Found requirement: ${requirement.title} (ID: ${requirement.id})`);
    
    // Step 4: Call the candidates API endpoint
    console.log(`\n📍 Step 4: Calling /requirements/${requirement.id}/candidates endpoint...`);
    
    const candidatesRes = await fetch(`${API_URL}/requirements/${requirement.id}/candidates?page=1&limit=50`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   Status: ${candidatesRes.status} ${candidatesRes.statusText}`);
    
    if (!candidatesRes.ok) {
      const errorBody = await candidatesRes.text();
      console.error('❌ API call failed:', errorBody);
      process.exit(1);
    }
    
    const candidatesData = await candidatesRes.json();
    console.log('✅ API call successful');
    
    // Step 5: Analyze response
    console.log(`\n📍 Step 5: Analyzing response...`);
    console.log(`  Success: ${candidatesData.success}`);
    console.log(`  Message: ${candidatesData.message}`);
    console.log(`  Candidates found: ${candidatesData.data?.candidates?.length || 0}`);
    console.log(`  Total candidates: ${candidatesData.data?.pagination?.total || 0}`);
    
    if (candidatesData.data && candidatesData.data.requirement) {
      console.log(`\n  Requirement Info:`);
      console.log(`    Title: ${candidatesData.data.requirement.title}`);
      console.log(`    Total Candidates (from metadata): ${candidatesData.data.requirement.totalCandidates}`);
      console.log(`    Accessed Candidates (from metadata): ${candidatesData.data.requirement.accessedCandidates}`);
    }
    
    // Step 6: Show sample candidates
    if (candidatesData.data && candidatesData.data.candidates && candidatesData.data.candidates.length > 0) {
      console.log(`\n📍 Step 6: Sample candidates from API response...`);
      const samples = candidatesData.data.candidates.slice(0, 3);
      
      for (const cand of samples) {
        console.log(`\n  - ${cand.name} (ID: ${cand.id})`);
        console.log(`    Designation: ${cand.designation}`);
        console.log(`    Experience: ${cand.experience}`);
        console.log(`    Location: ${cand.location}`);
        console.log(`    Skills: ${(cand.keySkills || []).slice(0, 3).join(', ') || 'NONE'}`);
        console.log(`    ATS Score: ${cand.atsScore || 'NOT CALCULATED'}`);
      }
    } else {
      console.log(`\n❌ No candidates returned from API!`);
      console.log(`\n📍 Step 6: Investigating why no candidates were found...`);
      
      // Count total candidates in database
      const totalCandidates = await User.count({
        where: {
          user_type: 'jobseeker',
          is_active: true,
          account_status: 'active'
        }
      });
      
      console.log(`  Total active candidates in database: ${totalCandidates}`);
      
      // Check requirement metadata
      const metadata = typeof requirement.metadata === 'string' 
        ? JSON.parse(requirement.metadata) 
        : (requirement.metadata || {});
      
      console.log(`\n  Requirement Criteria:`);
      console.log(`    Skills: ${(metadata.includeSkills || []).join(', ') || 'NOT SET'}`);
      console.log(`    Experience Min: ${metadata.workExperienceMin || 'NOT SET'}`);
      console.log(`    Experience Max: ${metadata.workExperienceMax || 'NOT SET'}`);
      console.log(`    Salary Min: ${metadata.currentSalaryMin || 'NOT SET'}`);
      console.log(`    Salary Max: ${metadata.currentSalaryMax || 'NOT SET'}`);
      console.log(`    Locations: ${(metadata.candidateLocations || []).join(', ') || 'ANY'}`);
      
      console.log(`\n  💡 Possible issues:`);
      console.log(`    1. Requirement has no criteria set (all fields empty)`);
      console.log(`    2. Candidates don't match the criteria`);
      console.log(`    3. There are no active candidates in the database`);
      console.log(`    4. Skills don't match any candidate profiles`);
    }
    
    console.log(`\n✅ Test completed!\n`);
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testAPI();
