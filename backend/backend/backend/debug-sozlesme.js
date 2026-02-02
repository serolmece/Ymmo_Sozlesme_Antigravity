const { connectToDb, sql } = require('./db');

async function debugSozlesme() {
    try {
        const pool = await connectToDb();
        console.log("Connected to DB.");

        // Get top 1 row to see data examples
        const result = await pool.request().query(`
            SELECT TOP 5 * FROM dbo.Sozlesme
        `);

        console.log("Sozlesme Sample Data:");
        console.log(result.recordset);

        // Get column names to ensure we have the right ones
        const schemaReq = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Sozlesme' AND TABLE_SCHEMA = 'dbo'
        `);
        console.log("Schema Columns:", schemaReq.recordset.map(c => c.COLUMN_NAME));

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        process.exit();
    }
}

debugSozlesme();
