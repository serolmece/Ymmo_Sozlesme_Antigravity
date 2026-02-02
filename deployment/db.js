const sql = require('mssql');
const path = require('path');
const fs = require('fs');

// Attempt to load .env
const envPath = path.join(__dirname, '.env');
console.log("Loading .env from:", envPath);

// 1. Try standard dotenv
require('dotenv').config({ path: envPath });

// 2. Manual fallback if DB_SERVER is missing (common IISNode issue)
if (!process.env.DB_SERVER && fs.existsSync(envPath)) {
    console.log("Standard dotenv failed. Parsing .env manually...");
    try {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split(/\r?\n/).forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                if (key && value && !key.startsWith('#')) {
                    // CRITICAL: Do NOT overwrite PORT if it's already set (IISNode sets a named pipe)
                    if (key === 'PORT' && process.env.PORT) {
                        return;
                    }
                    process.env[key] = value;
                }
            }
        });
    } catch (e) {
        console.error("Manual .env parsing failed:", e);
    }
}

// 3. Fallback Defaults (User provided)
const DB_SERVER = process.env.DB_SERVER || '213.142.137.166';
const DB_USER = process.env.DB_USER || 'Aa_Sozlesme';
const DB_NAME = process.env.DB_NAME || 'Aa';
// Do NOT fallback password for security, but ensure it's checked
const DB_PASSWORD = process.env.DB_PASSWORD;

console.log("DB Config State:", {
    server: DB_SERVER,
    user: DB_USER,
    database: DB_NAME,
    hasPassword: !!DB_PASSWORD
});

const config = {
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_SERVER,
    database: DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function connectToDb() {
    try {
        if (!config.server) {
            throw new Error("DB_SERVER is missing in config!");
        }
        if (!config.password) {
            throw new Error("DB_PASSWORD is missing! Check .env file.");
        }

        let pool = await sql.connect(config);
        console.log("Connected to MSSQL Database at", config.server);
        return pool;
    } catch (err) {
        console.error("Database Connection Failed!", err);
        throw err;
    }
}

module.exports = {
    connectToDb,
    sql
};
