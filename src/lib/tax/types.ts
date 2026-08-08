export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ProfileSummaryResponse {
  id: string;
  taxYear: string;
  assessmentYear: string | null;
  isComplete: boolean;
  lastUpdatedAt: string;
  totalGrossIncome: number;
  totalTdsDeducted: number;
}

export interface IncomeSourceDto {
  id: string;
  employerName: string | null;
  grossSalary: number | null;
  basicSalary: number | null;
  hraReceived: number | null;
  ltaReceived: number | null;
  bonus: number | null;
  specialAllowance: number | null;
  otherAllowances: number | null;
  professionalTax: number | null;
  standardDeduction: number | null;
  netSalary: number | null;
}

export interface TdsEntryDto {
  id: string;
  deductorName: string | null;
  deductorTan: string | null;
  taxDeducted: number | null;
  surcharge: number | null;
  healthEducationCess: number | null;
  totalTaxDeposited: number | null;
}

export interface DeductionDto {
  id: string;
  section: string;
  category: string | null;
  amount: number;
}

export interface InvestmentDto {
  id: string;
  investmentType: string;
  amount: number;
  institution: string | null;
  taxSection: string | null;
}

export interface HomeLoanDto {
  id: string;
  lenderName: string | null;
  principalPaid: number | null;
  interestPaid: number | null;
  propertyType: string;
}

export interface HraDetailDto {
  id: string;
  monthlyRent: number | null;
  cityType: string;
  landlordName: string | null;
  landlordPan: string | null;
}

export interface FinancialProfileResponse {
  id: string;
  taxYear: string;
  assessmentYear: string | null;
  isComplete: boolean;
  lastUpdatedAt: string;
  incomeSources: IncomeSourceDto[];
  tdsEntries: TdsEntryDto[];
  deductions: DeductionDto[];
  investments: InvestmentDto[];
  homeLoans: HomeLoanDto[];
  hraDetails: HraDetailDto[];
  totalGrossIncome: number;
  totalTdsDeducted: number;
  totalDeductions: number;
  totalInvestments: number;
}

export interface DocumentResponse {
  id: string;
  documentType: string;
  taxYear: string | null;
  originalFilename: string;
  fileSizeBytes: number;
  contentType: string;
  status: string;
  createdAt: string;
}

export interface UploadInitiatedResponse {
  documentId: string;
  uploadUrl: string;
  uploadUrlTtlSeconds: number;
  r2Key: string;
}

export interface ProcessingStatusResponse {
  jobId: string;
  documentId: string;
  status: string;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface TaxAnalysisResponse {
  id: string;
  profileId: string;
  taxYear: string;
  oldRegimeTax: number | null;
  newRegimeTax: number | null;
  recommendedRegime: string | null;
  totalDeductions: number | null;
  effectiveTaxRate: number | null;
  taxableIncome: number | null;
  insightsJson: string | null;
  createdAt: string;
}

export interface SessionResponse {
  id: string;
  taxYear: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  sourcesJson: string | null;
  createdAt: string;
}

export type DocumentType =
  | "FORM_16"
  | "FORM_16A"
  | "FORM_26AS"
  | "AIS"
  | "TIS"
  | "SALARY_SLIP"
  | "BANK_STATEMENT"
  | "INVESTMENT_PROOF"
  | "HOME_LOAN_STATEMENT"
  | "RENT_RECEIPT"
  | "OTHER";
