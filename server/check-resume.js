const { GoogleGenerativeAI } = require("@google/generative-ai");

// Replace with your actual API key
const API_KEY = "YOUR_GEMINI_API_KEY";

async function verifyKey() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  try {
    // We use a lightweight model like gemini-1.5-flash for the test
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("Checking API key...");
    const result = await model.generateContent("Say 'API is working!'");
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Success! Response from Gemini:", text);
  } catch (error) {
    console.error("❌ API Key Error:");
    console.error("Status:", error.status || "Unknown");
    console.error("Message:", error.message);
    
    if (error.message.includes("API_KEY_INVALID")) {
      console.log("Suggestion: Double-check your key in Google AI Studio.");
    }
  }
}

verifyKey();
