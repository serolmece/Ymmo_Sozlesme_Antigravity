const { connectToDb } = require('./db');

async function test() {
    try {
        const pool = await connectToDb();
        const request = pool.request();
        
        const resAlinan = await request.query(`
            SELECT 
                DO.uye_Id AS AlinanUyeId,
                DO.sirket_Id AS AlinanSirketId,
                U.Ad AS UyeAd,
                U.Soyad AS UyeSoyad,
                S.Unvan,
                DT.name AS SozlesmeTuru, 
                COUNT(*) as Adet
            FROM odam.DocumentOrder DO
            LEFT JOIN dbo.Uye U ON DO.uye_Id = U.Id
            LEFT JOIN dbo.Sirket S ON DO.sirket_Id = S.Id
            LEFT JOIN dbo.DocumentType DT ON DO.documentType_Id = DT.Id
            WHERE DO.paymentCompleted = 1 AND DO.documentType_Id IN (1151, 1152)
              AND (S.Unvan LIKE '%ZEN BAĞIMSIZ%' OR U.Ad LIKE '%YAŞAR%')
            GROUP BY DO.uye_Id, DO.sirket_Id, U.Ad, U.Soyad, S.Unvan, DT.name
        `);
        
        console.log("ALINAN (Sistemden Belge Saticisi - DocumentOrder):");
        console.table(resAlinan.recordset);

        const resBildirilen = await request.query(`
            SELECT 
                Soz.UyeId,
                Soz.OrtakOlduguSirket,
                U.Ad AS UyeAd,
                U.Soyad AS UyeSoyad,
                Soz.SozlesmeTuru,
                COUNT(*) as Adet
            FROM dbo.Sozlesme Soz
            LEFT JOIN dbo.Uye U ON Soz.UyeId = U.Id
            WHERE Soz.SozlesmeTuru IN ('SÜRESİNDE', 'SÜRE SONRASI')
              AND (Soz.OrtakOlduguSirket LIKE '%ZEN BAĞIMSIZ%' OR U.Ad LIKE '%YAŞAR%')
            GROUP BY Soz.UyeId, Soz.OrtakOlduguSirket, U.Ad, U.Soyad, Soz.SozlesmeTuru
        `);
        
        console.log("BİLDIRILEN (Sisteme Beyan - Sozlesme):");
        console.table(resBildirilen.recordset);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
test();
