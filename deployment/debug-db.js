const { connectToDb, sql } = require('./db');

async function debugDb() {
    try {
        const pool = await connectToDb();
        console.log("Connected to DB.");

        // Find a user with non-empty email
        const result = await pool.request().query(`
            SELECT TOP 5 Email, Sifre, Ad, Soyad 
            FROM dbo.Uye 
            WHERE Email IS NOT NULL AND Email <> ''
        `);

        console.log("Valid Users Sample:");
        console.log(result.recordset);

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        process.exit();
    }
}

debugDb();
