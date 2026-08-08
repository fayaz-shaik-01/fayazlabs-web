import type {
  ApiResponse,
  AuthResponse,
  DocumentResponse,
  FinancialProfileResponse,
  MessageResponse,
  ProcessingStatusResponse,
  ProfileSummaryResponse,
  SessionResponse,
  TaxAnalysisResponse,
  UploadInitiatedResponse,
} from "./types";

const PLATFORM_URL =
  process.env.PLATFORM_URL ??
  process.env.NEXT_PUBLIC_PLATFORM_URL ??
  "http://localhost:8080";

export { PLATFORM_URL };

async function unwrap<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!json.success || json.data === null) {
    throw new Error(json.error?.message ?? json.message ?? "Request failed");
  }
  return json.data;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${PLATFORM_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return unwrap<AuthResponse>(res);
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResponse> {
  const res = await fetch(`${PLATFORM_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName }),
  });
  return unwrap<AuthResponse>(res);
}

export async function listProfiles(token: string): Promise<ProfileSummaryResponse[]> {
  const res = await fetch(`${PLATFORM_URL}/api/tax/profiles`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });
  return unwrap<ProfileSummaryResponse[]>(res);
}

export async function getProfileByYear(
  token: string,
  taxYear: string,
): Promise<FinancialProfileResponse> {
  const res = await fetch(
    `${PLATFORM_URL}/api/tax/profiles/by-year/${taxYear}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    },
  );
  return unwrap<FinancialProfileResponse>(res);
}

export async function listDocuments(
  token: string,
  taxYear?: string,
): Promise<DocumentResponse[]> {
  const url = taxYear
    ? `${PLATFORM_URL}/api/tax/documents?taxYear=${taxYear}`
    : `${PLATFORM_URL}/api/tax/documents`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 30 },
  });
  return unwrap<DocumentResponse[]>(res);
}

export async function initiateUpload(
  token: string,
  payload: {
    documentType: string;
    contentType: string;
    originalFilename: string;
    fileSizeBytes: number;
    taxYear?: string;
  },
): Promise<UploadInitiatedResponse> {
  const res = await fetch(`${PLATFORM_URL}/api/tax/documents/upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return unwrap<UploadInitiatedResponse>(res);
}

export async function confirmUpload(
  token: string,
  documentId: string,
): Promise<DocumentResponse> {
  const res = await fetch(
    `${PLATFORM_URL}/api/tax/documents/${documentId}/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    },
  );
  return unwrap<DocumentResponse>(res);
}

export async function getJobStatus(
  token: string,
  jobId: string,
): Promise<ProcessingStatusResponse> {
  const res = await fetch(`${PLATFORM_URL}/api/tax/processing/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<ProcessingStatusResponse>(res);
}

export async function listAnalyses(
  token: string,
  taxYear: string,
): Promise<TaxAnalysisResponse[]> {
  const res = await fetch(
    `${PLATFORM_URL}/api/tax/insights?taxYear=${taxYear}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 120 },
    },
  );
  return unwrap<TaxAnalysisResponse[]>(res);
}

export async function triggerInsightsGeneration(
  token: string,
  profileId: string,
  taxYear: string,
): Promise<void> {
  await fetch(`${PLATFORM_URL}/api/tax/insights/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ profileId, taxYear }),
  });
}

export async function listChatSessions(
  token: string,
): Promise<SessionResponse[]> {
  const res = await fetch(`${PLATFORM_URL}/api/tax/chat/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 30 },
  });
  return unwrap<SessionResponse[]>(res);
}

export async function createChatSession(
  token: string,
  taxYear: string,
  title?: string,
): Promise<SessionResponse> {
  const res = await fetch(`${PLATFORM_URL}/api/tax/chat/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ taxYear, title }),
  });
  return unwrap<SessionResponse>(res);
}

export async function getSessionMessages(
  token: string,
  sessionId: string,
): Promise<MessageResponse[]> {
  const res = await fetch(
    `${PLATFORM_URL}/api/tax/chat/sessions/${sessionId}/messages`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    },
  );
  return unwrap<MessageResponse[]>(res);
}

export async function sendChatMessage(
  token: string,
  sessionId: string,
  content: string,
): Promise<MessageResponse> {
  const res = await fetch(
    `${PLATFORM_URL}/api/tax/chat/sessions/${sessionId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    },
  );
  return unwrap<MessageResponse>(res);
}
