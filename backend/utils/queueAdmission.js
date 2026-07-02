async function rejectWhenQueueBacklogged(queue, options = {}) {
    const waitingLimit = Number(options.waitingLimit || 500);
    const delayedLimit = Number(options.delayedLimit || waitingLimit);

    const counts = await queue.getJobCounts();
    const waiting = counts.waiting || 0;
    const delayed = counts.delayed || 0;
    const active = counts.active || 0;

    const shouldReject = waiting >= waitingLimit || delayed >= delayedLimit;
    return {
        shouldReject,
        counts: { waiting, delayed, active },
        limits: { waitingLimit, delayedLimit },
    };
}

module.exports = { rejectWhenQueueBacklogged };

