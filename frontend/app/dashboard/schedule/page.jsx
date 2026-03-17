'use client';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { postsAPI, platformsAPI } from '@/lib/api';
import NewPostModal from './components/NewPostModal';
import PostCard from './components/PostCard';
import CalendarAutofillWizard from './components/CalendarAutofillWizard';

// Helper to get dates for the week
const getWeekDates = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
    });
};

export default function SchedulePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [posts, setPosts] = useState({}); // { 'YYYY-MM-DD': [posts] }
    const [loading, setLoading] = useState(true);
    const [isNewPostOpen, setIsNewPostOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [connectedPlatforms, setConnectedPlatforms] = useState([]);
    const [view, setView] = useState('week'); // 'week', 'month'

    // AI Wizard State
    const [showWizard, setShowWizard] = useState(false);

    const weekDates = getWeekDates(currentDate);

    useEffect(() => {
        loadPosts();
        loadPlatforms();
    }, [currentDate, view]);

    const loadPlatforms = async () => {
        try {
            const res = await platformsAPI.getConnected();
            setConnectedPlatforms(res.data);
        } catch (error) {
            console.error('Failed to load platforms');
        }
    };

    const loadPosts = async () => {
        setLoading(true);
        try {
            // Calculate range based on view
            const start = view === 'week' ? weekDates[0] : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const end = view === 'week' ? weekDates[6] : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            // Add padding to ensure we catch edge cases
            start.setDate(start.getDate() - 7);
            end.setDate(end.getDate() + 7);

            const res = await postsAPI.list({ startDate: start.toISOString(), endDate: end.toISOString() });

            // Group by date
            const grouped = {};
            res.data.forEach(post => {
                const dateKey = new Date(post.scheduledDate).toISOString().split('T')[0];
                if (!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(post);
            });
            setPosts(grouped);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const sourceDate = result.source.droppableId;
        const destDate = result.destination.droppableId;
        const postId = result.draggableId;

        if (sourceDate === destDate) return;

        // Optimistic update
        const sourcePosts = [...(posts[sourceDate] || [])];
        const destPosts = [...(posts[destDate] || [])];
        const [movedPost] = sourcePosts.splice(result.source.index, 1);

        // Update post date object
        const newDate = new Date(destDate);
        // Preserve time
        const oldDate = new Date(movedPost.scheduledDate);
        newDate.setHours(oldDate.getHours(), oldDate.getMinutes());

        movedPost.scheduledDate = newDate.toISOString();
        destPosts.splice(result.destination.index, 0, movedPost);

        setPosts({
            ...posts,
            [sourceDate]: sourcePosts,
            [destDate]: destPosts
        });

        try {
            await postsAPI.update(postId, { scheduledDate: newDate });
        } catch (error) {
            console.error('Failed to update post date:', error);
            loadPosts(); // Revert on error
        }
    };

    const changeWeek = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setCurrentDate(newDate);
    };

    const handleNewPost = (dateStr) => {
        if (connectedPlatforms.length === 0) {
            if (confirm('You need to connect a social account first. Go to Connect Accounts?')) {
                window.location.href = '/dashboard/connect-accounts';
            }
            return;
        }
        setSelectedDate(dateStr ? new Date(dateStr) : new Date());
        setEditingPost(null);
        setIsNewPostOpen(true);
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setIsNewPostOpen(true);
    };

    const handlePostSaved = () => {
        setIsNewPostOpen(false);
        loadPosts();
    };

    return (
        <div className="h-full flex flex-col p-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowWizard(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 font-medium text-sm"
                    >
                        <Sparkles size={16} />
                        AI Auto-Fill
                    </button>

                    <div className="bg-white border rounded-lg flex items-center p-1 shadow-sm">
                        <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-medium text-gray-600 hover:text-gray-900">
                            Today
                        </button>
                        <button onClick={() => changeWeek(1)} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronRight size={20} className="text-gray-600" />
                        </button>
                    </div>

                    <button
                        onClick={() => handleNewPost()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium text-sm"
                    >
                        <Plus size={18} />
                        New Post
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex-1 grid grid-cols-7 gap-4 min-h-0 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                    {weekDates.map((date) => {
                        const dateKey = date.toISOString().split('T')[0];
                        const dayPosts = posts[dateKey] || [];
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <Droppable key={dateKey} droppableId={dateKey}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex flex-col h-full rounded-xl border transition-all duration-200
                                            ${isToday ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-gray-200'}
                                            ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400 bg-blue-50' : 'hover:border-blue-300'}
                                        `}
                                    >
                                        <div className={`p-3 border-b flex justify-between items-center
                                            ${isToday ? 'bg-blue-50/50 text-blue-700' : 'bg-gray-50/50 text-gray-600'}
                                            rounded-t-xl
                                        `}>
                                            <div className="text-center">
                                                <div className="text-xs font-semibold uppercase opacity-70">
                                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                                                    {date.getDate()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleNewPost(dateKey)}
                                                className="opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-blue-600 p-1 rounded transition"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <div className="flex-1 p-2 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                                            {dayPosts.map((post, index) => (
                                                <Draggable key={post._id} draggableId={post._id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                opacity: snapshot.isDragging ? 0.8 : 1,
                                                            }}
                                                        >
                                                            <PostCard post={post} onClick={() => handleEditPost(post)} />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            </DragDropContext>

            {/* Modals */}
            {isNewPostOpen && (
                <NewPostModal
                    isOpen={isNewPostOpen}
                    onClose={() => setIsNewPostOpen(false)}
                    initialDate={selectedDate}
                    initialData={editingPost}
                    onSave={handlePostSaved}
                    connectedPlatforms={connectedPlatforms}
                />
            )}

            {showWizard && (
                <CalendarAutofillWizard
                    onClose={() => setShowWizard(false)}
                    onComplete={() => {
                        setShowWizard(false);
                        loadPosts(); // Refresh calendar
                    }}
                />
            )}
        </div>
    );
}
