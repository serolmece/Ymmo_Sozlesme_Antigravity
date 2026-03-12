const { connectToDb } = require('./db');
async function test() {
    try {
        const pool = await connectToDb();
        const request = pool.request();
        let result = await request.query("SELECT TOP 1 * FROM dbo.Sozlesme");
        console.log("Sozlesme Columns:", Object.keys(result.recordset[0]));
        console.log("Sozlesme Sample:", result.recordset);
    } catch (err) { console.error(err); }
    process.exit(0);
}
test();
