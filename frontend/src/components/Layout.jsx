import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, ChevronDown, AlignLeft, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = ({ user, onLogout }) => {
    const [sozlesmeMenuOpen, setSozlesmeMenuOpen] = useState(true);
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <motion.div
                initial={{ x: -250 }}
                animate={{ x: 0 }}
                className="w-72 bg-white shadow-xl flex flex-col z-20"
            >
                <div className="border-b border-gray-100 flex items-center justify-center">
                    <img src="/logo_v2.jpg" alt="Logo" style={{ width: '288px', height: '89px' }} className="object-contain" />
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="mb-6">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2">Genel</p>
                        <NavLink
                            to="/"
                            className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <LayoutDashboard size={20} />
                            <span>Üye Kartı</span>
                        </NavLink>
                    </div>

                    <div className="mb-2">
                        <div
                            onClick={() => setSozlesmeMenuOpen(!sozlesmeMenuOpen)}
                            className="flex items-center justify-between px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl cursor-pointer"
                        >
                            <div className="flex items-center space-x-3">
                                <FileText size={20} />
                                <span className="font-medium">Sözleşmeler</span>
                            </div>
                            <ChevronDown size={16} className={`transition-transform ${sozlesmeMenuOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {sozlesmeMenuOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="ml-4 pl-4 border-l border-gray-200 mt-1 space-y-1"
                            >
                                <NavLink
                                    to="/contracts/suresinde"
                                    className={({ isActive }) => `block px-4 py-2 text-sm rounded-lg transition-colors ${isActive ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Süresinde Sözleşmeler
                                </NavLink>
                                <NavLink
                                    to="/contracts/sure-sonrasi"
                                    className={({ isActive }) => `block px-4 py-2 text-sm rounded-lg transition-colors ${isActive ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Süre Sonrası Sözleşmeler
                                </NavLink>
                                <NavLink
                                    to="/contracts/feshedilen"
                                    className={({ isActive }) => `block px-4 py-2 text-sm rounded-lg transition-colors ${isActive ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Feshedilen Sözleşmeler
                                </NavLink>
                                <NavLink
                                    to="/contracts/kdv-iade"
                                    className={({ isActive }) => `block px-4 py-2 text-sm rounded-lg transition-colors ${isActive ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Kdv İadesi Sözleşme Listesi
                                </NavLink>
                                <NavLink
                                    to="/contracts/hizmet"
                                    className={({ isActive }) => `block px-4 py-2 text-sm rounded-lg transition-colors ${isActive ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Hizmet Sözleşmeleri
                                </NavLink>
                                <NavLink
                                    to="/contracts/diger"
                                    className={({ isActive }) => `block px-4 py-2 text-sm rounded-lg transition-colors ${isActive ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Diğer Sözleşmeler
                                </NavLink>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center p-3 bg-gray-50 rounded-xl mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                            {user.Ad?.[0]}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-gray-800 truncate">{user.Ad} {user.Soyad}</p>
                            <p className="text-xs text-gray-500 truncate">{user.Email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </motion.div >

            {/* Main Content */}
            < div className="flex-1 overflow-auto" >
                <header className="bg-white h-16 border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="font-semibold text-gray-800">Panel</h2>
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50">
                            <AlignLeft size={20} />
                        </button>
                    </div>
                </header>
                <main className="p-8">
                    <Outlet context={{ user }} />
                </main>
            </div >
        </div >
    );
};

export default Layout;
