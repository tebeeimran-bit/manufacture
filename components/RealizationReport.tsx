
import React, { useState, useMemo, useContext } from 'react';
import { ChevronDown, ChevronRight, Download, Filter, Printer } from 'lucide-react';
import { AppContext } from '../App';
import { RealizationRow, PRDetailView, WorkflowStatus } from '../types';

export const RealizationReport: React.FC = () => {
  const context = useContext(AppContext);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  if (!context) return <div>Loading...</div>;
  const { budgets, prs, masterData } = context;

  // --- Business Logic: Aggregation ---
  const reportData: RealizationRow[] = useMemo(() => {
    const rows: RealizationRow[] = [];

    // Pre-process PR Items to include Header info for easier access
    const allPrItemsWithHeader = prs.flatMap(prHeader => 
        prHeader.items.map(prItem => ({
            ...prItem,
            prHeader
        }))
    );

    budgets.forEach(budgetHeader => {
        // Get Master Data details for the header
        const project = masterData.projects.find(p => p.id === budgetHeader.projectId);
        const dept = masterData.departments.find(d => d.id === budgetHeader.departmentId);
        const io = masterData.ios.find(i => i.id === budgetHeader.ioNo);
        const cc = masterData.costCenters.find(c => c.id === budgetHeader.costCenter);

        budgetHeader.items.forEach(budgetItem => {
            // Find all PR items linked to this budget item explicitly
            const linkedItems = allPrItemsWithHeader.filter(p => p.budgetPlanItemId === budgetItem.id);
            
            const linkedPRDetails: PRDetailView[] = linkedItems.map(pi => {
                return {
                    prNo: pi.prHeader.prNumber,
                    date: pi.prHeader.prDate,
                    itemName: pi.description,
                    amount: pi.estCostTotal,
                    status: pi.prHeader.status
                };
            });

            // Calculate Realized Amount (Only Approved, On Process, or Closed count towards realization)
            const realizedAmount = linkedPRDetails
                .filter(d => [
                    WorkflowStatus.APPROVED, 
                    WorkflowStatus.ON_PROCESS, 
                    WorkflowStatus.CLOSED
                ].includes(d.status as WorkflowStatus))
                .reduce((acc, curr) => acc + curr.amount, 0);

            rows.push({
                id: budgetItem.id,
                ioNumber: io?.code || 'N/A',
                costCenter: cc?.code || 'N/A',
                machineName: budgetItem.machineName,
                projectName: project?.name || 'Unknown',
                deptName: dept?.name || 'Unknown',
                totalPlanCost: budgetItem.estimationCostTotal,
                realizedAmount,
                balance: budgetItem.estimationCostTotal - realizedAmount,
                percentageUsed: budgetItem.estimationCostTotal > 0 
                    ? (realizedAmount / budgetItem.estimationCostTotal) * 100 
                    : 0,
                linkedPRs: linkedPRDetails
            });
        });
    });

    return rows;
  }, [budgets, prs, masterData]);

  // --- Calculate Summaries (Grand Totals) ---
  const totalPlan = reportData.reduce((sum, row) => sum + row.totalPlanCost, 0);
  const totalRealization = reportData.reduce((sum, row) => sum + row.realizedAmount, 0);
  const totalBalance = totalPlan - totalRealization;
  const totalPercentage = totalPlan > 0 ? (totalRealization / totalPlan) * 100 : 0;

  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Budget Realization Report</h2>
          <p className="text-slate-500">Detailed breakdown of Plan vs. Actual Spending</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium">
                <Filter size={16} /> Filter
            </button>
            <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium" 
                title="Print Report"
            >
                <Printer size={16} /> Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm">
                <Download size={16} /> Export CSV
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Budget Plan</p>
              <p className="text-xl font-mono font-bold text-slate-800 mt-1">Rp {totalPlan.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Realized</p>
              <p className="text-xl font-mono font-bold text-blue-600 mt-1">Rp {totalRealization.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Remaining Balance</p>
              <p className={`text-xl font-mono font-bold mt-1 ${totalBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  Rp {totalBalance.toLocaleString('id-ID')}
              </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Utilization</p>
              <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${totalPercentage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                      ></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{totalPercentage.toFixed(1)}%</span>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 w-10 print:hidden"></th>
                <th className="p-4">IO Number</th>
                <th className="p-4">Cost Center</th>
                <th className="p-4">Machine / Asset</th>
                <th className="p-4">Project</th>
                <th className="p-4 text-right">Plan Amount</th>
                <th className="p-4 text-right">Realized</th>
                <th className="p-4 text-right">Balance</th>
                <th className="p-4 text-center">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((row) => (
                <React.Fragment key={row.id}>
                  <tr 
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedRowId === row.id ? 'bg-blue-50/50' : ''} print:break-inside-avoid`}
                    onClick={() => toggleRow(row.id)}
                  >
                    <td className="p-4 text-slate-400 print:hidden">
                      {expandedRowId === row.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </td>
                    <td className="p-4 font-medium text-slate-700">{row.ioNumber}</td>
                    <td className="p-4 text-slate-600">{row.costCenter}</td>
                    <td className="p-4 text-slate-900 font-medium">{row.machineName}</td>
                    <td className="p-4 text-slate-500">{row.projectName}</td>
                    <td className="p-4 text-right font-mono text-slate-700">Rp {row.totalPlanCost.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right font-mono text-blue-700 font-medium">Rp {row.realizedAmount.toLocaleString('id-ID')}</td>
                    <td className={`p-4 text-right font-mono font-bold ${row.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      Rp {row.balance.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            row.percentageUsed > 100 ? 'bg-red-100 text-red-700' : 
                            row.percentageUsed > 80 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                            {row.percentageUsed.toFixed(0)}%
                        </span>
                    </td>
                  </tr>
                  
                  {/* Drill Down Row */}
                  {expandedRowId === row.id && (
                    <tr className="bg-slate-50">
                        <td colSpan={9} className="p-0">
                            <div className="p-6 border-y border-slate-200/50">
                                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Associated Purchase Requests</h4>
                                {row.linkedPRs.length > 0 ? (
                                    <table className="w-full text-xs border border-slate-200 bg-white rounded-md overflow-hidden">
                                        <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 text-left">PR No</th>
                                                <th className="px-4 py-2 text-left">Date</th>
                                                <th className="px-4 py-2 text-left">Item Description</th>
                                                <th className="px-4 py-2 text-left">Status</th>
                                                <th className="px-4 py-2 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {row.linkedPRs.map((pr, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2 font-medium text-blue-600">{pr.prNo}</td>
                                                    <td className="px-4 py-2 text-slate-500">{pr.date}</td>
                                                    <td className="px-4 py-2 text-slate-700">{pr.itemName}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                                            pr.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            pr.status === 'On Process' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                            {pr.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-slate-700 font-mono">Rp {pr.amount.toLocaleString('id-ID')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-slate-400 text-center italic py-2">No Purchase Requests linked yet.</div>
                                )}
                            </div>
                        </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {reportData.length === 0 && (
                 <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                        No budget items found to display.
                    </td>
                 </tr>
              )}
            </tbody>
            
            {/* Grand Total Footer */}
            <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                <tr>
                    <td colSpan={5} className="p-4 text-right uppercase text-xs tracking-wider">Grand Total</td>
                    <td className="p-4 text-right font-mono text-slate-800">Rp {totalPlan.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right font-mono text-blue-700">Rp {totalRealization.toLocaleString('id-ID')}</td>
                    <td className={`p-4 text-right font-mono ${totalBalance < 0 ? 'text-red-600' : 'text-emerald-700'}`}>Rp {totalBalance.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${totalPercentage > 100 ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                            {totalPercentage.toFixed(1)}%
                        </span>
                    </td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
