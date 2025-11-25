
import React, { useState, useContext } from 'react';
import { Plus, Edit2, Trash2, X, Save, Check, Ban, ArrowRightLeft, History, AlertCircle, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { AppContext } from '../App';
import { BudgetPlanHeader, BudgetPlanItem, WorkflowStatus, UserRole, TransferLog, Project } from '../types';

const StatusBadge = ({ status }: { status: WorkflowStatus }) => {
    const styles = {
        [WorkflowStatus.DRAFT]: 'bg-slate-100 text-slate-600',
        [WorkflowStatus.SUBMITTED]: 'bg-blue-50 text-blue-700',
        [WorkflowStatus.APPROVED]: 'bg-emerald-50 text-emerald-700',
        [WorkflowStatus.REJECTED]: 'bg-red-50 text-red-700',
        [WorkflowStatus.ON_PROCESS]: 'bg-indigo-50 text-indigo-700',
        [WorkflowStatus.CLOSED]: 'bg-gray-100 text-gray-800',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
            {status}
        </span>
    );
};

export const BudgetModule = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { budgets, addBudget, updateBudget, deleteBudget, updateBudgetStatus, masterData, currentUser, projectsList } = context;

    // Permission Check: Standard 'User' role cannot create/edit budgets
    const isRestrictedUser = currentUser?.role === UserRole.USER;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<BudgetPlanHeader | null>(null);
    
    // Transfer State
    const [transferItem, setTransferItem] = useState<BudgetPlanItem | null>(null);
    const [targetPlanId, setTargetPlanId] = useState<string>('');
    const [transferReason, setTransferReason] = useState('');

    // Form State
    const initialFormState: Partial<BudgetPlanHeader> = {
        planNumber: '',
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear(),
        investmentType: 'Capex',
        status: WorkflowStatus.DRAFT,
        items: []
    };
    const [formData, setFormData] = useState<Partial<BudgetPlanHeader>>(initialFormState);
    
    // Temp Item State
    const initialItemState: Partial<BudgetPlanItem> = {
        qty: 1,
        process: 'Preparation',
        uom: 'Unit',
        currency: 'IDR',
        estimationCostUnit: 0,
        fiscalYear: new Date().getFullYear()
    };
    const [tempItem, setTempItem] = useState<Partial<BudgetPlanItem>>(initialItemState);

    // --- Helpers ---
    const getProject = (id: string) => projectsList.find(p => p.id === id) || masterData.projects.find(p => p.id === id);
    const getIO = (id: string) => masterData.ios.find(i => i.id === id);
    const getCC = (id: string) => masterData.costCenters.find(c => c.id === id);

    // --- CRUD ---
    const openCreateModal = () => {
        setEditingBudget(null);
        setFormData({
            ...initialFormState,
            planNumber: `BP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        });
        setTempItem(initialItemState);
        setIsModalOpen(true);
    };

    const openEditModal = (budget: BudgetPlanHeader) => {
        setEditingBudget(budget);
        setFormData(JSON.parse(JSON.stringify(budget)));
        setTempItem(initialItemState);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this budget plan?')) {
            deleteBudget(id);
        }
    };

    const handleAddItem = () => {
        if (!tempItem.machineName || !tempItem.estimationCostUnit) {
            alert("Machine Name and Cost are required.");
            return;
        }
        const newItem: BudgetPlanItem = {
            id: `bpi-${Date.now()}`,
            internalNo: `INT-${Date.now()}`,
            machineName: tempItem.machineName,
            process: tempItem.process || 'Preparation',
            qty: tempItem.qty || 1,
            uom: tempItem.uom || 'Unit',
            currency: tempItem.currency || 'IDR',
            estimationCostUnit: tempItem.estimationCostUnit,
            estimationCostTotal: (tempItem.qty || 1) * tempItem.estimationCostUnit,
            fiscalYear: tempItem.fiscalYear || formData.startYear || new Date().getFullYear()
        };

        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }));
        setTempItem({ ...initialItemState, fiscalYear: formData.startYear });
    };

    const handleRemoveItem = (id: string) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items?.filter(i => i.id !== id)
        }));
    };

    const handleSave = () => {
        if (!formData.departmentId || !formData.projectId || !formData.ioNo) {
            alert("Department, Project, and IO Number are required.");
            return;
        }

        const payload = {
            ...formData,
            id: editingBudget ? editingBudget.id : `bp-${Date.now()}`,
            createdAt: editingBudget ? editingBudget.createdAt : new Date().toISOString()
        } as BudgetPlanHeader;

        if (editingBudget) {
            updateBudget(payload);
        } else {
            addBudget(payload);
        }
        setIsModalOpen(false);
    };

    // --- Transfer Logic ---
    const initiateTransfer = (item: BudgetPlanItem) => {
        if (!editingBudget) return;
        setTransferItem(item);
        setTargetPlanId('');
        setTransferReason('');
        setIsTransferModalOpen(true);
    };

    const confirmTransfer = () => {
        if (!transferItem || !targetPlanId || !editingBudget) return;
        if (!transferReason.trim()) {
            alert("Please provide a reason for the transfer.");
            return;
        }

        const targetPlan = budgets.find(b => b.id === targetPlanId);
        if (!targetPlan) return;

        const sourceIO = getIO(editingBudget.ioNo)?.code || 'Unknown';
        const targetIO = getIO(targetPlan.ioNo)?.code || 'Unknown';

        // Create Transfer Log
        const log: TransferLog = {
            date: new Date().toISOString(),
            fromPlanId: editingBudget.id,
            fromIoNo: sourceIO,
            toPlanId: targetPlan.id,
            toIoNo: targetIO,
            reason: transferReason,
            user: currentUser?.name || 'Unknown'
        };

        // 1. Add to Target
        const itemInTarget: BudgetPlanItem = {
            ...transferItem,
            id: `bpi-${Date.now()}`, // Regenerate ID to avoid conflicts
            transfers: [...(transferItem.transfers || []), log]
        };

        const updatedTargetPlan = {
            ...targetPlan,
            items: [...targetPlan.items, itemInTarget]
        };
        updateBudget(updatedTargetPlan);

        // 2. Remove from Source (Global Update)
        const updatedSourceItems = editingBudget.items.filter(i => i.id !== transferItem.id);
        const updatedSourcePlan = {
            ...editingBudget,
            items: updatedSourceItems
        };
        updateBudget(updatedSourcePlan);

        // 3. Update Local Form State (UI)
        setFormData(prev => ({
            ...prev,
            items: prev.items?.filter(i => i.id !== transferItem.id)
        }));

        setIsTransferModalOpen(false);
        alert(`Item transferred to IO ${targetIO} successfully.`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Budget Investment Plan</h1>
                    <p className="text-slate-500">Manage annual capex and opex budgets.</p>
                </div>
                {!isRestrictedUser && (
                    <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
                        <Plus size={18} /> New Budget Plan
                    </button>
                )}
            </div>

            {/* Budget List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">IO Number</th>
                                <th className="px-6 py-3">Cost Center</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Project Name</th>
                                
                                {/* Multi-Item Columns Header */}
                                <th className="px-6 py-3 bg-slate-100/50">Machine / Equipment</th>
                                <th className="px-6 py-3 text-center bg-slate-100/50">Qty</th>
                                <th className="px-6 py-3 bg-slate-100/50">Process</th>
                                <th className="px-6 py-3 text-right bg-slate-100/50">Amount (Item)</th>
                                
                                <th className="px-6 py-3 text-right">Total Amount</th>
                                <th className="px-6 py-3">Status</th>
                                {!isRestrictedUser && <th className="px-6 py-3 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {budgets.map((budget) => {
                                const project = getProject(budget.projectId);
                                const customerName = (project as any)?.customer || masterData.projects.find(p => p.id === budget.projectId)?.name || '-';
                                const totalPlanAmount = budget.items.reduce((sum, i) => sum + i.estimationCostTotal, 0);

                                return (
                                    <tr key={budget.id} className="hover:bg-slate-50 group align-top">
                                        <td className="px-6 py-4 font-medium text-blue-600">{getIO(budget.ioNo)?.code}</td>
                                        <td className="px-6 py-4 text-slate-600">{getCC(budget.costCenter)?.code}</td>
                                        <td className="px-6 py-4 text-slate-600">{customerName}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{project?.name}</td>
                                        
                                        {/* Nested Items Render */}
                                        <td colSpan={4} className="p-0 border-x border-slate-100 bg-slate-50/30">
                                            {budget.items.map((item, idx) => {
                                                const hasTransfer = item.transfers && item.transfers.length > 0;
                                                const lastTransfer = hasTransfer ? item.transfers![item.transfers!.length - 1] : null;
                                                
                                                return (
                                                    <div key={item.id} className={`grid grid-cols-4 ${idx !== budget.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                                        <div className="px-6 py-3 col-span-1 border-r border-slate-50">
                                                            <div className="text-slate-800 font-medium">{item.machineName}</div>
                                                            <div className="text-xs text-slate-400">FY {item.fiscalYear}</div>
                                                            {hasTransfer && lastTransfer && (
                                                                <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] border border-blue-100 font-bold" title={`Reason: ${lastTransfer.reason}`}>
                                                                    <ArrowRightLeft size={10} />
                                                                    Pindahan dari {lastTransfer.fromIoNo}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="px-6 py-3 col-span-1 text-center border-r border-slate-50 flex items-center justify-center">
                                                            <span className="text-slate-600">{item.qty}</span>
                                                            <span className="text-xs text-slate-400 ml-1">{item.uom}</span>
                                                        </div>
                                                        <div className="px-6 py-3 col-span-1 border-r border-slate-50 flex items-center text-slate-600 text-xs">
                                                            {item.process}
                                                        </div>
                                                        <div className="px-6 py-3 col-span-1 text-right flex items-center justify-end font-mono text-slate-600 text-xs">
                                                            Rp {item.estimationCostTotal.toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {budget.items.length === 0 && (
                                                <div className="px-6 py-4 text-slate-400 italic text-xs">No items</div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                                            Rp {totalPlanAmount.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={budget.status} />
                                        </td>
                                        {!isRestrictedUser && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditModal(budget)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(budget.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                             {budgets.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                                        No Budget Plans found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transfer Modal */}
            {isTransferModalOpen && transferItem && (
                <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4 text-amber-600">
                                <ArrowRightLeft size={24} />
                                <h3 className="text-lg font-bold text-slate-800">Transfer Item</h3>
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Item to Transfer</p>
                                <p className="text-sm font-medium text-slate-800">{transferItem.machineName}</p>
                                <p className="text-xs text-blue-600 mt-1">Current IO: {getIO(editingBudget?.ioNo || '')?.code}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Target Budget (IO)</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={targetPlanId}
                                        onChange={(e) => setTargetPlanId(e.target.value)}
                                    >
                                        <option value="">-- Select Target --</option>
                                        {budgets
                                            .filter(b => b.id !== editingBudget?.id) // Exclude current
                                            .map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.planNumber} - {getIO(b.ioNo)?.code} ({b.startYear})
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason for Transfer *</label>
                                    <textarea 
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                        rows={3}
                                        placeholder="Why is this item moving to another IO?"
                                        value={transferReason}
                                        onChange={(e) => setTransferReason(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 mt-4 italic">
                                <AlertCircle size={12} className="inline mr-1" />
                                The item will be removed from the current plan and added to the selected target plan immediately.
                            </p>

                            <div className="flex gap-3 mt-6">
                                <button 
                                    onClick={() => setIsTransferModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmTransfer}
                                    disabled={!targetPlanId || !transferReason.trim()}
                                    className="flex-1 px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Transfer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-slate-800">
                                {editingBudget ? `Edit ${editingBudget.planNumber}` : 'New Budget Plan'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {/* Header Form */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Year</label>
                                    <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={formData.startYear} onChange={e => setFormData({...formData, startYear: parseInt(e.target.value)})} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End Year</label>
                                    <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={formData.endYear} onChange={e => setFormData({...formData, endYear: parseInt(e.target.value)})} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={formData.departmentId || ''} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                                        <option value="">Select Dept</option>
                                        {masterData.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Project</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={formData.projectId || ''} onChange={e => setFormData({...formData, projectId: e.target.value})}>
                                        <option value="">Select Project</option>
                                        {projectsList.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">IO Number</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={formData.ioNo || ''} onChange={e => setFormData({...formData, ioNo: e.target.value})}>
                                        <option value="">Select IO</option>
                                        {masterData.ios.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cost Center</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={formData.costCenter || ''} onChange={e => setFormData({...formData, costCenter: e.target.value})}>
                                        <option value="">Select Cost Center</option>
                                        {masterData.costCenters.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Investment Type</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={formData.investmentType || 'Capex'} onChange={e => setFormData({...formData, investmentType: e.target.value as any})}>
                                        <option value="Capex">Capex</option>
                                        <option value="Opex">Opex</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-4">Plan Items</h4>
                                
                                {/* Add Item Form */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-500 mb-1 block">Machine / Equipment Name</label>
                                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                            value={tempItem.machineName || ''} onChange={e => setTempItem({...tempItem, machineName: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 mb-1 block">Fiscal Year</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                            value={tempItem.fiscalYear} 
                                            onChange={e => setTempItem({...tempItem, fiscalYear: parseInt(e.target.value)})}>
                                            {/* Generate range based on header */}
                                            {Array.from({length: (formData.endYear || 2025) - (formData.startYear || 2024) + 1}, (_, i) => (formData.startYear || 2024) + i).map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 mb-1 block">Process</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                            value={tempItem.process || 'Preparation'} onChange={e => setTempItem({...tempItem, process: e.target.value as any})}>
                                            <option value="Preparation">Preparation</option>
                                            <option value="Final Assy">Final Assy</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 mb-1 block">Qty</label>
                                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                            value={tempItem.qty || ''} onChange={e => setTempItem({...tempItem, qty: parseFloat(e.target.value)})} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 mb-1 block">UoM</label>
                                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                            value={tempItem.uom || ''} onChange={e => setTempItem({...tempItem, uom: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-500 mb-1 block">Cost Estimation (Unit)</label>
                                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                            value={tempItem.estimationCostUnit || ''} onChange={e => setTempItem({...tempItem, estimationCostUnit: parseFloat(e.target.value)})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-500 mb-1 block">Currency</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                            value={tempItem.currency || 'IDR'} onChange={e => setTempItem({...tempItem, currency: e.target.value})}>
                                            {masterData.currencies.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-500 mb-1 block opacity-0">Add</label>
                                        <button onClick={handleAddItem} className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                                            + Add Item
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 text-slate-600 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3">Machine Name</th>
                                                <th className="px-4 py-3">Year</th>
                                                <th className="px-4 py-3 text-center">Qty</th>
                                                <th className="px-4 py-3">Process</th>
                                                <th className="px-4 py-3 text-right">Total Cost</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {formData.items && formData.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium text-slate-800">{item.machineName}</div>
                                                        {item.transfers && item.transfers.length > 0 && (
                                                             <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded mt-1 font-semibold">
                                                                <ArrowRightLeft size={10} />
                                                                Pindahan dari {item.transfers[item.transfers.length-1].fromIoNo}
                                                             </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-500">{item.fiscalYear}</td>
                                                    <td className="px-4 py-2 text-center">{item.qty} {item.uom}</td>
                                                    <td className="px-4 py-2">{item.process}</td>
                                                    <td className="px-4 py-2 text-right font-mono text-slate-700">
                                                        {item.currency} {item.estimationCostTotal.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {/* Transfer Button only in Edit Mode */}
                                                            {editingBudget && (
                                                                <button 
                                                                    onClick={() => initiateTransfer(item)}
                                                                    className="text-amber-500 hover:bg-amber-50 p-1.5 rounded transition-colors"
                                                                    title="Transfer Item to another IO"
                                                                >
                                                                    <ArrowRightLeft size={16} />
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => handleRemoveItem(item.id)} 
                                                                className="text-red-400 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!formData.items || formData.items.length === 0) && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                                        No items added yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-white hover:text-slate-800 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                                <Save size={16} /> Save Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
