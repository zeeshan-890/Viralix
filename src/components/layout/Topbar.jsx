'use client';
import { Button } from '../ui/Button';
export default function Topbar() {
    return (<header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="relative">
                        <input type="text" placeholder="Search..." className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">🔍</span>
                        </div>
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="text-xl">🔔</span>
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                    </button>

                    {/* Profile */}
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">U</span>
                        </div>
                        <Button variant="ghost" size="sm">
                            Account
                        </Button>
                    </div>
                </div>
            </div>
        </header>);
}
