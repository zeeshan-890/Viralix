'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '../../lib/utils';
const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Upload', href: '/dashboard/upload', icon: '📤' },
    { name: 'Preview', href: '/dashboard/preview', icon: '👁️' },
    { name: 'Schedule', href: '/dashboard/schedule', icon: '📅' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
    {
        name: 'Engagement',
        href: '/engagement',
        icon: '💬',
        subItems: [
            { name: 'Comments', href: '/engagement/comments', icon: '💭' },
            { name: 'Mentions', href: '/engagement/mentions', icon: '📢' },
            { name: 'Analytics', href: '/engagement/analytics', icon: '📊' },
            { name: 'Templates', href: '/engagement/templates', icon: '📝' },
        ]
    },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
    {
        name: 'Admin',
        href: '/admin',
        icon: '👑',
        subItems: [
            { name: 'Users', href: '/admin/users', icon: '👥' },
            { name: 'Content', href: '/admin/content', icon: '📋' },
            { name: 'System', href: '/admin/system', icon: '🔧' },
            { name: 'Platforms', href: '/admin/platforms', icon: '🌐' },
        ]
    },
];
export default function Sidebar() {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = useState([]);
    const toggleExpanded = (itemName) => {
        setExpandedItems(prev => prev.includes(itemName)
            ? prev.filter(name => name !== itemName)
            : [...prev, itemName]);
    };
    return (<div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900">AutoReach AI</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => (<div key={item.name}>
                        {item.subItems ? (<div>
                                <button onClick={() => toggleExpanded(item.name)} className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors', pathname.startsWith(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900')}>
                                    <div className="flex items-center">
                                        <span className="mr-3 text-lg">{item.icon}</span>
                                        {item.name}
                                    </div>
                                    <span className="text-gray-400">
                                        {expandedItems.includes(item.name) ? '▼' : '▶'}
                                    </span>
                                </button>
                                {expandedItems.includes(item.name) && (<div className="ml-6 mt-1 space-y-1">
                                        {item.subItems.map((subItem) => (<Link key={subItem.name} href={subItem.href} className={cn('flex items-center px-3 py-2 rounded-lg text-sm transition-colors', pathname === subItem.href
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}>
                                                <span className="mr-2 text-base">{subItem.icon}</span>
                                                {subItem.name}
                                            </Link>))}
                                    </div>)}
                            </div>) : (<Link href={item.href} className={cn('flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors', pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900')}>
                                <span className="mr-3 text-lg">{item.icon}</span>
                                {item.name}
                            </Link>)}
                    </div>))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">U</span>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">User Name</p>
                        <p className="text-xs text-gray-500">Free Plan</p>
                    </div>
                </div>
            </div>
        </div>);
}
