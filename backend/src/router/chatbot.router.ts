import { Router } from 'express';

import { generateResponse } from '../services/chatbot.service';

const router = Router();

router.post('/send-message', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await generateResponse(message, history || []);
        res.json({ response });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;