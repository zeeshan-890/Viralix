"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { facebookAPI, uploadAPI } from "@/lib/api";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/Modal";

export default function FacebookPageDetail() {
    const params = useParams();
    const pageId = useMemo(() => params?.pageId, [params]);
    const [feed, setFeed] = useState([]);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedError, setFeedError] = useState("");
    const [insightsError, setInsightsError] = useState("");
    const [posting, setPosting] = useState(false);
    const [message, setMessage] = useState("");
    const [link, setLink] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeTab, setComposeTab] = useState("text"); // text | photo | video
    const [videoFile, setVideoFile] = useState(null);
    const [videoDescription, setVideoDescription] = useState("");

    useEffect(() => {
        if (!pageId) return;
        let mounted = true;
        (async () => {
            setLoading(true);
            setFeedError("");
            setInsightsError("");
            try {
                const feedRes = await facebookAPI.getPageFeed(pageId, 10);
                if (mounted) setFeed(feedRes.data.feed || []);
            } catch (e) {
                if (mounted) setFeedError(e?.response?.data?.message || e.message || "Failed to load feed");
            }
            try {
                const insightsRes = await facebookAPI.getPageInsights(pageId);
                if (mounted) setInsights(insightsRes.data.insights || []);
            } catch (e) {
                if (mounted) setInsightsError(e?.response?.data?.message || e.message || "Failed to load insights");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [pageId]);

    const submitPost = async (e) => {
        e.preventDefault();
        setPosting(true);
        try {
            await facebookAPI.createPagePost(pageId, { message, link: link || undefined });
            setMessage("");
            setLink("");
            const { data } = await facebookAPI.getPageFeed(pageId, 10);
            setFeed(data.feed || []);
        } finally {
            setPosting(false);
        }
    };

    const submitPhoto = async (e) => {
        e.preventDefault();
        setPosting(true);
        try {
            if (!photoFile) throw new Error('Please select a photo file');
            // Upload to Cloudinary then publish by URL
            const { data: up } = await uploadAPI.uploadMedia([photoFile]);
            const url = up?.files?.[0]?.url;
            if (!url) throw new Error('Upload failed');
            await facebookAPI.createPagePhoto(pageId, { url, caption: caption || undefined });
            setPhotoFile(null);
            setCaption("");
            const { data } = await facebookAPI.getPageFeed(pageId, 10);
            setFeed(data.feed || []);
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Facebook Page</h1>
                    <p className="text-gray-600">ID: {pageId}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setComposeOpen(true)} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Create Post</button>
                    <Link href="/dashboard/connect-accounts/facebook" className="text-sm text-blue-600 hover:underline">Back</Link>
                </div>
            </div>

            {loading ? (
                <div className="text-sm text-gray-500">Loading…</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border rounded p-4">
                            <div className="font-medium mb-3">Feed (latest)</div>
                            {feedError && (
                                <div className="text-sm text-red-600 mb-2">{String(feedError)}</div>
                            )}
                            {feed?.length ? (
                                <ul className="space-y-3">
                                    {feed.map((item) => (
                                        <li key={item.id} className="border rounded p-3">
                                            <div className="text-sm text-gray-500">{new Date(item.created_time).toLocaleString()}</div>
                                            {item.message && <div className="mt-1 whitespace-pre-wrap">{item.message}</div>}
                                            {item.attachments?.data?.[0]?.media?.image?.src && (
                                                <img src={item.attachments.data[0].media.image.src} alt="" className="mt-2 rounded" />
                                            )}
                                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                                                <span>👍 {item.likes?.summary?.total_count ?? 0}</span>
                                                <span>💬 {item.comments?.summary?.total_count ?? 0}</span>
                                                <span>🔁 {item.shares?.count ?? 0}</span>
                                            </div>
                                            {item.permalink_url && (
                                                <a className="text-xs text-blue-600" href={item.permalink_url} target="_blank" rel="noreferrer">Open on Facebook</a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-gray-500">No posts yet.</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white border rounded p-4">
                                <div className="text-xs text-gray-500">Total Posts</div>
                                <div className="text-2xl font-semibold">{feed?.length || 0}</div>
                            </div>
                            <div className="bg-white border rounded p-4">
                                <div className="text-xs text-gray-500">Last Post</div>
                                <div className="text-sm">{feed?.[0]?.created_time ? new Date(feed[0].created_time).toLocaleDateString() : '-'}</div>
                            </div>
                            <div className="bg-white border rounded p-4">
                                <div className="text-xs text-gray-500">Avg Engagement</div>
                                <div className="text-sm">{(() => {
                                    if (!feed?.length) return '-';
                                    const totals = feed.reduce((acc, p) => {
                                        const likes = p.likes?.summary?.total_count || 0;
                                        const comments = p.comments?.summary?.total_count || 0;
                                        const shares = p.shares?.count || 0;
                                        return acc + likes + comments + shares;
                                    }, 0);
                                    return Math.round(totals / feed.length);
                                })()}</div>
                            </div>
                        </div>

                        <div className="bg-white border rounded p-4">
                            <div className="font-medium mb-2">Insights</div>
                            {insightsError && (
                                <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                                    {String(insightsError)}
                                </div>
                            )}
                            {insights?.length ? (
                                <ul className="space-y-2 text-sm">
                                    {insights.map((m) => (
                                        <li key={m.name}>
                                            <div className="font-medium">{m.title || m.name}</div>
                                            <div className="text-xs text-gray-500">{m.period}</div>
                                            <div className="text-xs">{m.values?.map(v => `${v.value} (${v.end_time})`).join(', ')}</div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-gray-500">No insights available.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Modal open={composeOpen} onOpenChange={setComposeOpen}>
                <ModalContent>
                    <ModalHeader>
                        <ModalTitle>Create Post</ModalTitle>
                        <ModalDescription>Publish to this Page as a text, photo, or video post.</ModalDescription>
                    </ModalHeader>
                    <div className="border-b mb-4 flex gap-3 text-sm">
                        <button className={`px-3 py-2 ${composeTab === 'text' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} onClick={() => setComposeTab('text')}>Text</button>
                        <button className={`px-3 py-2 ${composeTab === 'photo' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} onClick={() => setComposeTab('photo')}>Photo</button>
                        <button className={`px-3 py-2 ${composeTab === 'video' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} onClick={() => setComposeTab('video')}>Video</button>
                    </div>

                    {composeTab === 'text' && (
                        <form onSubmit={async (e) => { e.preventDefault(); setPosting(true); try { await facebookAPI.createPagePost(pageId, { message, link: link || undefined }); setMessage(''); setLink(''); const { data } = await facebookAPI.getPageFeed(pageId, 10); setFeed(data.feed || []); setComposeOpen(false); } finally { setPosting(false); } }} className="space-y-3">
                            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border rounded p-2" rows={4} placeholder="Write something..." />
                            <input value={link} onChange={(e) => setLink(e.target.value)} className="w-full border rounded p-2" placeholder="Link (optional)" />
                            <div className="flex justify-end">
                                <button disabled={posting} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Publish</button>
                            </div>
                        </form>
                    )}

                    {composeTab === 'photo' && (
                        <form onSubmit={async (e) => { e.preventDefault(); setPosting(true); try { await submitPhoto(e); setComposeOpen(false); } finally { setPosting(false); } }} className="space-y-3">
                            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="w-full border rounded p-2" />
                            {photoFile && <div className="text-xs text-gray-600">Selected: {photoFile.name}</div>}
                            <input value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full border rounded p-2" placeholder="Caption (optional)" />
                            <div className="flex justify-end">
                                <button disabled={posting || !photoFile} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Publish Photo</button>
                            </div>
                        </form>
                    )}

                    {composeTab === 'video' && (
                        <form onSubmit={async (e) => { e.preventDefault(); setPosting(true); try { if (!videoFile) throw new Error('Please select a video file'); const { data: up } = await uploadAPI.uploadMedia([videoFile]); const url = up?.files?.[0]?.url; if (!url) throw new Error('Upload failed'); await facebookAPI.createPageVideo(pageId, { fileUrl: url, description: videoDescription || undefined }); setVideoFile(null); setVideoDescription(''); const { data } = await facebookAPI.getPageFeed(pageId, 10); setFeed(data.feed || []); setComposeOpen(false); } finally { setPosting(false); } }} className="space-y-3">
                            <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="w-full border rounded p-2" />
                            {videoFile && <div className="text-xs text-gray-600">Selected: {videoFile.name}</div>}
                            <input value={videoDescription} onChange={(e) => setVideoDescription(e.target.value)} className="w-full border rounded p-2" placeholder="Description (optional)" />
                            <div className="flex justify-end">
                                <button disabled={posting || !videoFile} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Publish Video</button>
                            </div>
                        </form>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
