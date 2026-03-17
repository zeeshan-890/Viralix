import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, change, icon, color }) {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            icon: '#52796F'
        },
        green: {
            bg: 'bg-green-50',
            text: 'text-green-600',
            icon: '#84A98C'
        },
        purple: {
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            icon: '#52796F'
        },
        red: {
            bg: 'bg-red-50',
            text: 'text-red-600',
            icon: '#8B4545'
        }
    };

    const colorStyle = colorClasses[color] || colorClasses.blue;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold mb-3" style={{ color: '#354F52' }}>{value}</p>

                    {change !== undefined && (
                        <div className="flex items-center gap-1">
                            {change >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {change >= 0 ? '+' : ''}{change}%
                            </span>
                            <span className="text-sm text-gray-500 ml-1">from last month</span>
                        </div>
                    )}
                </div>
                <div
                    className={`p-3 rounded-xl ${colorStyle.bg}`}
                    style={{ backgroundColor: color === 'green' ? '#CAD2C5' : undefined }}
                >
                    <span className="text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );
}
