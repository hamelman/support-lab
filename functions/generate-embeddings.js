const { GoogleSpreadsheet } = require("google-spreadsheet");
const axios = require("axios");
require("dotenv").config();

async function generateEmbeddings() {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });

  await doc.loadInfo();
  const sheet = doc.sheetsByTitle["Keywords"];
  const rows = await sheet.getRows();

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  for (const row of rows) {
    try {
      if (row.Embedding && row.Embedding.trim() !== "") {
        console.log(`⏩ Skipped (already embedded): ${row.Keywords}`);
        continue;
      }

      const res = await axios.post(
        "https://api.openai.com/v1/embeddings",
        {
          model: "text-embedding-ada-002",
          input: row.Keywords,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const embedding = res.data.data[0].embedding;
      row.Embedding = JSON.stringify(embedding);
      await row.save();

      console.log(`✅ Embedded: ${row.Keywords}`);
      await sleep(4000); // safe delay between requests

    } catch (err) {
      console.error(`❌ Failed on: ${row.Keywords}`, err.response?.status || err.message);

      if (err.response?.status === 429) {
        console.log("⚠️ Rate limited — waiting longer...");
        await sleep(10000); // back off more on rate limit
      } else {
        await sleep(5000); // wait a bit before next attempt anyway
      }
    }
  }

  console.log("✅ Embedding complete.");
}

generateEmbeddings().catch(console.error);
