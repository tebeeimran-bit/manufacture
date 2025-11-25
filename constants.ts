
import { BudgetPlanHeader, MasterOption, PurchaseRequest, User, UserRole, WorkflowStatus, Project } from "./types";

// --- Auth Mocks ---

export const MOCK_USERS: User[] = [
    {
        id: 'u1',
        username: 'admin',
        password: '123',
        name: 'Admin Administrator',
        email: 'admin@manuvest.com',
        role: UserRole.ADMIN,
        department: 'IT'
    },
    {
        id: 'u2',
        username: 'user',
        password: '123',
        name: 'John Engineer',
        email: 'john@manuvest.com',
        role: UserRole.USER,
        department: 'Engineering'
    },
    {
        id: 'u3',
        username: 'approver',
        password: '123',
        name: 'Sarah Manager',
        email: 'sarah@manuvest.com',
        role: UserRole.APPROVER,
        department: 'Management'
    }
];

// --- Master Data Mocks ---

export const DEPARTMENTS: MasterOption[] = [
    { id: 'dept1', code: 'ENG', name: 'Engineering' },
    { id: 'dept2', code: 'PROD', name: 'Production' },
    { id: 'dept3', code: 'QA', name: 'Quality Assurance' },
    { id: 'dept4', code: 'LOG', name: 'Logistics' },
];

export const BUSINESS_CATEGORIES: MasterOption[] = [
    { id: 'cat1', code: 'WH', name: 'Wiring Harness' },
    { id: 'cat2', code: 'AEP', name: 'Automotive Electronics Part' },
    { id: 'cat3', code: 'PES', name: 'Power & Energy Solution' },
    { id: 'cat4', code: 'AMR', name: 'AMR System' },
];

export const PROJECTS: MasterOption[] = [
    { id: 'prj1', code: 'P-2024-01', name: 'Model X Harness Expansion' },
    { id: 'prj2', code: 'P-2024-02', name: 'EV Battery Line Setup' },
    { id: 'prj3', code: 'P-2024-03', name: 'AMR Fleet Upgrade' },
];

export const IO_NUMBERS: MasterOption[] = [
    { id: 'io1', code: 'IO-1001', name: 'New Machine Inv' },
    { id: 'io2', code: 'IO-1002', name: 'Facility Upgrade' },
    { id: 'io3', code: 'IO-2001', name: 'R&D Tools' },
];

export const COST_CENTERS: MasterOption[] = [
    { id: 'cc1', code: 'CC-501', name: 'Plant A - Assy' },
    { id: 'cc2', code: 'CC-502', name: 'Plant B - Molding' },
];

export const PLANTS: MasterOption[] = [
    { id: 'pl1', code: 'P1', name: 'Karawang Plant 1' },
    { id: 'pl2', code: 'P2', name: 'Cikarang Plant 2' },
];

export const SUPPLIERS: MasterOption[] = [
    { id: 'sup1', code: 'V001', name: 'Global Tech Machinery' },
    { id: 'sup2', code: 'V002', name: 'Local Parts Indo' },
];

export const CURRENCIES: MasterOption[] = [
    { id: 'curr1', code: 'IDR', name: 'Indonesian Rupiah' },
    { id: 'curr2', code: 'USD', name: 'US Dollar' },
    { id: 'curr3', code: 'JPY', name: 'Japanese Yen' },
    { id: 'curr4', code: 'EUR', name: 'Euro' },
];

export const MASTER_ITEMS: MasterOption[] = [
    { id: 'mi1', code: 'ITM-001', name: 'Copper Wire 5mm', description: 'Standard copper wire for harness', uom: 'Roll', isActive: true },
    { id: 'mi2', code: 'ITM-002', name: 'PCB Board Type A', description: 'Main control board', uom: 'Pcs', isActive: true },
    { id: 'mi3', code: 'ITM-003', name: 'Hydraulic Oil', description: 'Lubricant for press machine', uom: 'Liter', isActive: true },
    { id: 'mi4', code: 'ITM-004', name: 'Safety Gloves L', description: 'Standard safety equipment', uom: 'Pair', isActive: false },
];

// --- Detailed Project Mocks (New Module) ---
export const MOCK_PROJECTS_DETAILED: Project[] = [
    {
        id: 'prj1',
        code: 'P-2024-01',
        customer: 'Tesla',
        name: 'Model X Harness Expansion',
        model: 'Model X 2024',
        description: 'Expansion of rear harness assembly line.',
        year: '2024',
        projectManager: 'Robert Downey',
        budgetAllocation: 5000000000, // 5 Billion
        status: 'Active',
        schedule: {
            dieGo: '2024-01-10',
            t0: '2024-02-15',
            pp1: '2024-03-20',
            pp2: '2024-04-15',
            pp3: '2024-05-01',
            massPro: '2024-06-01'
        },
        customMilestones: [
            { id: 'm1', name: 'Kickoff Meeting', date: '2023-12-01', isCompleted: true },
            { id: 'm2', name: 'Design Freeze', date: '2024-01-05', isCompleted: true }
        ]
    },
    {
        id: 'prj2',
        code: 'P-2024-02',
        customer: 'Hyundai',
        name: 'EV Battery Line Setup',
        model: 'Ioniq 5',
        description: 'New battery pack assembly station.',
        year: '2024',
        projectManager: 'Chris Evans',
        budgetAllocation: 8500000000, // 8.5 Billion
        status: 'Active',
        schedule: {
            dieGo: '2024-02-01',
            t0: '2024-03-01',
            pp1: '2024-04-01',
            pp2: '2024-05-01',
            pp3: '2024-05-20',
            massPro: '2024-07-15'
        },
        customMilestones: []
    },
    {
        id: 'prj3',
        code: 'P-2024-03',
        customer: 'Internal',
        name: 'AMR Fleet Upgrade',
        model: 'AGV-X1',
        description: 'Upgrading logic boards for all warehouse AMRs.',
        year: '2024',
        projectManager: 'Mark Ruffalo',
        budgetAllocation: 1200000000, // 1.2 Billion
        status: 'Draft',
        schedule: {
            dieGo: '2024-06-01',
            t0: '2024-07-01',
            pp1: '',
            pp2: '',
            pp3: '',
            massPro: '2024-12-01'
        },
        customMilestones: []
    }
];

