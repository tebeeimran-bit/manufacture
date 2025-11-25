
import React, { useState, createContext, useContext } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { BudgetModule } from './components/BudgetModule';
import { PRModule } from './components/PRModule';
import { ProjectModule } from './components/ProjectModule';
import { RealizationReport } from './components/RealizationReport';
import { EvaluationAnalysis } from './components/EvaluationAnalysis';
import { 
    BudgetPlanHeader, PurchaseRequest, MasterOption, 
    WorkflowStatus, MasterDataCategory, User, AppState, Project
} from './types';
import { 
    MOCK_BUDGETS, MOCK_PRS, DEPARTMENTS, BUSINESS_CATEGORIES, 
    IO_NUMBERS, COST_CENTERS, PROJECTS, PLANTS, SUPPLIERS, MASTER_ITEMS, CURRENCIES,
    MOCK_USERS, MOCK_PROJECTS_DETAILED
} from './constants';

// --- CONTEXT ---
export const AppContext = createContext<AppState | null>(null);

const AppContent = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { budgets, prs, currentUser, login, users, projectsList, masterData } = context;

    // Protection: If accessed directly without login, show nothing (will be handled by App wrapper)
    if (!currentUser) return <Login onLogin={login} users={users} />;

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard budgets={budgets} prs={prs} projects={projectsList} masterData={masterData} />} />
                <Route path="/budget" element={<BudgetModule />} />
                <Route path="/pr" element={<PRModule />} />
                <Route path="/projects" element={<ProjectModule />} />
                <Route path="/comparison" element={<RealizationReport />} />
                <Route path="/evaluation" element={<EvaluationAnalysis />} />
                {/* Protect Admin Route */}
                <Route path="/admin" element={<AdminPanel />} />
            </Routes>
        </Layout>
    );
};

export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(MOCK_USERS); // Initialize with Mocks
    const [budgets, setBudgets] = useState<BudgetPlanHeader[]>(MOCK_BUDGETS);
    const [prs, setPrs] = useState<PurchaseRequest[]>(MOCK_PRS);
    const [projectsList, setProjectsList] = useState<Project[]>(MOCK_PROJECTS_DETAILED);

    // Convert static constants to State
    const [masterDataState, setMasterDataState] = useState<Record<MasterDataCategory, MasterOption[]>>({
        departments: DEPARTMENTS,
        categories: BUSINESS_CATEGORIES,
        ios: IO_NUMBERS,
        costCenters: COST_CENTERS,
        projects: PROJECTS,
        plants: PLANTS,
        suppliers: SUPPLIERS,
        currencies: CURRENCIES,
        items: MASTER_ITEMS
    });

    // Auth Handlers
    const login = (user: User) => setCurrentUser(user);
    const logout = () => setCurrentUser(null);

    // Use functional updates to prevent race conditions on multiple simultaneous calls
    const addBudget = (b: BudgetPlanHeader) => setBudgets(prev => [...prev, b]);
    
    const updateBudget = (updated: BudgetPlanHeader) => {
        setBudgets(prev => prev.map(b => b.id === updated.id ? updated : b));
    };
    
    const deleteBudget = (id: string) => {
        setBudgets(prev => prev.filter(b => b.id !== id));
    };
    
    const updateBudgetStatus = (id: string, status: WorkflowStatus) => {
        setBudgets(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    };

    const addPR = (p: PurchaseRequest) => setPrs(prev => [...prev, p]);
    
    const updatePR = (updated: PurchaseRequest) => {
        setPrs(prev => prev.map(p => p.id === updated.id ? updated : p));
    };
    
    const deletePR = (id: string) => {
        setPrs(prev => prev.filter(p => p.id !== id));
    };
    
    const updatePRStatus = (id: string, status: WorkflowStatus, note?: string) => {
        setPrs(prev => prev.map(p => {
            if (p.id !== id) return p;
            
            // Create Log Entry
            const logEntry = {
                date: new Date().toISOString(),
                user: currentUser?.name || 'Unknown',
                action: `Changed status to ${status}`,
                notes: note || ''
            };

            return { 
                ...p, 
                status,
                history: [...(p.history || []), logEntry]
            };
        }));
    };

    // User Management
    const manageUser = (action: 'create' | 'update' | 'delete', user: User) => {
        if (action === 'create') {
            setUsers(prev => [...prev, user]);
        } else if (action === 'update') {
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
            // If current user is updated, reflect changes
            if (currentUser?.id === user.id) {
                setCurrentUser(user);
            }
        } else if (action === 'delete') {
            setUsers(prev => prev.filter(u => u.id !== user.id));
            // Logic Error Fix: If deleting the current user, must logout
            if (currentUser?.id === user.id) {
                logout();
            }
        }
    };

    // Master Data CRUD
    const manageMasterData = (category: MasterDataCategory, action: 'create' | 'update' | 'delete', item: MasterOption) => {
        setMasterDataState(prevState => {
            const currentList = prevState[category];
            let newList = [...currentList];

            if (action === 'create') {
                newList.push(item);
            } else if (action === 'update') {
                newList = currentList.map(x => x.id === item.id ? item : x);
            } else if (action === 'delete') {
                newList = currentList.filter(x => x.id !== item.id);
            }

            return {
                ...prevState,
                [category]: newList
            };
        });
    };

    // Project CRUD & Sync with Master Data
    const manageProject = (action: 'create' | 'update' | 'delete', project: Project) => {
        if (action === 'create') {
            setProjectsList(prev => [...prev, project]);
            // Auto-add to Master Data for Budgets
            manageMasterData('projects', 'create', {
                id: project.id,
                code: project.code,
                name: project.name,
                description: project.description
            });
        } else if (action === 'update') {
            setProjectsList(prev => prev.map(p => p.id === project.id ? project : p));
            // Sync Master Data
            manageMasterData('projects', 'update', {
                id: project.id,
                code: project.code,
                name: project.name,
                description: project.description
            });
        } else if (action === 'delete') {
            setProjectsList(prev => prev.filter(p => p.id !== project.id));
            // Sync Master Data
            manageMasterData('projects', 'delete', { id: project.id } as MasterOption);
        }
    };

    return (
        <AppContext.Provider value={{ 
            currentUser, users, login, logout,
            budgets, prs, projectsList,
            masterData: masterDataState, 
            addBudget, updateBudget, deleteBudget, updateBudgetStatus,
            addPR, updatePR, deletePR, updatePRStatus,
            manageMasterData, manageUser, manageProject
        }}>
            {!currentUser ? (
                <Login onLogin={login} users={users} />
            ) : (
                <HashRouter>
                    <AppContent />
                </HashRouter>
            )}
        </AppContext.Provider>
    );
}
