'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
export default function Breadcrumb() {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const getBreadcrumbLabel = (segment) => {
        // Custom labels for specific routes
        const labels = {
            'dashboard': 'Dashboard',
            'upload': 'Upload Content',
            'preview': 'Preview',
            'schedule': 'Schedule Posts',
            'analytics': 'Analytics',
            'settings': 'Settings',
            'engagement': 'Engagement',
            'comments': 'Comments',
            'mentions': 'Mentions',
            'templates': 'Templates',
            'admin': 'Admin',
            'users': 'User Management',
            'content': 'Content Moderation',
            'system': 'System Stats',
            'platforms': 'Platform Status'
        };
        return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    };
    const generateBreadcrumbPath = (index) => {
        return '/' + pathSegments.slice(0, index + 1).join('/');
    };
    return (<nav className="flex items-center space-x-2 text-sm text-gray-600">
        <Link href="/dashboard" className="flex items-center hover:text-gray-900 transition-colors">
            <Home className="w-4 h-4" />
        </Link>

        {pathSegments.map((segment, index) => (<div key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {index === pathSegments.length - 1 ? (<span className="text-gray-900 font-medium">
                {getBreadcrumbLabel(segment)}
            </span>) : (<Link href={generateBreadcrumbPath(index)} className="hover:text-gray-900 transition-colors">
                {getBreadcrumbLabel(segment)}
            </Link>)}
        </div>))}
    </nav>);
}