// --- Transaction Data Mocks ---

export const MOCK_BUDGETS: BudgetPlanHeader[] = [
    {
        id: 'bp1',
        planNumber: 'BP-2024-001',
        startYear: 2024,
        endYear: 2025,
        departmentId: 'dept1',
        businessCategoryId: 'cat1',
        ioNo: 'io1',
        costCenter: 'cc1',
        projectId: 'prj1',
        customerId: 'CUST01',
        plantId: 'pl1',
        pic: 'John Doe',
        investmentType: 'Capex',
        status: WorkflowStatus.APPROVED,
        createdAt: '2024-01-15',
        items: [
            {
                id: 'bpi1',
                internalNo: 'INT-01',
                machineName: 'Auto Crimping Machine Alpha',
                process: 'Final Assy',
                brand: 'Komax',
                qty: 2,
                uom: 'Unit',
                estimationCostUnit: 750000000, // 750 Million IDR
                estimationCostTotal: 1500000000, // 1.5 Billion IDR
                currency: 'IDR',
                description: 'High speed crimping',
                fiscalYear: 2024
            },
            {
                id: 'bpi2',
                internalNo: 'INT-02',
                machineName: 'Conveyor Belt System',
                process: 'Final Assy',
                brand: 'Local',
                qty: 1,
                uom: 'Set',
                estimationCostUnit: 300000000, // 300 Million IDR
                estimationCostTotal: 300000000,
                currency: 'IDR',
                description: '6 meter conveyor',
                fiscalYear: 2025
            }
        ]
    },
    {
        id: 'bp2',
        planNumber: 'BP-2024-002',
        startYear: 2024,
        endYear: 2024,
        departmentId: 'dept2',
        businessCategoryId: 'cat3',
        ioNo: 'io3',
        costCenter: 'cc2',
        projectId: 'prj2',
        customerId: 'CUST02',
        plantId: 'pl2',
        pic: 'Jane Smith',
        investmentType: 'Capex',
        status: WorkflowStatus.APPROVED,
        createdAt: '2024-02-10',
        items: [
            {
                id: 'bpi3',
                internalNo: 'INT-03',
                machineName: 'Battery Tester',
                process: 'Preparation',
                brand: 'Hioki',
                qty: 5,
                uom: 'Unit',
                estimationCostUnit: 225000000, // 225 Million IDR
                estimationCostTotal: 1125000000, // 1.125 Billion IDR
                currency: 'IDR',
                description: 'Cell testing unit',
                fiscalYear: 2024
            }
        ]
    }
];

export const MOCK_PRS: PurchaseRequest[] = [
    {
        id: 'pr1',
        prNumber: 'PR-2403-001',
        prDate: '2024-03-01',
        departmentId: 'dept1',
        businessCategoryId: 'cat1',
        ioNo: 'io1',
        costCenter: 'cc1',
        plantId: 'pl1',
        storageLocId: 'SL01',
        pic: 'John Doe',
        investmentType: 'Capex',
        status: WorkflowStatus.APPROVED,
        attachments: [],
        history: [],
        items: [
            {
                id: 'pri1',
                itemId: 'ITEM001',
                description: 'Auto Crimping Machine Alpha',
                budgetPlanItemId: 'bpi1', // Linked to budget
                qty: 1,
                uom: 'Unit',
                estCostUnit: 740000000, // Slightly under budget (740jt)
                estCostTotal: 740000000,
                currency: 'IDR',
                supplierId: 'sup1',
                remarks: 'Urgent for Project X'
            }
        ]
    },
    {
        id: 'pr2',
        prNumber: 'PR-2403-005',
        prDate: '2024-03-15',
        departmentId: 'dept2',
        businessCategoryId: 'cat3',
        ioNo: 'io3', // Matches BP2
        costCenter: 'cc2',
        plantId: 'pl2',
        storageLocId: 'SL01',
        pic: 'Jane Smith',
        investmentType: 'Capex',
        status: WorkflowStatus.SUBMITTED,
        attachments: [],
        history: [],
        items: [
            {
                id: 'pri2',
                itemId: 'ITEM055',
                description: 'Battery Tester Hioki 3000',
                budgetPlanItemId: 'bpi3',
                qty: 2,
                uom: 'Unit',
                estCostUnit: 230000000, // Over budget (230jt)
                estCostTotal: 460000000,
                currency: 'IDR',
                supplierId: 'sup1',
                remarks: 'Requesting 2 units first'
            }
        ]
    }
];
