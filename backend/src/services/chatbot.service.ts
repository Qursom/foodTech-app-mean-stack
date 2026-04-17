import { GoogleGenerativeAI } from '@google/generative-ai';
import { FoodModel, Food } from '../models/food.model';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const BASE_INSTRUCTIONS =
    'You are the customer support assistant for FoodTech, an online food ordering website. ' +
    'You MUST answer menu / food / price / availability questions using ONLY the data in the "FoodTech Menu" section below. ' +
    'Do NOT invent dishes, prices, cook times, or ratings. ' +
    'If a user asks for something that is not on the menu, say it is not currently available on FoodTech and suggest the closest items from the menu. ' +
    'When listing foods, include the name, price (in the site\'s currency), rating (stars), tags, and cook time when useful. ' +
    'For questions about ordering, payment, delivery, tracking, or account — answer helpfully and concisely without inventing policies. ' +
    'Keep answers short and friendly; use bullet points when listing multiple items.';

let cachedMenuText: string | null = null;
let cachedAt = 0;
const MENU_CACHE_MS = 60 * 1000;

const buildMenuText = (foods: Food[]): string => {
    if (!foods.length) return 'No foods are currently available in the database.';
    const lines = foods.map(f => {
        const tags = f.tags && f.tags.length ? f.tags.join(', ') : 'none';
        const origins = f.origins && f.origins.length ? f.origins.join(', ') : 'unknown';
        return `- ${f.name} | price: ${f.price} | stars: ${f.stars} | cookTime: ${f.cookTime} | tags: ${tags} | origins: ${origins}`;
    });
    return lines.join('\n');
};

const getMenuText = async (): Promise<string> => {
    const now = Date.now();
    if (cachedMenuText && now - cachedAt < MENU_CACHE_MS) {
        return cachedMenuText;
    }
    try {
        const foods = await FoodModel.find().lean<Food[]>();
        cachedMenuText = buildMenuText(foods);
        cachedAt = now;
        return cachedMenuText;
    } catch (err) {
        console.error('Failed to load menu for chatbot:', err);
        return cachedMenuText || 'Menu is temporarily unavailable.';
    }
};

const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const isTransient = (err: any) => {
    const status = err?.status;
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

export const generateResponse = async (message: string, history: any[]) => {
    try {
        const menuText = await getMenuText();

        const systemInstruction =
            BASE_INSTRUCTIONS +
            '\n\n=== FoodTech Menu (source of truth) ===\n' +
            menuText +
            '\n=== End of Menu ===';

        const cleanHistory = (history || [])
            .filter(h => h && typeof h.text === 'string' && h.text.trim().length > 0)
            .map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }],
            }));

        const firstUserIdx = cleanHistory.findIndex(h => h.role === 'user');
        const safeHistory = firstUserIdx === -1 ? [] : cleanHistory.slice(firstUserIdx);

        let lastErr: any = null;
        for (const modelName of MODEL_CANDIDATES) {
            const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const chat = model.startChat({ history: safeHistory });
                    const result = await chat.sendMessage(message);
                    return result.response.text();
                } catch (err: any) {
                    lastErr = err;
                    if (!isTransient(err)) break;
                    await sleep(500 * Math.pow(2, attempt));
                }
            }
            if (!isTransient(lastErr)) break;
        }

        console.error('Error generating response:', lastErr);
        return 'Sorry, our assistant is briefly unavailable. Please try again in a moment.';
    } catch (error) {
        console.error('Error generating response:', error);
        return 'Sorry, I am unable to respond right now. Please try again later.';
    }
};
