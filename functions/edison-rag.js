const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config(); // Safe to call — has no effect on Netlify

exports.handler = async function (event, context) {
  try {
    const query = event.queryStringParameters.q;
    if (!query) {
      return {
        statusCode: 400,
        body: "Missing query parameter `q`.",
      };
    }
    const { GoogleSpreadsheet } = require("google-spreadsheet");

// Setup Google Sheets access
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

await doc.useServiceAccountAuth({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
});

await doc.loadInfo(); // Load sheet info
const sheet = doc.sheetsByTitle["Keywords"]; // Tab name
const rows = await sheet.getRows();

// Extract keywords and responses
const qaPairs = rows.map((row) => ({
  keywords: row.Keywords,
  response: row.Response,
}));

// For now, return the first one to test
return {
  statusCode: 200,
  body: `Loaded ${qaPairs.length} Q&A entries. First: "${qaPairs[0].keywords}" → "${qaPairs[0].response}"`,
};

    // Placeholder until next step
    return {
      statusCode: 200,
      body: `You asked: "${query}". Edison is thinking...`,
    };
  } catch (error) {
    console.error("Edison error:", error);
    return {
      statusCode: 500,
      body: "Something went wrong: " + error.message,
    };
  }
};
