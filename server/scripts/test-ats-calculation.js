const axios = require('axios');

// JWT token for vinod@keshavencon.com
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVkNDJjM2QyLWFkNTAtNGNlOC1iZDBlLThhZDU5MjUzM2Y4MCIsInVzZXJOYW1lIjoidmluaW9kQGtlc2hhdmVuY29uLmNvbSIsInVzZXJUeXBlIjoiZW1wbG95ZXIiLCJpc0VtcGxveWVyIjp0cnVlfQ.bj5p8F0RiH3Z5KJM5TlN8e1vQKrqbWMF6OqQl3pJ6cU';
const REQUIREMENT_ID = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb';
const JACK_ID = '0e6bc77c-195a-4ed9-befa-5cb330d79361';

async function testATSCalculation() {
  try {
    console.log('🔄 Testing ATS Calculation for Requirement: Software Developer');
    console.log('===================================================================\n');
    
    // Test 1: Get candidates first
    console.log('📋 Step 1: Fetching candidates for requirement...\n');
    const candidatesResponse = await axios.get(
      `http://localhost:8000/api/requirements/${REQUIREMENT_ID}/candidates?page=1&limit=20&sortBy=ats`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Candidates fetched:');
    const candidates = candidatesResponse.data?.candidates || [];
    candidates.forEach(c => {
      console.log(`   - ${c.first_name} ${c.last_name}: ATS Score ${c.atsScore}`);
    });
    console.log();
    
    // Test 2: Calculate ATS scores
    console.log('📊 Step 2: Triggering ATS calculation...\n');
    const calculateResponse = await axios.post(
      `http://localhost:8000/api/requirements/${REQUIREMENT_ID}/calculate-ats`,
      { page: 1, limit: 20, processAll: true },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ ATS Calculation Response:');
    console.log(JSON.stringify(calculateResponse.data, null, 2));
    console.log();
    
    // Test 3: Fetch JACK's specific ATS score
    console.log('🎯 Step 3: Fetching JACK\'s ATS score details...\n');
    const jackResponse = await axios.get(
      `http://localhost:8000/api/requirements/${REQUIREMENT_ID}/candidates/${JACK_ID}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const jackData = jackResponse.data;
    console.log('✅ JACK SPARROW\'s Current Details:');
    console.log(`   Name: ${jackData.first_name} ${jackData.last_name}`);
    console.log(`   Email: ${jackData.email}`);
    console.log(`   ATS Score: ${jackData.atsScore}`);
    console.log(`   Experience: ${jackData.experience_years} years`);
    console.log(`   Current Salary: ${jackData.current_salary} LPA`);
    console.log(`   Skills: ${jackData.skills}`);
    console.log(`   Headline: ${jackData.headline}`);
    console.log(`   Relevance: ${jackData.relevanceScore}%`);
    console.log();
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testATSCalculation();
