const mongoose = require('mongoose');

let isConnected = false;
let readConnection = null;

const baseOptions = {
    serverSelectionTimeoutMS: 10000,
};

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
            const conn = await mongoose.connect(process.env.MONGODB_URI, baseOptions);
            isConnected = true;
            console.log(`📅 MongoDB Connected: ${conn.connection.host}`);
            if (process.env.SKIP_INDEX_ENSURE !== '1') {
                const { ensureDatabaseIndexes } = require('./ensureIndexes');
                const indexResults = await ensureDatabaseIndexes();
                const failed = indexResults.filter((item) => !item.ok);
                if (failed.length > 0) {
                    console.warn('⚠️ Some MongoDB indexes failed to ensure:', failed.map((f) => f.model).join(', '));
                } else {
                    console.log(`📇 MongoDB indexes ensured for ${indexResults.length} models`);
                }
            }
            break;
        } catch (error) {
            console.error(`❌ Database connection attempt ${attempt}/${maxAttempts} failed:`, error.message);
            if (attempt < maxAttempts) {
                const delay = attempt * 2000;
                console.log(`   Retrying in ${delay / 1000}s...`);
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }

    if (!isConnected) {
        console.error('❌ Could not connect to MongoDB after multiple attempts.');
        console.error('   Check MONGODB_URI, Atlas IP allowlist (0.0.0.0/0), and cluster status.');
        return;
    }

    if (process.env.MONGODB_READ_URI) {
        try {
            readConnection = mongoose.createConnection(process.env.MONGODB_READ_URI, baseOptions);
            readConnection.on('connected', () => {
                console.log(`📖 MongoDB Read Replica Connected: ${readConnection.host}`);
            });
            readConnection.on('error', (error) => {
                console.error('❌ MongoDB read replica connection error:', error.message);
            });
            await readConnection.asPromise();
        } catch (error) {
            console.error('❌ MongoDB read replica connection failed:', error.message);
            readConnection = null;
        }
    }
};

function getReadConnection() {
    return readConnection || mongoose.connection;
}

function getDbStatus() {
    if (!process.env.MONGODB_URI) return 'not_configured';
    if (isConnected && mongoose.connection.readyState === 1) return 'connected';
    return 'disconnected';
}

function getReadDbStatus() {
    if (!process.env.MONGODB_READ_URI) return 'not_configured';
    if (readConnection && readConnection.readyState === 1) return 'connected';
    if (readConnection) return 'disconnected';
    return 'not_configured';
}

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
module.exports.getReadConnection = getReadConnection;
module.exports.getReadDbStatus = getReadDbStatus;
