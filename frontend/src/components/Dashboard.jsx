import React from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, GraduationCap, Mail, MapPin, Phone, LogOut, FileBadge, Hash } from 'lucide-react';

const InfoCard = ({ icon: Icon, label, value, color = "blue" }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/60 shadow-sm flex items-start space-x-4"
    >
        <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-lg font-semibold text-gray-800 break-words">{value || '-'}</p>
        </div>
    </motion.div>
);

const Dashboard = ({ user, onLogout }) => {
    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow-md border border-gray-100">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                        <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {user.Ad?.[0]}{user.Soyad?.[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">
                                Hoşgeldiniz, {user.Ad} {user.Soyad}
                            </h1>
                            <p className="text-gray-500">Üye Paneli</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition flex items-center gap-2 group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Çıkış Yap
                    </button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <InfoCard
                        icon={Briefcase}
                        label="Oda Kayıt No"
                        value={user.OdaKayitNo}
                        color="indigo"
                    />
                    <InfoCard
                        icon={FileBadge}
                        label="Ruhsat Sicil No"
                        value={user.RuhsatSicilNo}
                        color="purple"
                    />
                    <InfoCard
                        icon={GraduationCap}
                        label="Mezun Olduğu Okul"
                        value={user.MezunOlduguOkul}
                        color="orange"
                    />
                    <InfoCard
                        icon={Mail}
                        label="Email Adresi"
                        value={user.Email}
                        color="blue"
                    />
                    <InfoCard
                        icon={Phone}
                        label="Telefon"
                        value={user.Telefon}
                        color="green"
                    />
                    <InfoCard
                        icon={MapPin}
                        label="Adres"
                        value={user.Adres}
                        color="red"
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
