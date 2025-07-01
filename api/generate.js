const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model, count, aspect } = req.body;

  if (!prompt || !model || !count || !aspect) {
    return res.status(400).json({ error: 'Missing required parameters (prompt, model, count, aspect)' });
  }

  console.log('Received request:', { prompt, model, count, aspect });

  const aspectRatios = {
    '1:1': { width: 768, height: 768 },
    '9:16': { width: 768, height: 1344 },
    '16:9': { width: 1344, height: 768 }
  };
  const { width, height } = aspectRatios[aspect] || aspectRatios['1:1'];

  try {
    const images = [];
    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 1000000);
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: prompt,
          parameters: { width, height, seed },
          options: { wait_for_model: true }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
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

      const base64Image = Buffer.from(response.data).toString('base64');
      images.push(base64Image);
    }

    res.status(200).json({ images });
  } catch (error) {
    console.error('Error generating image:', error.message, error.response?.data);
    res.status(500).json({ error: `Error generating image: ${error.message}` });
  }
};
