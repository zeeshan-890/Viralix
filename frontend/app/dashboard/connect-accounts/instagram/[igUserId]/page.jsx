"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { instagramAPI, uploadAPI } from "@/lib/api";

export default function InstagramDetailPage() {
    const params = useParams();
    const igUserId = useMemo(() => params?.igUserId, [params]);

    const [profile, setProfile] = useState(null);
    const [feed, setFeed] = useState([]);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('IMAGE');
    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [posting, setPosting] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        if (!igUserId) return;
        (async () => {
            setLoading(true);
            try { const { data } = await instagramAPI.profile(igUserId); setProfile(data.profile); } catch { }
            try { const { data } = await instagramAPI.feed(igUserId, 12); setFeed(data.feed || []); } catch { }
            try { const { data } = await instagramAPI.insights(igUserId); setInsights(data.insights || []); } catch { }
            setLoading(false);
        })();
    }, [igUserId]);

    const publish = async (e) => {
        e.preventDefault();
        setErr("");
        if (!file) return;
        setPosting(true);
        try {
            // 1) Upload to Cloudinary via our API
            const { data: up } = await uploadAPI.uploadMedia([file]);
            const url = up?.files?.[0]?.url;
            if (!url) throw new Error('Upload failed');
            // 2) Publish by URL to IG
            await instagramAPI.publishByUrl(igUserId, { mediaType: tab, url, caption });
            setOpen(false); setCaption(""); setFile(null);
            const { data } = await instagramAPI.feed(igUserId, 12);
            setFeed(data.feed || []);
        } catch (e) {
            setErr(e?.response?.data?.message || e.message);
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Instagram</h1>
                    <div className="text-gray-600 text-sm">IG User ID: {igUserId}</div>
                    {profile && <div className="text-sm mt-1">@{profile.username} • {profile.followers_count} followers</div>}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setOpen(true)} className="px-3 py-2 rounded bg-purple-600 text-white">Create Post</button>
                    <Link href="/dashboard/connect-accounts/instagram" className="text-blue-600">Back</Link>
                </div>
            </div>

            {loading ? <div>Loading…</div> : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white border rounded p-4">
                            <div className="font-medium mb-3">Recent Media</div>
                            {feed?.length ? (
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {feed.map((m) => (
                                        <li key={m.id} className="border rounded overflow-hidden">
                                            {m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM' ? (
                                                <img src={m.media_url} alt="" />
                                            ) : m.media_type === 'VIDEO' ? (
                                                <video src={m.media_url} controls />
                                            ) : null}
                                            <div className="p-3 text-sm space-y-1">
                                                <div className="text-xs text-gray-500">{new Date(m.timestamp).toLocaleString()}</div>
                                                {m.caption && <div>{m.caption}</div>}
                                                <div className="text-xs text-gray-600 flex gap-4">
                                                    <span>❤️ {m.like_count ?? 0}</span>
                                                    <span>💬 {m.comments_count ?? 0}</span>
                                                    <a href={m.permalink} target="_blank" rel="noreferrer" className="text-blue-600">Open</a>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : <div className="text-sm text-gray-500">No media yet.</div>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white border rounded p-4">
                            <div className="font-medium mb-2">Insights</div>
                            {insights?.length ? (
                                <ul className="space-y-2 text-sm">
                                    {insights.map((i) => (
                                        <li key={i.name}>
                                            <div className="font-medium">{i.title || i.name}</div>
                                            <div className="text-xs text-gray-500">{i.period}</div>
                                            <div className="text-xs">{i.values?.map(v => `${v.value} (${v.end_time})`).join(', ')}</div>
                                        </li>
                                    ))}
                                </ul>
                            ) : <div className="text-sm text-gray-500">No insights available.</div>}
                        </div>
                    </div>
                </div>
            )}

            {open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="font-medium">Create Instagram Post</div>
                            <button onClick={() => setOpen(false)} className="text-gray-500">✕</button>
                        </div>
                        <div className="border-b flex gap-3 text-sm">
                            <button className={`px-3 py-2 ${tab === 'IMAGE' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`} onClick={() => setTab('IMAGE')}>Image</button>
                            <button className={`px-3 py-2 ${tab === 'VIDEO' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`} onClick={() => setTab('VIDEO')}>Video</button>
                        </div>
                        {err && <div className="text-sm text-red-600">{err}</div>}
                        <form onSubmit={publish} className="space-y-3">
                            <input type="file" accept={tab === 'IMAGE' ? 'image/*' : 'video/*'} onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full border rounded p-2" />
                            <textarea className="w-full border rounded p-2" rows={3} placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} />
                            <div className="flex justify-end">
                                <button disabled={!file || posting} className="px-3 py-2 rounded bg-purple-600 text-white disabled:opacity-50">Publish</button>
                            </div>
                        </form>
                        <div className="text-xs text-gray-500">Media uploads go to Cloudinary first, then are published to Instagram.</div>
                    </div>
                </div>
            )}
        </div>
    );
}
