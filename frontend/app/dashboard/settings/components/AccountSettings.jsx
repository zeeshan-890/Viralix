'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function AccountSettings() {
    const user = useAuthStore(s => s.user);
    const updateUser = useAuthStore(s => s.updateUser);
    const logout = useAuthStore(s => s.logout);
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        timezone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                timezone: user.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setProfilePicture(user.profilePicture || '');
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
            if (file.size > 10 * 1024 * 1024) {
                setMessage('Image must be less than 10MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setMessage('');

        try {
            const response = await api.put('/auth/profile', {
                name: formData.name,
                profilePicture: profilePicture,
                timezone: formData.timezone
            });

            updateUser(response.data);
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to update profile. Please try again.');
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

        if (formData.newPassword.length < 6) {
            setMessage('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            await api.post('/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            setMessage('Password changed successfully!');
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to change password. Please try again.');
            console.error('Password change error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;

        setDeleting(true);
        try {
            await api.delete('/users/account');
            logout();
            router.push('/');
        } catch (error) {
            console.error('Account deletion error:', error);
            setMessage(error.response?.data?.message || 'Failed to delete account. Please try again.');
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
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
                        {profilePicture ? (
                            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl text-gray-600">
                                {formData.name ? formData.name.charAt(0).toUpperCase() : '👤'}
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

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Email (read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
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
                        <option value="Asia/Karachi">Pakistan (UTC+5)</option>
                        <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
                        <option value="America/Denver">Mountain Time (UTC-7)</option>
                        <option value="America/Chicago">Central Time (UTC-6)</option>
                        <option value="America/New_York">Eastern Time (UTC-5)</option>
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">London (UTC+0)</option>
                        <option value="Europe/Paris">Paris (UTC+1)</option>
                        <option value="Asia/Dubai">Dubai (UTC+4)</option>
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

                {/* Danger Zone - Delete Account */}
                <div className="border-t border-red-200 pt-6 mt-8">
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                        Once you delete your account, there is no going back. All your data, connected accounts, posts, and settings will be permanently deleted.
                    </p>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-red-800">
                                This will permanently delete:
                            </p>
                            <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                                <li>Your account and profile</li>
                                <li>All connected social accounts</li>
                                <li>All scheduled and published posts</li>
                                <li>All analytics and content data</li>
                            </ul>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type <span className="font-bold text-red-600">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? 'Deleting...' : 'Delete Forever'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
