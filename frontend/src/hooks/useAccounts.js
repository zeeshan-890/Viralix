import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Hook to manage social accounts state and actions
 */
export function useAccounts() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const { platformsAPI } = await import('../lib/api');
            const response = await platformsAPI.getConnected();
            return response.data?.accounts || [];
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: async ({ platform, accountId }) => {
            if (platform === 'facebook') {
                return await api.delete('/facebook/disconnect');
            }
            if (platform === 'instagram') return await api.delete(`/instagram-oauth/disconnect/${accountId}`);
            if (platform === 'tiktok') return await api.delete(`/tiktok-oauth/disconnect/${accountId}`);
            if (platform === 'youtube') return await api.delete(`/youtube-oauth/disconnect/${accountId}`);
            throw new Error(`Unknown platform: ${platform}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });

    return {
        accounts: query.data || [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        disconnect: disconnectMutation.mutate,
        isDisconnecting: disconnectMutation.isPending,
    };
}
