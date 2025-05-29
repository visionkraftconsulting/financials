// routes/openai.js
import express from 'express';
const router = express.Router();
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/validate-company', async (req, res) => {
  const { name, ticker } = req.body;
  const prompt = `Determine if "${name}" is a valid company name and not just a ticker symbol like "${ticker}". Reply with "Valid" or "Invalid".`;
  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 10,
      temperature: 0,
    });
    const text = response.data.choices[0].text.trim().toLowerCase();
    res.json({ valid: text === 'valid' });
  } catch (err) {
    console.error('OpenAI validation error:', err.message);
    res.status(500).json({ error: 'OpenAI validation failed' });
  }
});

const openaiRoutes = router;
export { openaiRoutes };