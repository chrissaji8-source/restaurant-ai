const axios = require('axios');
require('dotenv').config();

async function generateDailyInsights(restaurantProfile, weather, events, predictedRevenue) {
  try {
    const systemPrompt = "You are a marketing advisor for local Indian restaurants. Always respond in valid JSON only. No extra text.";
    
    const userPrompt = `
      Restaurant Name: ${restaurantProfile.name}
      City: ${restaurantProfile.city}
      Cuisine Type: ${restaurantProfile.cuisine_type}
      Day of Week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}
      Weather: ${weather ? weather.description : 'Unknown'}, Temp: ${weather ? weather.temp : 'Unknown'}°C
      Local Events: ${JSON.stringify(events)}
      Predicted Revenue: ₹${predictedRevenue || 0}
      
      Generate daily insights.
      Returns JSON with exact keys:
      {
        "instagram_caption": "string",
        "whatsapp_message": "string",
        "menu_tip": "string",
        "hashtags": ["string1", "string2", "string3", "string4", "string5"],
        "confidence_score": 0.85
      }
    `;

    // If API key is missing or mock, return mock data
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'mock') {
        throw new Error('No Anthropic API key found');
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const jsonText = response.data.content[0].text;
    const parsed = JSON.parse(jsonText);
    return {
      instagram_caption: parsed.instagram_caption || '',
      whatsapp_message: parsed.whatsapp_message || '',
      menu_tip: parsed.menu_tip || '',
      hashtags: parsed.hashtags || [],
      confidence_score: parsed.confidence_score || 0.8
    };

  } catch (error) {
    console.error('Claude API Error:', error.message);
    // Return fallback JSON
    return {
      instagram_caption: "Ready for a delicious meal? Visit us today! 🍛✨",
      whatsapp_message: "Hello! We are open and ready to serve your favorite dishes today.",
      menu_tip: "Feature your popular signature dish today.",
      hashtags: ["#foodie", "#restaurant", "#delicious", "#indianfood", "#foodlover"],
      confidence_score: 0.5
    };
  }
}

module.exports = { generateDailyInsights };
