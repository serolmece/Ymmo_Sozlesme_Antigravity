const { connectToDb, sql } = require('./db');

async function test() {
    try {
        const pool = await connectToDb();
        const request = pool.request();
        // Mock query logic from server.js for purchased-counts
        
        let whereClause = "WHERE DO.paymentCompleted = 1 AND DO.documentType_Id IN (1151, 1152)";
        request.input('startDate', sql.NVarChar, '2025-10-01T00:00:00.000');
        request.input('endDate', sql.NVarChar, '2026-03-04T23:59:59.999');
        whereClause += " AND DO.createdAt BETWEEN @startDate AND @endDate";
        request.input('contractType', sql.NVarChar, '35-A  Denetim ve Tasdik Sözleşmesi');
        whereClause += " AND DT.name = @contractType";

        const query = `
            WITH AlinanSirketUye AS (
                SELECT 
                    DO.Id,
                    U.Id AS UyeId,
                    U.Ad, U.Soyad,
                    S.Id AS SirketId,
                    S.Unvan AS SirketUnvan,
                    DT.name AS SozlesmeTuru,
                    CASE WHEN DO.documentType_Id = 1151 THEN 'SÜRESİNDE'
                         WHEN DO.documentType_Id = 1152 THEN 'SÜRE SONRASI'
                         ELSE DT.name END AS BildirilenTuru
                FROM odam.DocumentOrder DO
                LEFT JOIN dbo.Uye U ON DO.uye_Id = U.Id
                LEFT JOIN dbo.Sirket S ON DO.sirket_Id = S.Id
                LEFT JOIN dbo.DocumentType DT ON DO.documentType_Id = DT.Id
                ${whereClause}
            ),
            AlinanGrouped AS (
                SELECT 
                    UyeId,
                    SirketId,
                    SirketUnvan,
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
                    UyeId, SirketId, SirketUnvan, Ad, Soyad, SozlesmeTuru, BildirilenTuru
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
                        ((A.UyeId IS NOT NULL AND SZ.UyeId = A.UyeId) 
                        OR (A.UyeId IS NULL AND A.SirketUnvan IS NOT NULL AND SZ.OrtakOlduguSirket LIKE '%' + A.SirketUnvan + '%'))
                        AND SZ.SozlesmeTuru = A.BildirilenTuru
                        AND SZ.CreatedAt BETWEEN @startDate AND @endDate
                ) AS BildirenAdet
            FROM AlinanGrouped A
            ORDER BY A.UyeAd ASC, A.SozlesmeTuru ASC
        `;

        let result = await request.query(query);
        console.log("Result sample:", result.recordset.slice(0, 5));
    } catch (err) { console.error(err); }
    process.exit(0);
}
test();
