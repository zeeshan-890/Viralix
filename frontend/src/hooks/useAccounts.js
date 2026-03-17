import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Hook to manage social accounts state and actions
 */
export function useAccounts() {
    const queryClient = useQueryClient();

    // Fetch accounts query
    const query = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const { platformsAPI } = await import('../lib/api');
            const response = await platformsAPI.getConnected();
            return response.data?.accounts || [];
        }
    });

    // Connect Mutation (URL generation)
    // Usually this is just a redirect, so maybe not strictly a mutation unless it posts something
    // But disconnecting is definitely a mutation.

    const disconnectMutation = useMutation({
        mutationFn: async ({ platform, accountId }) => {
            console.log('[useAccounts] Disconnect requested:', { platform, accountId });
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
