require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors()); // Enable CORS if frontend and backend are on different origins

// Load API key from environment variable (set in .env file)
const API_TOKEN = process.env.HF_API_TOKEN;

if (!API_TOKEN) {
  console.error('API_TOKEN is not set. Please configure it in a .env file.');
  process.exit(1);
}

const BASE_URL = 'https://api-inference.huggingface.co/models';

// Simple GET handler for root
app.get('/', (req, res) => {
  res.send('AI Image Generator Backend is running');
});

app.post('/generate', async (req, res) => {
  const { prompt, model, count, aspect } = req.body;

  if (!prompt || !model || !count || !aspect) {
    return res.status(400).json({ error: 'Missing required parameters (prompt, model, count, aspect)' });
  }

  console.log('Received request:', { prompt, model, count, aspect }); // Log received data

  // Define aspect ratios with adjusted resolutions
  const aspectRatios = {
    '1:1': { width: 768, height: 768 },
	'9:16': { width: 768, height: 1344 },
    '16:9': { width: 1344, height: 768 } // Reduced to 512x288 to test lower resolution
  };
  const { width, height } = aspectRatios[aspect] || aspectRatios['1:1']; // Default to 1:1 if aspect is invalid

  try {
    const images = [];
    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 1000000);
      const response = await axios.post(
        `${BASE_URL}/${model}`,
        { 
          inputs: prompt,
          parameters: { width, height, seed }, // Use parameters object
          options: { wait_for_model: true }
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            'Accept': 'image/png',
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      if (response.status !== 200) {
        const errorData = Buffer.from(response.data).toString('utf8');
        console.error('Hugging Face API error response (full):', errorData);
        return res.status(400).json({ error: `Hugging Face API error: ${errorData}` });
      }

      // Convert arraybuffer to base64 for JSON response
      const base64Image = Buffer.from(response.data).toString('base64');
      images.push(base64Image);
    }

    res.json({ images }); // Send all images as a JSON array
  } catch (error) {
    console.error('Error generating image:', error.message, error.response?.data);
    res.status(500).json({ error: `Error generating image: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});