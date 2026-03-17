const FacebookPublisher = require('./facebook.publisher');
const InstagramPublisher = require('./instagram.publisher');
const TikTokPublisher = require('./tiktok.publisher');
const YouTubePublisher = require('./youtube.publisher');

class PublisherFactory {
    static getPublisher(user, platformName) {
        switch (platformName.toLowerCase()) {
            case 'facebook':
                return new FacebookPublisher(user);
            case 'instagram':
                return new InstagramPublisher(user);
            case 'tiktok':
                return new TikTokPublisher(user);
            case 'youtube':
                return new YouTubePublisher(user);
            default:
                throw new Error(`Unsupported platform: ${platformName}`);
        }
    }
}

module.exports = PublisherFactory;
