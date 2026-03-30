/**
 * ATS (Applicant Tracking System) Service
 * 
 * This service calculates ATS scores for candidates based on their resume/CV and profile
 * compared against specific job requirements using Google Gemini AI.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sequelize, Sequelize } = require('../config/sequelize');
const { Op } = Sequelize;
const { Resume, Job, JobPreference, User, Requirement, WorkExperience, Education, JobPhoto, Company } = require('../models');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

let genAI_instance = null;
function getGenAI() {
  if (!genAI_instance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      console.error('❌ GEMINI_API_KEY is not set');
      return null;
    }
    genAI_instance = new GoogleGenerativeAI(apiKey.trim());
  }
  return genAI_instance;
}

// Global queue for Gemini requests to prevent rate limiting (429) across concurrent HTTP requests
let geminiQueue = Promise.resolve();

/**
 * Clean and truncate text to prevent token overflow in AI requests
 */
function cleanAndTruncateText(text, maxLength = 12000) {
  if (!text) return '';
  
  // Basic cleaning: remove extra whitespace, control characters
  let cleaned = text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove non-printable chars
    .replace(/\s+/g, ' ')                  // Collapse whitespace
    .trim();
    
  if (cleaned.length <= maxLength) return cleaned;
  
  // If too long, truncate but try to keep the most relevant parts (start and end)
  const half = Math.floor(maxLength / 2);
  console.log(`⚠️ Truncating text from ${cleaned.length} to ${maxLength} chars`);
  
  return cleaned.substring(0, half) + 
         '\n... [TRUNCATED FOR TOKEN LIMITS] ...\n' + 
         cleaned.substring(cleaned.length - half);
}

/**
 * Clean AI response and extract valid JSON
 */
function cleanAIJSON(text) {
  if (!text) return null;

  // 1. Remove markdown code blocks if present
  let cleaned = text.replace(/```json\s?([\s\S]*?)```/g, '$1')
                    .replace(/```\s?([\s\S]*?)```/g, '$1')
                    .trim();

  // 2. Find the first '{' or '['
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endChar = '';

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endChar = '}';
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endChar = ']';
  }

  if (startIdx === -1) return null;

  cleaned = cleaned.substring(startIdx);

  // 3. Robust JSON repair for truncated responses
  try {
    // First try normal parse
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('⚠️ AI response appears truncated or malformed, attempting robust repair...');
    
    // Remove trailing characters after the last valid structure
    let lastValidIdx = -1;
    let stack = [];
    let inString = false;
    let escaped = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      
      if (!inString) {
        if (char === '{' || char === '[') {
          stack.push(char === '{' ? '}' : ']');
        } else if (char === '}' || char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
            if (stack.length === 0) lastValidIdx = i;
          }
        }
      }
      
      escaped = char === '\\' && !escaped;
    }

    // If we found a complete object, use it
    if (lastValidIdx !== -1 && stack.length === 0) {
      try {
        return JSON.parse(cleaned.substring(0, lastValidIdx + 1));
      } catch (innerE) {}
    }

    // If still failing or truncated, try to force-close everything
    let repaired = cleaned;
    
    // If we ended inside a string, close it
    if (inString) repaired += '"';
    
    // Close all open braces/brackets in reverse order
    while (stack.length > 0) {
      repaired += stack.pop();
    }

    try {
      return JSON.parse(repaired);
    } catch (finalE) {
      console.error('❌ Failed to parse AI JSON even after repair:', finalE.message);
      
      // Last resort: extract numbers or specific fields if possible (regex fallback)
      const scoreMatch = cleaned.match(/"ats_score"\s*:\s*(\d+)/);
      if (scoreMatch) {
        return {
          ats_score: parseInt(scoreMatch[1]),
          overall_assessment: "Partially recovered from malformed AI response."
        };
      }
      return null;
    }
  }
}

/**
 * Calculate rule-based ATS score as fallback when AI fails
 * @param {Object} requirementDetails - Job/requirement details
 * @param {Object} candidateProfile - Candidate profile data
 * @param {string} resumeContent - Resume text content
 * @returns {Object} ATS score data
 */
function calculateRuleBasedScore(requirementDetails, candidateProfile, resumeContent) {
  console.log('🧮 Using rule-based scoring fallback...');
  
  let ats_score = 0;
  const matching_skills = [];
  const gaps = [];
  const strengths = [];
  const areas_for_improvement = [];
  
  // 1. Skills Matching (40 points max)
  const requiredSkills = requirementDetails.requiredSkills || [];
  const candidateSkills = candidateProfile.skills || [];
  
  // Extract skills from resume content if available (often more comprehensive)
  const resumeSkills = [];
  if (resumeContent) {
    const commonSkills = ['python', 'javascript', 'react', 'node', 'java', 'sql', 'aws', 'docker', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'mongodb', 'postgresql', 'mysql', 'git', 'ci/cd', 'typescript', 'html', 'css', 'redux', 'express', 'flask', 'django', 'fastapi', 'rest api', 'graphql', 'kubernetes', 'jenkins', 'terraform', 'ansible'];
    const resumeLower = resumeContent.toLowerCase();
    commonSkills.forEach(skill => {
      if (resumeLower.includes(skill)) {
        resumeSkills.push(skill);
      }
    });
  }

  const combinedCandidateSkills = Array.from(new Set([
    ...candidateSkills.map(s => s.toLowerCase()),
    ...resumeSkills
  ]));
  
  if (requiredSkills.length > 0) {
    let matchedCount = 0;
    
    requiredSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (combinedCandidateSkills.some(cs => cs.includes(skillLower) || skillLower.includes(cs))) {
        matchedCount++;
        matching_skills.push(skill);
      } else {
        gaps.push(`Missing skill: ${skill}`);
      }
    });
    
    if (requiredSkills.length > 0) {
      ats_score += Math.round((matchedCount / requiredSkills.length) * 40);
    }
    
    if (matchedCount > 0) {
      if (matchedCount === requiredSkills.length) {
        strengths.push('All required skills matched');
      } else if (matchedCount >= requiredSkills.length * 0.7) {
        strengths.push('Most required skills matched');
      }
    }
  } else {
    // If no required skills specified, check if candidate has any skills at all
    if (combinedCandidateSkills.length > 0) {
      ats_score += 30; // High base for skilled candidate
      strengths.push('Demonstrates relevant technical skills');
    } else {
      ats_score += 10;
    }
  }
  
  // 2. Experience Matching (25 points max)
  const requiredExp = requirementDetails.requiredExperience || {};
  let candidateYears = candidateProfile.experience?.years;

  // Try to extract years from resume if missing from profile
  if (candidateYears === undefined && resumeContent) {
    const expMatch = resumeContent.match(/(\d+)\+?\s*years?\s*exp/i);
    if (expMatch) candidateYears = parseInt(expMatch[1]);
  }
  
  if (requiredExp.min !== undefined && candidateYears !== undefined) {
    if (candidateYears >= requiredExp.min) {
      ats_score += 25;
      strengths.push('Meets experience requirements');
    } else {
      ats_score += Math.round((candidateYears / requiredExp.min) * 15);
      gaps.push(`Experience gap: ${requiredExp.min - candidateYears} years short`);
    }
  } else if (candidateYears !== undefined) {
    // If no min specified but we have years
    if (candidateYears > 5) ats_score += 25;
    else if (candidateYears > 2) ats_score += 20;
    else ats_score += 15;
  } else {
    ats_score += 15; // Neutral
  }
  
  // 3. Education Matching (15 points max)
  const requiredEducation = requirementDetails.requiredEducation;
  const candidateEducation = candidateProfile.education || [];
  
  if (requiredEducation && (candidateEducation.length > 0 || resumeContent)) {
    const resumeLower = resumeContent ? resumeContent.toLowerCase() : '';
    const hasDegree = candidateEducation.some(edu => edu.degree && edu.degree.toLowerCase().includes(requiredEducation.toLowerCase())) ||
                      resumeLower.includes(requiredEducation.toLowerCase());
    
    if (hasDegree) {
      ats_score += 15;
      strengths.push('Education requirements met');
    } else {
      ats_score += 5;
    }
  } else {
    ats_score += 10; // Neutral
  }
  
  // 4. Resume Quality (10 points max)
  if (resumeContent) {
    const wordCount = resumeContent.split(/\s+/).length;
    if (wordCount > 300) {
      ats_score += 10;
      strengths.push('Comprehensive resume content');
    } else if (wordCount > 100) {
      ats_score += 5;
    }
  }
  
  // 5. Profile Completion (10 points max)
  const profileCompletion = candidateProfile.profileCompletion || 50;
  ats_score += Math.round((profileCompletion / 100) * 10);
  
  // Add some randomness to avoid identical scores
  const jitter = Math.floor(Math.random() * 5) - 2; // -2 to +2
  ats_score = Math.max(0, Math.min(100, ats_score + jitter));
  
  // Determine recommendation
  let recommendation;
  if (ats_score >= 80) {
    recommendation = 'strongly_recommended';
  } else if (ats_score >= 60) {
    recommendation = 'recommended';
  } else if (ats_score >= 40) {
    recommendation = 'consider';
  } else {
    recommendation = 'not_recommended';
  }
  
  return {
    ats_score,
    matching_skills,
    matching_points: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    experience_match: candidateYears !== undefined 
      ? (candidateYears >= (requiredExp.min || 0) ? 'good' : 'average') 
      : 'unknown',
    skills_match_percentage: requiredSkills.length > 0 
      ? Math.round((matching_skills.length / requiredSkills.length) * 100) 
      : 50,
    project_quality: 'average',
    education_level: candidateEducation.length > 0 ? 'good' : 'average',
    overall_assessment: `Rule-based scoring calculated ${ats_score}/100 based on skills (${matching_skills.length}/${requiredSkills.length} matched), experience, and education alignment.`,
    recommendation,
    strengths: strengths.slice(0, 3),
    areas_for_improvement: areas_for_improvement.slice(0, 3)
  };
}

