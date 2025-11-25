
import React, { useState, useContext } from 'react';
import { Plus, Trash2, Edit2, Download, Upload, Database, Code, FileDown, X, Save, AlertTriangle, Package, Users, Shield, Coins } from 'lucide-react';
import { MasterOption, MasterDataCategory, User, UserRole } from '../types';
import { SQLITE_SCHEMA } from '../migrations';
import { AppContext } from '../App';

interface TabConfig {
    id: MasterDataCategory | 'db' | 'users';
    label: string;
    icon?: any;
}

const MasterTable = ({ title, data, categoryId, onEdit, onDelete }: { 
    title: string, 
    data: MasterOption[],
    categoryId: string,
    onEdit: (item: MasterOption) => void,
    onDelete: (id: string) => void
}) => {
    const isItemTable = categoryId === 'items';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <div className="flex gap-2">
                    <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Export Excel">
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={() => onEdit({ id: '', code: '', name: '', isActive: true })} // Trigger create
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
                    >
                        <Plus size={16} /> Add New
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">{isItemTable ? 'Item ID' : 'Code'}</th>
                            <th className="px-6 py-3">{isItemTable ? 'Item Name' : 'Name'}</th>
                            <th className="px-6 py-3">Description</th>
                            {isItemTable && <th className="px-6 py-3">UoM</th>}
                            {isItemTable && <th className="px-6 py-3">Status</th>}
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 group">
                                <td className="px-6 py-3 font-medium text-slate-700 font-mono">{item.code}</td>
                                <td className="px-6 py-3 text-slate-600 font-medium">{item.name}</td>
                                <td className="px-6 py-3 text-slate-500 truncate max-w-xs">{item.description || item.category || '-'}</td>
                                {isItemTable && (
                                    <>
                                        <td className="px-6 py-3 text-slate-600">{item.uom || '-'}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </>
                                )}
                                <td className="px-6 py-3 text-right opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3 p-1 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                    <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                         {data.length === 0 && (
                            <tr>
                                <td colSpan={isItemTable ? 6 : 4} className="px-6 py-8 text-center text-slate-400 italic">
                                    No records found. Add a new item to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const UserTable = ({ users, onEdit, onDelete }: { users: User[], onEdit: (u: User) => void, onDelete: (u: User) => void }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Registered Users</h3>
                <button 
                    onClick={() => onEdit({ id: '', username: '', password: '123', name: '', email: '', role: UserRole.USER, department: '' })} 
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
                >
                    <Plus size={16} /> Add User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Username</th>
                            <th className="px-6 py-3">Password</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Department</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                             <tr key={user.id} className="hover:bg-slate-50 group">
                                <td className="px-6 py-3 font-medium text-slate-800">{user.name}</td>
                                <td className="px-6 py-3 text-slate-600 font-mono text-xs">{user.username}</td>
                                <td className="px-6 py-3 text-slate-500 font-mono text-xs">{user.password}</td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                        user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        user.role === UserRole.APPROVER ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-slate-600">{user.department || '-'}</td>
                                <td className="px-6 py-3 text-slate-500 text-xs">{user.email}</td>
                                <td className="px-6 py-3 text-right opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-800 mr-3 p-1 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                    <button onClick={() => onDelete(user)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const DatabaseView = () => {
    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([SQLITE_SCHEMA], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "manuvest_sqlite_migration.sql";
        document.body.appendChild(element);
        element.click();
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Database size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">SQLite Database Schema</h3>
                        <p className="text-xs text-slate-500">Compatible migration script for SQLite backend</p>
                    </div>
                </div>
                <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                >
                    <FileDown size={16} /> Download .sql
                </button>
            </div>
            <div className="p-0 bg-slate-900 overflow-hidden relative">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800 text-slate-400 text-xs font-mono">
                    <span>schema.sql</span>
                    <span>SQLite 3.x</span>
                </div>
                <pre className="p-6 overflow-auto max-h-[600px] text-sm font-mono text-emerald-400 leading-relaxed">
                    {SQLITE_SCHEMA}
                </pre>
            </div>
        </div>
    );
}

export const AdminPanel = () => {
    const context = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<MasterDataCategory | 'db' | 'users'>('users');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MasterOption | null>(null);
    const [formData, setFormData] = useState<Partial<MasterOption>>({});
    
    // User Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<Partial<User>>({});

    if (!context) return null;
    const { masterData, manageMasterData, users, manageUser } = context;

    const tabs: TabConfig[] = [
        { id: 'users', label: 'User Roles', icon: Users },
        { id: 'items', label: 'Master Items', icon: Package },
        { id: 'departments', label: 'Departments' },
        { id: 'categories', label: 'Categories' },
        { id: 'ios', label: 'IO Numbers' },
        { id: 'costCenters', label: 'Cost Centers' },
        { id: 'projects', label: 'Projects' },
        { id: 'plants', label: 'Plants' },
        { id: 'suppliers', label: 'Suppliers' },
        { id: 'currencies', label: 'Currencies', icon: Coins },
        { id: 'db', label: 'DB System', icon: Code },
    ];

    // --- Master Data Handlers ---
    const openModal = (item: MasterOption) => {
        if (item.id) {
            setEditingItem(item);
            setFormData({...item});
        } else {
            setEditingItem(null); // Create mode
            setFormData({ code: '', name: '', description: '', uom: 'Unit', isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (activeTab === 'db' || activeTab === 'users') return;
        if (window.confirm('Are you sure you want to delete this record? This might affect existing budgets/PRs.')) {
            manageMasterData(activeTab, 'delete', { id } as MasterOption);
        }
    };

    const handleSave = () => {
        if (activeTab === 'db' || activeTab === 'users') return;

        if (!formData.code || !formData.name) {
            alert("Code/ID and Name are required fields.");
            return;
        }

        const payload: MasterOption = {
            id: editingItem ? editingItem.id : `${activeTab.substring(0,3)}-${Date.now()}`,
            code: formData.code,
            name: formData.name,
            description: formData.description || '',
            category: formData.category || '',
            uom: formData.uom,
            isActive: formData.isActive !== undefined ? formData.isActive : true
        };

        manageMasterData(activeTab, editingItem ? 'update' : 'create', payload);
        setIsModalOpen(false);
    };

    // --- User Handlers ---
    const openUserModal = (user: User) => {
        if (user.id) {
            setEditingUser(user);
            setUserData({...user});
        } else {
            setEditingUser(null);
            setUserData({ username: '', password: '123', name: '', email: '', role: UserRole.USER, department: '' });
        }
        setIsUserModalOpen(true);
    }

    const handleUserDelete = (user: User) => {
        if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
            manageUser('delete', user);
        }
    }

    const handleUserSave = () => {
        if (!userData.username || !userData.name || !userData.role || !userData.password) {
            alert("Username, Password, Name and Role are required.");
            return;
        }

        const payload: User = {
            id: editingUser ? editingUser.id : `u-${Date.now()}`,
            username: userData.username,
            password: userData.password,
            name: userData.name,
            email: userData.email || '',
            role: userData.role as UserRole,
            department: userData.department || ''
        };

        manageUser(editingUser ? 'update' : 'create', payload);
        setIsUserModalOpen(false);
    }

    const activeTabConfig = tabs.find(t => t.id === activeTab);
    const isItemMode = activeTab === 'items';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">System Administration</h1>
                <p className="text-slate-500">Manage users, roles, and master data configurations.</p>
            </div>

            <div className="flex overflow-x-auto border-b border-slate-200 space-x-6 pb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                            activeTab === tab.id 
                            ? 'border-b-2 border-blue-600 text-blue-600' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.icon && <tab.icon size={16} />}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="py-4">
                {activeTab === 'db' ? (
                    <DatabaseView />
                ) : activeTab === 'users' ? (
                    <UserTable users={users} onEdit={openUserModal} onDelete={handleUserDelete} />
                ) : (
                    <MasterTable 
                        title={activeTabConfig?.label || 'Data'} 
                        data={masterData[activeTab as MasterDataCategory]} 
                        categoryId={activeTab}
                        onEdit={openModal}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Generic Master Data Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-slate-800">
                                {editingItem ? `Edit ${activeTabConfig?.label}` : `New ${activeTabConfig?.label}`}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                    {isItemMode ? 'Item ID / Code' : 'Code'}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.code || ''}
                                    onChange={e => setFormData({...formData, code: e.target.value})}
                                    placeholder={isItemMode ? 'ITM-001' : 'CODE'}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                    {isItemMode ? 'Item Name' : 'Name'}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Name"
                                />
                            </div>
                            
                            {isItemMode && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Unit of Measure (UoM)</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.uom || ''}
                                        onChange={e => setFormData({...formData, uom: e.target.value})}
                                        placeholder="e.g. Pcs, Unit, Kg"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
                                <textarea 
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={3}
                                    value={formData.description || ''}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional description..."
                                ></textarea>
                            </div>

                            {isItemMode && (
                                <div className="flex items-center gap-2 pt-2">
                                    <input 
                                        type="checkbox" 
                                        id="isActive"
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        checked={formData.isActive ?? true}
                                        onChange={e => setFormData({...formData, isActive: e.target.checked})}
                                    />
                                    <label htmlFor="isActive" className="text-sm text-slate-700">Active Status</label>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-white hover:text-slate-800 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
                            >
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                         <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-slate-800">
                                {editingUser ? 'Edit User' : 'New User'}
                            </h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                             <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                    value={userData.name || ''} onChange={e => setUserData({...userData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Username</label>
                                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                                        value={userData.username || ''} onChange={e => setUserData({...userData, username: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
                                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                                        value={userData.password || ''} onChange={e => setUserData({...userData, password: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={userData.role || UserRole.USER} onChange={e => setUserData({...userData, role: e.target.value as UserRole})}>
                                        <option value={UserRole.ADMIN}>Admin</option>
                                        <option value={UserRole.USER}>User</option>
                                        <option value={UserRole.APPROVER}>Approver</option>
                                        <option value={UserRole.FINANCE}>Finance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label>
                                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={userData.department || ''} onChange={e => setUserData({...userData, department: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                                <input type="email" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                    value={userData.email || ''} onChange={e => setUserData({...userData, email: e.target.value})} />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-white hover:text-slate-800 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleUserSave} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                                <Save size={16} /> Save User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
