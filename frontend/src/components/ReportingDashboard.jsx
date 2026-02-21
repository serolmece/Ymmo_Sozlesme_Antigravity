
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Briefcase, BarChart3, TrendingUp, LogOut, FileText, Calendar, Building, List, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

const InfoCard = ({ icon: Icon, label, value, subLabel, color = "blue", fullWidth = false }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className={`bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-white/60 shadow-sm flex items-start space-x-4 ${fullWidth ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}`}
    >
        <div className={`p-4 rounded-lg bg-${color}-100 text-${color}-600`}>
            <Icon size={28} />
        </div>
        <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-800 break-words mt-1">{value || '0'}</p>
            {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
        </div>
    </motion.div>
);


const ReportingDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Filter State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [contractType, setContractType] = useState('HEPSİ');
    const [filteredResults, setFilteredResults] = useState(null);
    const [filterLoading, setFilterLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [pagination, setPagination] = useState(null);

    // Special Reports State
    const [lowFeeStats, setLowFeeStats] = useState(null);
    const [lowFeeLoading, setLowFeeLoading] = useState(false);

    const [activeTab, setActiveTab] = useState('genel');
    const [genelYil, setGenelYil] = useState('HEPSİ');

    useEffect(() => {
        const storedUser = localStorage.getItem('adminUser');
        if (!storedUser) {
            navigate('/raporlama');
            return;
        }
        setUser(JSON.parse(storedUser));

        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/admin/reports', { params: { year: genelYil } });
                setStats(response.data.stats);
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate, genelYil]);

    const fetchFilteredData = async (page = 1) => {
        setFilterLoading(true);
        try {
            const response = await axios.post('/api/admin/reports/detailed', {
                startDate: startDate || null,
                endDate: endDate || null,
                contractType: contractType === 'HEPSİ' ? null : contractType,
                page,
                limit: itemsPerPage
            });
            setFilteredResults(response.data.data);
            setPagination(response.data.pagination);
            setCurrentPage(page);
        } catch (err) {
            console.error("Filter Error:", err);
            alert("Rapor oluşturulurken hata oluştu.");
        } finally {
            setFilterLoading(false);
        }
    };

    const handleFilter = () => {
        if (!startDate) {
            alert("Lütfen Başlangıç Tarihi seçiniz.");
            return;
        }
        fetchFilteredData(1); // Reset to page 1
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
            fetchFilteredData(newPage);
        }
    };

    const handleExport = async () => {
        if (!pagination || pagination.total === 0) {
            alert("Aktarılacak veri bulunmamaktadır.");
            return;
        }

        try {
            // Fetch all data for export
            const response = await axios.post('/api/admin/reports/detailed', {
                startDate: startDate || null,
                endDate: endDate || null,
                contractType: contractType === 'HEPSİ' ? null : contractType,
                page: 1,
                limit: pagination.total // Get all records
            });

            if (response.data.success) {
                const dataToExport = response.data.data.map(item => ({
                    'Sözleşme Tarihi': item.SozlesmeTarihi ? new Date(item.SozlesmeTarihi).toLocaleDateString('tr-TR') : '',
                    'Üye Adı Soyadı': item.UyeAd ? `${item.UyeAd} ${item.UyeSoyad}` : '',
                    'Ortak Olduğu Şirket': item.OrtakOlduguSirket || '',
                    'Firma Ünvanı': item.FirmaninUnvani || item.UtFirmaUnvan,
                    'Sözleşme Türü': item.SozlesmeTuru,
                    'Ücret': item.SozlesmeUcreti,
                    'Vergi No': item.UtVergiNo,
                    'Başlangıç Tarihi': item.SozlesmeBaslangicTarihi ? new Date(item.SozlesmeBaslangicTarihi).toLocaleDateString('tr-TR') : '',
                    'Bitiş Tarihi': item.SozlesmeBitisTarihi ? new Date(item.SozlesmeBitisTarihi).toLocaleDateString('tr-TR') : '',
                    'Oluşturulma Tarihi': new Date(item.CreatedAt).toLocaleDateString('tr-TR')
                }));

                const worksheet = XLSX.utils.json_to_sheet(dataToExport);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");
                XLSX.writeFile(workbook, `Sozlesme_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.xlsx`);
            }
        } catch (err) {
            console.error("Export Error:", err);
            alert("Excel'e aktarılırken hata oluştu.");
        }
    };

    const fetchLowFeeReport = async () => {
        setLowFeeLoading(true);
        try {
            const response = await axios.get('/api/admin/reports/low-fees');
            if (response.data.success) {
                setLowFeeStats(response.data);
            }
        } catch (err) {
            console.error("Low Fee Report Error:", err);
            alert("Rapor alınırken bir hata oluştu.");
        } finally {
            setLowFeeLoading(false);
        }
    };

    const handleLowFeeExport = () => {
        if (!lowFeeStats || !lowFeeStats.data || lowFeeStats.data.length === 0) {
            alert("Aktarılacak veri bulunmamaktadır.");
            return;
        }

        try {
            const dataToExport = lowFeeStats.data.map(item => ({
                'Üye Adı Soyadı': item.UyeAd ? `${item.UyeAd} ${item.UyeSoyad}` : '',
                'Ortak Olduğu Şirket': item.OrtakOlduguSirket || '',
                'Firma Ünvanı': item.FirmaninUnvani || item.UtFirmaUnvan,
                'Sözleşme Türü': item.SozlesmeTuru,
                'Sözleşme Ücreti': item.SozlesmeUcreti,
                'Kararlaştırılan Ücret': item.UtKararlastirilanUcret,
                'Fark': (item.SozlesmeUcreti || 0) - (item.UtKararlastirilanUcret || 0),
                'Sözleşme Tarihi': item.SozlesmeTarihi ? new Date(item.SozlesmeTarihi).toLocaleDateString('tr-TR') : '',
                'Oluşturulma Tarihi': new Date(item.CreatedAt).toLocaleDateString('tr-TR')
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Dusuk_Ucretli_Rapor");
            XLSX.writeFile(workbook, `Dusuk_Ucretli_Sozlesme_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.xlsx`);
        } catch (err) {
            console.error("Export Error:", err);
            alert("Excel'e aktarılırken hata oluştu.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-gray-500 font-medium animate-pulse">Veriler yükleniyor...</div>
        </div>
    );

    if (!stats) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-red-500 font-medium">Veri yüklenemedi. Sunucu hatası olabilir.</div>
        </div>
    );

    const contractTypes = ['HEPSİ', ...(stats.byType?.map(t => t.SozlesmeTuru) || [])];

    const menuItems = [
        { id: 'genel', label: 'Genel Dağılım', icon: List },
        { id: 'detayli', label: 'Detaylı Raporlama', icon: List },
        { id: 'ozel', label: 'Özel Raporlar', icon: AlertTriangle },
        { id: 'yillar', label: 'Yıllara Göre Dağılım', icon: Calendar },
        { id: 'son-eklenen', label: 'Son Eklenen Sözleşmeler', icon: Briefcase },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'genel':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <InfoCard
                                icon={FileText}
                                label="Toplam Sözleşme"
                                value={stats.totalContracts}
                                color="blue"
                            />
                            <InfoCard
                                icon={TrendingUp}
                                label="Aktif Yıl Sözleşmeleri"
                                value={stats.byYear?.[0]?.count || 0}
                                subLabel={`${stats.byYear?.[0]?.Yil || ''} yılına ait`}
                                color="green"
                            />
                            <InfoCard
                                icon={Building}
                                label="Son Eklenen Firma"
                                value={stats.recent?.[0]?.FirmaninUnvani || '-'}
                                subLabel={stats.recent?.[0]?.CreatedAt ? `${new Date(stats.recent[0].CreatedAt).toLocaleDateString('tr-TR')} ${stats.recent[0].UyeAd ? ` | Ekleyen: ${stats.recent[0].UyeAd} ${stats.recent[0].UyeSoyad}` : ''}` : ''}
                                color="indigo"
                            />
                        </div>
                        {/* Contracts by Type */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <List size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-700">Genel Dağılım</h3>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-600">Yıl:</label>
                                    <select
                                        value={genelYil}
                                        onChange={(e) => setGenelYil(e.target.value)}
                                        className="p-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                                    >
                                        <option value="HEPSİ">Tümü</option>
                                        {stats.byYear?.map((y, idx) => (
                                            <option key={idx} value={y.Yil}>{y.Yil}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats.byType?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition">
                                        <span className="text-gray-600 font-medium">{item.SozlesmeTuru || 'Bilinmiyor'}</span>
                                        <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-bold border border-purple-100">
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            case 'detayli':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {/* FILTER SECTION */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
                            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <List size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700">Detaylı Raporlama</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="flex flex-col">
                                    <label className="text-sm font-semibold text-gray-600 mb-1">Başlangıç Tarihi</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-semibold text-gray-600 mb-1">Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-semibold text-gray-600 mb-1">Sözleşme Türü</label>
                                    <select
                                        value={contractType}
                                        onChange={(e) => setContractType(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {contractTypes.map((type, idx) => (
                                            <option key={idx} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleFilter}
                                        disabled={filterLoading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                                    >
                                        {filterLoading ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
                                    </button>
                                    {filteredResults && (
                                        <button
                                            onClick={handleExport}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                                            title="Excel'e Aktar"
                                        >
                                            <FileText size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {filteredResults && (
                                <div className="mt-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-gray-700">Sonuçlar</h4>
                                        <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">Toplam {pagination?.total || 0} sonuç bulundu</span>
                                    </div>

                                    <div className="overflow-x-auto custom-scrollbar mb-4">
                                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Eklenme Tarihi</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Üye Bilgisi</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ortak Şirket</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Firma Ünvanı</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sözleşme Türü</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ücret</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vergi No</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredResults.length > 0 ? (
                                                    filteredResults.map((item) => (
                                                        <tr key={item.Id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                                {item.CreatedAt ? new Date(item.CreatedAt).toLocaleDateString('tr-TR') : '-'}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-medium text-blue-700">
                                                                {item.UyeAd ? `${item.UyeAd} ${item.UyeSoyad}` : '-'}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                                {item.OrtakOlduguSirket || '-'}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-medium text-gray-800">
                                                                {item.FirmaninUnvani || item.UtFirmaUnvan}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">{item.SozlesmeTuru}</td>
                                                            <td className="px-4 py-2 text-sm font-bold text-gray-700">
                                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.SozlesmeUcreti)}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-500">{item.UtVergiNo || '-'}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                            Kriterlere uygun kayıt bulunamadı.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls */}
                                    {pagination && pagination.totalPages > 1 && (
                                        <div className="flex justify-center items-center space-x-4 mt-6">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Önceki
                                            </button>
                                            <span className="text-gray-600 font-medium text-sm">
                                                Sayfa {currentPage} / {pagination.totalPages}
                                            </span>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === pagination.totalPages}
                                                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Sonraki
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            case 'ozel':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8"
                    >
                        <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700">Özel Raporlar</h3>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={fetchLowFeeReport}
                                disabled={lowFeeLoading}
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 border border-red-200"
                            >
                                {lowFeeLoading ? 'Yükleniyor...' : 'Düşük Ücretli Sözleşmeler'}
                            </button>

                            {lowFeeStats && lowFeeStats.data && lowFeeStats.data.length > 0 && (
                                <button
                                    onClick={handleLowFeeExport}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition"
                                >
                                    <FileText size={20} />
                                    Excel'e Aktar
                                </button>
                            )}
                        </div>

                        {lowFeeStats && (
                            <div className="mt-8 animate-fadeIn">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-gray-700">Düşük Ücretli Sözleşmeler (Kararlaştırılan Ücretin Altında Kalanlar)</h4>
                                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                                        Toplam: {lowFeeStats.count}
                                    </span>
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Üye Adı Soyadı</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ortak Şirket</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Firma</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tür</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sözleşme Ücreti</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kararlaştırılan Ücret</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fark</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {lowFeeStats.data.map((item) => (
                                                <tr key={item.Id} className="hover:bg-red-50 transition">
                                                    <td className="px-4 py-3 text-sm font-medium text-blue-700">
                                                        {item.UyeAd ? `${item.UyeAd} ${item.UyeSoyad}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.OrtakOlduguSirket || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.FirmaninUnvani || item.UtFirmaUnvan}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{item.SozlesmeTuru}</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-red-600">
                                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.SozlesmeUcreti || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-gray-600">
                                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.UtKararlastirilanUcret || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-red-500">
                                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format((item.SozlesmeUcreti || 0) - (item.UtKararlastirilanUcret || 0))}
                                                    </td>
                                                </tr>
                                            ))}
                                            {lowFeeStats.count === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                                                        Kriterlere uyan kayıt bulunamadı.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                );
            case 'yillar':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700">Yıllara Göre Dağılım</h3>
                        </div>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {stats.byYear?.map((item, index) => (
                                <div key={index} className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition">
                                    <span className="text-gray-600 font-bold w-16">{item.Yil}</span>
                                    <div className="flex-1 mx-4 bg-gray-100 h-3 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full"
                                            style={{ width: `${(item.count / stats.totalContracts) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-gray-800 font-bold w-12 text-right">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'son-eklenen':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                                <Briefcase size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700">Son Eklenen Sözleşmeler</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        <th className="px-6 py-3">Firma</th>
                                        <th className="px-6 py-3">Tür</th>
                                        <th className="px-6 py-3">Ücret</th>
                                        <th className="px-6 py-3">Tarih</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats.recent?.map((contract) => (
                                        <tr key={contract.Id} className="hover:bg-gray-50 transition group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-teal-600 transition">
                                                {contract.FirmaninUnvani}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                                    {contract.SozlesmeTuru}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                                {contract.SozlesmeUcreti ?
                                                    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(contract.SozlesmeUcreti)
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {new Date(contract.CreatedAt).toLocaleDateString('tr-TR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex">
            {/* SIDEBAR */}
            <div className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col fixed inset-y-0 z-50">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                        YÖNETİM PANELİ
                    </h2>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={() => {
                            localStorage.removeItem('adminUser');
                            navigate('/raporlama');
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition font-medium text-sm"
                    >
                        <LogOut size={18} />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 md:ml-64 p-6 md:p-12 overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    {/* Header with User Info */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </h1>

                        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {user?.KullaniciAdi?.[0]?.toUpperCase()}
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-gray-700">{user?.Ad} {user?.Soyad}</p>
                            </div>
                        </div>
                    </div>

                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ReportingDashboard;
