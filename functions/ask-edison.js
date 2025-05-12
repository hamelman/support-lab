const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

exports.handler = async function(event, context) {
  try {
    const query = (event.queryStringParameters.q || '').toLowerCase();
    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing query parameter' }),
      };
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // Simple keyword match ranking
    let bestMatch = { score: 0, answer: "🤖 I couldn't find a good answer for that, but Sean is always updating me!" };

    rows.forEach(row => {
      const keywords = (row.Keywords || '').toLowerCase().split(',').map(k => k.trim());
      const score = keywords.reduce((acc, keyword) => acc + (query.includes(keyword) ? 1 : 0), 0);
      if (score > bestMatch.score) {
        bestMatch = { score, answer: row.Response };
      }
    });

    return {
      statusCode: 200,
      body: bestMatch.answer,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
