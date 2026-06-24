import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facebookAPI, instagramOAuthAPI, tiktokAPI, youtubeAPI, platformsAPI } from '../lib/api';

/**
 * Hook to manage social accounts state and actions
 */
export function useAccounts() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const response = await platformsAPI.getConnected();
            return (response.data?.accounts || []).map((a) => ({
                ...a,
                platformAccountId: a.platformAccountId || a.accountId,
                followerCount: a.followerCount ?? a.metadata?.followersCount ?? 0,
                username: a.username ?? a.metadata?.username,
            }));
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: async ({ platform, accountId }) => {
            if (platform === 'facebook') {
                return facebookAPI.disconnect();
            }
            if (platform === 'instagram') return instagramOAuthAPI.disconnect(accountId);
            if (platform === 'tiktok') return tiktokAPI.disconnect(accountId);
            if (platform === 'youtube') return youtubeAPI.disconnect(accountId);
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
