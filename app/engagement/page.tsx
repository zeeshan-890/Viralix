'use client'

import Link from 'next/link'
import { MessageCircle, AtSign, BarChart3, MessageSquare, TrendingUp, Users, AlertCircle, Clock } from 'lucide-react'

export default function EngagementOverview() {
    const stats = [
        {
            title: 'Total Comments',
            value: '2,543',
            change: '+12%',
            trend: 'up',
            icon: MessageCircle
        },
        {
            title: 'Mentions',
            value: '89',
            change: '+8%',
            trend: 'up',
            icon: AtSign
        },
        {
            title: 'Response Rate',
            value: '94%',
            change: '+3%',
            trend: 'up',
            icon: TrendingUp
        },
        {
            title: 'Avg Response Time',
            value: '2.3h',
            change: '-15min',
            trend: 'up',
            icon: Clock
        }
    ]

    const quickActions = [
        {
            title: 'Comment Tracker',
            description: 'Monitor and respond to comments across platforms',
            href: '/engagement/comments',
            icon: MessageCircle,
            color: 'bg-blue-500'
        },
        {
            title: 'Mention Monitor',
            description: 'Track brand mentions and social listening',
            href: '/engagement/mentions',
            icon: AtSign,
            color: 'bg-purple-500'
        },
        {
            title: 'Engagement Analytics',
            description: 'View detailed engagement metrics and insights',
            href: '/engagement/analytics',
            icon: BarChart3,
            color: 'bg-green-500'
        },
        {
            title: 'Response Templates',
            description: 'Manage AI-powered response templates',
            href: '/engagement/templates',
            icon: MessageSquare,
            color: 'bg-orange-500'
        }
    ]

    const recentActivity = [
        {
            type: 'comment',
            platform: 'Instagram',
            content: 'New comment on your latest post',
            time: '2 minutes ago',
            urgent: false
        },
        {
            type: 'mention',
            platform: 'Twitter',
            content: 'Brand mention detected',
            time: '15 minutes ago',
            urgent: true
        },
        {
            type: 'comment',
            platform: 'Facebook',
            content: 'Customer question needs response',
            time: '1 hour ago',
            urgent: true
        },
        {
            type: 'mention',
            platform: 'LinkedIn',
            content: 'Professional mention in industry post',
            time: '2 hours ago',
            urgent: false
        }
    ]

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.title} className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {stat.change} from last week
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <stat.icon className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                                    <action.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                                    <p className="text-sm text-gray-600">{action.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        <Link href="/engagement/comments" className="text-sm text-blue-600 hover:text-blue-800">
                            View all
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100">
                                <div className="flex-shrink-0">
                                    {activity.urgent ? (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    ) : activity.type === 'comment' ? (
                                        <MessageCircle className="w-5 h-5 text-blue-500" />
                                    ) : (
                                        <AtSign className="w-5 h-5 text-purple-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-medium text-gray-900">{activity.platform}</p>
                                        {activity.urgent && (
                                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                                Urgent
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{activity.content}</p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week&apos;s Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Engagement Rate</h3>
                        <p className="text-2xl font-bold text-blue-600">4.2%</p>
                        <p className="text-sm text-gray-600">+0.3% from last week</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Comments Handled</h3>
                        <p className="text-2xl font-bold text-green-600">847</p>
                        <p className="text-sm text-gray-600">94% response rate</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Sentiment Score</h3>
                        <p className="text-2xl font-bold text-purple-600">8.6/10</p>
                        <p className="text-sm text-gray-600">+0.4 from last week</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
