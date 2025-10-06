const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');

function getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    const genAI = new GoogleGenerativeAI(apiKey, { fetch });
    return genAI;
}

async function generateText({ prompt, model = 'gemini-2.5-flash' }) {
    const genAI = getClient();
    const m = genAI.getGenerativeModel({ model });
    const res = await m.generateContent(prompt);
    const txt = res?.response?.text?.() || res?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return txt.trim();
}

async function suggestCaption({ topic, tone = 'engaging', platform = 'instagram' }) {
    const prompt = `You are a top-tier social media copywriter.
Task: Write a ${tone} ${platform} caption about: ${topic}
Rules:
- Output 2 to 3 short lines (not a paragraph)
- Make it punchy, scroll-stopping, and specific
- Keep each line concise (<= 12 words)
- No hashtags or @mentions
- Prefer verbs, benefits, and curiosity; avoid fluff
- Optional last line: a light CTA
Return only the caption text with line breaks.`;
    return generateText({ prompt });
}

async function suggestHashtags({ topic, platform = 'instagram', count = 10 }) {
    const prompt = `Suggest ${count} ${platform} hashtags for: ${topic}. Return as a comma-separated list without the # symbol.`;
    const out = await generateText({ prompt });
    return out.split(/[,\n]/).map(s => s.replace(/[#]/g, '').trim()).filter(Boolean).slice(0, count);
}

async function rewriteText({ text, tone = 'concise', platform = 'instagram' }) {
    const prompt = `Rewrite the following text for ${platform} in a ${tone} tone. Keep structure and meaning, improve clarity and engagement.\n\nTEXT:\n${text}`;
    return generateText({ prompt });
}

module.exports = { suggestCaption, suggestHashtags, rewriteText };
