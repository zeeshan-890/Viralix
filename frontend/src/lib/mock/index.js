import { handleMockRequest } from './handlers';
import { MOCK_TOKEN } from './fixtures';
import { getMockStore } from './store';

/** Mock mode is ON by default; set NEXT_PUBLIC_USE_MOCK_DATA=false to use real API */
export function isMockMode() {
    return process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
}

/** Ensure demo auth token exists so dashboard loads without login */
export function ensureMockAuth() {
    if (typeof window === 'undefined' || !isMockMode()) return;
    if (!localStorage.getItem('auth_token')) {
        localStorage.setItem('auth_token', MOCK_TOKEN);
    }
    const store = getMockStore();
    if (!localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(store.user));
    }
}

/**
 * Route all axios requests through mock handlers (no network).
 * @param {import('axios').AxiosInstance} axiosInstance
 */
export function setupMockAdapter(axiosInstance) {
    if (!isMockMode()) return;

    axiosInstance.interceptors.request.use((config) => {
        config.adapter = async (cfg) => {
            try {
                const data = await handleMockRequest(cfg);
                return {
                    data,
                    status: 200,
                    statusText: 'OK',
                    headers: { 'content-type': 'application/json' },
                    config: cfg,
                    request: {},
                };
            } catch (err) {
                return Promise.reject(err);
            }
        };
        return config;
    });
}

export { isMockMode as USE_MOCK_DATA };
