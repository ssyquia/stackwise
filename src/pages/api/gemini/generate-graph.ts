import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { GEMINI_API_KEY } = process.env;
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const { prompt } = req.body;

    const result = await model.generateContent(`
      Generate a tech stack graph based on the following requirements:
      ${prompt}

      Return the response in JSON format with the following structure:
      {
        "nodes": [
          {
            "id": "unique_id",
            "type": "techNode",
            "position": { "x": number, "y": number },
            "data": {
              "label": "framework_name",
              "type": "frontend|backend|database|custom"
            }
          }
        ],
        "edges": [
          {
            "id": "unique_id",
            "source": "node_id",
            "target": "node_id"
          }
        ]
      }
    `);

    const response = await result.response;
    const text = response.text();
    const graph = JSON.parse(text);

    return res.status(200).json(graph);
  } catch (error) {
    console.error('Error generating graph:', error);
    return res.status(500).json({ message: 'Failed to generate graph' });
  }
} 