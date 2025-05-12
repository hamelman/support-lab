const axios = require("axios");
require("dotenv").config(); // Safe to call — has no effect on Netlify

// 🧠 Cosine similarity function
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

    // 1. Embed the user query
    const userEmbeddingRes = await axios.post(
      "https://openrouter.ai/api/v1/embeddings",
      {
        model: "text-embedding-ada-002",
        input: query,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      }
    );
    const userEmbedding = userEmbeddingRes.data.data[0].embedding;

    // 2. Embed each keyword set and score
    const scoredPairs = await Promise.all(
      qaPairs.map(async (pair) => {
        const keywordEmbeddingRes = await axios.post(
          "https://openrouter.ai/api/v1/embeddings",
          {
            model: "text-embedding-ada-002",
            input: pair.keywords,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
          }
        );
        const keywordEmbedding = keywordEmbeddingRes.data.data[0].embedding;
        const score = cosineSimilarity(userEmbedding, keywordEmbedding);
        return { ...pair, score };
      })
    );

    // 3. Return best match
    const bestMatch = scoredPairs.sort((a, b) => b.score - a.score)[0];

    return {
      statusCode: 200,
      body: bestMatch.response,
    };

  } catch (error) {
    console.error("Edison error:", error);
    return {
      statusCode: 500,
      body: "Something went wrong: " + error.message,
    };
  }
};
