const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API KEY found in .env");
    return;
  }
  console.log("Using API Key:", apiKey.substring(0, 10) + "...");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    console.log(`Using model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    // There isn't a direct "listModels" on the client instance in the Node SDK easily accessible 
    // without using the model manager, but let's try a simple generation to see the specific error 
    // or if we can access the model.
    
    // Actually, to list models we might need to use the REST API directly if the SDK doesn't expose it easily 
    // or check the error message carefully.
    // But let's try to run a simple text generation to see if the model exists for text at least.
    
    console.log("Testing gemini-1.5-flash...");
    const result = await model.generateContent("Hello");
    console.log("Success!", result.response.text());
  } catch (error) {
    console.error("Error with gemini-1.5-flash:", error.message);
  }

  try {
    console.log("Testing gemini-1.5-flash...");
    const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result2 = await model2.generateContent("Hello");
    console.log("Success!", result2.response.text());
  } catch (error) {
    console.error("Error with gemini-1.5-flash:", error.message);
  }
  
  try {
    console.log("Testing gemini-pro...");
    const model3 = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result3 = await model3.generateContent("Hello");
    console.log("Success!", result3.response.text());
  } catch (error) {
    console.error("Error with gemini-pro:", error.message);
  }
}

listModels();
