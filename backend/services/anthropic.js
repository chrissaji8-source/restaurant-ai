const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const generateCampaign = async (platform, type, tone, contextDetails, weatherData, eventsData) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key is not configured.');
  }

  const systemPrompt = `You are an expert restaurant marketing AI.
Generate a marketing campaign for a restaurant based on the following context:
Platform: ${platform}
Type of Post: ${type}
Tone: ${tone}
Additional Context: ${contextDetails}
Current Weather: ${JSON.stringify(weatherData)}
Local Events: ${JSON.stringify(eventsData)}

Your response MUST be in raw JSON format with exactly these keys:
- "caption": The main text/copy for the post or message. Use appropriate formatting and emojis for the platform.
- "hashtags": An array of 3-5 relevant strings (without the # symbol).
- "bestTime": A short string recommending the best time to post today (e.g., "Post at 5:30 PM for maximum dinner rush reach"). Choose a smart time based on the meal type or standard best practices.

Do NOT wrap the JSON in markdown code blocks. Just output the raw JSON object.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: 'Generate the campaign now.'
      }
    ]
  });

  const responseText = response.content[0].text.trim();
  try {
    return JSON.parse(responseText);
  } catch (error) {
    // Fallback if Claude adds markdown blocks
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Failed to parse AI response into JSON');
  }
};

module.exports = {
  generateCampaign
};
