const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI is not set. API will run but database features will fail.');
        if (process.env.NODE_ENV === 'production') {
            console.error('   Set MONGODB_URI in Heroku: heroku config:set MONGODB_URI="mongodb+srv://..." -a YOUR_APP');
        }
        return;
    }

    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000,
            });
            isConnected = true;
            console.log(`📅 MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (error) {
            console.error(`❌ Database connection attempt ${attempt}/${maxAttempts} failed:`, error.message);
            if (attempt < maxAttempts) {
                const delay = attempt * 2000;
                console.log(`   Retrying in ${delay / 1000}s...`);
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }

    console.error('❌ Could not connect to MongoDB after multiple attempts.');
    console.error('   Check MONGODB_URI, Atlas IP allowlist (0.0.0.0/0), and cluster status.');
    // Do not exit — keep the HTTP server alive so Heroku health checks and logs work.
};

function getDbStatus() {
    if (!process.env.MONGODB_URI) return 'not_configured';
    if (isConnected && mongoose.connection.readyState === 1) return 'connected';
    return 'disconnected';
}

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
