export default function BillingSettings() {
    return (
        <div id="billing" className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing & Subscription</h3>

            <div className="space-y-8">
                {/* Current Plan */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-4">Current Plan</h4>
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h5 className="text-xl font-bold text-blue-900">Pro Plan</h5>
                                <p className="text-blue-700">Perfect for growing businesses</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-900">$29</div>
                                <div className="text-sm text-blue-700">per month</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-sm">
                                <div className="text-blue-900 font-medium">✓ Unlimited posts</div>
                                <div className="text-blue-700">✓ 4 social platforms</div>
                                <div className="text-blue-700">✓ Advanced analytics</div>
                            </div>
                            <div className="text-sm">
                                <div className="text-blue-700">✓ AI content optimization</div>
                                <div className="text-blue-700">✓ Team collaboration</div>
                                <div className="text-blue-700">✓ Priority support</div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Upgrade Plan
                            </button>
                            <button className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                                Change Plan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Billing Information */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-4">Billing Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Billing Email
                            </label>
                            <input
                                type="email"
                                defaultValue="billing@company.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name
                            </label>
                            <input
                                type="text"
                                defaultValue="Acme Corp"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-4">Payment Method</h4>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                                    💳
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">•••• •••• •••• 1234</p>
                                    <p className="text-sm text-gray-600">Expires 12/25</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button className="text-sm text-blue-600 hover:text-blue-800">
                                    Edit
                                </button>
                                <button className="text-sm text-red-600 hover:text-red-800">
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                    <button className="mt-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Add Payment Method
                    </button>
                </div>

                {/* Billing History */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-4">Billing History</h4>
                    <div className="space-y-3">
                        {[
                            { date: 'Jan 1, 2024', amount: '$29.00', status: 'Paid', invoice: 'INV-001' },
                            { date: 'Dec 1, 2023', amount: '$29.00', status: 'Paid', invoice: 'INV-002' },
                            { date: 'Nov 1, 2023', amount: '$29.00', status: 'Paid', invoice: 'INV-003' },
                        ].map((payment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div>
                                        <p className="font-medium text-gray-900">{payment.date}</p>
                                        <p className="text-sm text-gray-600">Invoice {payment.invoice}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="font-medium text-gray-900">{payment.amount}</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                        {payment.status}
                                    </span>
                                    <button className="text-sm text-blue-600 hover:text-blue-800">
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Usage Stats */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-4">Usage This Month</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">247</div>
                            <div className="text-sm text-gray-600">Posts Published</div>
                            <div className="text-xs text-green-600 mt-1">Unlimited</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">4</div>
                            <div className="text-sm text-gray-600">Platforms Connected</div>
                            <div className="text-xs text-green-600 mt-1">4 of 4</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">5</div>
                            <div className="text-sm text-gray-600">Team Members</div>
                            <div className="text-xs text-gray-600 mt-1">5 of 10</div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-red-200 pt-6">
                    <h4 className="font-medium text-red-900 mb-4">Danger Zone</h4>
                    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                        <h5 className="font-medium text-red-900 mb-2">Cancel Subscription</h5>
                        <p className="text-sm text-red-700 mb-4">
                            Once you cancel, you&apos;ll lose access to all premium features at the end of your billing period.
                        </p>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            Cancel Subscription
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