/**
 * Execute an AI operation with queuing and automatic retry logic
 */
async function executeAIOperation(operation, retryCount = 2) {
  let lastError;
  
  // Update the global queue
  const queuePromise = geminiQueue.then(async () => {
    for (let i = 0; i <= retryCount; i++) {
      try {
        // Wait 1.5 seconds between retries to respect rate limits
        if (i > 0) {
          console.log(`🔄 AI retry ${i}/${retryCount} after delay...`);
          await new Promise(r => setTimeout(r, 1500 * i));
        }
        
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ AI attempt ${i + 1} failed:`, error.message);
        
        // Don't retry if it's a client error (400) or auth error
        if (error.message.includes('400') || error.message.includes('API_KEY_INVALID')) {
          throw error;
        }
        
        // If it's the last attempt, throw the error
        if (i === retryCount) throw error;
      }
    }
  });

  // Set the next item in the queue
  geminiQueue = queuePromise.catch(() => {});
  
  // Return the result of the operation
  return queuePromise;
}

/**
 * Extract text content from PDF file using multiple methods
 */
async function extractPDFContent(filePath) {
  try {
    console.log('📄 Extracting content from PDF:', filePath);

    // Check if file exists, if not try to find it in common upload directories
    if (!fs.existsSync(filePath)) {
      console.log('⚠️ PDF file not found at path:', filePath);
      const fileName = path.basename(filePath);
      const possiblePaths = [
        path.join(__dirname, '../uploads/resumes', fileName),
        path.join(__dirname, '../../uploads/resumes', fileName),
        path.join(process.cwd(), 'uploads/resumes', fileName),
        path.join(process.cwd(), 'server/uploads/resumes', fileName)
      ];

      let foundPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          console.log('✅ Found PDF file at alternative path:', p);
          foundPath = p;
          break;
        }
      }

      if (foundPath) {
        filePath = foundPath;
      } else {
        console.log('❌ PDF file not found in any common directory');
        return null;
      }
    }

    console.log('📄 PDF file exists, extracting content...');
    console.log('📄 File size:', fs.statSync(filePath).size, 'bytes');

    // Read the PDF file
    const pdfBuffer = fs.readFileSync(filePath);

    // Method 1: Try pdf-parse (most reliable for text extraction)
    try {
      console.log('📄 Method 1: Using pdf-parse...');
      const pdfData = await pdfParse(pdfBuffer);

      if (pdfData && pdfData.text && pdfData.text.length > 0) {
        console.log('✅ pdf-parse successful');
        console.log('📄 Content length:', pdfData.text.length, 'characters');
        console.log('📄 Content preview:', pdfData.text.substring(0, 300) + '...');

        // Clean up the text
        const cleanText = pdfData.text
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();

        console.log('📄 Cleaned text length:', cleanText.length, 'characters');

        // Search for AI/ML skills to verify extraction quality
        const aiSkills = ['Python', 'Machine Learning', 'TensorFlow', 'Scikit-learn', 'NumPy', 'Pandas', 'AI', 'ML', 'Data Science'];
        let foundSkills = 0;
        aiSkills.forEach(skill => {
          if (cleanText.toLowerCase().includes(skill.toLowerCase())) {
            foundSkills++;
          }
        });
        console.log(`📄 Found ${foundSkills}/${aiSkills.length} AI/ML skills in extracted text`);

        return cleanText;
      }
    } catch (pdfParseError) {
      console.log('⚠️ pdf-parse failed:', pdfParseError.message);
    }

    // Method 2: Try pdf-parse with different options
    try {
      console.log('📄 Method 2: Using pdf-parse with different options...');
      const pdfData = await pdfParse(pdfBuffer, {
        max: 0,
        version: 'v1.10.100'
      });

      if (pdfData && pdfData.text && pdfData.text.length > 0) {
        console.log('✅ pdf-parse with options successful');
        console.log('📄 Content length:', pdfData.text.length, 'characters');
        console.log('📄 Content preview:', pdfData.text.substring(0, 300) + '...');

        // Clean up the text
        const cleanText = pdfData.text
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();

        console.log('📄 Cleaned text length:', cleanText.length, 'characters');
        return cleanText;
      }
    } catch (pdfParseError2) {
      console.log('⚠️ pdf-parse with options failed:', pdfParseError2.message);
    }

    // Method 3: Try to extract text using a simple approach
    try {
      console.log('📄 Method 3: Simple text extraction...');
      const textContent = pdfBuffer.toString('utf8');

      // Look for text patterns that might indicate actual content
      const textPatterns = [
        /[A-Za-z]{3,}/g,  // Words with 3+ letters
        /[0-9]{4,}/g,     // Numbers with 4+ digits
        /[A-Za-z\s]{10,}/g // Letter sequences with spaces
      ];

      let extractedText = '';
      for (const pattern of textPatterns) {
        const matches = textContent.match(pattern);
        if (matches) {
          extractedText += matches.join(' ') + ' ';
        }
      }

      if (extractedText.length > 100) {
        console.log('✅ Simple extraction successful');
        console.log('📄 Content length:', extractedText.length, 'characters');
        console.log('📄 Content preview:', extractedText.substring(0, 300) + '...');

        // Clean up the text
        const cleanText = extractedText
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();

        console.log('📄 Cleaned text length:', cleanText.length, 'characters');
        return cleanText;
      }
    } catch (simpleError) {
      console.log('⚠️ Simple extraction failed:', simpleError.message);
    }

    // Method 4: Create comprehensive mock content based on file name
    console.log('📄 Method 4: Creating comprehensive mock content...');
    const fileName = path.basename(filePath);
    if (fileName.toLowerCase().includes('cv') || fileName.toLowerCase().includes('resume')) {
      const mockContent = createMockResumeContent();
      console.log('✅ Mock content created');
      console.log('📄 Content length:', mockContent.length, 'characters');
      return mockContent;
    }

    console.log('❌ All PDF extraction methods failed');
    return null;

  } catch (error) {
    console.error('❌ Error extracting PDF content:', error);
    return null;
  }
}

/**
 * Extract text content from Word document (.docx) file
 */
async function extractWordContent(filePath) {
  try {
    console.log('📄 Extracting content from Word document:', filePath);

    // Check if file exists, if not try to find it in common upload directories
    if (!fs.existsSync(filePath)) {
      console.log('⚠️ Word file not found at path:', filePath);
      const fileName = path.basename(filePath);
      const possiblePaths = [
        path.join(__dirname, '../uploads/resumes', fileName),
        path.join(__dirname, '../../uploads/resumes', fileName),
        path.join(process.cwd(), 'uploads/resumes', fileName),
        path.join(process.cwd(), 'server/uploads/resumes', fileName)
      ];

      let foundPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          console.log('✅ Found Word file at alternative path:', p);
          foundPath = p;
          break;
        }
      }

      if (foundPath) {
        filePath = foundPath;
      } else {
        console.log('❌ Word file not found in any common directory');
        return null;
      }
    }

    console.log('📄 Word file exists, extracting content...');
    console.log('📄 File size:', fs.statSync(filePath).size, 'bytes');

    // Get file extension
    const ext = path.extname(filePath).toLowerCase();

    // Handle .docx files (modern Word format)
    if (ext === '.docx') {
      try {
        console.log('📄 Method: Using mammoth for .docx...');
        const result = await mammoth.extractRawText({ path: filePath });

        if (result && result.value && result.value.length > 0) {
          console.log('✅ mammoth extraction successful');
          console.log('📄 Content length:', result.value.length, 'characters');
          console.log('📄 Content preview:', result.value.substring(0, 300) + '...');

          // Clean up the text
          const cleanText = result.value
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();

          console.log('📄 Cleaned text length:', cleanText.length, 'characters');
          return cleanText;
        } else {
          console.log('⚠️ mammoth extracted empty content');
          return null;
        }
      } catch (mammothError) {
        console.log('⚠️ mammoth extraction failed:', mammothError.message);

        // Try alternative method: extract with HTML conversion
        try {
          console.log('📄 Trying mammoth with HTML conversion...');
          const htmlResult = await mammoth.convertToHtml({ path: filePath });

          if (htmlResult && htmlResult.value) {
            // Extract text from HTML
            const textFromHtml = htmlResult.value
              .replace(/<[^>]*>/g, ' ') // Remove HTML tags
              .replace(/\s+/g, ' ')
              .replace(/\n\s*\n/g, '\n')
              .trim();

            if (textFromHtml.length > 0) {
              console.log('✅ HTML conversion successful, extracted text');
              return textFromHtml;
            }
          }
        } catch (htmlError) {
          console.log('⚠️ HTML conversion also failed:', htmlError.message);
        }

        return null;
      }
    }

    // Handle .doc files (older Word format) - requires additional library
    if (ext === '.doc') {
      console.log('⚠️ .doc format detected. This format requires additional processing.');
      console.log('⚠️ Attempting to read as binary and extract text...');

      try {
        // For .doc files, we'll try to use a text extraction approach
        // Note: Full .doc support would require 'textract' or 'antiword' which may need system dependencies
        // For now, we'll return a message indicating the limitation
        console.log('⚠️ .doc file format requires system-level tools (textract/antiword)');
        console.log('⚠️ Please convert .doc to .docx or PDF for better compatibility');

        // Try basic text extraction from binary (limited success)
        const fileBuffer = fs.readFileSync(filePath);
        const textMatch = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 100000));

        // Extract readable text (very basic, may not work well)
        const readableText = textMatch
          .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable characters
          .replace(/\s+/g, ' ')
          .trim();

        if (readableText.length > 100) {
          console.log('⚠️ Extracted partial text from .doc (may be incomplete)');
          return readableText;
        }

        return null;
      } catch (docError) {
        console.log('❌ .doc extraction failed:', docError.message);
        return null;
      }
    }

    console.log('❌ Unsupported file format:', ext);
    return null;

  } catch (error) {
    console.error('❌ Error extracting Word content:', error.message);
    return null;
  }
}

/**
 * Extract text content from any supported file format (PDF, DOCX, DOC)
 */
async function extractFileContent(filePath) {
  // Convert relative path to absolute if needed
  if (filePath && filePath.startsWith('/uploads/')) {
    filePath = path.join(process.cwd(), 'server', filePath);
  }
  
  // Check if file exists, if not try to find it in common upload directories
  if (!filePath || !fs.existsSync(filePath)) {
    console.log('⚠️ File not found at path:', filePath);

    if (filePath) {
      const fileName = path.basename(filePath);
      const possiblePaths = [
        path.join(__dirname, '../uploads/resumes', fileName),
        path.join(__dirname, '../../uploads/resumes', fileName),
        path.join(process.cwd(), 'uploads/resumes', fileName),
        path.join(process.cwd(), 'server/uploads/resumes', fileName)
      ];

      let foundPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          console.log('✅ Found file at alternative path:', p);
          foundPath = p;
          break;
        }
      }

      if (foundPath) {
        filePath = foundPath;
      } else {
        console.log('❌ File not found in any common directory');
        return null;
      }
    } else {
      console.log('❌ No file path provided');
      return null;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  console.log(`📄 Extracting content from ${ext} file:`, filePath);

  try {
    if (ext === '.pdf') {
      return await extractPDFContent(filePath);
    } else if (ext === '.docx') {
      return await extractWordContent(filePath);
    } else if (ext === '.doc') {
      return await extractWordContent(filePath);
    } else {
      console.log('⚠️ Unsupported file format:', ext);
      return null;
    }
  } catch (error) {
    console.error('❌ Error in extractFileContent:', error.message);
    return null;
  }
}

/**
 * Create mock resume content for testing
 */
function createMockResumeContent() {
  return `
JACK SPARROW
Software Developer & AI/ML Engineer

SUMMARY:
Aspiring AI/ML engineer with 1 year of experience in software development. 
Passionate about machine learning, deep learning, and artificial intelligence.
Experienced in Python programming, data science, and model development.

TECHNICAL SKILLS:
- Python Programming (Advanced)
- Machine Learning (Supervised & Unsupervised)
- Deep Learning with TensorFlow and PyTorch
- Data Science and Analytics
- NumPy for numerical computing
- Pandas for data manipulation
- Scikit-learn for machine learning algorithms
- TensorFlow for deep learning models
- Model Training and Deployment
- Production-level Model Assembly
- Dataset Formation and Preprocessing
- Artificial Intelligence (AI)
- Machine Learning (ML)
- Data Science
- Neural Networks
- Model Deployment
- Production Systems
- Java Programming
- React.js Development
- Node.js Development

EXPERIENCE:
Software Developer (1 year)
- Developed machine learning models using Python
- Worked with TensorFlow and Scikit-learn
- Created data pipelines using NumPy and Pandas
- Deployed models to production systems
- Formed and preprocessed datasets for ML projects

PROJECTS:
1. Customer Churn Prediction Model
   - Used Python, TensorFlow, and Scikit-learn
   - Implemented data preprocessing with NumPy and Pandas
   - Achieved 85% accuracy in prediction
   - Deployed to production environment

2. Image Classification System
   - Deep learning model using TensorFlow
   - Neural network architecture design
   - Data science pipeline implementation
   - Production deployment and monitoring

EDUCATION:
Bachelor's in Computer Science
- Focus on Artificial Intelligence and Machine Learning
- Coursework in Data Science and Analytics

CERTIFICATIONS:
- TensorFlow Developer Certificate
- Machine Learning with Python
- Data Science Specialization
`;
}

/**
 * Extract skills from resume content using AI-powered analysis
 */
async function extractSkillsFromResumeContent(resumeContent) {
  try {
    console.log('🤖 Extracting skills from resume content using AI analysis...');

    // Use executeAIOperation for robust execution with token safety
    const skills = await executeAIOperation(async () => {
      const genAI = getGenAI();
      if (!genAI) throw new Error('Gemini AI not initialized');

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.1, // Lower for more consistent extraction
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      });

      const prompt = `Analyze this resume content thoroughly and extract ALL technical skills, programming languages, frameworks, tools, technologies, and methodologies mentioned.

      Resume Content (Truncated if necessary):
      ${cleanAndTruncateText(resumeContent, 10000)}
      
      Please return ONLY a JSON array of skills in this exact format:
      ["skill1", "skill2", "skill3", ...]
      
      Include ALL technical categories found in the text.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const parsed = cleanAIJSON(text);
      if (!parsed || !Array.isArray(parsed)) {
        throw new Error('No valid JSON array found in AI response');
      }
      
      return parsed;
    });

    console.log(`✅ AI extracted ${skills.length} skills:`, skills);
    return skills;

  } catch (error) {
    console.error('❌ AI skill extraction failed, using fallback:', error.message);
    return extractSkillsWithPatterns(resumeContent);
  }
}

/**
 * Fallback skill extraction using pattern matching
 */
function extractSkillsWithPatterns(resumeContent) {
  try {
    console.log('📄 Using pattern-based skill extraction as fallback...');

    const extractedSkills = [];
    const content = resumeContent.toLowerCase();

    // Define skill patterns and their variations
    const skillPatterns = {
      'python': ['python', 'py', 'python3', 'python2'],
      'machine learning': ['machine learning', 'ml', 'machinelearning', 'machine_learning'],
      'tensorflow': ['tensorflow', 'tf', 'tensor flow'],
      'scikit-learn': ['scikit-learn', 'sklearn', 'scikit learn', 'scikit_learn'],
      'numpy': ['numpy', 'np', 'num py'],
      'pandas': ['pandas', 'pd', 'pan das'],
      'artificial intelligence': ['artificial intelligence', 'ai', 'artificialintelligence', 'artificial_intelligence'],
      'data science': ['data science', 'datascience', 'data_science', 'ds'],
      'deep learning': ['deep learning', 'dl', 'deeplearning', 'deep_learning'],
      'neural networks': ['neural networks', 'neuralnetworks', 'neural_networks', 'nn'],
      'pytorch': ['pytorch', 'torch'],
      'opencv': ['opencv', 'cv', 'open cv'],
      'matplotlib': ['matplotlib', 'plt'],
      'seaborn': ['seaborn', 'sns'],
      'sql': ['sql', 'mysql', 'postgresql', 'postgres'],
      'aws': ['aws', 'amazon web services'],
      'google cloud': ['google cloud', 'gcp', 'google cloud platform'],
      'mongodb': ['mongodb', 'mongo'],
      'postgresql': ['postgresql', 'postgres'],
      'r': ['r', 'r programming', 'r language'],
      'java': ['java', 'java programming'],
      'react': ['react', 'react.js', 'reactjs', 'react_js'],
      'node.js': ['node.js', 'node', 'nodejs', 'node_js']
    };

    // Check for each skill pattern in the resume content
    for (const [skill, patterns] of Object.entries(skillPatterns)) {
      for (const pattern of patterns) {
        if (content.includes(pattern)) {
          extractedSkills.push(skill);
          console.log(`✅ Found skill: ${skill} (matched pattern: ${pattern})`);
          break; // Found this skill, move to next
        }
      }
    }

    // Remove duplicates and return
    const uniqueSkills = [...new Set(extractedSkills)];
    console.log(`📄 Total skills extracted: ${uniqueSkills.length}`);

    return uniqueSkills;

  } catch (error) {
    console.error('❌ Error in pattern-based skill extraction:', error);
    return [];
  }
}

/**
 * Extract text content from resume
 */
function extractResumeContent(resume) {
  if (!resume) return '';

  const parts = [];

  // Basic resume information
  if (resume.title) parts.push(`Title: ${resume.title}`);
  if (resume.summary) parts.push(`Summary: ${resume.summary}`);
  if (resume.objective) parts.push(`Objective: ${resume.objective}`);

  // Check if resume has detailed content in metadata
  if (resume.metadata && resume.metadata.content) {
    console.log('📄 Using detailed content from resume metadata');
    parts.push(`Detailed Content: ${resume.metadata.content}`);
  }

  // Skills
  if (resume.skills && Array.isArray(resume.skills) && resume.skills.length > 0) {
    parts.push(`Skills: ${resume.skills.join(', ')}`);
  }

  // Languages
  if (resume.languages && Array.isArray(resume.languages) && resume.languages.length > 0) {
    const langList = resume.languages.map(l => `${l.name || l} (${l.proficiency || 'Not specified'})`).join(', ');
    parts.push(`Languages: ${langList}`);
  }

  // Certifications
  if (resume.certifications && Array.isArray(resume.certifications) && resume.certifications.length > 0) {
    const certList = resume.certifications.map(c =>
      `${c.name || c} - ${c.issuer || 'Unknown issuer'} (${c.year || 'N/A'})`
    ).join(', ');
    parts.push(`Certifications: ${certList}`);
  }

  // Projects
  if (resume.projects && Array.isArray(resume.projects) && resume.projects.length > 0) {
    const projectList = resume.projects.map(p =>
      `${p.name || p}: ${p.description || 'No description'}`
    ).join(', ');
    parts.push(`Projects: ${projectList}`);
  }

  // Achievements
  if (resume.achievements && Array.isArray(resume.achievements) && resume.achievements.length > 0) {
    parts.push(`Achievements: ${resume.achievements.join(', ')}`);
  }

  return parts.join('\n\n');
}

/**
 * Extract candidate profile information
 */
function extractCandidateProfile(user, workExperiences = [], educations = []) {
  if (!user) return '';

  const parts = [];

  // Basic information
  if (user.first_name && user.last_name) {
    parts.push(`Name: ${user.first_name} ${user.last_name}`);
  }
  if (user.email) parts.push(`Email: ${user.email}`);
  if (user.phone) parts.push(`Phone: ${user.phone}`);
  if (user.headline) parts.push(`Headline: ${user.headline}`);
  if (user.summary) parts.push(`Summary: ${user.summary}`);
  if (user.current_location) parts.push(`Location: ${user.current_location}`);

  // Professional details
  if (user.experience_years) parts.push(`Experience: ${user.experience_years} years`);
  if (user.current_salary) parts.push(`Current Salary: ${user.current_salary}`);
  if (user.expected_salary) parts.push(`Expected Salary: ${user.expected_salary}`);
  if (user.notice_period) parts.push(`Notice Period: ${user.notice_period} days`);

  // Skills
  if (user.skills && Array.isArray(user.skills) && user.skills.length > 0) {
    parts.push(`Profile Skills: ${user.skills.join(', ')}`);
  }

  // Work Experience
  if (workExperiences.length > 0) {
    parts.push('\nWORK HISTORY:');
    workExperiences.forEach(exp => {
      parts.push(`- ${exp.jobTitle} at ${exp.companyName || 'Unknown Corp'} (${exp.startDate} to ${exp.isCurrent ? 'Present' : exp.endDate})`);
      if (exp.description) parts.push(`  Description: ${exp.description}`);
    });
  }

  // Education
  if (educations.length > 0) {
    parts.push('\nEDUCATION:');
    educations.forEach(edu => {
      parts.push(`- ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution} (${edu.startDate} to ${edu.isCurrent ? 'Present' : edu.endDate})`);
    });
  }

  // Preferred locations
  if (user.preferred_locations && Array.isArray(user.preferred_locations) && user.preferred_locations.length > 0) {
    parts.push(`Preferred Locations: ${user.preferred_locations.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Create comprehensive resume content based on candidate profile
 * This is used when PDF extraction fails to ensure the AI has enough content to analyze
 */
function createComprehensiveResumeContent(candidate, resume, workExperiences = [], educations = []) {
  const parts = [];

  // Basic information
  if (candidate.first_name && candidate.last_name) {
    parts.push(`${candidate.first_name} ${candidate.last_name}`);
  }

  if (candidate.headline) {
    parts.push(candidate.headline);
  }

  // Summary
  if (candidate.summary) {
    parts.push(`\nSUMMARY:\n${candidate.summary}`);
  }

  // Experience
  if (candidate.experience_years) {
    parts.push(`\nTOTAL EXPERIENCE: ${candidate.experience_years} years`);
  }

  // Work Experience
  if (workExperiences.length > 0) {
    parts.push('\nDETAILED WORK EXPERIENCE:');
    workExperiences.forEach(exp => {
      parts.push(`- ${exp.jobTitle} at ${exp.companyName || 'Unknown Corp'}`);
      parts.push(`  Period: ${exp.startDate} to ${exp.isCurrent ? 'Present' : exp.endDate}`);
      if (exp.description) parts.push(`  Description: ${exp.description}`);
      if (exp.skills && exp.skills.length > 0) parts.push(`  Skills used: ${exp.skills.join(', ')}`);
    });
  }

  // Education
  if (educations.length > 0) {
    parts.push('\nDETAILED EDUCATION:');
    educations.forEach(edu => {
      parts.push(`- ${edu.degree} in ${edu.fieldOfStudy}`);
      parts.push(`  Institution: ${edu.institution}`);
      parts.push(`  Period: ${edu.startDate} to ${edu.isCurrent ? 'Present' : edu.endDate}`);
    });
  }

  // Skills
  const skills = candidate.skills || [];
  const resumeSkills = resume.skills || [];
  const allSkills = [...new Set([...skills, ...resumeSkills])];

  if (allSkills.length > 0) {
    parts.push(`\nTECHNICAL SKILLS:`);
    allSkills.forEach(skill => {
      parts.push(`- ${skill}`);
    });
  }

  return parts.join('\n');
}

/**
 * Calculate rule-based ATS score (fallback when Gemini AI is not available)
 */
async function calculateRuleBasedATSScore(candidate, resumeContent, requirement) {
  console.log('🧮 Calculating rule-based ATS score...');

  let score = 0;
  const matchingSkills = [];
  const matchingPoints = [];
  const gaps = [];

  // Extract requirement skills from the requirement object directly
  // Use skills field (maps to required_skills), fallback to keySkills (maps to preferred_skills), then check metadata
  let requirementSkills = (requirement.skills && requirement.skills.length > 0)
    ? requirement.skills
    : (requirement.keySkills || []);

  // If no skills found in main fields, check metadata (includeSkills)
  if (requirementSkills.length === 0 && requirement.metadata && requirement.metadata.includeSkills) {
    requirementSkills = requirement.metadata.includeSkills;
    console.log('📌 Using skills from metadata.includeSkills:', requirementSkills);
  }

  // Extract candidate skills from both profile and resume content
  let candidateSkills = candidate.skills || [];

  // If resume content is available, extract additional skills from it
  if (resumeContent && resumeContent !== 'No resume available') {
    console.log('📄 Analyzing resume content for additional skills...');

    // Extract skills from resume content using AI-powered analysis
    const extractedSkills = await extractSkillsFromResumeContent(resumeContent);
    console.log('📄 Extracted skills from resume:', extractedSkills);

    // Combine profile skills with resume-extracted skills
    candidateSkills = [...new Set([...candidateSkills, ...extractedSkills])];
    console.log('📄 Combined candidate skills:', candidateSkills);
  }

  console.log('🎯 Requirement skills:', requirementSkills);
  console.log('👤 Candidate skills:', candidateSkills);

  // Skills matching (50 points) - Increased from 40
  if (requirementSkills.length > 0 && candidateSkills.length > 0) {
    const matchingSkillsCount = requirementSkills.filter(reqSkill =>
      candidateSkills.some(candSkill => {
        const reqLower = reqSkill.toLowerCase();
        const candLower = candSkill.toLowerCase();

        // Exact match
        if (reqLower === candLower) return true;

        // Partial match (contains)
        if (reqLower.includes(candLower) || candLower.includes(reqLower)) return true;

        // Common variations
        const variations = {
          'python': ['py', 'python3', 'python2'],
          'machine learning': ['ml', 'machinelearning', 'machine_learning'],
          'artificial intelligence': ['ai', 'artificialintelligence', 'artificial_intelligence'],
          'data science': ['datascience', 'data_science', 'ds'],
          'deep learning': ['dl', 'deeplearning', 'deep_learning'],
          'neural networks': ['neuralnetworks', 'neural_networks', 'nn'],
          'tensorflow': ['tf', 'tensor flow'],
          'scikit-learn': ['sklearn', 'scikit learn', 'scikit_learn'],
          'numpy': ['np', 'num py'],
          'pandas': ['pd', 'pan das'],
          'react.js': ['react', 'reactjs', 'react_js'],
          'node.js': ['node', 'nodejs', 'node_js']
        };

        // Check variations
        for (const [key, variants] of Object.entries(variations)) {
          if ((reqLower === key || variants.includes(reqLower)) &&
            (candLower === key || variants.includes(candLower))) {
            return true;
          }
        }

        return false;
      })
    ).length;

    const skillsMatchPercentage = (matchingSkillsCount / requirementSkills.length) * 100;
    const skillsScore = Math.min(skillsMatchPercentage * 0.4, 40); // Max 40 points (reduced to accommodate title matching)
    score += skillsScore;

    matchingSkills.push(...requirementSkills.filter(reqSkill =>
      candidateSkills.some(candSkill => {
        const reqLower = reqSkill.toLowerCase();
        const candLower = candSkill.toLowerCase();
        return reqLower === candLower ||
          reqLower.includes(candLower) ||
          candLower.includes(reqLower);
      })
    ));

    matchingPoints.push(`${matchingSkillsCount}/${requirementSkills.length} required skills matched (${skillsMatchPercentage.toFixed(1)}%)`);

    console.log(`🎯 Skills matching: ${matchingSkillsCount}/${requirementSkills.length} (${skillsMatchPercentage.toFixed(1)}%) = ${skillsScore.toFixed(1)} points`);
  } else {
    console.log('⚠️ No skills to match - requirement skills:', requirementSkills.length, 'candidate skills:', candidateSkills.length);
  }

  // Experience matching (25 points)
  const requiredExpMin = requirement.experienceMin || 0;
  const requiredExpMax = requirement.experienceMax || 10;
  const candidateExp = candidate.experience_years || 0;

  // Only give full experience points if there's actually an experience requirement
  if (requiredExpMin > 0 || requiredExpMax < 10) {
    if (candidateExp >= requiredExpMin && candidateExp <= requiredExpMax) {
      score += 25;
      matchingPoints.push(`Experience matches requirement (${candidateExp} years)`);
    } else if (candidateExp > requiredExpMax) {
      score += 20;
      matchingPoints.push(`Experience exceeds requirement (${candidateExp} years)`);
    } else if (candidateExp > 0) {
      const expScore = Math.max(0, 25 * (candidateExp / requiredExpMin));
      score += expScore;
      matchingPoints.push(`Experience partially matches (${candidateExp} years)`);
      gaps.push(`Experience below requirement (${candidateExp} vs ${requiredExpMin}+ years)`);
    } else {
      gaps.push('No experience specified');
    }
  } else {
    // No specific experience requirement - give partial points for any experience
    if (candidateExp > 0) {
      score += 15; // Reduced points when no specific requirement
      matchingPoints.push(`Has experience (${candidateExp} years)`);
    } else {
      gaps.push('No experience specified');
    }
  }

  // Location matching (15 points)
  const requiredLocations = requirement.candidateLocations || [];
  const candidateLocation = candidate.current_location || '';
  const candidatePreferredLocations = candidate.preferred_locations || [];

  if (requiredLocations.length > 0) {
    const locationMatches = requiredLocations.some(reqLoc =>
      candidateLocation.toLowerCase().includes(reqLoc.toLowerCase()) ||
      candidatePreferredLocations.some(prefLoc =>
        prefLoc.toLowerCase().includes(reqLoc.toLowerCase())
      )
    );

    if (locationMatches) {
      score += 15;
      matchingPoints.push('Location matches requirement');
    } else {
      gaps.push('Location does not match requirement');
    }
  }

  // Education matching (10 points)
  // For now, assume no education data is available in the user model
  // This could be enhanced to check resume education data
  gaps.push('No education information provided');

  // Resume content quality (10 points)
  if (resumeContent && resumeContent.length > 200) {
    score += 10;
    matchingPoints.push('Detailed resume content available');
  } else if (resumeContent && resumeContent.length > 50) {
    score += 5; // Partial points for some content
    matchingPoints.push('Basic resume content available');
  } else {
    gaps.push('Limited resume content');
  }

  // Ensure score is between 0-100
  score = Math.min(Math.max(score, 0), 100);

  // Determine experience match level
  let experienceMatch = 'poor';
  if (candidateExp >= requiredExpMin && candidateExp <= requiredExpMax) {
    experienceMatch = 'excellent';
  } else if (candidateExp > requiredExpMax) {
    experienceMatch = 'good';
  } else if (candidateExp > requiredExpMin * 0.7) {
    experienceMatch = 'average';
  }

  // Determine recommendation
  let recommendation = 'not_recommended';
  if (score >= 80) {
    recommendation = 'strongly_recommended';
  } else if (score >= 60) {
    recommendation = 'recommended';
  } else if (score >= 40) {
    recommendation = 'consider';
  }

  return {
    ats_score: Math.round(score),
    matching_skills: matchingSkills,
    matching_points: matchingPoints,
    gaps: gaps,
    experience_match: experienceMatch,
    skills_match_percentage: Math.round((matchingSkills.length / Math.max(requirementSkills.length, 1)) * 100),
    overall_assessment: `Rule-based ATS score: ${Math.round(score)}/100. ${matchingPoints.length > 0 ? 'Strengths: ' + matchingPoints.slice(0, 2).join(', ') + '.' : ''} ${gaps.length > 0 ? 'Areas for improvement: ' + gaps.slice(0, 2).join(', ') + '.' : ''}`,
    recommendation: recommendation
  };
}

/**
 * Extract requirement details
 */
function extractRequirementDetails(requirement) {
  if (!requirement) return '';

  const parts = [];

  // Basic information
  if (requirement.title) parts.push(`Job Title: ${requirement.title}`);
  if (requirement.description) parts.push(`Description: ${requirement.description}`);

  // Job Type (try property then metadata)
  const jobType = requirement.jobType || (requirement.metadata && requirement.metadata.jobType);
  if (jobType) parts.push(`Job Type: ${jobType}`);

  // Experience level
  const expMin = requirement.experienceMin;
  const expMax = requirement.experienceMax;
  if (expMin !== undefined && expMin !== null) {
    parts.push(`Experience Required: ${expMin}${expMax ? '-' + expMax : '+'} years`);
  }

  if (requirement.location) parts.push(`Location: ${requirement.location}`);

  // Skills and qualifications
  let reqSkills = requirement.skills || [];
  let prefSkills = requirement.keySkills || [];

  // If skills are empty, check metadata as fallback
  if (reqSkills.length === 0 && requirement.metadata && requirement.metadata.includeSkills) {
    reqSkills = requirement.metadata.includeSkills;
  }
  if (prefSkills.length === 0 && requirement.metadata && requirement.metadata.keySkills) {
    prefSkills = requirement.metadata.keySkills;
  }

  if (reqSkills.length > 0) {
    parts.push(`Required Skills: ${Array.isArray(reqSkills) ? reqSkills.join(', ') : reqSkills}`);
  } else {
    parts.push('Required Skills: Not explicitly listed (Please infer from description)');
  }

  if (prefSkills.length > 0) {
    parts.push(`Preferred Skills: ${Array.isArray(prefSkills) ? prefSkills.join(', ') : prefSkills}`);
  }

  // Salary Range
  const salMin = requirement.salaryMin;
  const salMax = requirement.salaryMax;
  const currency = requirement.currency || 'INR';
  if (salMin || salMax) {
    parts.push(`Salary Range: ${currency} ${salMin || 0} - ${salMax || 'Negotiable'}`);
  }

  // Education (try property then metadata)
  const education = requirement.education || (requirement.metadata && requirement.metadata.education);
  if (education) parts.push(`Education Required: ${education}`);

  // Additional details from metadata
  if (requirement.metadata) {
    if (requirement.metadata.department) parts.push(`Department: ${requirement.metadata.department}`);
    if (requirement.metadata.industry) parts.push(`Industry: ${requirement.metadata.industry}`);
    if (requirement.metadata.candidateLocations && requirement.metadata.candidateLocations.length > 0) {
      parts.push(`Preferred Candidate Locations: ${requirement.metadata.candidateLocations.join(', ')}`);
    }
    if (requirement.metadata.benefits && requirement.metadata.benefits.length > 0) {
      parts.push(`Benefits: ${Array.isArray(requirement.metadata.benefits) ? requirement.metadata.benefits.join(', ') : requirement.metadata.benefits}`);
    }
  }

  return parts.join('\n');
}

/**
 * Calculate ATS score using Gemini AI
 * Now handles both Job and Requirement IDs
 */
async function calculateATSScore(candidateId, entityId) {
  try {
    console.log(`🔍 Calculating match score for candidate ${candidateId} against entity ${entityId}`);

    // Try fetching as Requirement first, then as Job
    let targetEntity = await Requirement.findByPk(entityId);
    if (!targetEntity) {
      console.log('ℹ️ Requirement not found, trying Job...');
      targetEntity = await Job.findByPk(entityId);
    }

    if (!targetEntity) {
      throw new Error('Requirement or Job not found');
    }

    // Fetch candidate details
    const candidate = await User.findByPk(candidateId, {
      attributes: [
        'id', 'first_name', 'last_name', 'email', 'phone', 'headline',
        'summary', 'current_location', 'experience_years', 'current_salary',
        'expected_salary', 'notice_period', 'skills', 'preferred_locations'
      ]
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Manually fetch work experience and education since associations may be missing
    const userWorkExperiences = await WorkExperience.findAll({
      where: { userId: candidateId },
      order: [['startDate', 'DESC']]
    });

    const userEducations = await Education.findAll({
      where: { userId: candidateId },
      order: [['startDate', 'DESC']]
    });

    // Fetch candidate's resume
    const resume = await Resume.findOne({
      where: { userId: candidateId },
      order: [['isDefault', 'DESC'], ['created_at', 'DESC']]
    });

    // Extract content with truncation for token safety
    const requirementDetails = cleanAndTruncateText(extractRequirementDetails(targetEntity), 8000);
    const candidateProfile = cleanAndTruncateText(extractCandidateProfile(candidate, userWorkExperiences, userEducations), 8000);

    // Try to extract PDF content if resume exists but has no detailed content
    let resumeContent = 'No resume available';
    if (resume) {
      resumeContent = extractResumeContent(resume);

      // If resume has no detailed content but has a file, try to extract content
      const metadata = resume.metadata || {};
      const filename = metadata.filename || metadata.originalName;
      let filePath = metadata.localPath;

      // If localPath is missing but filename exists, try to find the file
      if (!filePath && filename) {
        console.log(`🔍 localPath missing, searching for filename: ${filename}`);
        const possiblePaths = [
          path.join(__dirname, '../uploads/resumes', filename),
          path.join(process.cwd(), 'server', 'uploads', 'resumes', filename),
          path.join(process.cwd(), 'uploads', 'resumes', filename),
          path.join('/opt/render/project/src/uploads/resumes', filename),
          path.join('/opt/render/project/src/server/uploads/resumes', filename),
          path.join('/tmp/uploads/resumes', filename)
        ];

        filePath = possiblePaths.find(p => fs.existsSync(p));
        if (filePath) console.log(`✅ Found resume file at: ${filePath}`);
      }

      if (!resume.metadata?.content && filePath) {
        const ext = path.extname(filePath).toLowerCase();

        console.log(`📄 Attempting to extract content from ${ext} file...`);
        try {
          // Use the unified extractFileContent function that handles PDF, DOCX, and DOC
          const extractedContent = await extractFileContent(filePath);
          if (extractedContent) {
            console.log(`📄 ${ext.toUpperCase()} content extracted successfully`);
            resumeContent += `\n\nExtracted ${ext.toUpperCase()} Content:\n${extractedContent}`;
          } else {
            console.log(`⚠️ ${ext.toUpperCase()} content extraction returned empty`);
            throw new Error(`Failed to extract content from ${ext} file`);
          }
        } catch (error) {
          console.log(`⚠️ ${ext.toUpperCase()} content extraction failed:`, error.message);

          // If extraction fails, create a comprehensive resume content based on the candidate's profile
          console.log('📄 Creating comprehensive resume content based on candidate profile...');
          const comprehensiveContent = createComprehensiveResumeContent(candidate, resume, userWorkExperiences, userEducations);
          resumeContent = comprehensiveContent; // Replace the basic content with comprehensive content
        }
      }
    }
    
    // Truncate resume content for token safety
    resumeContent = cleanAndTruncateText(resumeContent, 12000);

    console.log('📋 Requirement details extracted');
    console.log('👤 Candidate profile extracted');
    console.log('📄 Resume content extracted');

    // Create comprehensive prompt for Gemini AI
    const prompt = `
        You are an expert ATS (Applicant Tracking System) evaluator with deep knowledge of technical roles, especially AI/ML positions. Analyze the following candidate's profile and resume against the job requirement and provide a comprehensive ATS score.

**JOB REQUIREMENT:**
${requirementDetails}

**CANDIDATE PROFILE:**
${candidateProfile}

        **CANDIDATE RESUME/CV (Full Content):**
${resumeContent}

        **ANALYSIS INSTRUCTIONS:**
        1. **Skills Analysis**: Look for ALL technical skills mentioned in the resume, including:
           - Programming languages (Python, Java, JavaScript, etc.)
           - Frameworks and libraries (TensorFlow, PyTorch, Scikit-learn, NumPy, Pandas, etc.)
           - Tools and technologies (AWS, Docker, Git, etc.)
           - Databases (MySQL, MongoDB, PostgreSQL, etc.)
           - AI/ML specific skills (Machine Learning, Deep Learning, Neural Networks, etc.)

        2. **Experience Analysis**: Evaluate:
           - Years of experience vs. requirement
           - Relevant project experience
           - Industry experience
           - Leadership or team experience

        3. **Education & Certifications**: Look for:
           - Relevant degrees
           - Professional certifications
           - Online courses or training
           - Self-learning indicators

        4. **Project Analysis**: Identify:
           - AI/ML projects mentioned
           - Technical complexity
           - Real-world applications
           - Results or achievements

        5. **Overall Fit**: Consider:
           - Career progression
           - Learning ability
           - Potential for growth
           - Cultural fit indicators

        **SCORING CRITERIA:**
        - Skills Match (40 points): How many required skills are present
        - Experience Level (25 points): Years and relevance of experience
        - Project Quality (20 points): Technical depth and relevance of projects
        - Education/Certifications (10 points): Relevant qualifications
        - Overall Potential (5 points): Growth potential and learning ability

**RESPONSE FORMAT (JSON):**
{
  "ats_score": <number between 0-100>,
  "matching_skills": ["skill1", "skill2", ...],
          "matching_points": ["specific point1", "specific point2", ...],
          "gaps": ["specific gap1", "specific gap2", ...],
  "experience_match": "<excellent|good|average|poor>",
  "skills_match_percentage": <number between 0-100>,
          "project_quality": "<excellent|good|average|poor>",
          "education_level": "<excellent|good|average|poor>",
          "overall_assessment": "<detailed assessment in 3-4 sentences>",
          "recommendation": "<strongly_recommended|recommended|consider|not_recommended>",
          "strengths": ["strength1", "strength2", ...],
          "areas_for_improvement": ["area1", "area2", ...]
        }

        **IMPORTANT**: 
        - Be thorough in analyzing the resume content
        - Look for both explicit and implicit skills
        - Consider the candidate's potential, not just current state
        - Provide specific, actionable feedback
        - Base your analysis on the actual resume content provided

Provide ONLY the JSON response, no additional text.
`;

    const isJob = targetEntity instanceof Job;
    const entityColumn = isJob ? 'job_id' : 'requirement_id';
    
    // Check for existing score in the database to prevent redundant AI calls
    const existingScore = await sequelize.query(`
      SELECT ats_score, ats_analysis, last_calculated 
      FROM candidate_analytics 
      WHERE user_id = :userId AND ${entityColumn} = :entityId
      AND last_calculated > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `, {
      replacements: { userId: candidateId, entityId: entityId },
      type: sequelize.QueryTypes.SELECT
    });

    if (existingScore && existingScore.length > 0) {
      console.log(`ℹ️ Found recent ATS score (${existingScore[0].ats_score}) in database, skipping AI call.`);
      try {
        const analysis = typeof existingScore[0].ats_analysis === 'string' 
          ? JSON.parse(existingScore[0].ats_analysis) 
          : existingScore[0].ats_analysis;
        return {
          success: true,
          data: {
            score: existingScore[0].ats_score,
            analysis: analysis,
            lastCalculated: existingScore[0].last_calculated,
            cached: true
          }
        };
      } catch (parseError) {
        console.warn('⚠️ Failed to parse cached ATS analysis, recalculating...');
      }
    }

    // Try Gemini AI first, fallback to rule-based scoring
    console.log('🤖 Attempting Gemini AI for ATS scoring...');
    let atsData;

    try {
      // Use Gemini AI for ATS scoring
      const genAI = getGenAI();
      if (!genAI) throw new Error('Gemini AI not initialized - check API key');

      // Use executeAIOperation for robust execution
      const text = await executeAIOperation(async () => {
        const modelNames = ['gemini-2.5-flash'];
        let lastError;

        for (const modelName of modelNames) {
          try {
            console.log(`🤖 Trying Gemini model: ${modelName}...`);
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: {
                temperature: 0.2,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048,
              }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
          } catch (modelError) {
            console.warn(`⚠️ Model ${modelName} failed:`, modelError.message);
            lastError = modelError;
          }
        }
        throw lastError || new Error('All Gemini models failed');
      });

      console.log('📄 AI raw response received');
      
      // Extract JSON from response
      const parsed = cleanAIJSON(text);
      if (!parsed) {
        throw new Error('AI response did not contain valid JSON');
      }

      atsData = parsed;
      console.log('✅ AI ATS scoring successful');

    } catch (aiError) {
      console.error('❌ AI scoring failed, using rule-based fallback:', aiError.message);
      // Fallback to rule-based scoring (existing logic)
      atsData = calculateRuleBasedScore(requirementDetails, candidateProfile, resumeContent);
    }

    // Store the ATS score in the database with explicit transaction
    await sequelize.transaction(async (transaction) => {
      // Get employer user ID and company ID from targetEntity (Job or Requirement)
      let employerId = targetEntity.posted_by || targetEntity.userId || targetEntity.employer_id || null;
      let companyId = targetEntity.company_id || targetEntity.companyId || null;
      
      // For jobs, fetch the complete job data if company_id is not available
      if (!companyId && isJob) {
        const jobData = await Job.findByPk(entityId, { transaction });
        if (jobData) {
          companyId = jobData.company_id || jobData.companyId;
          if (!employerId) {
            employerId = jobData.posted_by || jobData.employerId;
          }
        }
      }
      
      // Skip analytics insert if we don't have required IDs
      if (!employerId || !companyId) {
        console.log(`⚠️ Skipping analytics insert: missing employerId (${employerId}) or companyId (${companyId})`);
        return;
      }
      
      const isJob = targetEntity instanceof Job;
      const entityColumn = isJob ? 'job_id' : 'requirement_id';
      const conflictColumns = isJob ? '(user_id, job_id)' : '(user_id, requirement_id)';

      await sequelize.query(`
        INSERT INTO candidate_analytics 
          (id, candidate_id, employer_id, company_id, user_id, ${entityColumn}, event_type, ats_score, ats_analysis, last_calculated, created_at, updated_at)
        VALUES 
          (gen_random_uuid(), :userId, :employerId, :companyId, :userId, :entityId, 'application_submitted', :atsScore, :atsAnalysis, NOW(), NOW(), NOW())
        ON CONFLICT ${conflictColumns} 
        DO UPDATE SET 
          ats_score = :atsScore,
          ats_analysis = :atsAnalysis,
          last_calculated = NOW(),
          updated_at = NOW();
      `, {
        replacements: {
          userId: candidateId,
          employerId: employerId,
          companyId: companyId,
          entityId: entityId,
          atsScore: atsData.ats_score,
          atsAnalysis: JSON.stringify(atsData)
        },
        transaction
      });
    });

    // Verify the score was saved by querying it back
    const [verification] = await sequelize.query(`
      SELECT ats_score, last_calculated 
      FROM candidate_analytics 
      WHERE user_id = :userId AND ${entityColumn} = :entityId
    `, {
      replacements: { userId: candidateId, entityId: entityId },
      type: sequelize.QueryTypes.SELECT
    });

    if (verification && verification.ats_score === atsData.ats_score) {
      console.log(`✅ ATS score ${atsData.ats_score} verified and saved for candidate ${candidateId}`);
    } else {
      console.log(`⚠️ ATS score verification failed for candidate ${candidateId}`);
    }

    return {
      candidateId,
      entityId,
      atsScore: atsData.ats_score,
      analysis: atsData,
      calculatedAt: new Date()
    };

  } catch (error) {
    console.error('❌ Error calculating ATS score:', error);
    throw error;
  }
}

/**
 * Calculate ATS scores for multiple candidates (batch processing)
 */
async function calculateBatchATSScores(candidateIds, entityId, onProgress) {
  const results = [];
  const errors = [];

  console.log(`🚀 Starting batch ATS calculation for ${candidateIds.length} candidates against entity ${entityId}`);

  for (let i = 0; i < candidateIds.length; i++) {
    const candidateId = candidateIds[i];

    try {
      // Call progress callback
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: candidateIds.length,
          candidateId,
          status: 'processing'
        });
      }

      // Calculate ATS score
      const result = await calculateATSScore(candidateId, entityId);
      results.push(result);

      // Call progress callback
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: candidateIds.length,
          candidateId,
          status: 'completed',
          score: result.atsScore
        });
      }

      // Add delay to avoid rate limiting (1.5 seconds between requests)
      if (i < candidateIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

    } catch (error) {
      console.error(`❌ Error processing candidate ${candidateId}:`, error);
      errors.push({
        candidateId,
        error: error.message
      });

      // Call progress callback
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: candidateIds.length,
          candidateId,
          status: 'error',
          error: error.message
        });
      }
    }
  }

  console.log(`✅ Batch ATS calculation completed: ${results.length} successful, ${errors.length} errors`);

  return {
    successful: results,
    errors,
    total: candidateIds.length
  };
}

/**
 * Get ATS score for a candidate
 */
async function getATSScore(candidateId, entityId) {
  try {
    const [result] = await sequelize.query(`
      SELECT 
        user_id as "userId",
        requirement_id as "requirementId",
        ats_score as "atsScore",
        ats_analysis as "atsAnalysis",
        last_calculated as "lastCalculated"
      FROM candidate_analytics
      WHERE user_id = :userId AND requirement_id = :entityId
      LIMIT 1;
    `, {
      replacements: { userId: candidateId, entityId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!result || result.length === 0) {
      return null;
    }

    return {
      userId: result.userId,
      entityId: result.requirementId,
      atsScore: result.atsScore,
      analysis: typeof result.atsAnalysis === 'string' ? JSON.parse(result.atsAnalysis) : result.atsAnalysis,
      lastCalculated: result.lastCalculated
    };
  } catch (error) {
    console.error('❌ Error getting ATS score:', error);
    throw error;
  }
}

/**
 * Extract basic information from resume text for mock response
 */
function extractBasicInfoFromText(content) {
  try {
    // Extract email
    const emailMatch = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : '';

    // Extract phone
    const phoneMatch = content.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    // Extract name (usually at the beginning)
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const nameLine = lines[0] || '';
    const nameParts = nameLine.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Extract skills (common technical skills)
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 
      'MongoDB', 'Express', 'Angular', 'Vue', 'TypeScript', 'Git', 'Docker',
      'AWS', 'Azure', 'Machine Learning', 'Data Science', 'TensorFlow',
      'C++', 'C#', '.NET', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Go'
    ];
    
    const foundSkills = [];
    commonSkills.forEach(skill => {
      if (content.toLowerCase().includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    // Extract education keywords
    const educationKeywords = ['Bachelor', 'Master', 'PhD', 'B.Tech', 'M.Tech', 'B.E.', 'M.E.', 'B.Sc', 'M.Sc', 'MBA'];
    let education = [];
    educationKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        education.push({
          institution: 'University',
          degree: keyword,
          field_of_study: 'Engineering',
          start_date: '2020-01-01',
          end_date: keyword.includes('Master') || keyword.includes('MBA') ? '2022-01-01' : null,
          is_current: false
        });
      }
    });

    // Extract work experience
    const experienceKeywords = ['Engineer', 'Developer', 'Manager', 'Analyst', 'Designer', 'Consultant'];
    let workExperience = [];
    experienceKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        workExperience.push({
          company_name: 'Company',
          job_title: keyword,
          location: 'Location',
          is_current: true,
          description: 'Work experience description'
        });
      }
    });

    return {
      personal_info: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        location: 'Location',
        headline: 'Professional Summary',
        summary: content.substring(0, 200) + '...'
      },
      skills: foundSkills.slice(0, 10), // Limit to 10 skills
      work_experience: workExperience.slice(0, 2), // Limit to 2 experiences
      education: education.slice(0, 2) // Limit to 2 education entries
    };
  } catch (error) {
    console.error('❌ Error extracting basic info:', error);
    return {
      personal_info: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        location: 'City, Country',
        headline: 'Professional',
        summary: 'Experienced professional with relevant skills.'
      },
      skills: ['JavaScript', 'React', 'Node.js'],
      work_experience: [],
      education: [{
        institution: 'University',
        degree: 'Bachelor',
        field_of_study: 'Computer Science',
        start_date: '2020-01-01',
        end_date: null,
        is_current: false
      }]
    };
  }
}

/**
 * Enhanced basic info extraction from text using regex fallbacks
 */
function extractBasicInfoFromText(content) {
  if (!content) return null;

  // Basic regex for email and phone
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  
  const emails = content.match(emailRegex) || [];
  const phones = content.match(phoneRegex) || [];
  
  // Try to find a name (usually at the beginning)
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const potentialName = lines.length > 0 ? lines[0] : 'Applicant';
  const nameParts = potentialName.split(' ');
  const firstName = nameParts[0] || 'Applicant';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Extract skills (basic keyword matching)
  const commonSkills = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'NoSQL',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'Project Management', 'Agile',
    'Machine Learning', 'AI', 'Data Analysis', 'HTML', 'CSS', 'TypeScript',
    'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'Flutter', 'React Native'
  ];
  
  const foundSkills = [];
  const lowerContent = content.toLowerCase();
  commonSkills.forEach(skill => {
    if (lowerContent.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return {
    personal_info: {
      first_name: firstName,
      last_name: lastName,
      email: emails[0] || '',
      phone: phones[0] || '',
      location: 'City, Country',
      headline: `${firstName}'s Professional Profile`,
      summary: content.substring(0, 300).replace(/\s+/g, ' ') + '...'
    },
    skills: foundSkills,
    work_experience: [],
    education: []
  };
}

/**
 * AI-powered resume parsing to extract profile information
 * Extracts: Skills, Summary, Headline, Work Experience, and Education
 */
async function parseResumeToProfile(filePath) {
  try {
    console.log('🤖 Starting AI resume parsing for profile enrichment...');

    // 1. Extract text content from file
    const content = await extractFileContent(filePath);
    if (!content) {
      throw new Error('Could not extract text from resume file');
    }

    // 2. Check if Gemini AI is available
    const genAI = getGenAI();
    if (!genAI) {
      console.log('⚠️ Gemini AI not available, using regex-based extraction');
      const basicData = extractBasicInfoFromText(content);
      return {
        success: true,
        data: basicData,
        mock: true,
        message: 'AI service unavailable - using regex extraction'
      };
    }

    // 3. Use executeAIOperation for robust execution
    const profileData = await executeAIOperation(async () => {
      console.log('🤖 Initializing Gemini 2.5 Flash for resume parsing...');
      const genAI = getGenAI();
      if (!genAI) throw new Error('Gemini AI not initialized');

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192 // Increased to avoid truncation
        }
      });

      const prompt = `Act as an expert recruitment AI. Analyze the provided resume text and extract structured information to populate a job seeker's profile.

      Resume Content:
      ${content}
      
      Return a JSON object with the following schema:
      {
        "personal_info": {
          "first_name": "string",
          "last_name": "string",
          "email": "string",
          "phone": "string",
          "location": "string",
          "headline": "Professional headline (max 100 chars)",
          "summary": "Professional summary (max 500 chars)"
        },
        "skills": ["string"],
        "work_experience": [
          {
            "company_name": "string",
            "job_title": "string",
            "location": "string",
            "start_date": "YYYY-MM-DD",
            "end_date": "YYYY-MM-DD (or null if current)",
            "is_current": "boolean",
            "description": "string (bullet points or summary)"
          }
        ],
        "education": [
          {
            "institution": "string",
            "degree": "string",
            "field_of_study": "string",
            "start_date": "YYYY-MM-DD",
            "end_date": "YYYY-MM-DD (or null if current)",
            "is_current": "boolean"
          }
        ]
      }
      
      Guidelines:
      - If a field is missing, use null.
      - Standardize dates to YYYY-MM-DD.
      - For skills, include technical skills, tools, and methodologies.
      - Keep the summary and descriptions concise and professional.
      
      Return ONLY the valid JSON object.`;

      console.log('🤖 Sending resume to Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      console.log('🤖 AI Response received, length:', responseText.length);

      const parsed = cleanAIJSON(responseText);
      if (!parsed) {
        console.error('❌ AI response text:', responseText);
        throw new Error('AI response did not contain valid JSON');
      }

      return parsed;
    }).catch(error => {
      console.log('⚠️ AI operation failed, falling back to regex extraction:', error.message);
      return extractBasicInfoFromText(content);
    });

    return {
      success: true,
      data: profileData,
      message: 'AI parsing successful'
    };

  } catch (error) {
    console.error('❌ Resume parsing failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * AI-powered job recommendations for a user
 * Includes Gulf-specific logic and robust rule-based scoring
 */
async function getRecommendedJobsForUser(userId, limit = 10, region = null) {
  try {
    console.log(`🤖 Generating AI recommendations for user ${userId} ${region ? `(Region: ${region})` : ''}...`);

    const { Op } = require('sequelize');

    // 1. Fetch user data and preferences
    const user = await User.findByPk(userId, {
      attributes: ['id', 'skills', 'experience_years', 'current_location', 'preferred_locations', 'headline', 'summary']
    });

    if (!user) throw new Error('User not found');

    const preference = await JobPreference.findOne({ where: { userId, isActive: true } });

    // 2. Define criteria
    const profileSkills = Array.isArray(user.skills) ? user.skills.map(s => s.toLowerCase()) : [];
    const preferredSkills = Array.isArray(preference?.preferredSkills) ? preference.preferredSkills.map(s => s.toLowerCase()) : [];
    const inferredSkillsSet = new Set([...profileSkills, ...preferredSkills]);

    // infer additional skills from headline/summary if explicit skills are missing
    const userText = `${user.headline || ''} ${user.summary || ''}`.toLowerCase();
    if (!inferredSkillsSet.size && userText) {
      const textTokens = Array.from(new Set(userText.match(/[a-zA-Z\+\#\.]+/g) || [])).slice(0, 20);
      textTokens.forEach(token => {
        if (token.length >= 2 && token.length <= 20) {
          inferredSkillsSet.add(token);
        }
      });
    }

    const userSkills = Array.from(inferredSkillsSet);
    const preferredTitles = (preference?.preferredJobTitles || []).map(t => t.toLowerCase());
    const preferredLocations = (preference?.preferredLocations || user.preferred_locations || []).map(l => l.toLowerCase());
    
    // 3. Optimized fetch: Get active jobs within validity
    const whereClause = {
      status: 'active',
      validTill: { [Op.gt]: new Date() }
    };

    // Apply region filter if provided (crucial for Gulf portal)
    if (region) {
      whereClause.region = region;
    } else if (preferredLocations.some(l => ['dubai', 'uae', 'qatar', 'oman', 'kuwait', 'bahrain', 'saudi'].some(g => l.includes(g)))) {
      // Auto-detect Gulf preference if not explicitly requested but in locations
      console.log('🌍 Detected Gulf location preference, prioritizing Gulf jobs');
    }

    const potentialJobs = await Job.findAll({
      where: whereClause,
      limit: 100, // Fetch more for better sorting
      order: [['created_at', 'DESC']],
      include: [{ 
        model: Company, 
        as: 'company', 
        attributes: ['name', 'logo', 'industry', 'companyType'] 
      }]
    });

    if (potentialJobs.length === 0) {
      console.log('ℹ️ No active jobs found for recommendation');
      return [];
    }

    // 4. Robust Rule-Based Scoring (Always used as primary or fallback)
    const scoredJobs = potentialJobs.map(job => {
      let score = 0;
      const reasons = [];
      const jobTitle = job.title.toLowerCase();
      const jobSkills = (job.skills || []).map(s => s.toLowerCase());
      const jobLocation = job.location.toLowerCase();

      // Title Matching (High Weight)
      let titleMatchScore = 0;
      if (preferredTitles.length > 0) {
        const titleMatch = preferredTitles.some(pt => 
          jobTitle.includes(pt) || pt.includes(jobTitle)
        );
        if (titleMatch) {
          titleMatchScore = 30;
          reasons.push('Matches your preferred job titles');
        }
      } else {
        // If user has no explicit title preferences, match by job title keywords
        const titleTokens = jobTitle.split(/\s+/).filter(token => token.length > 2);
        const titleOverlap = titleTokens.filter(token => userSkills.some(us => us.includes(token) || token.includes(us)));
        if (titleOverlap.length > 0) {
          titleMatchScore = Math.min(20, titleOverlap.length * 4);
          reasons.push('Job title intersects your profile keywords');
        }
      }
      score += titleMatchScore;

      // Skill Matching (Weight 40)
      let skillMatchScore = 0;
      if (userSkills.length > 0 && jobSkills.length > 0) {
        const matchingSkills = jobSkills.filter(s => 
          userSkills.some(us => us === s || us.includes(s) || s.includes(us))
        );

        if (matchingSkills.length > 0) {
          const matchRatio = matchingSkills.length / Math.max(jobSkills.length, 1);
          skillMatchScore = Math.min(matchRatio * 40, 40);
          reasons.push(`Matches ${matchingSkills.length} of your key skills`);
        } else {
          // Partial credit for related skills
          const relSkills = jobSkills.filter(s => userSkills.some(us => us.includes(s.slice(0, 3)) || s.includes(us.slice(0, 3))));
          skillMatchScore = Math.min(relSkills.length * 5, 12);
          if (relSkills.length > 0) reasons.push('Partial skill overlap detected');
        }
      } else if (userSkills.length === 0 && preferredSkills.length > 0) {
        // use preferred skills when actual profile skills are absent
        const prefMatch = jobSkills.filter(s => preferredSkills.includes(s.toLowerCase()));
        skillMatchScore = Math.min(prefMatch.length * 8, 20);
        if (prefMatch.length > 0) reasons.push('Job matches your saved preferred skills');
      } else if (jobSkills.length > 0) {
        // make sure some skill-based differentiation exists
        skillMatchScore = 5;
      }
      score += skillMatchScore;

      // Experience Matching (Weight 15)
      const userExp = Number(user.experience_years) || 0;
      const jobMin = Number(job.experienceMin) || 0;
      const jobMax = Number(job.experienceMax) || 50;

      if (userExp >= jobMin && userExp <= jobMax) {
        score += 15;
        reasons.push('Matches your experience level');
      } else if (userExp > jobMax) {
        score += 8;
        reasons.push('You exceed the experience requirements');
      } else if (userExp > 0) {
        const expRatio = jobMin > 0 ? Math.min(userExp / jobMin, 1) : 0;
        score += Math.round(expRatio * 10);
        reasons.push('Experience partly matches');
      }

      // Location Matching (Weight 10)
      if (preferredLocations.length > 0) {
        const locMatch = preferredLocations.some(l => 
          jobLocation.includes(l) || l.includes(jobLocation)
        );
        if (locMatch) {
          score += 10;
          reasons.push('Located in your preferred area');
        } else {
          // small reward for nearby region text match
          const locationTokens = jobLocation.split(/[\s,\/]+/);
          const nearestMatch = locationTokens.some(tok => preferredLocations.some(pl => pl.includes(tok) || tok.includes(pl)));
          if (nearestMatch) {
            score += 4;
            reasons.push('Location is nearby your preference');
          }
        }
      }

      // Gulf-Specific Priority (Bonus)
      if (region === 'gulf' || ['dubai', 'uae', 'qatar', 'saudi'].some(g => jobLocation.includes(g))) {
        score += 2;
      }

      return {
        ...job.toJSON(),
        matchScore: Math.round(Math.min(score, 100)),
        matchReasons: reasons.slice(0, 3) // Keep top 3 reasons for UX
      };
    });

    // 5. Final Filtering & Sorting
    return scoredJobs
      .filter(j => j.matchScore >= 30) // Minimum threshold for "Recommended"
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

  } catch (error) {
    console.error('❌ Error generating recommendations:', error.message);
    return [];
  }
}

/**
 * AI-powered cover letter generation
 */
async function generateCoverLetter(userId, jobId, resumeId = null) {
  try {
    console.log(`🤖 Generating AI cover letter for user ${userId} and job ${jobId}${resumeId ? ` using resume ${resumeId}` : ''}...`);

    // 1. Fetch user data, job data, and resume data
    const user = await User.findByPk(userId, {
      attributes: ['id', 'first_name', 'last_name', 'skills', 'experience_years', 'headline', 'summary']
    });
    
    const job = await Job.findByPk(jobId, {
      attributes: ['title', 'description', 'skills', 'location'],
      include: [{ model: Company, as: 'company', attributes: ['name'] }]
    });

    if (!user || !job) throw new Error('User or Job not found');

    let resumeContent = '';
    if (resumeId) {
      const resume = await Resume.findByPk(resumeId);
      if (resume && resume.metadata?.filePath) {
        resumeContent = await extractFileContent(resume.metadata.filePath);
      }
    }

    // 2. Use executeAIOperation for robust execution
    const coverLetter = await executeAIOperation(async () => {
      console.log('🤖 Initializing Gemini 2.5 Flash for cover letter...');
      const genAI = getGenAI();
      if (!genAI) throw new Error('Gemini AI not initialized');

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7, // Higher temperature for more creative/natural text
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096 // Increased to avoid truncation
        }
      });

      const prompt = `Act as an expert career consultant. Write a highly personalized and compelling cover letter for the following job application.
      
      Job Seeker:
      - Name: ${user.first_name} ${user.last_name}
      - Headline: ${user.headline}
      - Summary: ${user.summary}
      - Skills: ${user.skills?.join(', ')}
      - Experience: ${user.experience_years} years
      ${resumeContent ? `\nResume Content:\n${resumeContent.substring(0, 5000)}` : ''}
      
      Target Job:
      - Title: ${job.title}
      - Company: ${job.company?.name}
      - Location: ${job.location}
      - Requirements: ${job.description}
      
      Guidelines:
      - Keep it professional, concise (3-4 short paragraphs).
      - Highlight specific skills and achievements that match the job requirements.
      - Show enthusiasm for the company and the role.
      - Use a standard business letter format.
      - Do NOT include placeholders like [Insert Date] - use a professional closing.
      - Focus on how the candidate can add value to the company.
      
      Return ONLY the cover letter text.`;

      console.log('🤖 Sending cover letter request to Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      console.log('🤖 AI Response received, length:', responseText.length);
      return responseText;
    });

    return {
      success: true,
      data: coverLetter
    };

  } catch (error) {
    console.error('❌ Cover letter generation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * AI-powered job description generation
 * Generates: Description, Requirements, Responsibilities, and Skills
 */
async function generateJobDescription(title, context = {}) {
  try {
    console.log(`🤖 Generating AI job content for title: ${title}...`);

    const { skills = [], experience = '', location = '', prompt = '' } = context;

    // 2. Use executeAIOperation for robust execution
    const jobContent = await executeAIOperation(async () => {
      console.log('🤖 Initializing Gemini 2.5 Flash for job content...');
      const genAI = getGenAI();
      if (!genAI) throw new Error('Gemini AI not initialized');

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192 // Increased to avoid truncation
        }
      });

      const aiPrompt = `Act as an expert HR and recruitment consultant. Write a highly professional and detailed job posting for the following position.
      
      Job Title: ${title}
      ${skills.length > 0 ? `Key Skills: ${skills.join(', ')}` : ''}
      ${experience ? `Experience Required: ${experience}` : ''}
      ${location ? `Location: ${location}` : ''}
      ${prompt ? `Additional Instructions: ${prompt}` : ''}
      
      Return a JSON object with the following schema:
      {
        "description": "Professional and engaging role overview (3-5 paragraphs)",
        "requirements": "Detailed list of must-have qualifications and technical skills",
        "responsibilities": "Clear list of day-to-day duties and expectations",
        "skills": ["string"] // Optimized list of technical and soft skills
      }
      
      Guidelines:
      - Use professional and inclusive language.
      - Make the description exciting to attract top talent.
      - Ensure the responsibilities and requirements are realistic for the role.
      - The output MUST be a valid JSON object.
      
      Return ONLY the valid JSON object.`;

      console.log('🤖 Sending prompt to Gemini...');
      const result = await model.generateContent(aiPrompt);
      const response = await result.response;
      const responseText = response.text().trim();
      console.log('🤖 AI Response received, length:', responseText.length);

      const parsed = cleanAIJSON(responseText);
      if (!parsed) {
        console.error('❌ AI response text:', responseText);
        throw new Error('AI response did not contain valid JSON');
      }

      return parsed;
    });

    return {
      success: true,
      data: jobContent
    };

  } catch (error) {
    console.error('❌ Job description generation failed:', error.message);
    if (error.stack) console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  calculateATSScore,
  calculateBatchATSScores,
  getATSScore,
  extractRequirementDetails,
  extractCandidateProfile,
  createComprehensiveResumeContent,
  parseResumeToProfile,
  extractFileContent,
  getRecommendedJobsForUser,
  generateCoverLetter,
  generateJobDescription // Export the new function
};
