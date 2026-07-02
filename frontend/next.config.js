/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|webp|gif|ico|woff|woff2)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.ggpht.com',
            },
            {
                protocol: 'https',
                hostname: '**.fbsbx.com',
            },
            {
                protocol: 'https',
                hostname: '**.fbcdn.net',
            },
            {
                protocol: 'https',
                hostname: '**.cdninstagram.com',
            },
            {
                protocol: 'https',
                hostname: '**.tiktokcdn.com',
            },
            {
                protocol: 'https',
                hostname: '**.tiktokcdn-us.com',
            },
            {
                protocol: 'https',
                hostname: '**.tiktokv.com',
            },
            {
                protocol: 'https',
                hostname: '**.ytimg.com',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },
}

module.exports = nextConfig
