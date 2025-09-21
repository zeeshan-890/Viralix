'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AccountSettings() {
    const user = useAuthStore(s => s.user);
    const updateUser = useAuthStore(s => s.updateUser);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: '',
        timezone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setProfileImage(user.profileImage || null);
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setMessage('Image must be less than 10MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setMessage('');

        try {
            const profileData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                bio: formData.bio,
                timezone: formData.timezone,
                profileImage: profileImage
            };
            // Update local store immediately for snappy UX
            updateUser(profileData);
            // Optional: Persist to backend if an endpoint exists
            // await fetch('/api/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileData) });
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage('Failed to update profile. Please try again.');
            console.error('Profile update error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            setMessage('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // API call to change password
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            if (response.ok) {
                setMessage('Password changed successfully!');
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            } else {
                const error = await response.json();
                setMessage(error.message || 'Failed to change password');
            }
        } catch (error) {
            setMessage('Failed to change password. Please try again.');
            console.error('Password change error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="account" className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>

            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.includes('successfully')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message}
                </div>
            )}

            <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl text-gray-600">
                                {formData.firstName ? formData.firstName.charAt(0).toUpperCase() : '👤'}
                            </span>
                        )}
                    </div>
                    <div>
                        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                            Change Photo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfileImageChange}
                                className="hidden"
                            />
                        </label>
                        <p className="text-sm text-gray-600 mt-1">JPG, PNG up to 10MB</p>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                    </label>
                    <textarea
                        rows={4}
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Timezone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                    </label>
                    <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
                        <option value="America/Denver">Mountain Time (UTC-7)</option>
                        <option value="America/Chicago">Central Time (UTC-6)</option>
                        <option value="America/New_York">Eastern Time (UTC-5)</option>
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">London (UTC+0)</option>
                        <option value="Europe/Paris">Paris (UTC+1)</option>
                        <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                    </select>
                </div>

                {/* Save Profile Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>

                {/* Password Change */}
                <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handlePasswordChange}
                                disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
