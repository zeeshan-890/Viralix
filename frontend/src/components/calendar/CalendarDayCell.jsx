'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import CalendarPostCard from './CalendarPostCard';
import { canDragPost, toDateKey } from './calendarUtils';
import { cal } from './calendarTheme';

export default function CalendarDayCell({
    date,
    posts,
    isToday,
    isWeekend = false,
    isCurrentMonth = true,
    isSelected,
    compact = false,
    onSelectDay,
    onAddPost,
    onEditPost,
}) {
    const dateKey = toDateKey(date);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });

    return (
        <Droppable droppableId={dateKey}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    onClick={() => onSelectDay?.(dateKey)}
                    className={cn(
                        cal.day,
                        'group flex min-h-0 flex-col transition-all',
                        compact ? 'min-h-[112px]' : 'min-h-[420px]',
                        isToday && 'ring-2 ring-[#84A98C]',
                        isSelected && 'ring-2 ring-[#354F52]',
                        snapshot.isDraggingOver && 'bg-[#E8F0ED] border-[#84A98C]',
                        !isCurrentMonth && 'opacity-40'
                    )}
                >
                    <div
                        className={cn(
                            'flex items-center justify-between px-2 py-1.5',
                            isToday ? cal.dayHeaderToday : isWeekend ? cal.dayHeaderWeekend : cal.dayHeader
                        )}
                    >
                        <div className="flex items-center gap-1.5">
                            {!compact && (
                                <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-[#52796F]">
                                    {weekday}
                                </span>
                            )}
                            <span
                                className={cn(
                                    'text-sm font-bold tabular-nums',
                                    isToday
                                        ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[#84A98C] text-xs text-white'
                                        : 'text-[#354F52]'
                                )}
                            >
                                {date.getDate()}
                            </span>
                            {posts.length > 0 && (
                                <span className="rounded-full bg-[#354F52] px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">
                                    {posts.length}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddPost?.(dateKey);
                            }}
                            className="rounded p-1 text-[#52796F] opacity-0 transition-all hover:bg-[var(--viralix-surface)] group-hover:opacity-100"
                            aria-label={`Add post on ${dateKey}`}
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div
                        className={cn(
                            cal.dayBody,
                            'flex-1 space-y-1.5 overflow-y-auto p-1.5',
                            compact ? 'max-h-[140px] min-h-[60px]' : ''
                        )}
                    >
                        {posts.map((post, index) => {
                            const draggable = canDragPost(post);
                            return (
                                <Draggable
                                    key={post._id}
                                    draggableId={post._id}
                                    index={index}
                                    isDragDisabled={!draggable}
                                >
                                    {(dragProvided, dragSnapshot) => (
                                        <div
                                            ref={dragProvided.innerRef}
                                            {...dragProvided.draggableProps}
                                            style={dragProvided.draggableProps.style}
                                        >
                                            <CalendarPostCard
                                                post={post}
                                                compact={compact}
                                                isDragging={dragSnapshot.isDragging}
                                                dragHandleProps={draggable ? dragProvided.dragHandleProps : undefined}
                                                onClick={() => onEditPost?.(post)}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                        {posts.length === 0 && !compact && (
                            <div className="flex flex-1 items-center justify-center py-6 text-[0.6875rem] text-[#94A3B8]">
                                Drop posts here
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Droppable>
    );
}
