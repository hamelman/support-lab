const axios = require("axios");
require("dotenv").config(); // Safe to call — no effect on Netlify

// 🧠 Cosine similarity helper
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

exports.handler = async function (event, context) {
  try {
    const query = event.queryStringParameters.q;
    if (!query) {
      return {
        statusCode: 400,
        body: "Missing query parameter `q`.",
      };
    }

    // 📄 Load spreadsheet data
    const { GoogleSpreadsheet } = require("google-spreadsheet");
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["Keywords"];
    const rows = await sheet.getRows();

    const qaPairs = rows.map((row) => ({
      keywords: row.Keywords,
      response: row.Response,
    }));

    // 1️⃣ Embed the user query
    const embedQueryRes = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        input: query,
        model: "text-embedding-ada-002",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const userEmbedding = embedQueryRes.data.data[0].embedding;

    // 2️⃣ Score each entry
    const scored = await Promise.all(
      qaPairs.map(async (pair) => {
        const embedRowRes = await axios.post(
          "https://api.openai.com/v1/embeddings",
          {
            input: pair.keywords,
            model: "text-embedding-ada-002",
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        const keywordEmbedding = embedRowRes.data.data[0].embedding;
        const score = cosineSimilarity(userEmbedding, keywordEmbedding);
        return { ...pair, score };
      })
    );

    // 3️⃣ Return best match
    const best = scored.sort((a, b) => b.score - a.score)[0];
    return {
      statusCode: 200,
      body: best.response,
    };
  } catch (error) {
    console.error("Edison error:", error);
    return {
      statusCode: 500,
      body: "Something went wrong: " + error.message,
    };
  }
};
