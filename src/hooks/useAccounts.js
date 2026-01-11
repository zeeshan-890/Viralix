import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/**
 * Hook to manage social accounts state and actions
 */
export function useAccounts() {
    const queryClient = useQueryClient();

    // Fetch accounts query
    const query = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            // Assuming api.get returns { success, data: accounts } or similar
            // Adjust based on your actual API response structure
            // Example: await api.get('/oauth/status') -> returns { connected, accounts: [...] }
            // This logic unifies fetch across providers if needed or just fetches status

            // Since we have separate endpoints per platform in current API, 
            // we might want to aggregate them or use the new consolidated AccountService endpoints if available.
            // For now, let's fetch individual statuses and merge them, OR 
            // if you have a unified endpoint use that.
            // Based on server.js: 
            // - /api/instagram-oauth/status
            // - /api/tiktok-oauth/status
            // - /api/youtube-oauth/status

            const [ig, tt, yt] = await Promise.allSettled([
                api.get('/instagram-oauth/status'),
                api.get('/tiktok-oauth/status'),
                api.get('/youtube-oauth/status')
            ]);

            const accounts = [];
            if (ig.status === 'fulfilled' && ig.value.data.connected) {
                accounts.push(...ig.value.data.accounts.map(a => ({ ...a, platform: 'instagram' })));
            }
            if (tt.status === 'fulfilled' && tt.value.data.connected) {
                accounts.push(...tt.value.data.accounts.map(a => ({ ...a, platform: 'tiktok' })));
            }
            if (yt.status === 'fulfilled' && yt.value.data.connected) {
                accounts.push(...yt.value.data.accounts.map(a => ({ ...a, platform: 'youtube' })));
            }

            return accounts;
        }
    });

    // Connect Mutation (URL generation)
    // Usually this is just a redirect, so maybe not strictly a mutation unless it posts something
    // But disconnecting is definitely a mutation.

    const disconnectMutation = useMutation({
        mutationFn: async ({ platform, accountId }) => {
            // Map platform to endpoint
            let endpoint = '';
            if (platform === 'instagram') endpoint = `/instagram-oauth/disconnect/${accountId}`;
            if (platform === 'tiktok') endpoint = `/tiktok-oauth/disconnect/${accountId}`;
            if (platform === 'youtube') endpoint = `/youtube-oauth/disconnect/${accountId}`;

            if (!endpoint) throw new Error(`Unknown platform: ${platform}`);

            return await api.delete(endpoint);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['accounts']);
        }
    });

    return {
        accounts: query.data || [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        disconnect: disconnectMutation.mutate,
        isDisconnecting: disconnectMutation.isPending
    };
}
