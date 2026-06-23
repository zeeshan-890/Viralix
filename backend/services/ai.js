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

function fallbackInboxSuggestions({ participantName, lastMessage, tone, signOff }) {
    const name = (participantName || 'there').split(' ')[0];
    const topic = lastMessage || 'your message';
    const templates = {
        friendly: [
            `Hey ${name}! Thanks for reaching out 😊 ${topic.includes('?') ? 'Great question — ' : ''}I'd love to help you get started.`,
            `Hi ${name}! So glad you wrote in. Let me know what you need and I'll point you in the right direction!`,
        ],
        professional: [
            `Hello ${name}, thank you for your message. Regarding "${topic.slice(0, 60)}${topic.length > 60 ? '…' : ''}" — we'd be happy to assist.`,
            `Hi ${name}, we appreciate you contacting us. A team member will follow up shortly with more details.`,
        ],
        concise: [
            `Hi ${name}! Happy to help. What can I assist you with today?`,
            `Thanks ${name}! Let me know which platform you're looking to connect first.`,
        ],
        empathetic: [
            `Hi ${name}, I'm sorry you're running into this. Let's get it sorted — can you share a few more details?`,
            `${name}, I understand the frustration. We're here to help and will make this right.`,
        ],
    };
    const list = templates[tone] || templates.friendly;
    return list.map((text, i) => ({
        id: `sug-${i}`,
        text: signOff ? `${text}\n\n${signOff}` : text,
        tone,
        confidence: 0.88 - i * 0.04,
    }));
}

async function suggestInboxReply({
    participantName,
    lastMessage,
    tone = 'friendly',
    includeContext = true,
    signOff = ''
}) {
    const name = (participantName || 'there').split(' ')[0];
    const topic = lastMessage || 'your message';

    try {
        const contextLine = includeContext
            ? `Their last message: "${topic.replace(/"/g, '\\"')}"`
            : 'Generate general helpful replies.';
        const prompt = `You are a social media customer support agent.
Generate exactly 2 short reply suggestions in a ${tone} tone for an inbox conversation.
Participant first name: ${name}
${contextLine}
Rules:
- Keep each reply under 3 sentences
- Be helpful and human
- No hashtags
Return ONLY valid JSON array: [{"text":"..."},{"text":"..."}]`;

        const raw = await generateText({ prompt });
        const cleaned = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
        let parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) parsed = parsed.suggestions || [];

        const suggestions = parsed
            .filter((s) => s?.text)
            .slice(0, 2)
            .map((s, i) => ({
                id: `sug-${i}`,
                text: signOff ? `${s.text.trim()}\n\n${signOff}` : s.text.trim(),
                tone,
                confidence: 0.9 - i * 0.05,
            }));

        if (suggestions.length > 0) return suggestions;
    } catch (e) {
        console.warn('[AI] Inbox suggest fallback:', e.message);
    }

    return fallbackInboxSuggestions({ participantName, lastMessage, tone, signOff });
}

module.exports = {
    generateText,
    suggestCaption,
    suggestHashtags,
    rewriteText,
    analyzeSentiment,
    remixContent,
    suggestInboxReply,
    fallbackInboxSuggestions,
};

