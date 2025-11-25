
import React, { useState, useContext } from 'react';
import { Plus, Edit2, Trash2, X, Save, Calendar, Briefcase, Search, Flag, CheckCircle, Circle } from 'lucide-react';
import { AppContext } from '../App';
import { Project, ProjectSchedule, Milestone } from '../types';

export const ProjectModule = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { projectsList, manageProject } = context;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const initialSchedule: ProjectSchedule = {
        dieGo: '', t0: '', pp1: '', pp2: '', pp3: '', massPro: ''
    };
    const initialFormState: Partial<Project> = {
        code: '',
        name: '',
        customer: '',
        model: '',
        description: '',
        year: new Date().getFullYear().toString(),
        status: 'Draft',
        projectManager: '',
        budgetAllocation: 0,
        schedule: initialSchedule,
        customMilestones: []
    };

    const [formData, setFormData] = useState<Partial<Project>>(initialFormState);
    const [newMilestone, setNewMilestone] = useState<{name: string, date: string}>({name: '', date: ''});

    // --- Handlers ---

    const openCreateModal = () => {
        setEditingProject(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const openEditModal = (project: Project) => {
        setEditingProject(project);
        // Deep copy to avoid mutating state directly
        setFormData({
            ...project,
            schedule: { ...project.schedule },
            customMilestones: project.customMilestones ? [...project.customMilestones] : []
        });
        setIsModalOpen(true);
    };

    const handleDelete = (project: Project) => {
        if (window.confirm(`Are you sure you want to delete project ${project.code}?`)) {
            manageProject('delete', project);
        }
    };

    const handleAddMilestone = () => {
        if (!newMilestone.name || !newMilestone.date) {
            alert("Milestone name and date are required");
            return;
        }
        const ms: Milestone = {
            id: `ms-${Date.now()}`,
            name: newMilestone.name,
            date: newMilestone.date,
            isCompleted: false
        };
        setFormData({
            ...formData,
            customMilestones: [...(formData.customMilestones || []), ms]
        });
        setNewMilestone({name: '', date: ''});
    };

    const handleRemoveMilestone = (id: string) => {
        setFormData({
            ...formData,
            customMilestones: formData.customMilestones?.filter(m => m.id !== id)
        });
    };

    const handleSave = () => {
        if (!formData.code || !formData.name || !formData.customer) {
            alert("Project Code, Name, and Customer are required.");
            return;
        }

        const payload: Project = {
            id: editingProject ? editingProject.id : `prj-${Date.now()}`,
            code: formData.code!,
            name: formData.name!,
            customer: formData.customer!,
            model: formData.model || '',
            description: formData.description || '',
            year: formData.year || new Date().getFullYear().toString(),
            status: formData.status as any,
            projectManager: formData.projectManager,
            budgetAllocation: formData.budgetAllocation,
            schedule: formData.schedule || initialSchedule,
            customMilestones: formData.customMilestones || []
        };

        manageProject(editingProject ? 'update' : 'create', payload);
        setIsModalOpen(false);
    };

    // Filtered Data
    const filteredProjects = projectsList.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            'Active': 'bg-emerald-100 text-emerald-700',
            'Draft': 'bg-slate-100 text-slate-600',
            'Completed': 'bg-blue-100 text-blue-700',
            'Hold': 'bg-amber-100 text-amber-700'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
                    <p className="text-slate-500">Manage product introductions and detailed schedules.</p>
                </div>
                <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
                    <Plus size={18} /> New Project
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center bg-white p-2 rounded-lg border border-slate-200 w-full md:w-80">
                <Search size={18} className="text-slate-400 mr-2" />
                <input 
                    type="text" 
                    placeholder="Search projects..." 
                    className="bg-transparent border-none outline-none text-sm text-slate-700 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Code</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Project Manager</th>
                                <th className="px-6 py-3">Model</th>
                                <th className="px-6 py-3">Year</th>
                                <th className="px-6 py-3 bg-blue-50/50 border-l border-slate-200 text-blue-800">Die Go</th>
                                <th className="px-6 py-3 bg-blue-50/50 text-blue-800">T0</th>
                                <th className="px-6 py-3 bg-blue-50/50 text-blue-800">PP1</th>
                                <th className="px-6 py-3 bg-blue-50/50 text-blue-800">PP2</th>
                                <th className="px-6 py-3 bg-blue-50/50 text-blue-800">PP3</th>
                                <th className="px-6 py-3 bg-blue-50/50 border-r border-slate-200 text-blue-800 font-bold">Mass Pro</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProjects.map((project) => (
                                <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-3 font-mono font-medium text-blue-600">{project.code}</td>
                                    <td className="px-6 py-3 text-slate-600">{project.customer}</td>
                                    <td className="px-6 py-3 font-medium text-slate-800">{project.name}</td>
                                    <td className="px-6 py-3 text-slate-600">{project.projectManager || '-'}</td>
                                    <td className="px-6 py-3 text-slate-600">{project.model}</td>
                                    <td className="px-6 py-3 text-slate-600 font-medium">{project.year}</td>
                                    
                                    {/* Schedule Columns - ADDED OPTIONAL CHAINING HERE */}
                                    <td className="px-6 py-3 font-mono text-xs border-l border-slate-100 bg-slate-50/30">{project.schedule?.dieGo || '-'}</td>
                                    <td className="px-6 py-3 font-mono text-xs bg-slate-50/30">{project.schedule?.t0 || '-'}</td>
                                    <td className="px-6 py-3 font-mono text-xs bg-slate-50/30">{project.schedule?.pp1 || '-'}</td>
                                    <td className="px-6 py-3 font-mono text-xs bg-slate-50/30">{project.schedule?.pp2 || '-'}</td>
                                    <td className="px-6 py-3 font-mono text-xs bg-slate-50/30">{project.schedule?.pp3 || '-'}</td>
                                    <td className="px-6 py-3 font-mono text-xs border-r border-slate-100 font-bold text-slate-700 bg-slate-50/30">{project.schedule?.massPro || '-'}</td>

                                    <td className="px-6 py-3 text-center"><StatusBadge status={project.status} /></td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(project)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(project)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProjects.length === 0 && (
                                <tr>
                                    <td colSpan={14} className="px-6 py-12 text-center text-slate-400">
                                        No projects found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Briefcase size={20} className="text-blue-600" />
                                {editingProject ? 'Edit Project' : 'New Project'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-8 overflow-y-auto flex-1">
                            {/* General Info */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-600 rounded"></div>
                                    General Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="lg:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Project Name *</label>
                                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="Project Name"
                                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Project Code *</label>
                                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="P-2024-XX"
                                            value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer *</label>
                                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="Customer Name"
                                            value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} />
                                    </div>
                                    
                                    {/* New Fields: Manager & Budget */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Project Manager</label>
                                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="PM Name"
                                            value={formData.projectManager || ''} onChange={e => setFormData({...formData, projectManager: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Budget Allocation (IDR)</label>
                                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm text-right" placeholder="0"
                                            value={formData.budgetAllocation || ''} onChange={e => setFormData({...formData, budgetAllocation: parseFloat(e.target.value)})} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Model</label>
                                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="Vehicle Model"
                                            value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Year</label>
                                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                            value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                                    </div>
                                    <div className="lg:col-span-4">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
                                        <textarea className="w-full border border-slate-300 rounded-lg p-2 text-sm" rows={2} placeholder="Project Scope..."
                                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                            value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                            <option value="Draft">Draft</option>
                                            <option value="Active">Active</option>
                                            <option value="Hold">Hold</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Schedule */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Calendar size={16} className="text-emerald-600" />
                                    Master Schedule
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Die Go</label>
                                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                                            value={formData.schedule?.dieGo || ''} 
                                            onChange={e => setFormData({...formData, schedule: {...(formData.schedule || initialSchedule), dieGo: e.target.value}})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">T0</label>
                                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                                            value={formData.schedule?.t0 || ''} 
                                            onChange={e => setFormData({...formData, schedule: {...(formData.schedule || initialSchedule), t0: e.target.value}})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">PP1</label>
                                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                                            value={formData.schedule?.pp1 || ''} 
                                            onChange={e => setFormData({...formData, schedule: {...(formData.schedule || initialSchedule), pp1: e.target.value}})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">PP2</label>
                                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                                            value={formData.schedule?.pp2 || ''} 
                                            onChange={e => setFormData({...formData, schedule: {...(formData.schedule || initialSchedule), pp2: e.target.value}})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">PP3</label>
                                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                                            value={formData.schedule?.pp3 || ''} 
                                            onChange={e => setFormData({...formData, schedule: {...(formData.schedule || initialSchedule), pp3: e.target.value}})} />
                                    </div>
                                    <div className="bg-emerald-50 p-1 rounded border border-emerald-100">
                                        <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Mass Pro</label>
                                        <input type="date" className="w-full border border-emerald-300 rounded-lg p-2 text-xs font-bold text-emerald-800"
                                            value={formData.schedule?.massPro || ''} 
                                            onChange={e => setFormData({...formData, schedule: {...(formData.schedule || initialSchedule), massPro: e.target.value}})} />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Key Milestones (Dynamic List) */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Flag size={16} className="text-orange-600" />
                                    Key Milestones & Events
                                </h4>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Event Name</label>
                                            <input 
                                                type="text" 
                                                className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                                                placeholder="e.g. Kickoff Meeting"
                                                value={newMilestone.name}
                                                onChange={e => setNewMilestone({...newMilestone, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="w-40">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                                value={newMilestone.date}
                                                onChange={e => setNewMilestone({...newMilestone, date: e.target.value})}
                                            />
                                        </div>
                                        <button 
                                            onClick={handleAddMilestone}
                                            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors h-[38px]"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {formData.customMilestones && formData.customMilestones.length > 0 ? (
                                            formData.customMilestones.map((ms) => (
                                                <div key={ms.id} className="flex items-center justify-between bg-white p-3 rounded border border-slate-200">
                                                    <div className="flex items-center gap-3">
                                                        <Flag size={14} className="text-orange-500" />
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">{ms.name}</p>
                                                            <p className="text-xs text-slate-500">{ms.date}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemoveMilestone(ms.id)}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-slate-400 text-sm italic">
                                                No additional milestones added.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-white hover:text-slate-800 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                                <Save size={16} /> Save Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
