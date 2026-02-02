const { connectToDb, sql } = require('./db');
require('dotenv').config();

async function checkColumns() {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Sozlesme'
        `);
        console.log('Columns in Sozlesme table:');
        result.recordset.forEach(row => {
            console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkColumns();
