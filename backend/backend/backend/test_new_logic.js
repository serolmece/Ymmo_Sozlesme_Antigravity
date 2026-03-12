const { connectToDb, sql } = require('./db');

async function test() {
    try {
        const pool = await connectToDb();
        const request = pool.request();
        // Mock query logic from server.js for purchased-counts
        
        const query = `
            WITH AlinanSirketUye AS (
                SELECT 
                    DO.Id,
                    U.Id AS UyeId,
                    U.Ad, U.Soyad,
                    S.Id AS SirketId,
                    S.Unvan AS SirketUnvan,
                    S.VergiNo AS SirketVergiNo,
                    DT.name AS SozlesmeTuru,
                    CASE WHEN DO.documentType_Id = 1151 THEN 'SÜRESİNDE'
                         WHEN DO.documentType_Id = 1152 THEN 'SÜRE SONRASI'
                         ELSE DT.name END AS BildirilenTuru
                FROM odam.DocumentOrder DO
                LEFT JOIN dbo.Uye U ON DO.uye_Id = U.Id
                LEFT JOIN dbo.Sirket S ON DO.sirket_Id = S.Id
                LEFT JOIN dbo.DocumentType DT ON DO.documentType_Id = DT.Id
                WHERE DO.paymentCompleted = 1 AND DO.documentType_Id IN (1151, 1152)
                AND DO.createdAt >= '2025-10-01T00:00:00.000'
                AND DO.createdAt <= '2026-03-04T23:59:59.999'
            ),
            AlinanGrouped AS (
                SELECT 
                    UyeId,
                    SirketId,
                    SirketUnvan,
                    SirketVergiNo,
                    COALESCE(
                        NULLIF(LTRIM(RTRIM(ISNULL(Ad, '') + ' ' + ISNULL(Soyad, ''))), ''),
                        NULLIF(LTRIM(RTRIM(SirketUnvan)), ''),
                        'Tanımsız veya Boş Kayıt'
                    ) AS UyeAd, 
                    '' AS UyeSoyad, 
                    SozlesmeTuru,
                    BildirilenTuru,
                    COUNT(*) as Adet
                FROM AlinanSirketUye
                GROUP BY 
                    UyeId, SirketId, SirketUnvan, SirketVergiNo, Ad, Soyad, SozlesmeTuru, BildirilenTuru
            )
            SELECT 
                A.UyeAd, 
                A.UyeSoyad, 
                A.SozlesmeTuru, 
                A.Adet,
                (
                    SELECT COUNT(*)
                    FROM dbo.Sozlesme SZ
                    WHERE 
                        (
                            (A.SirketId IS NOT NULL AND A.SirketVergiNo IS NOT NULL AND NULLIF(LTRIM(RTRIM(SZ.SirketVergiKimlikNo)), '') IS NOT NULL AND REPLACE(SZ.SirketVergiKimlikNo, ' ', '') = REPLACE(A.SirketVergiNo, ' ', ''))
                            OR 
                            (A.SirketId IS NULL AND A.UyeId IS NOT NULL AND SZ.UyeId = A.UyeId AND NULLIF(LTRIM(RTRIM(SZ.SirketVergiKimlikNo)), '') IS NULL)
                        )
                        AND SZ.SozlesmeTuru = A.BildirilenTuru
                        AND SZ.CreatedAt >= '2025-10-01T00:00:00.000'
                        AND SZ.CreatedAt <= '2026-03-04T23:59:59.999'
                ) AS BildirenAdet
            FROM AlinanGrouped A
            ORDER BY A.UyeAd ASC, A.SozlesmeTuru ASC
        `;

        let result = await request.query(query);
        console.log("Found:", result.recordset.length);
        console.log("Sample:", result.recordset.slice(20, 25));
    } catch (err) { console.error(err); }
    process.exit(0);
}
test();
