const { connectToDb, sql } = require('./db');

async function debugKdv() {
    try {
        const pool = await connectToDb();
        console.log("Connected to DB.");

        const uyeId = 186;

        // 1. Check strict match
        console.log("--- Strict Match 'KDV İADESİ' ---");
        const strictMatch = await pool.request()
            .input('uyeId', sql.Int, uyeId)
            .query("SELECT Count(*) as Count FROM dbo.Sozlesme WHERE UyeId = @uyeId AND SozlesmeTuru = 'KDV İADESİ'");
        console.log("Strict Count:", strictMatch.recordset[0].Count);

        // 2. Check LIKE match
        console.log("--- LIKE Match '%KDV İADE%' ---");
        const likeMatch = await pool.request()
            .input('uyeId', sql.Int, uyeId)
            .query("SELECT Id, SozlesmeTuru FROM dbo.Sozlesme WHERE UyeId = @uyeId AND SozlesmeTuru LIKE '%KDV İADE%'");
        console.log("LIKE Count:", likeMatch.recordset.length);
        console.log("LIKE Samples:", likeMatch.recordset.slice(0, 5));

        // 3. Check broad LIKE '%KDV%' to see if there are encoding issues
        console.log("--- Broad Match '%KDV%' ---");
        const broadMatch = await pool.request()
            .input('uyeId', sql.Int, uyeId)
            .query("SELECT Id, SozlesmeTuru FROM dbo.Sozlesme WHERE UyeId = @uyeId AND SozlesmeTuru LIKE '%KDV%'");
        console.log("Broad Count:", broadMatch.recordset.length);
        if (broadMatch.recordset.length > 0) {
            console.log("Broad Samples:", broadMatch.recordset.slice(0, 5));
        }

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        process.exit();
    }
}

debugKdv();
