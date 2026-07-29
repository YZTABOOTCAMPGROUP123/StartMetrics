// api.ts — backend ile tipli iletişim katmanı.
// Vite proxy sayesinde "/api/*" -> http://localhost:8000/* yönlendirilir.

const BASE = "/api";

export type FieldKind = "select" | "number" | "scale";

export interface FormField {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  min?: number;
  max?: number;
}

export interface BranchConfig {
  title: string;
  funding_stage: string;
  fields: FormField[];
}

export type ConfigResponse = Record<string, BranchConfig>;

export interface NavigationItem {
  title: string;
  body: string;
}

export interface AnalysisResponse {
  maturity_score: number;
  risk_probability: number;
  risk_percent: number;
  risk_band: string;
  drivers: string[];
  navigation_report: NavigationItem[];
  certificate_available: boolean;
  report_source: string;
}

// ---------------------------------------------------------------------------
// Kapsamlı Rapor (Adım 5) tipleri
// ---------------------------------------------------------------------------

export interface ComprehensiveReportResponse {
  maturity_score: number;
  base_maturity_score: number;
  score_delta: number;
  risk_probability: number;
  risk_percent: number;
  risk_band: string;
  drivers: string[];
  adjustment_reasons: string[];
  certificate_available: boolean;
  roadmap_report: string;
  report_source: string;
}

export async function fetchConfig(): Promise<ConfigResponse> {
  const res = await fetch(`${BASE}/config`);
  if (!res.ok) throw new Error("Form konfigürasyonu alınamadı");
  return res.json();
}

export async function analyze(
  branch: string,
  answers: Record<string, string | number>
): Promise<AnalysisResponse> {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branch, answers }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || "Analiz başarısız oldu");
  }
  return res.json();
}

// Sertifikayı indirir (PDF blob). certificate_available true iken çağrılır.
export async function downloadCertificate(
  branch: string,
  answers: Record<string, string | number>
): Promise<void> {
  const res = await fetch(`${BASE}/certificate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branch, answers }),
  });
  if (!res.ok) throw new Error("Sertifika üretilemedi");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "startmetrics_sertifika.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

// Kapsamlı rapor üret (Adım 5 — tüm adımların verisi birleşik)
export async function generateComprehensiveReport(
  branch: string,
  step1Answers: Record<string, string | number>,
  methodology1Answers: Record<string, string>,
  methodology2Answers: Record<string, string>
): Promise<ComprehensiveReportResponse> {
  const res = await fetch(`${BASE}/comprehensive-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      branch,
      step1_answers: step1Answers,
      methodology1_answers: methodology1Answers,
      methodology2_answers: methodology2Answers,
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || "Kapsamlı rapor oluşturulamadı");
  }
  return res.json();
}

// Kapsamlı rapordan sertifika indir (Adım 5)
export async function downloadCertificateFromComprehensive(
  branch: string,
  step1Answers: Record<string, string | number>,
  methodology1Answers: Record<string, string>,
  methodology2Answers: Record<string, string>
): Promise<void> {
  const res = await fetch(`${BASE}/certificate-from-comprehensive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      branch,
      step1_answers: step1Answers,
      methodology1_answers: methodology1Answers,
      methodology2_answers: methodology2Answers,
    }),
  });
  if (!res.ok) throw new Error("Sertifika üretilemedi");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "startmetrics_sertifika.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
