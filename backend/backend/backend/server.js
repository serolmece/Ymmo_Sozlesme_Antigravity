const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { connectToDb, sql } = require('./db');

// LOGGING DEBUG
function log(msg) {
    console.log(msg);
}

log('Starting server.js...');
log(`Environment: PORT=${process.env.PORT}, NODE_ENV=${process.env.NODE_ENV}`);

const app = express();
const PORT = process.env.PORT || 5003;
const FLAGS_FILE = path.join(__dirname, 'system-flags.json');

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Get System Flags
function getSystemFlags() {
    try {
        if (!fs.existsSync(FLAGS_FILE)) {
            try {
                fs.writeFileSync(FLAGS_FILE, JSON.stringify({ suresindeKilitli: false }));
            } catch (writeErr) {
                console.error("WARNING: Could not write system-flags.json (Permission denied?). Using default flags.", writeErr.message);
                return { suresindeKilitli: false };
            }
        }
        return JSON.parse(fs.readFileSync(FLAGS_FILE, 'utf8'));
    } catch (err) {
        console.error('Error reading flags:', err);
        return { suresindeKilitli: false };
    }
}

// Helper: Sanitize inputs for SQL
function sanitizeValue(value, type) {
    if (value === '' || value === null || value === undefined) {
        if (type === sql.Decimal || type === sql.Int || type === sql.Float) {
            return 0;
        }
        return null;
    }

    // Validate Numbers
    if (type === sql.Decimal || type === sql.Int || type === sql.Float) {
        const num = Number(value);
        if (isNaN(num)) return 0;
        return num;
    }

    return value;
}

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, 'public')));

// ... (skipping to Create/Update logic updates) ...
// NOTE: I am not pasting the entire file, just ensuring the sanitize function is robust.
// The replace_file_content tool needs to target specific chunks.
// Since I already edited sanitizeValue in previous step, I will target the function itself again to be sure.

// Wait, the previous tool call might have already applied changes to server.js in the filesystem.
// I will just read the file properly or overwrite the specific sections carefully.

// Let's rely on the previous state but refine it.
// I'll rewrite the sanitizeValue function first.
app.use(express.static(path.join(__dirname, 'public')));

// API Routes continue below...

// Get System Flags Endpoint
app.get('/api/system-flags', (req, res) => {
    res.json(getSystemFlags());
});

