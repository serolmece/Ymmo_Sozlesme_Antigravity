const { connectToDb } = require('./db');

async function test() {
    try {
        const pool = await connectToDb();
        const request = pool.request();

        let result = await request.query("SELECT TOP 5 Uye_Id, OrtakOlduguSirket, SozlesmeTuru FROM dbo.Sozlesme WHERE SozlesmeTuru IN ('SÜRESİNDE', 'SÜRE SONRASI')");
        console.log("Sozlesme Sample:", result.recordset);

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
test();
