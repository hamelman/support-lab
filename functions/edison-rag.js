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
