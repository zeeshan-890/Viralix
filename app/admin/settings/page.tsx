'use client'

import { useState } from 'react'
import { Save, Bell, Shield, Database, Globe } from 'lucide-react'

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        notifications: {
            emailAlerts: true,
            smsAlerts: false,
            pushNotifications: true,
            weeklyReports: true
        },
        security: {
            twoFactorAuth: true,
            passwordExpiry: 90,
            maxLoginAttempts: 5,
            sessionTimeout: 30
        },
        system: {
            autoBackup: true,
            backupFrequency: 'daily',
            maintenanceMode: false,
            debugMode: false
        },
        api: {
            rateLimiting: true,
            requestsPerMinute: 1000,
            cacheEnabled: true,
            compressionEnabled: true
        }
    })

    const handleSave = () => {
        console.log('Settings saved:', settings)
        // Here you would typically send the settings to your API
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                    <p className="text-gray-600">Configure system-wide settings and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notifications Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <Bell className="w-5 h-5 text-blue-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Email Alerts</label>
                            <input
                                type="checkbox"
                                checked={settings.notifications.emailAlerts}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    notifications: { ...prev.notifications, emailAlerts: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">SMS Alerts</label>
                            <input
                                type="checkbox"
                                checked={settings.notifications.smsAlerts}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    notifications: { ...prev.notifications, smsAlerts: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Push Notifications</label>
                            <input
                                type="checkbox"
                                checked={settings.notifications.pushNotifications}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    notifications: { ...prev.notifications, pushNotifications: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Weekly Reports</label>
                            <input
                                type="checkbox"
                                checked={settings.notifications.weeklyReports}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    notifications: { ...prev.notifications, weeklyReports: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <Shield className="w-5 h-5 text-green-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Two-Factor Authentication</label>
                            <input
                                type="checkbox"
                                checked={settings.security.twoFactorAuth}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    security: { ...prev.security, twoFactorAuth: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Password Expiry (days)</label>
                            <input
                                type="number"
                                value={settings.security.passwordExpiry}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    security: { ...prev.security, passwordExpiry: parseInt(e.target.value) }
                                }))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Max Login Attempts</label>
                            <input
                                type="number"
                                value={settings.security.maxLoginAttempts}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
                                }))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Session Timeout (minutes)</label>
                            <input
                                type="number"
                                value={settings.security.sessionTimeout}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                                }))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <Database className="w-5 h-5 text-purple-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">System</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Auto Backup</label>
                            <input
                                type="checkbox"
                                checked={settings.system.autoBackup}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    system: { ...prev.system, autoBackup: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Backup Frequency</label>
                            <select
                                value={settings.system.backupFrequency}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    system: { ...prev.system, backupFrequency: e.target.value }
                                }))}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                                <option value="hourly">Hourly</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Maintenance Mode</label>
                            <input
                                type="checkbox"
                                checked={settings.system.maintenanceMode}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    system: { ...prev.system, maintenanceMode: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Debug Mode</label>
                            <input
                                type="checkbox"
                                checked={settings.system.debugMode}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    system: { ...prev.system, debugMode: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                    </div>
                </div>

                {/* API Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <Globe className="w-5 h-5 text-orange-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">API Configuration</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Rate Limiting</label>
                            <input
                                type="checkbox"
                                checked={settings.api.rateLimiting}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    api: { ...prev.api, rateLimiting: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Requests per Minute</label>
                            <input
                                type="number"
                                value={settings.api.requestsPerMinute}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    api: { ...prev.api, requestsPerMinute: parseInt(e.target.value) }
                                }))}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Cache Enabled</label>
                            <input
                                type="checkbox"
                                checked={settings.api.cacheEnabled}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    api: { ...prev.api, cacheEnabled: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">Compression Enabled</label>
                            <input
                                type="checkbox"
                                checked={settings.api.compressionEnabled}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    api: { ...prev.api, compressionEnabled: e.target.checked }
                                }))}
                                className="rounded text-blue-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                    onClick={handleSave}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save All Settings
                </button>
            </div>
        </div>
    )
}
