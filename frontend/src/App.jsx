import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import Contracts from './components/Contracts';
import ReportingLogin from './components/ReportingLogin';
import ReportingDashboard from './components/ReportingDashboard';

function App() {
    const [user, setUser] = useState(null);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
    };

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={!user ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />}
                />

                {/* Protected Routes */}
                <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
                    <Route path="/" element={<Dashboard user={user} onLogout={handleLogout} />} />
                    <Route path="/contracts/:type" element={<Contracts />} />
                </Route>


                {/* Reporting Routes */}
                <Route path="/raporlama" element={<ReportingLogin />} />
                <Route path="/raporlama/dashboard" element={<ReportingDashboard />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
