interface StatsCardProps {
    title: string
    value: string
    change?: number
    icon: string
    color: 'blue' | 'green' | 'purple' | 'red'
}

export default function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-red-50 text-red-600'
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                    <span className="text-xl">{icon}</span>
                </div>
            </div>
            {change !== undefined && (
                <div className="mt-4 flex items-center">
                    <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change}%
                    </span>
                    <span className="text-sm text-gray-600 ml-2">from last month</span>
                </div>
            )}
        </div>
    )
}
