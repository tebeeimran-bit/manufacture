
import React, { useMemo, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DollarSign, FileText, CheckCircle, PauseCircle, Edit, Wallet, Archive, Clock, PlayCircle, Calendar } from 'lucide-react';
import { BudgetPlanHeader, PurchaseRequest, WorkflowStatus, Project, MasterDataCategory, MasterOption } from '../types';

interface DashboardProps {
    budgets: BudgetPlanHeader[];
    prs: PurchaseRequest[];
    projects: Project[];
    masterData: Record<MasterDataCategory, MasterOption[]>;
}

export const Dashboard: React.FC<DashboardProps> = ({ budgets, prs, projects, masterData }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- 1. Financial Calculations ---
    const totalBudget = budgets.reduce((sum, b) => sum + b.items.reduce((is, i) => is + i.estimationCostTotal, 0), 0);
    
    // Realization: Sum of PRs that are Approved, Processed, or Closed
    const realizedPRs = prs.filter(p => 
        [WorkflowStatus.APPROVED, WorkflowStatus.ON_PROCESS, WorkflowStatus.CLOSED].includes(p.status)
    );
    const totalRealization = realizedPRs.reduce((sum, p) => sum + p.items.reduce((is, i) => is + i.estCostTotal, 0), 0);
    
    const remainingBalance = totalBudget - totalRealization;

    // --- 2. PR Status Counts ---
    const prApprovedCount = prs.filter(p => p.status === WorkflowStatus.APPROVED).length;
    const prCompletedCount = prs.filter(p => p.status === WorkflowStatus.CLOSED).length;
    const prDraftCount = prs.filter(p => p.status === WorkflowStatus.DRAFT).length;
    const prPendingCount = prs.filter(p => p.status === WorkflowStatus.SUBMITTED).length;
    
    // --- 3. Project Status Counts ---
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const draftProjects = projects.filter(p => p.status === 'Draft').length;
    const holdProjects = projects.filter(p => p.status === 'Hold').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    // --- 4. Top 5 Projects by Budget ---
    const topProjects = [...projects]
        .sort((a, b) => (b.budgetAllocation || 0) - (a.budgetAllocation || 0))
        .slice(0, 5);

    // --- 5. Chart Data: Budget vs Realization by Category (Filtered by Year) ---
    const chartData = useMemo(() => {
        const stats: Record<string, { name: string, budget: number, realization: number }> = {};

        // Initialize categories
        masterData.categories.forEach(c => {
            stats[c.id] = { name: c.code, budget: 0, realization: 0 };
        });

        // Calculate Budget for Selected Year
        budgets.forEach(b => {
            if (stats[b.businessCategoryId]) {
                b.items.forEach(item => {
                    // Check if item matches selected fiscal year
                    if (item.fiscalYear === selectedYear) {
                        stats[b.businessCategoryId].budget += item.estimationCostTotal;
                    }
                });
            }
        });

        // Calculate Realization (Approved PRs linked to Budget Items of Selected Year)
        const validPRs = prs.filter(p =>
            [WorkflowStatus.APPROVED, WorkflowStatus.ON_PROCESS, WorkflowStatus.CLOSED].includes(p.status)
        );

        validPRs.forEach(pr => {
             if (stats[pr.businessCategoryId]) {
                 pr.items.forEach(prItem => {
                     // Find linked budget item to check year
                     // Optimization: We iterate budgets to find the linked item. 
                     // For a large app, this should be indexed, but for dashboard it's acceptable.
                     let linkedItemYear = -1;
                     for (const b of budgets) {
                         const found = b.items.find(i => i.id === prItem.budgetPlanItemId);
                         if (found) {
                             linkedItemYear = found.fiscalYear;
                             break;
                         }
                     }

                     // If the linked budget item is for the selected year, count as realization
                     // If unlinked, we ignore for year filtering strictness, or could use PR Date.
                     // Here we use strict budget link matching for accuracy.
                     if (linkedItemYear === selectedYear) {
                         stats[pr.businessCategoryId].realization += prItem.estCostTotal;
                     }
                 });
             }
        });

        return Object.values(stats);
    }, [budgets, prs, masterData.categories, selectedYear]);

    // Helper to format large IDR numbers
    const formatIDRCompact = (val: number) => {
        if (val >= 1_000_000_000) {
            return `Rp ${(val / 1_000_000_000).toFixed(1)} M`; // Miliar
        } else if (val >= 1_000_000) {
            return `Rp ${(val / 1_000_000).toFixed(0)} jt`; // Juta
        }
        return `Rp ${val.toLocaleString('id-ID')}`;
    };

    const MetricCard = ({ title, value, icon: Icon, color, sub, type = 'standard' }: any) => (
        <div className={`rounded-xl shadow-sm border p-6 ${type === 'highlight' ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className={`text-sm font-medium mb-1 ${type === 'highlight' ? 'text-slate-300' : 'text-slate-500'}`}>{title}</p>
                    <h3 className={`text-2xl font-bold tracking-tight ${type === 'highlight' ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${type === 'highlight' ? 'bg-white/10 text-white' : `${color} bg-opacity-10 ${color.replace('bg-', 'text-')}`}`}>
                    <Icon size={24} />
                </div>
            </div>
            {sub && <p className={`text-xs mt-4 ${type === 'highlight' ? 'text-slate-400' : 'text-slate-400'}`}>{sub}</p>}
        </div>
    );

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            'Active': 'bg-emerald-100 text-emerald-700',
            'Draft': 'bg-slate-100 text-slate-600',
            'Completed': 'bg-blue-100 text-blue-700',
            'Hold': 'bg-amber-100 text-amber-700'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
                <p className="text-slate-500">Financial Summary & Operational Status</p>
            </div>

            {/* ROW 1: Financials (Budget, Realization, Balance) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title="Total Budget Plan" 
                    value={formatIDRCompact(totalBudget)} 
                    icon={DollarSign} 
                    color="bg-blue-500"
                    sub="Approved Annual Budget"
                    type="highlight"
                />
                <MetricCard 
                    title="Total Realization" 
                    value={formatIDRCompact(totalRealization)} 
                    icon={Wallet} 
                    color="bg-emerald-500"
                    sub="Approved & Processed PRs"
                    type="highlight"
                />
                <MetricCard 
                    title="Remaining Balance" 
                    value={formatIDRCompact(remainingBalance)} 
                    icon={CheckCircle}
                    color="bg-indigo-500"
                    sub="Available Funds"
                    type="highlight"
                />
            </div>

             {/* ROW 2: Charts & Analysis */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800">Budget vs Realization</h3>
                            <p className="text-xs text-slate-500">Comparison by Business Category</p>
                        </div>
                        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-2">
                            <Calendar size={16} className="text-slate-400 mr-2" />
                            <select 
                                className="bg-transparent border-none text-sm font-medium text-slate-700 py-1.5 outline-none cursor-pointer"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            >
                                {[2023, 2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>FY {y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 12 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000000) return `${(value / 1000000000).toFixed(0)}M`;
                                        if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`;
                                        return value;
                                    }}
                                />
                                <ReTooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="budget" name="Budget Plan" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="realization" name="Realized" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 5 Projects (Moved here for better layout density) */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Top Projects</h3>
                        <p className="text-xs text-slate-500">Highest budget allocation</p>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-slate-100">
                                {topProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{project.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                <span className="bg-slate-100 px-1.5 rounded text-[10px]">{project.customer}</span>
                                                <StatusBadge status={project.status} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-medium text-slate-700 text-xs">
                                            Rp {(project.budgetAllocation || 0).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                                {topProjects.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-center text-slate-400 text-xs">
                                            No projects available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ROW 3: PR Counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                    title="PR Approved" 
                    value={prApprovedCount} 
                    icon={CheckCircle} 
                    color="bg-emerald-500"
                    sub="Ready for PO"
                />
                <MetricCard 
                    title="PR Completed" 
                    value={prCompletedCount} 
                    icon={Archive} 
                    color="bg-slate-500"
                    sub="Closed / Finished"
                />
                <MetricCard 
                    title="PR Draft" 
                    value={prDraftCount} 
                    icon={Edit} 
                    color="bg-blue-500"
                    sub="Not Submitted"
                />
                <MetricCard 
                    title="Pending Approval" 
                    value={prPendingCount} 
                    icon={Clock} 
                    color="bg-amber-500"
                    sub="Need Action"
                />
            </div>

            {/* ROW 4: Project Counts */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                    title="Active Projects" 
                    value={activeProjects} 
                    icon={PlayCircle} 
                    color="bg-emerald-500"
                />
                <MetricCard 
                    title="Draft Projects" 
                    value={draftProjects} 
                    icon={FileText} 
                    color="bg-slate-500"
                />
                <MetricCard 
                    title="Hold Projects" 
                    value={holdProjects} 
                    icon={PauseCircle} 
                    color="bg-amber-500"
                />
                <MetricCard 
                    title="Completed" 
                    value={completedProjects} 
                    icon={CheckCircle} 
                    color="bg-blue-500"
                />
            </div>
        </div>
    );
};
