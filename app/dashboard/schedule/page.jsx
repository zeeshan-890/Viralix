'use client';
import { Calendar, Clock, CheckCircle2, FileText, Users } from 'lucide-react';
import CalendarView from './components/CalendarView';

export default function SchedulePage() {
    return (
        <div className="space-y-6" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar View */}
                <div className="lg:col-span-3">
                    <CalendarView />
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Quick Stats Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100"
                            style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">This Week</h3>
                                    <p className="text-xs text-white text-opacity-90">Quick overview</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-md cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                                            style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                            <Clock className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-700">Scheduled</div>
                                            <div className="text-xs text-gray-500">Ready to post</div>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold" style={{ color: '#52796F' }}>12</div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-md cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-700">Published</div>
                                            <div className="text-xs text-gray-500">Live posts</div>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-green-600">8</div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-gray-100 hover:border-yellow-200 transition-all hover:shadow-md cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                                            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-700">Drafts</div>
                                            <div className="text-xs text-gray-500">In progress</div>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-600">4</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Platform Status Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100"
                            style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Connected</h3>
                                    <p className="text-xs text-white text-opacity-90">Active platforms</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
                                            <span className="text-lg">📘</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">Facebook</div>
                                            <div className="text-xs text-gray-500">2 pages connected</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm animate-pulse"></div>
                                        <span className="text-xs font-semibold text-green-600">Active</span>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-pink-100 hover:border-pink-300 transition-all hover:shadow-lg cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-md">
                                            <span className="text-lg">📷</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">Instagram</div>
                                            <div className="text-xs text-gray-500">1 account linked</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm animate-pulse"></div>
                                        <span className="text-xs font-semibold text-green-600">Active</span>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md cursor-pointer bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-sky-400 flex items-center justify-center shadow-md opacity-50">
                                            <span className="text-lg">🐦</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-500">Twitter</div>
                                            <div className="text-xs text-gray-400">Not connected</div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-200 rounded-lg">
                                        <span className="text-xs font-semibold text-gray-600">Connect</span>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md cursor-pointer bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center shadow-md opacity-50">
                                            <span className="text-lg">💼</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-500">LinkedIn</div>
                                            <div className="text-xs text-gray-400">Not connected</div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-200 rounded-lg">
                                        <span className="text-xs font-semibold text-gray-600">Connect</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
