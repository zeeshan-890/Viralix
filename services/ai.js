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

async function analyzeSentiment(commentText) {
    const prompt = `You are a sentiment analysis expert for social media.
Analyze this social media comment and return ONLY valid JSON (no markdown, no code blocks):
{
  "label": "positive" or "negative" or "neutral",
  "confidence": a number between 0.0 and 1.0,
  "isToxic": true or false (is the comment hateful, abusive, or harmful?),
  "isUrgent": true or false (does the commenter need immediate attention, e.g. complaint, crisis?)
}

Comment: "${commentText.replace(/"/g, '\\"')}"`;

    try {
        const raw = await generateText({ prompt });
        // Clean potential markdown code block wrapping
        const cleaned = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('[AI] Sentiment parse error:', e.message);
        return { label: 'neutral', confidence: 0, isToxic: false, isUrgent: false };
    }
}

async function remixContent({ content, hashtags = [], tone = 'fresh', platform = 'instagram' }) {
    const prompt = `You are a top-tier social media strategist.
Remix this old post for ${platform} in a ${tone} tone.
Make it feel completely new while keeping the core message.
Return ONLY valid JSON (no markdown, no code blocks):
{
  "caption": "the new remixed caption (2-3 punchy lines)",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

ORIGINAL POST:
${content}

ORIGINAL HASHTAGS: ${hashtags.length > 0 ? hashtags.join(', ') : 'none'}`;

    try {
        const raw = await generateText({ prompt });
        const cleaned = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('[AI] Remix parse error:', e.message);
        return { caption: content, hashtags };
    }
}

module.exports = { generateText, suggestCaption, suggestHashtags, rewriteText, analyzeSentiment, remixContent };

