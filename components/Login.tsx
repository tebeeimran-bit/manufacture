
import React, { useState } from 'react';
import { Lock, User, ChevronRight, ShieldCheck } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
    onLogin: (user: UserType) => void;
    users: UserType[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate API delay
        setTimeout(() => {
            // Simple mock authentication logic
            // Validates against the "users" prop passed from App state
            const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
            
            // Check stored password
            if (user && user.password === password) {
                onLogin(user);
            } else {
                setError('Invalid username or password');
                setIsLoading(false);
            }
        }, 800);
    };

    const fillCredentials = (u: string, p: string) => {
        setUsername(u);
        setPassword(p);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-600 opacity-10 transform -skew-y-12 origin-top-left scale-150"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                            <span className="font-bold text-white text-2xl">M</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">BIS</h1>
                        <p className="text-slate-400 text-sm mt-2">Budget & Investment System</p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Username</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input 
                                    type="password" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials Hint */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-4">
                            For Evaluation Purpose
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => fillCredentials('admin', '123')}
                                className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-left transition-colors group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-blue-800">Admin View</span>
                                    <ShieldCheck size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-[10px] text-blue-600/80 space-y-0.5 font-mono">
                                    <p>User: admin</p>
                                    <p>Pass: 123</p>
                                </div>
                            </button>

                            <button 
                                type="button"
                                onClick={() => fillCredentials('user', '123')}
                                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-left transition-colors group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-emerald-800">User View</span>
                                    <User size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-[10px] text-emerald-600/80 space-y-0.5 font-mono">
                                    <p>User: user</p>
                                    <p>Pass: 123</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
