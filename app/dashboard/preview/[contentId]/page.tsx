import PlatformTabs from './components/PlatformTabs'
import CaptionEditor from './components/CaptionEditor'
import HashtagEditor from './components/HashtagEditor'
import TimePicker from './components/TimePicker'

export default function PreviewPage({ params }: { params: { contentId: string } }) {
    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Preview Content</h1>
                <p className="text-gray-600">Preview how your content will look across different platforms.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Preview Area */}
                <div className="lg:col-span-2">
                    <PlatformTabs contentId={params.contentId} />
                </div>

                {/* Editing Panel */}
                <div className="space-y-6">
                    {/* Caption Editor */}
                    <CaptionEditor />

                    {/* Hashtag Editor */}
                    <HashtagEditor />

                    {/* Schedule Time */}
                    <TimePicker />

                    {/* Action Buttons */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                Schedule Post
                            </button>
                            <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                                Save as Draft
                            </button>
                            <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                                Back to Upload
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
