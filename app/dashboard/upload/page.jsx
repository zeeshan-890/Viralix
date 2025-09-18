import FileUpload from './components/FileUpload';
import TagsInput from './components/TagsInput';
export default function UploadPage() {
    return (<div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Upload Content</h1>
                <p className="text-gray-600">Upload your videos and images to start creating amazing content.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* File Upload */}
                <div className="space-y-6">
                    <FileUpload />
                </div>

                {/* Content Details */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Content Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title
                                </label>
                                <input type="text" placeholder="Enter content title..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea rows={4} placeholder="Enter content description..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                            </div>

                            <TagsInput />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Select category...</option>
                                    <option value="education">Education</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="lifestyle">Lifestyle</option>
                                    <option value="technology">Technology</option>
                                    <option value="business">Business</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex space-x-3">
                            <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                Save Draft
                            </button>
                            <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                                Continue to Preview
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>);
}
