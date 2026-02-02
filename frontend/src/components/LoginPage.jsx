import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log("Sending login request...", { email, password });
            const response = await axios.post('/api/login', {
                email,
                password
            });

            console.log("Login response:", response.data);

            if (response.data.success) {
                onLoginSuccess(response.data.user);
            }
        } catch (err) {
            console.error("Login component error:", err);
            if (err.response) {
                console.error("Error Response Data:", err.response.data);
                console.error("Error Response Status:", err.response.status);
            }
            const errorMessage = err.response?.data?.message || err.message || 'Giriş başarısız oldu. Sunucu hatası olabilir.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20"
            >
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Giriş Yap</h1>
                    <p className="text-gray-200 mt-2">Hesabınıza erişmek için bilgilerinizi girin</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Email Adresi</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-400 font-medium"
                                placeholder="ornek@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-400 font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-white text-purple-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </motion.button>
                </form>

                <div className="mt-6 text-center">
                    <a href="#" className="text-sm text-gray-300 hover:text-white transition">Şifremi Unuttum?</a>

                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
