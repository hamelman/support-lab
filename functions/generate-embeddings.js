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

  let delay = 500; // ms, safe for paid plans

  for (const [index, row] of rows.entries()) {
    try {
      if (row.Embedding && row.Embedding.trim() !== "") {
        console.log(`⏩ Skipped (${index + 1}/${rows.length}): ${row.Keywords}`);
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

      console.log(`✅ (${index + 1}/${rows.length}) Embedded: ${row.Keywords}`);
      await sleep(delay);

    } catch (err) {
      const status = err.response?.status || err.message;
      console.error(`❌ Failed on: ${row.Keywords} — ${status}`);

      if (err.response?.status === 429) {
        console.log("⚠️ Rate limited — backing off to 10s...");
        await sleep(10000); // bigger pause on rate limit
      } else {
        await sleep(3000); // pause a little anyway
      }
    }
  }

  console.log("✅ All embeddings generated.");
}

generateEmbeddings().catch(console.error);
