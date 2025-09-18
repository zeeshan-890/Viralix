'use client';
import { useState } from 'react';
export default function ResponseTemplates() {
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const templates = [
        {
            id: 'thank-you',
            name: 'Thank You',
            content: 'Thank you for your comment! I really appreciate your feedback. 😊'
        },
        {
            id: 'question-response',
            name: 'Question Response',
            content: 'Great question! I\'ll be covering this topic in my upcoming content. Stay tuned! 🚀'
        },
        {
            id: 'collaboration',
            name: 'Collaboration Inquiry',
            content: 'Hi! Thanks for reaching out. I\'d love to discuss potential collaboration opportunities. Please send me a DM with more details!'
        },
        {
            id: 'appreciation',
            name: 'Appreciation',
            content: 'Your support means the world to me! Thank you for being part of this amazing community! ❤️'
        },
        {
            id: 'tutorial-request',
            name: 'Tutorial Request',
            content: 'Thanks for the suggestion! I\'ll add this to my content ideas list. Keep an eye out for future tutorials!'
        }
    ];
    const handleTemplateSelect = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setCustomMessage(template.content);
        }
    };
    return (<div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Response Templates</h3>

            <div className="space-y-3 mb-4">
                {templates.map((template) => (<button key={template.id} onClick={() => handleTemplateSelect(template.id)} className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-600 mt-1 truncate">{template.content}</div>
                    </button>))}
            </div>

            <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customize Message
                </label>
                <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={4} placeholder="Type your response here..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"/>

                <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-500">
                        {customMessage.length}/280 characters
                    </span>
                    <div className="flex space-x-2">
                        <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                            Save Template
                        </button>
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                            Send Response
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-3">AI Suggestions</h4>
                <div className="space-y-2">
                    <button className="w-full text-left p-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                        <div className="text-sm font-medium text-purple-900">✨ Generate AI Response</div>
                        <div className="text-xs text-purple-700">Based on comment sentiment and context</div>
                    </button>
                    <button className="w-full text-left p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <div className="text-sm font-medium text-green-900">🎯 Suggest Call-to-Action</div>
                        <div className="text-xs text-green-700">Add engagement-driving CTAs</div>
                    </button>
                </div>
            </div>
        </div>);
}
