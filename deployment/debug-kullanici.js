
const { connectToDb } = require('./db');

async function debugKullanici() {
    try {
        const pool = await connectToDb();
        console.log("Connected to DB.");

        console.log("Checking for dbo.Kullanici...");
        const result = await pool.request().query(`
            SELECT TOP 1 * FROM dbo.Kullanici
        `);

        if (result.recordset && result.recordset.length > 0) {
            console.log("dbo.Kullanici exists. First row columns:", Object.keys(result.recordset[0]));
        } else if (result.recordset && result.recordset.length === 0) {
            console.log("dbo.Kullanici exists but is empty.");
            // Get column names via schema query if empty
            const schema = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Kullanici'
            `);
            console.log("Columns:", schema.recordset.map(r => r.COLUMN_NAME));

        } else {
            console.log("Could not confirm dbo.Kullanici existence via SELECT.");
        }
    } catch (err) {
        console.error("Error checking dbo.Kullanici:", err.message);
    } finally {
        process.exit();
    }
}

debugKullanici();
