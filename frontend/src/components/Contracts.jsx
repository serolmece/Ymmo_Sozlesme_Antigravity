import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Lock, Eye, Download } from 'lucide-react';
import ContractModal from './ContractModal';

const Contracts = () => {
    const { type } = useParams();
    const { user } = useOutletContext();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    // Lock State
    const [isLocked, setIsLocked] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const titleMap = {
        'suresinde': 'Süresinde Sözleşmeler',
        'sure-sonrasi': 'Süre Sonrası Sözleşmeler',
        'feshedilen': 'Feshedilen Sözleşmeler',
        'kdv-iade': 'Kdv İadesi Sözleşme Listesi',
        'hizmet': 'Hizmet Sözleşmeleri',
        'diger': 'Diğer Sözleşmeler'
    };

    // Check Lock Status
    const checkFlags = async () => {
        try {
            const res = await axios.get('/api/system-flags');
            // Lock only if we are in 'suresinde' page and lock is active
            if (type === 'suresinde' && res.data.suresindeKilitli) {
                setIsLocked(true);
            } else {
                setIsLocked(false);
            }
        } catch (err) {
            console.error("Flag check error", err);
        }
    };

    // Year State
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i).sort((a, b) => b - a); // [2026, 2025, 2024, 2023, 2022, 2021]

    const fetchContracts = async () => {
        if (!user?.Id) return;

        setLoading(true);
        try {
            const response = await axios.get(`/api/sozlesmeler?type=${type}&uyeId=${user.Id}&page=${page}&limit=25&yil=${selectedYear}`);
            if (response.data.success) {
                setContracts(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error("Contract fetch error:", err);
            setError("Sözleşmeler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        checkFlags(); // Check flags on type change
    }, [type]);

    useEffect(() => {
        fetchContracts();
    }, [type, user, page, selectedYear]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPage(newPage);
        }
    };

    const handleExportExcel = () => {
        const headers = [
            "Karşı Şirket",
            "Vergi No",
            "Sözleşme Sayı No",
            "Ücret",
            "Sözleşme Türü",
            "Ekleyen",
            "Eklenme Tarihi"
        ];

        const data = contracts.map(contract => [
            contract.KarsiSirketAdi,
            contract.KarsiSirketVergiKimlikNo,
            contract.SayiNo,
            contract.SozlesmeUcreti,
            contract.SozlesmeTuru,
            contract.CreatedBy || '-',
            contract.CreatedAt ? new Date(contract.CreatedAt).toLocaleDateString('tr-TR') : '-'
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sözleşmeler");
        XLSX.writeFile(workbook, "Sozlesmeler.xlsx");
    };

    const handleCreate = () => {
        if (isLocked) {
            alert("Süresinde sözleşme ekleme işlemi şu an kilitlidir.");
            return;
        }
        setEditingContract(null);
        setIsReadOnly(false);
        setIsModalOpen(true);
    };

    const handleEdit = (contract) => {
        if (isLocked) {
            alert("Süresinde sözleşme güncelleme işlemi şu an kilitlidir.");
            return;
        }

        // KDV İadesi Edit Restriction
        // "Aynı zamanda aynı sözleşmeler için içinde bulunduğumuz yıl ve 1 önceki yıl için kaydetme ve değiştirme imkanını aktif edelim"
        // Implies older years are NOT active for editing.
        const isKdvIade = contract.SozlesmeTuru === 'KDV İADESİ' || type === 'kdv-iade';
        if (isKdvIade) {
            const contractYear = contract.Yil || selectedYear; // Fallback to selectedYear if Yil missing
            const minAllowedYear = currentYear - 1;
            if (contractYear < minAllowedYear) {
                alert(`KDV İadesi sözleşmelerinde sadece ${currentYear} ve ${currentYear - 1} yılları için düzenleme yapılabilir.`);
                return;
            }
        }

        // Diğer Sözleşmeler Edit Restriction
        if (type === 'diger') {
            const contractYear = contract.Yil || selectedYear;
            if (contractYear < currentYear) {
                alert('Geçmiş yıllara ait diğer sözleşmeler düzenlenemez.');
                return;
            }
        }

        setEditingContract(contract);
        setIsReadOnly(false);
        setIsModalOpen(true);
    };

    const handleInspect = (contract) => {
        setEditingContract(contract);
        setIsReadOnly(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        // Global Check: Prevent deletion of past year contracts
        // "tüm sözleşmelerde geçmiş yıllara ait sözleşmeler silinemesin"
        // We use selectedYear because the list is filtered by it. Or we need the specific contract's year.
        // Since we only have ID here, we rely on the list's context or we need to find the contract.
        const contractToDelete = contracts.find(c => c.Id === id);
        const contractYear = contractToDelete ? contractToDelete.Yil : selectedYear;

        if (contractYear < currentYear) {
            alert('Geçmiş yıllara ait sözleşmeler silinemez.');
            return;
        }

        if (isLocked) {
            alert("Süresinde sözleşme silme işlemi şu an kilitlidir.");
            return;
        }
        if (window.confirm('Bu sözleşmeyi silmek istediğinizden emin misiniz?')) {
            try {
                await axios.delete(`/api/sozlesmeler/${id}`);
                fetchContracts();
            } catch (err) {
                alert('Silme işlemi başarısız: ' + err.message);
            }
        }
    };

    const handleSave = async (data) => {
        try {
            if (editingContract) {
                await axios.put(`/api/sozlesmeler/${editingContract.Id}`, { ...data, UyeId: user.Id });
            } else {
                await axios.post('/api/sozlesmeler', { ...data, UyeId: user.Id });
            }
            setIsModalOpen(false);
            fetchContracts();
        } catch (err) {
            // Check for 403 Forbidden specifically
            if (err.response && err.response.status === 403) {
                alert("İşlem Başarısız: " + err.response.data.message);
            } else {
                alert('Kaydetme hatası: ' + err.message);
            }
        }
    };

    if (loading && !contracts.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {titleMap[type] || 'Sözleşmeler'}
                        {isLocked && <Lock size={20} className="text-red-500" title="İşlemler Kilitli" />}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Toplam {pagination.total} kayıt bulundu.
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Year Selector */}
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="p-2 border border-gray-200 rounded-xl bg-white text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>{year} Yılı</option>
                        ))}
                    </select>

                    <button
                        onClick={handleExportExcel}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition shadow-lg bg-green-600 text-white hover:bg-green-700 shadow-green-200"
                        title="Excel'e Aktar"
                    >
                        <Download size={20} />
                        <span>Excel</span>
                    </button>

                    <button
                        onClick={handleCreate}
                        disabled={isLocked}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition shadow-lg 
                        ${isLocked ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
                        title={isLocked ? "Yeni sözleşme ekleme kilitli" : "Yeni Ekle"}
                    >
                        <Plus size={20} />
                        <span>Yeni Ekle</span>
                    </button>

                    <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-medium text-gray-600 min-w-[80px] text-center">
                            {page} / {pagination.totalPages || 1}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === pagination.totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 text-center w-28">İşlemler</th>
                                <th className="p-4 font-semibold text-gray-600">Karşı Şirket</th>
                                <th className="p-4 font-semibold text-gray-600">Vergi No</th>
                                <th className="p-4 font-semibold text-gray-600">Sözleşme Sayı No</th>
                                <th className="p-4 font-semibold text-gray-600">Ücret</th>
                                <th className="p-4 font-semibold text-gray-600">Sözleşme Türü</th>
                                <th className="p-4 font-semibold text-gray-600">Ekleyen</th>
                                <th className="p-4 font-semibold text-gray-600">Eklenme Tarihi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contracts.map((contract, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 flex justify-center space-x-2">
                                        <button
                                            onClick={() => handleInspect(contract)}
                                            className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                                            title="İncele"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(contract)}
                                            className={`p-2 rounded-lg transition ${isLocked ? 'text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                            title="Düzenle"
                                            disabled={isLocked}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contract.Id)}
                                            className={`p-2 rounded-lg transition ${isLocked ? 'text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                            title="Sil"
                                            disabled={isLocked}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                    <td className="p-4 font-medium text-gray-800">{contract.KarsiSirketAdi}</td>
                                    <td className="p-4 text-gray-600">{contract.KarsiSirketVergiKimlikNo}</td>
                                    <td className="p-4 text-gray-600">{contract.SayiNo || '-'}</td>
                                    <td className="p-4 text-gray-800 font-medium">
                                        {contract.SozlesmeUcreti ?
                                            new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(contract.SozlesmeUcreti)
                                            : '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold 
                                            ${contract.SozlesmeTuru?.includes('SÜRESİNDE') ? 'bg-green-100 text-green-700' :
                                                contract.SozlesmeTuru?.includes('FESHEDİLEN') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {contract.SozlesmeTuru}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 text-sm">
                                        {contract.CreatedBy || '-'}
                                    </td>
                                    <td className="p-4 text-gray-600 text-sm">
                                        {contract.CreatedAt ? new Date(contract.CreatedAt).toLocaleDateString('tr-TR') : '-'}
                                    </td>
                                </tr>
                            ))}
                            {contracts.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ContractModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingContract}
                type={type}
                readOnly={isReadOnly}
                user={user}
            />
        </motion.div>
    );
};

export default Contracts;
