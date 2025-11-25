
import React, { useContext, useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, HelpCircle, Info } from 'lucide-react';
import { AppContext } from '../App';
import { WorkflowStatus, BudgetPlanHeader } from '../types';

export const EvaluationAnalysis = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { budgets, prs, updateBudget, masterData } = context;

    // Local state to handle inputs before saving
    // Map key: budgetItemId, Value: { obstacle, differenceReason }
    const [evaluations, setEvaluations] = useState<Record<string, { obstacle: string, reason: string }>>({});

    // Initialize local state from budgets
    useEffect(() => {
        const initialEvals: Record<string, { obstacle: string, reason: string }> = {};
        budgets.forEach(b => {
            b.items.forEach(i => {
                initialEvals[i.id] = {
                    obstacle: i.evaluationObstacle || '',
                    reason: i.evaluationDifferenceReason || ''
                };
            });
        });
        setEvaluations(initialEvals);
    }, [budgets]);

    const handleInputChange = (itemId: string, field: 'obstacle' | 'reason', value: string) => {
        setEvaluations(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };

    const handleSave = (headerId: string) => {
        const budgetToUpdate = budgets.find(b => b.id === headerId);
        if (!budgetToUpdate) return;

        // Update items with new evaluation data
        const updatedItems = budgetToUpdate.items.map(item => {
            const ev = evaluations[item.id];
            if (ev) {
                return {
                    ...item,
                    evaluationObstacle: ev.obstacle,
                    evaluationDifferenceReason: ev.reason
                };
            }
            return item;
        });

        updateBudget({
            ...budgetToUpdate,
            items: updatedItems
        });
        alert("Evaluation data saved successfully!");
    };

    // Helper to calculate realized amount for an item
    const getRealizedAmount = (budgetItemId: string) => {
        let total = 0;
        prs.forEach(pr => {
            if ([WorkflowStatus.APPROVED, WorkflowStatus.ON_PROCESS, WorkflowStatus.CLOSED].includes(pr.status)) {
                pr.items.forEach(item => {
                    if (item.budgetPlanItemId === budgetItemId) {
                        total += item.estCostTotal;
                    }
                });
            }
        });
        return total;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Evaluasi Budget vs PR</h1>
                <p className="text-slate-500">Monitoring utilization status, obstacles, and cost discrepancies.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Evaluation Guide:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Status Full:</strong> Realization is ≥ 90% of Plan.</li>
                        <li><strong>Kendala (Obstacle):</strong> Fill this if status is not full (e.g., Supplier delay, Spec change).</li>
                        <li><strong>Alasan Perbedaan (Reason):</strong> Fill this if PR Item details/spec differ from original Budget Plan.</li>
                    </ul>
                </div>
            </div>

            <div className="space-y-8">
                {budgets.map(budget => {
                    const project = masterData.projects.find(p => p.id === budget.projectId);
                    const io = masterData.ios.find(i => i.id === budget.ioNo);

                    return (
                        <div key={budget.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800">{budget.planNumber}</h3>
                                    <p className="text-xs text-slate-500">
                                        {io?.code} • {project?.name || 'Unknown Project'} • {masterData.departments.find(d => d.id === budget.departmentId)?.name}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleSave(budget.id)}
                                    className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                                >
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white border-b border-slate-200 text-slate-600 font-semibold">
                                        <tr>
                                            <th className="px-6 py-3 w-[20%]">Machine / Asset</th>
                                            <th className="px-6 py-3 w-[15%] text-right">Plan vs Realized</th>
                                            <th className="px-6 py-3 w-[10%] text-center">Status</th>
                                            <th className="px-6 py-3 w-[25%]">Kendala (Obstacle)</th>
                                            <th className="px-6 py-3 w-[25%]">Alasan Perbedaan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {budget.items.map(item => {
                                            const realized = getRealizedAmount(item.id);
                                            const utilization = item.estimationCostTotal > 0 ? (realized / item.estimationCostTotal) * 100 : 0;
                                            const isFull = utilization >= 90;
                                            const isOver = utilization > 100;
                                            
                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50 group">
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="font-medium text-slate-800">{item.machineName}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">{item.process}</div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top text-right">
                                                        <div className="text-slate-500 text-xs">Plan: <span className="font-mono text-slate-800">Rp {item.estimationCostTotal.toLocaleString('id-ID')}</span></div>
                                                        <div className="text-slate-500 text-xs">Real: <span className="font-mono text-blue-600">Rp {realized.toLocaleString('id-ID')}</span></div>
                                                        <div className="mt-1 font-bold text-xs">{utilization.toFixed(0)}%</div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top text-center">
                                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${
                                                            isOver ? 'bg-red-50 text-red-700 border-red-200' :
                                                            isFull ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                            {isOver ? <AlertCircle size={12} /> : 
                                                             isFull ? <CheckCircle size={12} /> : 
                                                             <HelpCircle size={12} />}
                                                            {isOver ? 'Over' : isFull ? 'Full' : 'Not Full'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        {!isFull ? (
                                                            <textarea 
                                                                className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                                rows={2}
                                                                placeholder="Apa kendala pembelian?"
                                                                value={evaluations[item.id]?.obstacle || ''}
                                                                onChange={(e) => handleInputChange(item.id, 'obstacle', e.target.value)}
                                                            />
                                                        ) : (
                                                            <div className="text-xs text-slate-400 italic py-2">Completed</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <textarea 
                                                            className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                            rows={2}
                                                            placeholder="Jika spec/harga beda, jelaskan kenapa..."
                                                            value={evaluations[item.id]?.reason || ''}
                                                            onChange={(e) => handleInputChange(item.id, 'reason', e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
                {budgets.length === 0 && (
                     <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
                        No Budget Plans available for evaluation.
                    </div>
                )}
            </div>
        </div>
    );
};
