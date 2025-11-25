
// Status Enums
export enum WorkflowStatus {
    DRAFT = 'Draft',
    SUBMITTED = 'Submitted',
    APPROVED = 'Approved',
    ON_PROCESS = 'On Process',
    REJECTED = 'Rejected',
    CLOSED = 'Closed',
}

export enum UserRole {
    ADMIN = 'Admin',
    USER = 'User',
    APPROVER = 'Approver',
    FINANCE = 'Finance',
}

// Master Data Categories
export type MasterDataCategory = 'departments' | 'categories' | 'ios' | 'costCenters' | 'projects' | 'plants' | 'suppliers' | 'items' | 'currencies';

// Master Data Interfaces
export interface MasterOption {
    id: string;
    code: string;
    name: string;
    category?: string; // For hierarchical filtering
    description?: string;
    // Extended fields for Master Items
    uom?: string;
    isActive?: boolean; 
}

export interface User {
    id: string;
    username: string; // Added for login
    password?: string; // Added for login auth
    name: string;
    email: string;
    role: UserRole;
    department: string;
}

// --- PROJECT MANAGEMENT ---
export interface ProjectSchedule {
    dieGo?: string;
    t0?: string;
    pp1?: string;
    pp2?: string;
    pp3?: string;
    massPro?: string;
}

export interface Milestone {
    id: string;
    name: string;
    date: string;
    isCompleted?: boolean;
}

export interface Project {
    id: string;
    code: string;
    customer: string;
    name: string;
    model: string;
    description?: string;
    year: string;
    projectManager?: string; // New Field
    budgetAllocation?: number; // New Field
    status: 'Active' | 'Completed' | 'Hold' | 'Draft';
    schedule: ProjectSchedule;
    customMilestones?: Milestone[]; // New Field
}

export interface TransferLog {
    date: string;
    fromPlanId: string;
    fromIoNo: string;
    toPlanId: string;
    toIoNo: string;
    reason: string;
    user: string;
}

export interface BudgetPlanItem {
    id: string;
    internalNo: string;
    machineName: string;
    process: 'Preparation' | 'Final Assy';
    brand?: string;
    qty: number;
    uom: string;
    currency: string;
    estimationCostUnit: number;
    estimationCostTotal: number;
    description?: string;
    applicationProcess?: string;
    fiscalYear: number; // New: Allocate to specific year
    
    // --- Evaluation Fields (New) ---
    evaluationObstacle?: string; // Kendala jika belum full
    evaluationDifferenceReason?: string; // Alasan jika PR berbeda dengan Budget

    // --- Transfer History ---
    transfers?: TransferLog[];
}

export interface BudgetPlanHeader {
    id: string;
    planNumber: string;
    startYear: number; // New: Range Start
    endYear: number;   // New: Range End
    departmentId: string;
    businessCategoryId: string;
    projectId: string;
    customerId?: string;
    ioNo: string;
    costCenter: string;
    plantId: string;
    pic: string;
    investmentType: 'Capex' | 'Opex';
    description?: string;
    status: WorkflowStatus;
    items: BudgetPlanItem[];
    createdAt: string;
}

export interface PRHistoryLog {
    date: string;
    user: string;
    action: string;
    notes?: string;
}

export interface PRItem {
    id: string;
    itemId?: string; // Link to Master Item if needed
    description: string;
    budgetPlanItemId?: string; // Link to Budget Item
    qty: number;
    uom: string;
    estCostUnit: number;
    estCostTotal: number;
    currency: string;
    supplierId?: string;
    remarks?: string;
}

export interface PurchaseRequest {
    id: string;
    prNumber: string;
    prDate: string;
    departmentId: string;
    businessCategoryId: string;
    ioNo: string;
    costCenter: string;
    aucNo?: string;
    assetNo?: string;
    plantId: string;
    storageLocId?: string;
    pic: string;
    investmentType?: 'Capex' | 'Opex';
    status: WorkflowStatus;
    items: PRItem[];
    attachments?: string[];
    history: PRHistoryLog[];
}

// Reporting Interfaces
export interface PRDetailView {
    prNo: string;
    date: string;
    itemName: string;
    amount: number;
    status: string;
}

export interface RealizationRow {
    id: string;
    ioNumber: string;
    costCenter: string;
    machineName: string;
    projectName: string;
    deptName: string;
    totalPlanCost: number;
    realizedAmount: number;
    balance: number;
    percentageUsed: number;
    linkedPRs: PRDetailView[];
}

// Context Interface
export interface AppState {
    currentUser: User | null;
    users: User[]; // List of all users
    login: (user: User) => void;
    logout: () => void;
    
    budgets: BudgetPlanHeader[];
    prs: PurchaseRequest[];
    projectsList: Project[];
    masterData: Record<MasterDataCategory, MasterOption[]>;
    
    addBudget: (b: BudgetPlanHeader) => void;
    updateBudget: (b: BudgetPlanHeader) => void;
    deleteBudget: (id: string) => void;
    updateBudgetStatus: (id: string, status: WorkflowStatus) => void;
    
    addPR: (p: PurchaseRequest) => void;
    updatePR: (p: PurchaseRequest) => void;
    deletePR: (id: string) => void;
    updatePRStatus: (id: string, status: WorkflowStatus, note?: string) => void;
    
    manageMasterData: (category: MasterDataCategory, action: 'create' | 'update' | 'delete', item: MasterOption) => void;
    manageUser: (action: 'create' | 'update' | 'delete', user: User) => void;
    
    // Project CRUD
    manageProject: (action: 'create' | 'update' | 'delete', project: Project) => void;
}
