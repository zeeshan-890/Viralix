require('dotenv').config();

const { bootstrapTracing } = require('./config/tracing');
bootstrapTracing();

process.env.PROCESS_TYPE = process.env.PROCESS_TYPE || 'worker';

const connectDB = require('./config/database');
const { startBackgroundServices } = require('./bootstrap/workers');

connectDB().then(() => {
    startBackgroundServices();
    console.log('✅ Worker process ready');
});