// Toggle Lock Endpoint (For Testing/Admin)
app.post('/api/system-flags/toggle', (req, res) => {
    try {
        const flags = getSystemFlags();
        flags.suresindeKilitli = !flags.suresindeKilitli;
        fs.writeFileSync(FLAGS_FILE, JSON.stringify(flags, null, 2));
        res.json({ success: true, flags });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // LOGGING REQUEST
    console.log('--- Login Request ---');
    console.log('Email:', email);
    console.log('Password provided:', password ? '***' : 'No');

    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        const pool = await connectToDb();

        console.log('Executing query...');
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query('SELECT * FROM dbo.Uye WHERE Email = @email AND Sifre = @password');

        console.log('Query executed.');
        console.log('Rows found:', result.recordset.length);

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            console.log('User found:', user.Ad, user.Soyad);
            const { Sifre, ...userWithoutPassword } = user;
            res.json({ success: true, message: 'Login successful', user: userWithoutPassword });
        } else {
            console.log('No matching user found.');
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error('Login Server Error:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// GET YMM Company Info
app.get('/api/ymm-company-info/:uyeId', async (req, res) => {
    const { uyeId } = req.params;
    console.log('Fetching YMM Company Info for UyeId:', uyeId);

    try {
        const pool = await connectToDb();

        // 1. Get SirketId from dbo.Ortak
        const ortakResult = await pool.request()
            .input('uyeId', sql.Int, uyeId)
            .query('SELECT SirketId FROM dbo.Ortak WHERE UyeId = @uyeId');

        if (ortakResult.recordset.length === 0) {
            console.log('User is not a partner in any company.');
            return res.json({ success: true, data: null });
        }

        const sirketId = ortakResult.recordset[0].SirketId;
        console.log('Found SirketId:', sirketId);

        // 2. Get Company Details from dbo.Sirket
        const sirketResult = await pool.request()
            .input('sirketId', sql.Int, sirketId)
            .query('SELECT Unvan, VergiNo FROM dbo.Sirket WHERE Id = @sirketId');

        if (sirketResult.recordset.length > 0) {
            console.log('Found Company Info:', sirketResult.recordset[0]);
            res.json({ success: true, data: sirketResult.recordset[0] });
        } else {
            console.log('Company details not found for SirketId:', sirketId);
            res.json({ success: true, data: null });
        }

    } catch (err) {
        console.error('YMM Company Info Error:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// Contracts Endpoint
app.get('/api/sozlesmeler', async (req, res) => {
    const { type, uyeId, page = 1, limit = 25, yil } = req.query;
    console.log('Fetching contracts:', { type, uyeId, page, limit, yil });

    if (!uyeId) {
        return res.status(400).json({ success: false, message: 'UyeId is required' });
    }

    try {
        const pool = await connectToDb();
        const offset = (page - 1) * limit;

        // Base Query
        let whereClause = "WHERE UyeId = @uyeId";
        if (type === 'suresinde') {
            whereClause += " AND SozlesmeTuru = N'SÜRESİNDE'";
        } else if (type === 'sure-sonrasi') {
            whereClause += " AND SozlesmeTuru LIKE N'%SONRASI%'";
        } else if (type === 'feshedilen') {
            whereClause += " AND (SozlesmeTuru = N'FESİH' OR SozlesmeTuru = N'FESHEDİLEN' OR FesihTarihi IS NOT NULL)";
        } else if (type === 'kdv-iade') {
            whereClause += " AND SozlesmeTuru LIKE N'%KDV İADE%'";
        } else if (type === 'hizmet') {
            whereClause += " AND SozlesmeTuru LIKE N'%HİZMET%'";
        } else if (type === 'diger') {
            whereClause += " AND SozlesmeTuru LIKE N'%DİĞER%'";
        }

        // Year Filter
        if (yil) {
            whereClause += " AND Yil = @yil";
        }

        // Get Total Count
        const countQuery = `SELECT COUNT(*) as total FROM dbo.Sozlesme ${whereClause}`;
        const countRequest = pool.request().input('uyeId', sql.Int, uyeId);
        if (yil) countRequest.input('yil', sql.Int, yil);

        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total;

        // Get Data
        let dataQuery = `
            SELECT 
                KarsiSirketAdi, KarsiSirketVergiKimlikNo, Mahiyet,
                SozlesmeNo, SozlesmeUcreti, SozlesmeUcretiKdvHaric,
                SozlesmeTarihi, SozlesmeBaslangicTarihi, SozlesmeBitisTarihi,
                SayiNo, Yil, SozlesmeTuru,
                OrtakOlduguSirket, SirketVergiKimlikNo, HisseOrani,
                FirmaninUnvani, FirmaninAdresi, FirmaninVergiDairesi, FirmaninVergiNumarasi,
                UtIlKodu, UtFaaliyetTuru, UtVergiTuru, UtIndirimSecimi,
                UtOncekiYilNetSatis, UtDigerIndirimler, UtDigerIndirimlerAciklamasi,
                UtMatrah, UtIndirimeEsasUcret, UtYoreIndirimi, UtHesaplananUcret,
                UtFaaliyetTuruZammi, UtSmVeyaSmmmIndirimi, UtGrupSirketleriIndirimi, UtKararlastirilanUcret,
                UtFirmaUnvan, UtAdres, UtVergiDairesi, UtVergiNo, UtMuhSorumluAdSoyad, UtMuhSorumluRuhsatNo,
                UtSektorIndirimi, UtSozlesmeHesaplamaDurumu, UtGrupSirketUnvan, UtGrupSirketVergiNo,
                Id
            FROM dbo.Sozlesme
            ${whereClause}
            ORDER BY Id DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        console.log('Executing Contract Query');
        console.log('Query:', dataQuery);
        console.log('Params:', { uyeId, offset, limit, type, yil });

        const request = pool.request()
            .input('uyeId', sql.Int, uyeId)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit);

        if (yil) request.input('yil', sql.Int, yil);

        const result = await request.query(dataQuery);

        console.log(`Found ${result.recordset.length} contracts (Page ${page}).`);

        res.json({
            success: true,
            data: result.recordset,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        console.error('Contracts Error:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// CREATE Contract
app.post('/api/sozlesmeler', async (req, res) => {
    const { UyeId, ...data } = req.body;
    console.log('Creating contract for UyeId:', UyeId);

    // LOCK CHECK
    const flags = getSystemFlags();
    console.log('CREATE Lock Check - Flags:', flags, 'Type:', data.SozlesmeTuru);
    if (flags.suresindeKilitli && data.SozlesmeTuru === 'SÜRESİNDE') {
        return res.status(403).json({ success: false, message: 'Süresinde sözleşme ekleme işlemi şu an kilitlidir.' });
    }

    // YIL CALCULATION
    if (data.SozlesmeTarihi) {
        data.Yil = new Date(data.SozlesmeTarihi).getFullYear();
    } else {
        data.Yil = new Date().getFullYear();
    }

    try {
        const pool = await connectToDb();
        const request = pool.request();

        request.input('UyeId', sql.Int, UyeId);

        // Audit Fields for Create
        const now = new Date();
        const createdBy = data.UserEmail || null;

        request.input('CreatedAt', sql.DateTime, now);
        request.input('CreatedBy', sql.NVarChar, createdBy);

        // Define fields to insert
        const fields = [
            'KarsiSirketAdi', 'KarsiSirketVergiKimlikNo', 'Mahiyet', 'SozlesmeNo',
            'SozlesmeUcreti', 'SozlesmeUcretiKdvHaric', 'SozlesmeTarihi',
            'SozlesmeBaslangicTarihi', 'SozlesmeBitisTarihi', 'SayiNo', 'Yil',
            'SozlesmeTuru', 'OrtakOlduguSirket', 'SirketVergiKimlikNo', 'HisseOrani',
            'FirmaninUnvani', 'FirmaninAdresi', 'FirmaninVergiDairesi', 'FirmaninVergiNumarasi',
            'UtIlKodu', 'UtFaaliyetTuru', 'UtVergiTuru', 'UtIndirimSecimi',
            'UtOncekiYilNetSatis', 'UtDigerIndirimler', 'UtDigerIndirimlerAciklamasi',
            'UtMatrah', 'UtIndirimeEsasUcret', 'UtYoreIndirimi', 'UtHesaplananUcret',
            'UtFaaliyetTuruZammi', 'UtSmVeyaSmmmIndirimi', 'UtGrupSirketleriIndirimi', 'UtKararlastirilanUcret',
            'UtFirmaUnvan', 'UtAdres', 'UtVergiDairesi', 'UtVergiNo', 'UtMuhSorumluAdSoyad', 'UtMuhSorumluRuhsatNo',
            'UtSektorIndirimi', 'UtSozlesmeHesaplamaDurumu', 'UtGrupSirketUnvan', 'UtGrupSirketVergiNo'
        ];

        let columns = ['UyeId', 'CreatedAt', 'CreatedBy'];
        let values = ['@UyeId', '@CreatedAt', '@CreatedBy'];

        fields.forEach(field => {
            if (data[field] !== undefined) {
                // Determine Type
                let type = sql.NVarChar;
                if (['SozlesmeUcreti', 'SozlesmeUcretiKdvHaric'].includes(field)) type = sql.Decimal(18, 2);

                // Add Decimal types for Ut fields
                if ([
                    'UtOncekiYilNetSatis', 'UtMatrah', 'UtIndirimeEsasUcret', 'UtYoreIndirimi',
                    'UtHesaplananUcret', 'UtFaaliyetTuruZammi', 'UtSmVeyaSmmmIndirimi',
                    'UtGrupSirketleriIndirimi', 'UtDigerIndirimler', 'UtKararlastirilanUcret',
                    'UtSektorIndirimi'
                ].includes(field)) type = sql.Decimal(18, 2);

                if (field.includes('Tarih')) type = sql.DateTime;
                if (field === 'Yil') type = sql.Int;

                // Add Int types for Ut fields
                if (['UtIlKodu', 'UtFaaliyetTuru', 'UtVergiTuru', 'UtIndirimSecimi'].includes(field)) type = sql.Int;

                // SANITIZE
                const sanitizedValue = sanitizeValue(data[field], type);

                request.input(field, type, sanitizedValue);
                columns.push(field);
                values.push(`@${field}`);
            }
        });

        const query = `INSERT INTO dbo.Sozlesme (${columns.join(', ')}) VALUES (${values.join(', ')})`;
        console.log('Insert Query:', query);

        await request.query(query);
        res.json({ success: true, message: 'Sözleşme oluşturuldu.' });

    } catch (err) {
        console.error('Create Contract Error:', err);
        res.status(500).json({ success: false, message: 'DB Error: ' + err.message });
    }
});

// UPDATE Contract
app.put('/api/sozlesmeler/:id', async (req, res) => {
    const { id } = req.params;
    const { UyeId, ...data } = req.body;
    console.log('Updating contract:', id);

    // YIL CALCULATION
    if (data.SozlesmeTarihi) {
        data.Yil = new Date(data.SozlesmeTarihi).getFullYear();
    }

    try {
        const pool = await connectToDb();

        // CHECK EXISTING RECORD (Lock & Year Restriction)
        const checkQuery = await pool.request().input('Id', sql.Int, id).query('SELECT SozlesmeTuru, Yil FROM dbo.Sozlesme WHERE Id = @Id');

        if (checkQuery.recordset.length > 0) {
            const existing = checkQuery.recordset[0];

            // 1. Historical Data Lock (Older than 2026)
            if (existing.Yil < 2026) {
                return res.status(403).json({ success: false, message: '2026 yılından önceki sözleşmeler kilitlidir. Değişiklik yapılamaz.' });
            }

            // 2. System Flag Lock
            const flags = getSystemFlags();
            if (flags.suresindeKilitli && existing.SozlesmeTuru === 'SÜRESİNDE') {
                return res.status(403).json({ success: false, message: 'Süresinde sözleşme güncelleme işlemi şu an kilitlidir.' });
            }
        }

        const request = pool.request();
        request.input('Id', sql.Int, id);

        // Audit Fields for Update
        const now = new Date();
        const updatedBy = data.UserEmail || null;

        request.input('UpdatedAt', sql.DateTime, now);
        request.input('UpdatedBy', sql.NVarChar, updatedBy);

        const setClauses = ['UpdatedAt = @UpdatedAt', 'UpdatedBy = @UpdatedBy'];

        const fields = [
            'KarsiSirketAdi', 'KarsiSirketVergiKimlikNo', 'Mahiyet', 'SozlesmeNo',
            'SozlesmeUcreti', 'SozlesmeUcretiKdvHaric', 'SozlesmeTarihi',
            'SozlesmeBaslangicTarihi', 'SozlesmeBitisTarihi', 'SayiNo', 'Yil',
            'SozlesmeTuru', 'OrtakOlduguSirket', 'SirketVergiKimlikNo', 'HisseOrani',
            'FirmaninUnvani', 'FirmaninAdresi', 'FirmaninVergiDairesi', 'FirmaninVergiNumarasi',
            'UtIlKodu', 'UtFaaliyetTuru', 'UtVergiTuru', 'UtIndirimSecimi',
            'UtOncekiYilNetSatis', 'UtDigerIndirimler', 'UtDigerIndirimlerAciklamasi',
            'UtMatrah', 'UtIndirimeEsasUcret', 'UtYoreIndirimi', 'UtHesaplananUcret',
            'UtFaaliyetTuruZammi', 'UtSmVeyaSmmmIndirimi', 'UtGrupSirketleriIndirimi', 'UtKararlastirilanUcret',
            'UtFirmaUnvan', 'UtAdres', 'UtVergiDairesi', 'UtVergiNo', 'UtMuhSorumluAdSoyad', 'UtMuhSorumluRuhsatNo',
            'UtSektorIndirimi', 'UtSozlesmeHesaplamaDurumu', 'UtGrupSirketUnvan', 'UtGrupSirketVergiNo'
        ];

        fields.forEach(field => {
            if (data[field] !== undefined) {
                let type = sql.NVarChar;
                if (['SozlesmeUcreti', 'SozlesmeUcretiKdvHaric'].includes(field)) type = sql.Decimal(18, 2);

                // Add Decimal types for Ut fields
                if ([
                    'UtOncekiYilNetSatis', 'UtMatrah', 'UtIndirimeEsasUcret', 'UtYoreIndirimi',
                    'UtHesaplananUcret', 'UtFaaliyetTuruZammi', 'UtSmVeyaSmmmIndirimi',
                    'UtGrupSirketleriIndirimi', 'UtDigerIndirimler', 'UtKararlastirilanUcret',
                    'UtSektorIndirimi'
                ].includes(field)) type = sql.Decimal(18, 2);

                if (field.includes('Tarih')) type = sql.DateTime;
                if (field === 'Yil') type = sql.Int;

                // Add Int types for Ut fields
                if (['UtIlKodu', 'UtFaaliyetTuru', 'UtVergiTuru', 'UtIndirimSecimi'].includes(field)) type = sql.Int;

                // SANITIZE
                const sanitizedValue = sanitizeValue(data[field], type);

                request.input(field, type, sanitizedValue);
                setClauses.push(`${field} = @${field}`);
            }
        });

        const query = `UPDATE dbo.Sozlesme SET ${setClauses.join(', ')} WHERE Id = @Id`;
        await request.query(query);
        res.json({ success: true, message: 'Sözleşme güncellendi.' });

    } catch (err) {
        console.error('Update Contract Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE Contract
app.delete('/api/sozlesmeler/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Deleting contract:', id);

    try {
        const pool = await connectToDb();

        // CHECK EXISTING RECORD (Lock & Year Restriction)
        const checkQuery = await pool.request().input('Id', sql.Int, id).query('SELECT SozlesmeTuru, Yil FROM dbo.Sozlesme WHERE Id = @Id');

        if (checkQuery.recordset.length > 0) {
            const existing = checkQuery.recordset[0];

            // 1. Historical Data Lock (Older than 2026)
            if (existing.Yil < 2026) {
                return res.status(403).json({ success: false, message: '2026 yılından önceki sözleşmeler kilitlidir. Silme işlemi yapılamaz.' });
            }

            // 2. System Flag Lock
            const flags = getSystemFlags();
            if (flags.suresindeKilitli && existing.SozlesmeTuru === 'SÜRESİNDE') {
                return res.status(403).json({ success: false, message: 'Süresinde sözleşme silme işlemi şu an kilitlidir.' });
            }
        }

        await pool.request()
            .input('Id', sql.Int, id)
            .query('DELETE FROM dbo.Sozlesme WHERE Id = @Id');

        res.json({ success: true, message: 'Sözleşme silindi.' });
    } catch (err) {
        console.error('Delete Contract Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});



// TEMP DEBUG USERS
app.get('/api/debug/users', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query("SELECT TOP 1 * FROM dbo.Uye WHERE Email LIKE '%@%' AND Sifre IS NOT NULL");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json(err);
    }
});

// TEMP DEBUG AUDIT
app.get('/api/debug/audit', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query("SELECT TOP 5 Id, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, SozlesmeTuru FROM dbo.Sozlesme ORDER BY UpdatedAt DESC, CreatedAt DESC");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json(err);
    }
});



// React Client Side Routing Catch-All
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
// Start Server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // Attempt DB connection but don't crash if it fails
    // The individual API routes will try to connect anyway if the pool isn't ready
    try {
        await connectToDb();
        console.log("Initial Database Connection Successful");
    } catch (err) {
        console.error("WARNING: Initial DB connection failed (Server will stay running):", err.message);
    }
});
