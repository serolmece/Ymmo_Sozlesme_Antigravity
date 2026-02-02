
const { connectToDb, sql } = require('./db');

async function checkColumns() {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Sozlesme'
        `);
        console.log("Columns in Sozlesme table:");
        result.recordset.forEach(row => console.log(row.COLUMN_NAME));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkColumns();
