import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { X, Save, Calculator } from 'lucide-react';
import {
    UtFaaliyetTuru, UtFaaliyetTuruLabel,
    UtVergiTuru, UtVergiTuruLabel,
    UtIndirimSecimi, UtIndirimSecimiLabel,
    Cities
} from '../utils/constants';
import { calculateContractFee } from '../utils/feeCalculation';

const ContractModal = ({ isOpen, onClose, onSave, initialData, type, readOnly = false, user }) => {
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('genel');
    const [calcResult, setCalcResult] = useState(null);
    // const [ymmInfo, setYmmInfo] = useState({ Unvan: '', VergiNo: '' }); // REMOVED
    const [isAgreed, setIsAgreed] = useState(false);
    const [showAgreementModal, setShowAgreementModal] = useState(false);

    // Fetch YMM Company Info REMOVED
    // ... (rest of logic)


    useEffect(() => {
        const getContractType = (urlType) => {
            switch (urlType) {
                case 'suresinde': return 'SÜRESİNDE';
                case 'sure-sonrasi': return 'SÜRE SONRASI';
                case 'feshedilen': return 'FESİH';
                case 'kdv-iade': return 'KDV İADESİ';
                case 'hizmet': return 'HİZMET SÖZLEŞMELERİ';
                case 'diger': return 'DİĞER SÖZLEŞME';
                default: return 'SÜRESİNDE';
            }
        };

        const defaultType = getContractType(type);

        if (initialData) {
            setFormData(initialData);
            // If data has calculation results, show them
            if (initialData.UtKararlastirilanUcret !== undefined && initialData.UtKararlastirilanUcret !== null) {
                setCalcResult({
                    UtSektorIndirimi: initialData.UtSektorIndirimi,
                    UtMatrah: initialData.UtMatrah,
                    UtIndirimeEsasUcret: initialData.UtIndirimeEsasUcret,
                    UtYoreIndirimi: initialData.UtYoreIndirimi,
                    UtHesaplananUcret: initialData.UtHesaplananUcret,
                    UtFaaliyetTuruZammi: initialData.UtFaaliyetTuruZammi,
                    UtSmVeyaSmmmIndirimi: initialData.UtSmVeyaSmmmIndirimi,
                    UtGrupSirketleriIndirimi: initialData.UtGrupSirketleriIndirimi,
                    UtDigerIndirimler: initialData.UtDigerIndirimler,
                    UtKararlastirilanUcret: initialData.UtKararlastirilanUcret,
                    UtSozlesmeHesaplamaDurumu: initialData.UtSozlesmeHesaplamaDurumu
                });
            } else {
                setCalcResult(null);
            }
        } else {
            setCalcResult(null);
            // Default values for new contract
            setFormData({
                KarsiSirketAdi: '',
                KarsiSirketVergiKimlikNo: '',
                OrtakOlduguSirket: '',
                SirketVergiKimlikNo: '',
                Mahiyet: '12 - TAM TASDİK',
                SozlesmeUcreti: 0,
                SozlesmeTarihi: new Date().toISOString().split('T')[0],
                SozlesmeTuru: defaultType,
                Yil: new Date().getFullYear(),
                // Fee Determination Defaults
                UtVergiTuru: UtVergiTuru.KurumlarVergisi,
                UtFaaliyetTuru: UtFaaliyetTuru.SanayiIsletmesi,
                UtIndirimSecimi: UtIndirimSecimi.Yok,
                UtIlKodu: '', // Default empty to force selection
                UtOncekiYilNetSatis: 0,
                UtDigerIndirimler: 0
            });
        }
    }, [initialData, type, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCalculate = () => {
        const result = calculateContractFee(formData);
        if (result.success) {
            setCalcResult(result);
            setFormData(prev => ({
                ...prev,
                ...result, // Save all Utxxx calculated fields
                // SozlesmeUcreti: result.UtKararlastirilanUcret // REMOVED: User enters this manually
            }));
        } else {
            alert(result.error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Mandatory Calculation Check for Fee Determination types
        const showFeeDetermination = formData.SozlesmeTuru === 'SÜRESİNDE' || formData.SozlesmeTuru === 'SÜRE SONRASI';
        if (showFeeDetermination) {
            // Check if calculation results exist in formData
            if (!formData.UtKararlastirilanUcret || formData.UtKararlastirilanUcret <= 0) {
                alert("Lütfen önce ücret hesaplaması yapınız.");
                return;
            }
        }

        // City Validation
        if (showFeeDetermination && !formData.UtIlKodu) {
            alert("Lütfen 'Bulunduğu İl' seçimi yapınız.");
            return;
            return;
        }

        // Agreement Validation
        if (showFeeDetermination && !isAgreed) {
            alert("Lütfen sözleşme şartlarını okuyup kabul ediniz.");
            return;
        }

        // Fee Validation with Precision Handling
        const calculatedFee = parseFloat(Number(formData.UtKararlastirilanUcret).toFixed(2));
        const enteredFee = parseFloat(Number(formData.SozlesmeUcreti).toFixed(2));

        // 1. Check for Empty/Zero Fee (Strict Block)
        // "buradaki ücret kısmı 0 olmasın yada boş bırakılmaya izin vermesin"
        if (isNaN(enteredFee) || enteredFee <= 0) {
            alert('Sözleşmede Belirtilen Ücret (KDV DAHİL) 0 olamaz veya boş bırakılamaz.');
            return;
        }

        // 2. Check calculation comparison
        if (!isNaN(calculatedFee) && calculatedFee > 0) {
            // Check if entered fee is strictly less than calculated fee
            if (enteredFee < calculatedFee) {
                // Warning only, do not return
                // "Girdiğiniz ücret Asgari Tarifeye Göre Hesaplanan Ücret'den düşüktür, tarifeden düşük girilen ücretler raporlanarak Yönetim Kurulunda incelenecektir."
                alert("Girdiğiniz ücret Asgari Tarifeye Göre Hesaplanan Ücret'den düşüktür, tarifeden düşük girilen ücretler raporlanarak Yönetim Kurulunda incelenecektir.");
            }
        }

        const dataToSave = {
            ...formData,
            // OrtakOlduguSirket: ymmInfo.Unvan, // REMOVED
            // SirketVergiKimlikNo: ymmInfo.VergiNo, // REMOVED
            UserEmail: user?.Email, // Add User Email for Audit
            // Map General Info fields to Ut fields
            UtFirmaUnvan: formData.FirmaninUnvani,
            UtAdres: formData.FirmaninAdresi,
            UtVergiDairesi: formData.FirmaninVergiDairesi,
            UtVergiNo: formData.FirmaninVergiNumarasi
        };

        // For non-fee determination types, map General Info to main fields
        if (!showFeeDetermination) {
            dataToSave.KarsiSirketAdi = formData.FirmaninUnvani;
            dataToSave.KarsiSirketVergiKimlikNo = formData.FirmaninVergiNumarasi; // Mapping VergiNumarasi directly
            dataToSave.Mahiyet = null; // Set Mahiyet to null
        }

        onSave(dataToSave);
    };

    // Fee formatting helpers
    const [isFeeFocused, setIsFeeFocused] = useState(false);

    const formatCurrency = (value) => {
        if (value === undefined || value === null || value === '') return '';
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    const handleFeeChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, SozlesmeUcreti: value }));
    };

    const handleFeeFocus = (e) => {
        setIsFeeFocused(true);
        e.target.select();
    };
    const handleFeeBlur = () => setIsFeeFocused(false);

    if (!isOpen) return null;

    const showFeeDetermination = formData.SozlesmeTuru === 'SÜRESİNDE' || formData.SozlesmeTuru === 'SÜRE SONRASI';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-bold text-gray-800">
                            {initialData ? (readOnly ? 'Sözleşme İncele' : 'Sözleşme Düzenle') : 'Yeni Sözleşme Ekle'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                            <X size={24} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Tabs */}
                    {showFeeDetermination && (
                        <div className="flex border-b border-gray-100">
                            <button
                                type="button"
                                className={`px-6 py-3 font-medium transition ${activeTab === 'genel' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('genel')}
                            >
                                Genel Bilgiler
                            </button>
                            <button
                                type="button"
                                className={`px-6 py-3 font-medium transition ${activeTab === 'ucret' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('ucret')}
                            >
                                Ücret Tespit
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6">

                        <div className={activeTab === 'genel' ? 'block' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Firma Bilgileri */}
                                <div className="md:col-span-2 border-b border-gray-100 pb-4 mb-4">
                                    <h3 className="text-sm font-bold text-indigo-600 uppercase mb-3">Sözleşmedeki Firma Bilgileri</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">YMM'nin Ortak Olduğu Şirket</label>
                                            <input
                                                type="text" name="OrtakOlduguSirket"
                                                disabled={readOnly}
                                                value={formData.OrtakOlduguSirket || ''}
                                                onChange={handleChange}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Şirket Vergi No</label>
                                            <input
                                                type="text" name="SirketVergiKimlikNo"
                                                disabled={readOnly}
                                                value={formData.SirketVergiKimlikNo || ''}
                                                onChange={handleChange}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sözleşme Yapılan Firma Ünvanı</label>
                                            <input
                                                type="text" name="FirmaninUnvani"
                                                disabled={readOnly}
                                                value={formData.FirmaninUnvani || ''} onChange={handleChange}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
                                            <input
                                                type="text" name="FirmaninVergiDairesi"
                                                disabled={readOnly}
                                                value={formData.FirmaninVergiDairesi || ''} onChange={handleChange}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Numarası</label>
                                            <input
                                                type="text" name="FirmaninVergiNumarasi"
                                                disabled={readOnly}
                                                value={formData.FirmaninVergiNumarasi || ''} onChange={handleChange}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>
                                    </div>
                                </div>



                                {/* Detaylar */}
                                <div className="md:col-span-2 border-t border-gray-100 pt-4">
                                    <h3 className="text-sm font-bold text-indigo-600 uppercase mb-3">Sözleşme Detayları</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sözleşme No</label>
                                            <input
                                                type="text" name="SayiNo"
                                                disabled={readOnly}
                                                value={formData.SayiNo || ''} onChange={handleChange}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sözleşmede Belirtilen Ücret (KDV DAHİL)</label>
                                            <input
                                                type={isFeeFocused ? "number" : "text"}
                                                name="SozlesmeUcreti"
                                                disabled={readOnly}
                                                value={isFeeFocused ? (formData.SozlesmeUcreti || 0) : formatCurrency(formData.SozlesmeUcreti || 0)}
                                                onChange={handleFeeChange}
                                                onFocus={handleFeeFocus}
                                                onBlur={handleFeeBlur}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50 font-bold text-indigo-700 disabled:text-indigo-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Yıl</label>
                                            <input
                                                type="number" name="Yil"
                                                disabled={true} // Locked as requested
                                                value={formData.Yil || new Date().getFullYear()}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-100 text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sözleşme Tarihi</label>
                                            <input
                                                type="date" name="SozlesmeTarihi"
                                                disabled={readOnly}
                                                value={formData.SozlesmeTarihi ? formData.SozlesmeTarihi.split('T')[0] : ''} onChange={handleChange}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                                            <input
                                                type="date" name="SozlesmeBaslangicTarihi"
                                                disabled={readOnly}
                                                value={formData.SozlesmeBaslangicTarihi ? formData.SozlesmeBaslangicTarihi.split('T')[0] : ''} onChange={handleChange}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ücret Tespit Tab */}
                        {showFeeDetermination && (
                            <div className={activeTab === 'ucret' ? 'block' : 'hidden'}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                                        <p className="text-sm text-blue-800">
                                            Bu bölümden ASGARİ ÜCRET TARİFESİNE göre sözleşme ücretini hesaplayabilirsiniz.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Karşı Şirket Adı *</label>
                                        <input
                                            type="text" name="KarsiSirketAdi" required
                                            disabled={readOnly}
                                            value={formData.KarsiSirketAdi || ''} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Kimlik No</label>
                                        <input
                                            type="text" name="KarsiSirketVergiKimlikNo"
                                            disabled={readOnly}
                                            value={formData.KarsiSirketVergiKimlikNo || ''} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mahiyet</label>
                                        <input
                                            type="text" name="Mahiyet"
                                            disabled={true}
                                            value={formData.Mahiyet || ''}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-100 text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sözleşme Türü</label>
                                        <input
                                            type="text" name="SozlesmeTuru"
                                            disabled={true} // Always disabled/read-only as it's auto-set
                                            value={formData.SozlesmeTuru || ''}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-100 text-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Önceki Yıl Net Satış Tutarı</label>
                                        <input
                                            type="number" name="UtOncekiYilNetSatis"
                                            disabled={readOnly}
                                            value={formData.UtOncekiYilNetSatis || 0} onChange={handleChange}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bulunduğu İl</label>
                                        <select
                                            name="UtIlKodu"
                                            disabled={readOnly}
                                            value={formData.UtIlKodu || ''} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            <option value="">İL SEÇİNİZ</option>
                                            {Cities.map(city => (
                                                <option key={city.code} value={city.code}>{city.name}</option>
                                            ))}
                                        </select>
                                    </div>


                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Faaliyet Türü</label>
                                        <select
                                            name="UtFaaliyetTuru"
                                            disabled={readOnly}
                                            value={formData.UtFaaliyetTuru} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            {Object.entries(UtFaaliyetTuruLabel).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Türü</label>
                                        <select
                                            name="UtVergiTuru"
                                            disabled={readOnly}
                                            value={formData.UtVergiTuru} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            {Object.entries(UtVergiTuruLabel).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Seçimi</label>
                                        <select
                                            name="UtIndirimSecimi"
                                            disabled={readOnly}
                                            value={formData.UtIndirimSecimi || 0} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            {Object.entries(UtIndirimSecimiLabel).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Diğer İndirimler (TL)</label>
                                        <input
                                            type="number" name="UtDigerIndirimler"
                                            disabled={readOnly}
                                            value={formData.UtDigerIndirimler || 0} onChange={handleChange}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Varsa SMMM Ad Soyad</label>
                                        <input
                                            type="text" name="UtMuhSorumluAdSoyad"
                                            disabled={readOnly}
                                            value={formData.UtMuhSorumluAdSoyad || ''} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SMMM Ruhsat No</label>
                                        <input
                                            type="text" name="UtMuhSorumluRuhsatNo"
                                            disabled={readOnly}
                                            value={formData.UtMuhSorumluRuhsatNo || ''} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Grup Şirket Ünvanı</label>
                                        <input
                                            type="text" name="UtGrupSirketUnvan"
                                            disabled={readOnly}
                                            value={formData.UtGrupSirketUnvan || ''} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Grup Şirket Vergi No</label>
                                        <input
                                            type="text" name="UtGrupSirketVergiNo"
                                            disabled={readOnly}
                                            value={formData.UtGrupSirketVergiNo || ''} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Diğer İndirim Açıklaması</label>
                                        <input
                                            type="text" name="UtDigerIndirimlerAciklamasi"
                                            disabled={readOnly}
                                            value={formData.UtDigerIndirimlerAciklamasi || ''} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>

                                    {!readOnly && (
                                        <div className="md:col-span-2 pt-4 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={handleCalculate}
                                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center space-x-2"
                                            >
                                                <Calculator size={18} />
                                                <span>Ücreti Hesapla</span>
                                            </button>
                                        </div>
                                    )}

                                    {calcResult && (
                                        <div className="md:col-span-2 mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h4 className="font-bold text-gray-800 mb-2">Hesaplama Sonucu</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="flex justify-between border-b border-gray-200 pb-1">
                                                    <span className="text-gray-600">Net Satışlar:</span>
                                                    <span className="font-medium">{formatCurrency(calcResult.UtMatrah)} TL</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-200 pb-1">
                                                    <span className="text-gray-600">Hesaplanan Ücret:</span>
                                                    <span className="font-medium">{formatCurrency(calcResult.UtIndirimeEsasUcret)} TL</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-200 pb-1">
                                                    <span className="text-gray-600">Yöre İndirimi:</span>
                                                    <span className="text-red-600 font-medium">-{formatCurrency(calcResult.UtYoreIndirimi)} TL</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-200 pb-1">
                                                    <span className="text-gray-600">Faaliyet Türü Zammı:</span>
                                                    <span className="text-green-600 font-medium">+{formatCurrency(calcResult.UtFaaliyetTuruZammi)} TL</span>
                                                </div>

                                                {(calcResult.UtSmVeyaSmmmIndirimi > 0) && (
                                                    <div className="flex justify-between border-b border-gray-200 pb-1">
                                                        <span className="text-gray-600">SMMM İndirimi (%20):</span>
                                                        <span className="text-red-600 font-medium">-{formatCurrency(calcResult.UtSmVeyaSmmmIndirimi)} TL</span>
                                                    </div>
                                                )}

                                                {(calcResult.UtGrupSirketleriIndirimi > 0) && (
                                                    <div className="flex justify-between border-b border-gray-200 pb-1">
                                                        <span className="text-gray-600">Grup Şirketleri İndirimi (%35):</span>
                                                        <span className="text-red-600 font-medium">-{formatCurrency(calcResult.UtGrupSirketleriIndirimi)} TL</span>
                                                    </div>
                                                )}

                                                {(calcResult.UtDigerIndirimler > 0) && (
                                                    <div className="flex justify-between border-b border-gray-200 pb-1">
                                                        <span className="text-gray-600">Diğer İndirimler:</span>
                                                        <span className="text-red-600 font-medium">-{formatCurrency(calcResult.UtDigerIndirimler)} TL</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between border-b border-gray-200 pb-1 bg-red-50 p-1 rounded">
                                                    <span className="text-gray-800 font-medium">Toplam İndirim Tutarı:</span>
                                                    <span className="text-red-700 font-bold">
                                                        -{formatCurrency((calcResult.UtSmVeyaSmmmIndirimi || 0) + (calcResult.UtGrupSirketleriIndirimi || 0) + (calcResult.UtDigerIndirimler || 0))} TL
                                                    </span>
                                                </div>

                                                <div className="flex justify-between pt-2">
                                                    <span className="text-gray-900 font-bold text-base">Asgari Tarifeye Göre
                                                        Hesaplanan Ücret(KDV Dahil):</span>
                                                    <span className="text-indigo-700 font-bold text-base">{formatCurrency(calcResult.UtKararlastirilanUcret)} TL</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </form>

                    {showFeeDetermination && !readOnly && (
                        <div className="px-6 pb-2 flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="agreement"
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="agreement" className="text-sm text-gray-700 select-none">
                                <span
                                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowAgreementModal(true);
                                    }}
                                >
                                    Sözleşme giriş metnini okudum kabul ediyorum
                                </span>
                            </label>
                        </div>
                    )}

                    <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition"
                        >
                            {readOnly ? 'Kapat' : 'İptal'}
                        </button>
                        {!readOnly && (
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition flex items-center space-x-2 shadow-lg"
                            >
                                <Save size={20} />
                                <span>Kaydet</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>


            {/* Agreement Modal */}
            <AnimatePresence>
                {showAgreementModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-lg font-bold text-red-600">ÖNEMLİ UYARI VE BEYAN</h3>
                                <button onClick={() => setShowAgreementModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                    <X size={24} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="p-6 text-gray-700 text-sm space-y-4">
                                <div className="space-y-4 mb-6 pb-4 border-b border-gray-200">
                                    <p className="font-bold">(*)1-Yıllık GELİR VERGİSİ BEYANNAMESİNE göre hesaplanacak ücret 168.878 TL’den az olamaz. İnşaat ve Sanayi İşletmelerinde bu rakamlar %20 artırılarak uygulanır.</p>
                                    <p className="font-bold">(*)2-Yıllık KURUMLAR VERGİSİ BEYANNAMESİNE göre hesaplanacak ücret 186.036 TL’den az olamaz. İnşaat ve Sanayi İşletmelerinde bu rakamlar %20 artırılarak uygulanır</p>
                                    <p>(*)Gelir Vergisi Beyanname Tasdiklerinde Tarifedeki Nisbi Ücretler İçin %10 İndirim Uygulanır.</p>
                                    <p className="font-bold">3-Tarifedeki ücretler, KDV dahil tutarlardır.</p>
                                    <p>4-Kararlaştırılan ücrete sürekli danışmanlık ile yol ve konaklama giderleri dahil değildir.</p>
                                    <p>5-Ücret tespitinde esas alınan tutarın, cari yılda %50'den fazla sapma göstermesi halinde kararlaştırılan ücretin, gerçek tutarlara göre düzeltilmesine ilişkin olarak sözleşmeye hüküm koyabilirler.</p>
                                    <p>6-Asgari ücret tarifesinde yer alan ücretlerin altında iş yapılması yasaktır.</p>
                                    <p className="font-bold">7-ÜCRET SORU BELGESİNİN DOLDURULMASI ZORUNLUDUR.</p>
                                    <p>8-Ücret Soru Belgesi, tasdik sözleşmesinin ekini oluşturur.</p>
                                    <p>(*)Sözleşmede yazan rakamla Ücret Tespit Soru Belgesinde yazan rakamın birbirini tutması için; küsuratlı rakamlarda yuvarlama yapılmaması ve girilen ücret bilgisinin doğru girilmesi önemle rica olunur.</p>
                                    <p>(*)Rakam girişi yapılırken ,küsuratlı bölümlerde virgül kullanılması,küsurat haricinde noktalama işareti kullanılmaması gerekmektedir.</p>
                                    <p>(*)Şubat sonu itibariyle, süresinde sözleşme giriş yetkisi kapanacaktır.Bu tarihten sonra bilgiler değiştirilemez. </p>
                                </div>
                                <p className="font-bold">DEĞERLİ ÜYEMİZ BU SAYFADA HESAPLANAN VE SİZLERE GÖSTERİLEN ASGARİ ÜCRET TARİFESİ ALTINDA SÖZLEŞME YAPMAK YASAKTIR.</p>
                                <p>TÜM SÖZLEŞMELER GİRİŞ SÜRESİ SONRASINDA RAPORLANACAK VE ASGARİ ÜCRET TARİFESİ ALTINDA YAPILAN SÖZLEŞMELER YÖNETİM KURULU TARAFINDAN İNCELEMEYE ALINACAKTIR.</p>
                                <p>SÖZLEŞME GİRİŞİNDE TÜM ALANLARIN SÖZLEŞME ÜZERİNDE YAZILDIĞI ŞEKİLDE DOLDURULMASI ZORUNLUDUR, DOĞRU BEYAN EDİLMEYEN VE BOŞ GEÇİLEN ALANLAR RAPORLANARAK YÖNETİM KURULU İLE PAYLAŞILACAKTIR.</p>
                                <p>SÖZLEŞME YAPILAN MÜKELLEFE AİT TÜM BİLGİLERİN SİSTEME DOĞRU BİR ŞEKİLDE BEYAN EDİLMESİ ZORUNLUDUR. GİRİŞ SONRASINDA GİRİLEN TÜM BİLGİLER GİB SİSTEMİ İLE KARŞILAŞTIRALARAK RAPORLANACAKTIR. EKSİK YADA GİB SİSTEMİ İLE UYUMSUZ BİLGİLER YÖNETİM KURULU TARAFINDAN İNCELENECEKTİR.</p>
                                <p className="font-bold">HESAPLA VE KAYDET BUTONUNA TIKLADIĞINIZDA YUKARIDA BELİRTİLEN ŞARTLARI KABUL ETMİŞ SAYILIRSINIZ.</p>
                                <ul className="list-disc pl-5">
                                    <li>TÜM BİLGİLERİ SÖZLEŞME ÜZERİNDE YAZILDIĞI ŞEKİLDE GİRDİĞİMİ, ASGARİ ÜCRET ALTINDA SÖZLEŞME YAPMADIĞIMI KABUL VE BEYAN EDERİM.</li>
                                </ul>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-2xl">
                                <button
                                    onClick={() => {
                                        setIsAgreed(true);
                                        setShowAgreementModal(false);
                                    }}
                                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
                                >
                                    Okudum, Anladım, Kabul Ediyorum
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AnimatePresence >
    );
};

export default ContractModal;
