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
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

    await doc.authenticate({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["Keywords"];
    const rows = await sheet.getRows();

    const qaPairs = rows.map((row) => ({
      keywords: row.Keywords,
      response: row.Response,
    }));

    return {
      statusCode: 200,
      body: `Loaded ${qaPairs.length} Q&A entries. First: "${qaPairs[0].keywords}" → "${qaPairs[0].response}"`,
    };

  } catch (error) {
    console.error("Edison error:", error);
    return {
      statusCode: 500,
      body: "Something went wrong: " + error.message,
    };
  }
};
