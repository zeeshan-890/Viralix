'use client';
import { useState, useEffect } from 'react';
import { tiktokAPI } from '@/lib/api';
import { AlertCircle, CheckCircle2, User, Shield, MessageSquare, Copy, Scissors, Info, Tag, Building2, Handshake } from 'lucide-react';
import Image from 'next/image';

/**
 * TikTokSettings Component
 * Implements all TikTok Content Sharing Guidelines UX requirements
 * 
 * @param {Object} props
 * @param {string} props.accountId - TikTok account ID
 * @param {Object} props.settings - Current TikTok settings state
 * @param {Function} props.onSettingsChange - Callback when settings change
 * @param {boolean} props.isPhotoPost - True if posting photos (disables Duet/Stitch)
 */
export default function TikTokSettings({ accountId, settings, onSettingsChange, isPhotoPost = false }) {
    const [creatorInfo, setCreatorInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch creator info when accountId changes
    useEffect(() => {
        if (!accountId) {
            setCreatorInfo(null);
            setLoading(false);
            return;
        }

        const fetchCreatorInfo = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await tiktokAPI.creatorInfo(accountId);
                setCreatorInfo(response.data);
                // Pass creator info up to parent
                onSettingsChange({ ...settings, creatorInfo: response.data });
            } catch (err) {
                console.error('Failed to fetch creator info:', err);
                setError(err.response?.data?.message || 'Failed to load TikTok account info');
            } finally {
                setLoading(false);
            }
        };

        fetchCreatorInfo();
    }, [accountId]);

    // Handle setting changes
    const handleChange = (field, value) => {
        const newSettings = { ...settings, [field]: value };

        // If branded content is enabled and privacy is SELF_ONLY, auto-switch to PUBLIC
        if (field === 'brandedContent' && value && settings.privacyLevel === 'SELF_ONLY') {
            newSettings.privacyLevel = 'PUBLIC_TO_EVERYONE';
        }

        // If switching to private and branded content is enabled, disable it
        if (field === 'privacyLevel' && value === 'SELF_ONLY' && settings.brandedContent) {
            newSettings.brandedContent = false;
        }

        onSettingsChange(newSettings);
    };

    // Check if publish should be disabled due to commercial content
    const commercialError = settings.commercialDisclosure &&
        !settings.brandOrganic && !settings.brandedContent;

    // Get consent declaration text
    const getConsentText = () => {
        if (settings.brandedContent) {
            return "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation.";
        }
        return "By posting, you agree to TikTok's Music Usage Confirmation.";
    };

    // Get label text for commercial content
    const getLabelText = () => {
        if (settings.brandOrganic && settings.brandedContent) {
            return 'Your photo/video will be labeled as "Paid partnership"';
        }
        if (settings.brandedContent) {
            return 'Your photo/video will be labeled as "Paid partnership"';
        }
        if (settings.brandOrganic) {
            return 'Your photo/video will be labeled as "Promotional content"';
        }
        return null;
    };

    // Privacy level display names
    const privacyLabels = {
        'PUBLIC_TO_EVERYONE': 'Public',
        'MUTUAL_FOLLOW_FRIENDS': 'Friends',
        'FOLLOWER_OF_CREATOR': 'Followers',
        'SELF_ONLY': 'Only Me (Private)'
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-4 bg-pink-100 rounded w-32 animate-pulse mb-2" />
                        <div className="h-3 bg-pink-100 rounded w-48 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800">TikTok Settings Error</p>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!creatorInfo) return null;

    return (
        <div className="space-y-4">
            {/* Creator Info Header */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
                <div className="flex items-center gap-3">
                    {creatorInfo.avatarUrl ? (
                        <img
                            src={creatorInfo.avatarUrl}
                            alt={creatorInfo.creatorNickname}
                            className="w-10 h-10 rounded-full object-cover border-2 border-pink-300"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">{creatorInfo.creatorNickname}</p>
                        <p className="text-xs text-gray-500">Posting to TikTok • @{creatorInfo.accountName}</p>
                    </div>
                    <Image src="/tiktok.png" alt="TikTok" width={24} height={24} className="opacity-60" />
                </div>

                {/* Rate limit warning */}
                {!creatorInfo.canPost && (
                    <div className="mt-3 bg-yellow-100 text-yellow-800 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        You've reached the daily posting limit. Please try again later.
                    </div>
                )}
            </div>

            {/* Privacy Level */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Shield className="w-4 h-4 text-gray-500" />
                    Privacy Level *
                </label>
                <select
                    value={settings.privacyLevel}
                    onChange={(e) => handleChange('privacyLevel', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
                >
                    <option value="">Select privacy level...</option>
                    {(creatorInfo.privacyLevelOptions || []).map(level => (
                        <option
                            key={level}
                            value={level}
                            disabled={level === 'SELF_ONLY' && settings.brandedContent}
                        >
                            {privacyLabels[level] || level}
                            {level === 'SELF_ONLY' && settings.brandedContent ? ' (disabled for branded content)' : ''}
                        </option>
                    ))}
                </select>
                {settings.brandedContent && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Branded content visibility cannot be set to private.
                    </p>
                )}
            </div>

            {/* Interaction Settings */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Interaction Settings
                </p>
                <div className="space-y-3">
                    {/* Allow Comments */}
                    <label className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                        ${creatorInfo.commentDisabled ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' :
                            settings.allowComment ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                    >
                        <input
                            type="checkbox"
                            checked={settings.allowComment && !creatorInfo.commentDisabled}
                            onChange={(e) => handleChange('allowComment', e.target.checked)}
                            disabled={creatorInfo.commentDisabled}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Allow Comments</span>
                        {creatorInfo.commentDisabled && (
                            <span className="text-xs text-gray-500 ml-auto">(Disabled in app settings)</span>
                        )}
                    </label>

                    {/* Allow Duet - hidden for photos */}
                    {!isPhotoPost && (
                        <label className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                            ${creatorInfo.duetDisabled ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' :
                                settings.allowDuet ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                        >
                            <input
                                type="checkbox"
                                checked={settings.allowDuet && !creatorInfo.duetDisabled}
                                onChange={(e) => handleChange('allowDuet', e.target.checked)}
                                disabled={creatorInfo.duetDisabled}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <Copy className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">Allow Duet</span>
                            {creatorInfo.duetDisabled && (
                                <span className="text-xs text-gray-500 ml-auto">(Disabled in app settings)</span>
                            )}
                        </label>
                    )}

                    {/* Allow Stitch - hidden for photos */}
                    {!isPhotoPost && (
                        <label className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                            ${creatorInfo.stitchDisabled ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' :
                                settings.allowStitch ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                        >
                            <input
                                type="checkbox"
                                checked={settings.allowStitch && !creatorInfo.stitchDisabled}
                                onChange={(e) => handleChange('allowStitch', e.target.checked)}
                                disabled={creatorInfo.stitchDisabled}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <Scissors className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">Allow Stitch</span>
                            {creatorInfo.stitchDisabled && (
                                <span className="text-xs text-gray-500 ml-auto">(Disabled in app settings)</span>
                            )}
                        </label>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    These settings are off by default. Enable them to allow others to interact with your video.
                </p>
            </div>

            {/* Commercial Content Disclosure */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Tag className="w-4 h-4 text-gray-500" />
                        Commercial Content Disclosure
                    </p>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.commercialDisclosure}
                            onChange={(e) => handleChange('commercialDisclosure', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                    </label>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    Turn on to indicate this content promotes yourself, a brand, product or service.
                </p>

                {/* Commercial options - shown when toggle is on */}
                {settings.commercialDisclosure && (
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                        {/* Your Brand */}
                        <div>
                            <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
                                ${settings.brandOrganic ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={settings.brandOrganic}
                                    onChange={(e) => handleChange('brandOrganic', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium text-gray-700">Your Brand</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        You are promoting yourself or your own business.
                                    </p>
                                </div>
                            </label>
                            {settings.brandOrganic && (
                                <div className="mt-2 ml-7 px-3 py-2 bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
                                    <Tag className="w-4 h-4 flex-shrink-0" />
                                    Your photo/video will be labeled as "Promotional content"
                                </div>
                            )}
                        </div>

                        {/* Branded Content */}
                        <div>
                            <label
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-all
                                    ${settings.privacyLevel === 'SELF_ONLY'
                                        ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                                        : settings.brandedContent
                                            ? 'bg-purple-50 border-purple-300 cursor-pointer'
                                            : 'bg-gray-50 border-gray-200 hover:border-gray-300 cursor-pointer'}`}
                                title={settings.privacyLevel === 'SELF_ONLY' ? 'Branded content visibility cannot be set to private' : ''}
                            >
                                <input
                                    type="checkbox"
                                    checked={settings.brandedContent}
                                    onChange={(e) => handleChange('brandedContent', e.target.checked)}
                                    disabled={settings.privacyLevel === 'SELF_ONLY'}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 mt-0.5 disabled:opacity-50"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Handshake className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm font-medium text-gray-700">Branded Content</span>
                                        {settings.privacyLevel === 'SELF_ONLY' && (
                                            <span className="text-xs text-red-500 ml-auto">(Disabled for private posts)</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        You are promoting another brand or a third party.
                                    </p>
                                </div>
                            </label>
                            {settings.privacyLevel === 'SELF_ONLY' && (
                                <div className="mt-2 ml-7 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    Branded content visibility cannot be set to private. Change privacy level to enable.
                                </div>
                            )}
                            {settings.brandedContent && settings.privacyLevel !== 'SELF_ONLY' && (
                                <div className="mt-2 ml-7 px-3 py-2 bg-purple-100 border border-purple-200 rounded-lg text-sm text-purple-800 flex items-center gap-2">
                                    <Handshake className="w-4 h-4 flex-shrink-0" />
                                    Your photo/video will be labeled as "Paid partnership"
                                </div>
                            )}
                        </div>

                        {/* Combined label preview when both selected */}
                        {settings.brandOrganic && settings.brandedContent && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 text-purple-800 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
                                <Info className="w-4 h-4 flex-shrink-0" />
                                Your photo/video will be labeled as "Paid partnership" (takes priority over Promotional)
                            </div>
                        )}

                        {/* Error when toggle on but nothing selected */}
                        {commercialError && (
                            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                You need to indicate if your content promotes yourself, a third party, or both.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Consent Declaration */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{getConsentText()}</p>
                </div>
            </div>

            {/* Processing Time Notification - PROMINENT */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Processing Time Notice</p>
                        <p className="text-sm text-blue-700 mt-1">
                            After publishing, it may take <strong>a few minutes</strong> for your content to be processed and become visible on your TikTok profile.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to get TikTok settings validation
 */
export function useTikTokSettingsValidation(settings) {
    const isValid = () => {
        // Privacy must be selected
        if (!settings.privacyLevel) return false;

        // If commercial disclosure is on, at least one option must be selected
        if (settings.commercialDisclosure && !settings.brandOrganic && !settings.brandedContent) {
            return false;
        }

        // Branded content can't be private
        if (settings.brandedContent && settings.privacyLevel === 'SELF_ONLY') {
            return false;
        }

        return true;
    };

    const getErrors = () => {
        const errors = [];
        if (!settings.privacyLevel) {
            errors.push('Please select a privacy level for TikTok');
        }
        if (settings.commercialDisclosure && !settings.brandOrganic && !settings.brandedContent) {
            errors.push('Please select at least one commercial content option');
        }
        if (settings.brandedContent && settings.privacyLevel === 'SELF_ONLY') {
            errors.push('Branded content cannot be set to private');
        }
        return errors;
    };

    return { isValid: isValid(), errors: getErrors() };
}
