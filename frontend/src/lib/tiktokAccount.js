/** Resolve TikTok open_id / platform account id from API or hook account objects */
export function getTikTokAccountId(account) {
    if (!account) return null;
    return account.platformAccountId || account.accountId || null;
}

export function inferTikTokIsPublic(info) {
    if (!info) return null;
    if (typeof info.isPrivateAccount === 'boolean') return !info.isPrivateAccount;
    const opts = info.privacyLevelOptions || [];
    return opts.some((o) => {
        const v = typeof o === 'string' ? o : o?.value;
        return v === 'PUBLIC_TO_EVERYONE';
    });
}
