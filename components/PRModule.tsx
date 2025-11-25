
import React, { useState, useContext, useEffect } from 'react';
import { 
    Plus, Edit2, Trash2, X, Save, Check, Ban, 
    ArrowRight, Send, Clock, CheckCircle, XCircle, FileText,
    PlayCircle, Archive, Eye, Lock, AlertTriangle, RotateCcw
} from 'lucide-react';
import { AppContext } from '../App';
import { PurchaseRequest, PRItem, WorkflowStatus, UserRole } from '../types';

const StatusBadge = ({ status }: { status: WorkflowStatus }) => {
    const styles = {
        [WorkflowStatus.DRAFT]: 'bg-slate-100 text-slate-600 border-slate-200',
        [WorkflowStatus.SUBMITTED]: 'bg-blue-50 text-blue-700 border-blue-200',
        [WorkflowStatus.APPROVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        [WorkflowStatus.REJECTED]: 'bg-red-50 text-red-700 border-red-200',
        [WorkflowStatus.ON_PROCESS]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        [WorkflowStatus.CLOSED]: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    
    const icons = {
        [WorkflowStatus.DRAFT]: FileText,
        [WorkflowStatus.SUBMITTED]: Send,
        [WorkflowStatus.APPROVED]: CheckCircle,
        [WorkflowStatus.REJECTED]: XCircle,
        [WorkflowStatus.ON_PROCESS]: PlayCircle,
        [WorkflowStatus.CLOSED]: Archive,
    };

    const Icon = icons[status] || FileText;

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
            <Icon size={12} />
            {status}
        </span>
    );
};

export const PRModule = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { prs, budgets, masterData, addPR, updatePR, deletePR, updatePRStatus, currentUser } = context;

    // Permissions
    const isApprover = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.APPROVER;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Workflow Action State
    const [selectedPRId, setSelectedPRId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<WorkflowStatus | null>(null);
    const [actionNote, setActionNote] = useState('');

    // Inline Editing State
    const [inlineEditId, setInlineEditId] = useState<string | null>(null);
    const [inlineEditData, setInlineEditData] = useState<Partial<PRItem>>({});

    // Form State
    const initialFormState: Partial<PurchaseRequest> = {
        items: [],
        prDate: new Date().toISOString().split('T')[0],
        status: WorkflowStatus.DRAFT,
        history: []
    };
    const [formData, setFormData] = useState<Partial<PurchaseRequest>>(initialFormState);

    // Temp Item State (For adding new items via top form)
    const initialItemState: Partial<PRItem> = {
        itemId: '',
        qty: 1,
        estCostUnit: 0,
        currency: 'IDR', // Default currency
        uom: 'Unit'
    };
    const [tempItem, setTempItem] = useState<Partial<PRItem>>(initialItemState);

    // Derived State
    // Simple sum, ideally would handle currency conversion
    const totalPRCost = (formData.items || []).reduce((sum, i) => sum + (i.estCostTotal || 0), 0);
    
    const availableBudgets = budgets.filter(b => 
        b.status === WorkflowStatus.APPROVED &&
        (!formData.ioNo || b.ioNo === formData.ioNo) &&
        (!formData.costCenter || b.costCenter === formData.costCenter)
    );

    // --- Logic: Read Only Mode ---
    const isReadOnly = isEditMode && ![WorkflowStatus.DRAFT, WorkflowStatus.REJECTED].includes(formData.status as WorkflowStatus);

    // --- CRUD Handlers ---

    const openCreateModal = () => {
        setFormData({
            ...initialFormState,
            prNumber: `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        });
        setIsEditMode(false);
        setTempItem(initialItemState);
        setInlineEditId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (pr: PurchaseRequest) => {
        setFormData(JSON.parse(JSON.stringify(pr)));
        setIsEditMode(true);
        setTempItem(initialItemState);
        setInlineEditId(null);
        setIsModalOpen(true);
    };

    const handleDelete = (pr: PurchaseRequest) => {
        if ([WorkflowStatus.APPROVED, WorkflowStatus.ON_PROCESS, WorkflowStatus.CLOSED].includes(pr.status)) {
            alert("Cannot delete a PR that has already been Approved, Processed, or Closed.");
            return;
        }

        if(window.confirm(`Are you sure you want to delete PR ${pr.prNumber}?`)) {
            deletePR(pr.id);
        }
    };

    const handleSubmit = () => {
        if (inlineEditId) {
            alert("Please save or cancel the current item edit before submitting.");
            return;
        }

        if (!formData.departmentId || !formData.ioNo) {
            alert("Please fill in required header fields.");
            return;
        }
        
        if (!formData.items || formData.items.length === 0) {
            alert("Please add at least one item to the Purchase Request.");
            return;
        }

        const payload = {
            ...formData,
            id: isEditMode ? formData.id! : `pr-${Date.now()}`,
            history: isEditMode ? formData.history : [{ date: new Date().toISOString(), user: currentUser?.name || 'User', action: 'Created', notes: 'Initial Draft' }]
        } as PurchaseRequest;

        if (isEditMode) {
            updatePR(payload);
        } else {
            addPR(payload);
        }
        setIsModalOpen(false);
    };

    // --- Workflow Action Handlers ---

    const initiateAction = (id: string, action: WorkflowStatus) => {
        setSelectedPRId(id);
        setActionType(action);
        setActionNote('');
        setIsActionModalOpen(true);
    };

    const submitAction = () => {
        if (!selectedPRId || !actionType) return;
        
        if (actionType === WorkflowStatus.REJECTED && !actionNote.trim()) {
            alert("Please provide a reason for rejection in the notes.");
            return;
        }

        updatePRStatus(selectedPRId, actionType, actionNote);
        setIsActionModalOpen(false);
        setSelectedPRId(null);
        setActionType(null);
    };

    // --- Item Handlers (New Item Form) ---

    const handleMasterItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const masterItem = masterData.items.find(i => i.code === code);
        
        setTempItem(prev => ({
            ...prev,
            itemId: code,
            description: masterItem ? masterItem.name : prev.description, // Auto-fill name
            uom: masterItem && masterItem.uom ? masterItem.uom : prev.uom // Auto-fill UoM
        }));
    };

    const handleBudgetLinkSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const budgetItemId = e.target.value;
        let foundBudget = null;
        let foundItem = null;

        for(const b of availableBudgets) {
            const item = b.items.find(i => i.id === budgetItemId);
            if(item) {
                foundItem = item;
                foundBudget = b;
                break;
            }
        }

        setTempItem(prev => ({
            ...prev,
            budgetPlanItemId: budgetItemId,
            description: foundItem ? foundItem.machineName : prev.description, // Auto-fill from budget
            estCostUnit: foundItem ? foundItem.estimationCostUnit : prev.estCostUnit, // Auto-fill cost
            uom: foundItem ? foundItem.uom : prev.uom,
            currency: foundItem ? foundItem.currency : prev.currency
        }));
    };

    const handleAddItem = () => {
        if (!tempItem.description || !tempItem.estCostUnit) {
            alert("Item Description and Cost are required!");
            return;
        }
        const total = (tempItem.qty || 1) * (tempItem.estCostUnit || 0);
        
        const newItem: PRItem = {
            ...initialItemState,
            ...tempItem,
            id: `pr-item-${Date.now()}`,
            itemId: tempItem.itemId || '', 
            estCostTotal: total
        } as PRItem;

        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }));
        setTempItem(initialItemState);
    };

    const handleRemoveItem = (id: string) => {
        if (inlineEditId === id) {
            setInlineEditId(null); // Cancel edit if removing the item
        }
        setFormData(prev => ({
            ...prev,
            items: prev.items?.filter(i => i.id !== id)
        }));
    };

    // --- Inline Edit Handlers ---

    const handleStartInlineEdit = (item: PRItem) => {
        setInlineEditId(item.id);
        setInlineEditData({ ...item });
    };

    const handleCancelInlineEdit = () => {
        setInlineEditId(null);
        setInlineEditData({});
    };

    const handleSaveInlineEdit = () => {
        if (!inlineEditData.description || !inlineEditData.estCostUnit) {
            alert("Description and Cost are required.");
            return;
        }

        const updatedItems = formData.items?.map(item => {
            if (item.id === inlineEditId) {
                const qty = inlineEditData.qty || 0;
                const unitCost = inlineEditData.estCostUnit || 0;
                return {
                    ...item,
                    ...inlineEditData,
                    estCostTotal: qty * unitCost
                } as PRItem;
            }
            return item;
        });

        setFormData({ ...formData, items: updatedItems });
        setInlineEditId(null);
        setInlineEditData({});
    };

    // --- Render Helpers ---

    const getActionButtons = (pr: PurchaseRequest) => {
        switch (pr.status) {
            case WorkflowStatus.DRAFT:
                return (
                    <button onClick={() => initiateAction(pr.id, WorkflowStatus.SUBMITTED)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Submit for Approval">
                        <Send size={16} />
                    </button>
                );
            case WorkflowStatus.SUBMITTED:
                // Only Approvers can see Approve/Reject buttons
                if (!isApprover) return null;
                return (
                    <>
                        <button onClick={() => initiateAction(pr.id, WorkflowStatus.APPROVED)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Approve">
                            <Check size={16} />
                        </button>
                        <button onClick={() => initiateAction(pr.id, WorkflowStatus.REJECTED)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject">
                            <Ban size={16} />
                        </button>
                    </>
                );
            case WorkflowStatus.APPROVED:
                if (!isApprover) return null;
                return (
                    <button onClick={() => initiateAction(pr.id, WorkflowStatus.ON_PROCESS)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Process (PO)">
                        <PlayCircle size={16} />
                    </button>
                );
            case WorkflowStatus.ON_PROCESS:
                if (!isApprover) return null;
                return (
                    <button onClick={() => initiateAction(pr.id, WorkflowStatus.CLOSED)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Close PR">
                        <Archive size={16} />
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Purchase Requests</h1>
                    <p className="text-slate-500">Manage procurement requests and approvals.</p>
                </div>
                <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
                    <Plus size={18} /> New PR
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">PR Number</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Dept</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3 text-right">Total Cost</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {prs.map(pr => (
                            <tr key={pr.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-3 font-medium text-blue-600">{pr.prNumber}</td>
                                <td className="px-6 py-3">{pr.prDate}</td>
                                <td className="px-6 py-3">{masterData.departments.find(d => d.id === pr.departmentId)?.code}</td>
                                <td className="px-6 py-3 truncate max-w-xs text-slate-600">{pr.items[0]?.description || '-'} {pr.items.length > 1 && <span className="text-xs text-slate-400">(+{pr.items.length - 1} more)</span>}</td>
                                <td className="px-6 py-3 text-right font-mono font-medium text-slate-700">
                                    Rp {pr.items.reduce((sum, i) => sum + i.estCostTotal, 0).toLocaleString('id-ID')}
                                </td>
                                <td className="px-6 py-3"><StatusBadge status={pr.status} /></td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        {getActionButtons(pr)}
                                        <div className="w-px h-4 bg-slate-300 mx-1 self-center"></div>
                                        <button onClick={() => openEditModal(pr)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title={ [WorkflowStatus.DRAFT, WorkflowStatus.REJECTED].includes(pr.status) ? "Edit" : "View Details" }>
                                            { [WorkflowStatus.DRAFT, WorkflowStatus.REJECTED].includes(pr.status) ? <Edit2 size={16} /> : <Eye size={16} /> }
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleDelete(pr)} 
                                            className={`p-1.5 rounded transition-colors ${
                                                [WorkflowStatus.APPROVED, WorkflowStatus.ON_PROCESS, WorkflowStatus.CLOSED].includes(pr.status) 
                                                ? 'text-slate-300 cursor-not-allowed' 
                                                : 'text-red-600 hover:bg-red-50'
                                            }`}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {prs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                    No Purchase Requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Workflow Action Modal --- */}
            {isActionModalOpen && selectedPRId && actionType && (
                <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-full ${
                                    actionType === WorkflowStatus.APPROVED ? 'bg-emerald-100 text-emerald-600' :
                                    actionType === WorkflowStatus.REJECTED ? 'bg-red-100 text-red-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {actionType === WorkflowStatus.APPROVED && <Check size={24} />}
                                    {actionType === WorkflowStatus.REJECTED && <Ban size={24} />}
                                    {(actionType === WorkflowStatus.SUBMITTED || actionType === WorkflowStatus.ON_PROCESS) && <ArrowRight size={24} />}
                                    {actionType === WorkflowStatus.CLOSED && <Archive size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {actionType === WorkflowStatus.APPROVED ? 'Approve Request' :
                                         actionType === WorkflowStatus.REJECTED ? 'Reject Request' :
                                         actionType === WorkflowStatus.SUBMITTED ? 'Submit Request' :
                                         `Mark as ${actionType}`}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {prs.find(p => p.id === selectedPRId)?.prNumber}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm text-slate-600">
                                    Are you sure you want to proceed with this action?
                                    {actionType === WorkflowStatus.APPROVED && " This will move the request to the processing queue."}
                                    {actionType === WorkflowStatus.REJECTED && " The request will be returned to the requester."}
                                </p>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                        Notes / Comments {actionType === WorkflowStatus.REJECTED && <span className="text-red-500">*</span>}
                                    </label>
                                    <textarea 
                                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        rows={3}
                                        placeholder="Add any remarks or reasons..."
                                        value={actionNote}
                                        onChange={(e) => setActionNote(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button 
                                    onClick={() => setIsActionModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={submitAction}
                                    className={`flex-1 px-4 py-2 text-white font-medium rounded-lg shadow-md transition-colors ${
                                        actionType === WorkflowStatus.APPROVED ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        actionType === WorkflowStatus.REJECTED ? 'bg-red-600 hover:bg-red-700' :
                                        'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CRUD Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">
                                        {isReadOnly ? 'View Purchase Request' : (isEditMode ? 'Edit Purchase Request' : 'New Purchase Request')}
                                    </h2>
                                    <p className="text-xs text-slate-500">{formData.prNumber}</p>
                                </div>
                                {isEditMode && (
                                    <StatusBadge status={formData.status || WorkflowStatus.DRAFT} />
                                )}
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Read Only Banner */}
                        {isReadOnly && (
                            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-amber-800 text-sm">
                                <Lock size={14} />
                                <span className="font-medium">Read Only Mode:</span> This record is {formData.status} and cannot be edited directly.
                            </div>
                        )}

                        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                            {/* Left Side: Form */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Header Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Department</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 disabled:text-slate-500"
                                            disabled={isReadOnly}
                                            value={formData.departmentId || ''} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                                            <option value="">Select Dept</option>
                                            {masterData.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Business Category</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 disabled:text-slate-500"
                                            disabled={isReadOnly}
                                            value={formData.businessCategoryId || ''} onChange={e => setFormData({...formData, businessCategoryId: e.target.value})}>
                                            <option value="">Select Category</option>
                                            {masterData.categories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">IO Number</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 disabled:text-slate-500"
                                            disabled={isReadOnly}
                                            value={formData.ioNo || ''} onChange={e => setFormData({...formData, ioNo: e.target.value})}>
                                            <option value="">Select IO</option>
                                            {masterData.ios.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Cost Center</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 disabled:text-slate-500"
                                            disabled={isReadOnly}
                                            value={formData.costCenter || ''} onChange={e => setFormData({...formData, costCenter: e.target.value})}>
                                            <option value="">Select Cost Center</option>
                                            {masterData.costCenters.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Asset No (AUC)</label>
                                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm disabled:bg-slate-50 disabled:text-slate-500" placeholder="Asset Number"
                                            disabled={isReadOnly}
                                            value={formData.assetNo || ''} onChange={e => setFormData({...formData, assetNo: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Plant</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 disabled:text-slate-500"
                                            disabled={isReadOnly}
                                            value={formData.plantId || ''} onChange={e => setFormData({...formData, plantId: e.target.value})}>
                                            <option value="">Select Plant</option>
                                            {masterData.plants.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Items Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-emerald-600 rounded"></div>
                                        PR Items
                                    </h3>
                                    
                                    {!isReadOnly && !inlineEditId && (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-7 gap-3 mb-6">
                                            {/* Item ID Selection */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-slate-500 mb-1 block">Item ID (Master)</label>
                                                <select 
                                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                                    value={tempItem.itemId || ''}
                                                    onChange={handleMasterItemSelect}
                                                >
                                                    <option value="">-- Select Master Item --</option>
                                                    {masterData.items?.filter(i => i.isActive).map(item => (
                                                        <option key={item.id} value={item.code}>{item.code} - {item.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Budget Link Selection */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-slate-500 mb-1 block">Budget Link</label>
                                                <select 
                                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                                    value={tempItem.budgetPlanItemId || ''} 
                                                    onChange={handleBudgetLinkSelect}
                                                >
                                                    <option value="">-- No Link --</option>
                                                    {availableBudgets.map(b => (
                                                        <optgroup key={b.id} label={b.planNumber}>
                                                            {b.items.map(i => (
                                                                <option key={i.id} value={i.id}>{i.machineName} (Avail: {i.estimationCostTotal.toLocaleString()})</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="text-xs text-slate-500 mb-1 block">Description</label>
                                                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                                    value={tempItem.description || ''} onChange={e => setTempItem({...tempItem, description: e.target.value})} />
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

                                            <div className="md:col-span-1">
                                                <label className="text-xs text-slate-500 mb-1 block">Currency</label>
                                                <select 
                                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                                    value={tempItem.currency || 'IDR'}
                                                    onChange={e => setTempItem({...tempItem, currency: e.target.value})}
                                                >
                                                    {masterData.currencies.map(c => (
                                                        <option key={c.id} value={c.code}>{c.code}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="text-xs text-slate-500 mb-1 block">Cost/Unit</label>
                                                <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                                    value={tempItem.estCostUnit || ''} onChange={e => setTempItem({...tempItem, estCostUnit: parseFloat(e.target.value)})} />
                                            </div>
                                            
                                            <div className="md:col-span-7">
                                                 <button onClick={handleAddItem} className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors mt-4">
                                                    + Add Item
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-100 text-slate-600 font-semibold">
                                                <tr>
                                                    <th className="px-4 py-3 w-24">Item ID</th>
                                                    <th className="px-4 py-3">Description</th>
                                                    <th className="px-4 py-3 text-center w-24">Qty</th>
                                                    <th className="px-4 py-3 text-right w-32">Cost/Unit</th>
                                                    <th className="px-4 py-3 text-right w-32">Total</th>
                                                    <th className="px-4 py-3 w-28 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {formData.items && formData.items.map((item) => (
                                                    <tr key={item.id} className={`hover:bg-slate-50 ${inlineEditId === item.id ? 'bg-blue-50' : ''}`}>
                                                        {inlineEditId === item.id ? (
                                                            // --- EDIT MODE ---
                                                            <>
                                                                <td className="px-4 py-2">
                                                                     <select 
                                                                        className="w-full border border-blue-300 rounded text-xs p-1 outline-none"
                                                                        value={inlineEditData.itemId || ''}
                                                                        onChange={(e) => {
                                                                             const code = e.target.value;
                                                                             const master = masterData.items.find(i => i.code === code);
                                                                             setInlineEditData({
                                                                                 ...inlineEditData,
                                                                                 itemId: code,
                                                                                 description: master ? master.name : inlineEditData.description,
                                                                                 uom: master ? master.uom : inlineEditData.uom
                                                                             });
                                                                        }}
                                                                    >
                                                                        <option value="">Select</option>
                                                                        {masterData.items?.filter(i => i.isActive).map(mi => (
                                                                            <option key={mi.id} value={mi.code}>{mi.code}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <input 
                                                                        className="w-full border border-blue-300 rounded text-xs p-1 outline-none"
                                                                        value={inlineEditData.description || ''}
                                                                        onChange={(e) => setInlineEditData({...inlineEditData, description: e.target.value})}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <div className="flex flex-col gap-1">
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full border border-blue-300 rounded text-xs p-1 outline-none text-center"
                                                                            value={inlineEditData.qty || ''}
                                                                            onChange={(e) => setInlineEditData({...inlineEditData, qty: parseFloat(e.target.value)})}
                                                                        />
                                                                        <input 
                                                                            type="text"
                                                                            className="w-full border border-blue-300 rounded text-[10px] p-1 outline-none text-center"
                                                                            placeholder="UoM"
                                                                            value={inlineEditData.uom || ''}
                                                                            onChange={(e) => setInlineEditData({...inlineEditData, uom: e.target.value})}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                     <div className="flex flex-col gap-1">
                                                                        <select 
                                                                            className="w-full border border-blue-300 rounded text-[10px] p-1 outline-none"
                                                                            value={inlineEditData.currency || 'IDR'}
                                                                            onChange={(e) => setInlineEditData({...inlineEditData, currency: e.target.value})}
                                                                        >
                                                                            {masterData.currencies.map(c => (
                                                                                <option key={c.id} value={c.code}>{c.code}</option>
                                                                            ))}
                                                                        </select>
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full border border-blue-300 rounded text-xs p-1 outline-none text-right"
                                                                            value={inlineEditData.estCostUnit || ''}
                                                                            onChange={(e) => setInlineEditData({...inlineEditData, estCostUnit: parseFloat(e.target.value)})}
                                                                        />
                                                                     </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-right font-medium text-slate-800">
                                                                    <span className="text-xs text-slate-400 mr-1">{inlineEditData.currency}</span>
                                                                    {((inlineEditData.qty || 0) * (inlineEditData.estCostUnit || 0)).toLocaleString('id-ID')}
                                                                </td>
                                                                <td className="px-4 py-2 text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <button onClick={handleSaveInlineEdit} className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded" title="Save">
                                                                            <Check size={16} />
                                                                        </button>
                                                                        <button onClick={handleCancelInlineEdit} className="text-red-500 hover:bg-red-100 p-1.5 rounded" title="Cancel">
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            // --- VIEW MODE ---
                                                            <>
                                                                <td className="px-4 py-2 font-mono text-xs text-slate-500">
                                                                    {item.itemId || '-'}
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <div className="font-medium">{item.description}</div>
                                                                    {item.budgetPlanItemId && <div className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={10} /> Budget Linked</div>}
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    {item.qty} <span className="text-xs text-slate-400">{item.uom}</span>
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-xs text-slate-500">
                                                                    <span className="mr-1">{item.currency}</span>
                                                                    {item.estCostUnit.toLocaleString('id-ID')}
                                                                </td>
                                                                <td className="px-4 py-2 text-right font-medium text-slate-800">
                                                                    <span className="text-xs text-slate-400 mr-1">{item.currency}</span>
                                                                    {item.estCostTotal.toLocaleString('id-ID')}
                                                                </td>
                                                                <td className="px-4 py-2 text-right">
                                                                    {!isReadOnly && !inlineEditId && (
                                                                        <div className="flex justify-end gap-1">
                                                                            <button onClick={() => handleStartInlineEdit(item)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded" title="Edit Item">
                                                                                <Edit2 size={16} />
                                                                            </button>
                                                                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded" title="Remove Item">
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-50 font-bold text-slate-800">
                                                    <td colSpan={4} className="px-4 py-3 text-right">Grand Total (Est)</td>
                                                    <td className="px-4 py-3 text-right">Rp {totalPRCost.toLocaleString('id-ID')}</td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: History & Info */}
                            <div className="w-full lg:w-80 bg-slate-50 border-l border-slate-200 p-6 overflow-y-auto">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Clock size={16} />
                                    Workflow History
                                </h3>
                                
                                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                                    {formData.history && formData.history.length > 0 ? (
                                        formData.history.map((log, idx) => (
                                            <div key={idx} className="relative pl-6">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
                                                <p className="text-xs text-slate-400 mb-0.5">{new Date(log.date).toLocaleString()}</p>
                                                <p className="text-sm font-medium text-slate-800">{log.action}</p>
                                                <p className="text-xs text-slate-600">by {log.user}</p>
                                                {log.notes && (
                                                    <div className="mt-2 p-2 bg-white border border-slate-200 rounded text-xs text-slate-600 italic">
                                                        "{log.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="pl-6 text-sm text-slate-400 italic">No history yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                            <div className="text-xs text-slate-500">
                                {isReadOnly ? 'Read-Only View' : '* Fill all required fields before saving.'}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white hover:text-slate-800 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                    Close
                                </button>
                                {!isReadOnly && (
                                    <button onClick={handleSubmit} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all">
                                        <Save size={18} /> {isEditMode ? 'Update Request' : 'Create Request'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
