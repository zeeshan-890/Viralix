const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.log('⚠️  MongoDB URI not provided. Running in mock mode for development.');
            console.log('📄 To use real database, set MONGODB_URI in your .env file');
            return;
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`📅 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        console.log('⚠️  Continuing in mock mode. Some features may be limited.');
        // Don't exit process in development, allow the app to run without DB
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
