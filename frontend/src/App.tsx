import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  analyze,
  fetchConfig,
  generateComprehensiveReport,
  type AnalysisResponse,
  type ComprehensiveReportResponse,
  type ConfigResponse,
} from "./api";
import { useTheme } from "./useTheme";
import ParticleBackground from "./components/ParticleBackground";
import DynamicForm from "./components/DynamicForm";
import NavigationReport from "./components/NavigationReport";
import MethodologyForm, { METHODOLOGY_CONFIGS } from "./components/MethodologyForm";
import ComprehensiveResult from "./components/ComprehensiveResult";

const BRANCH_ORDER = ["fikrim_var", "startup_var", "sirketim_var"] as const;
const BRANCH_TONE: Record<string, string> = {
  fikrim_var: "Fikrini pazar gerçekliğiyle test edelim; nereye gideceğini birlikte bulalım.",
  startup_var: "Kör noktalarını ve büyüme sancılarını erkenden yakalayalım.",
  sirketim_var: "Şirketini verimlilik ve yön açısından baştan aşağı check-up'tan geçirelim.",
};

const STAGE_LABEL: Record<string, string> = {
  "Pre-Seed": "Fikir Aşaması",
  Seed: "Erken Aşama",
  Bootstrapped: "Büyüme Aşaması",
  "Series A": "Ölçekleme Aşaması",
};

// Adım göstergesi etiketleri
const STEP_LABELS = [
  "Bilgi Formu",
  "Navigasyon Raporu",
  "Metodoloji 1",
  "Metodoloji 2",
  "Sonuç",
];

function BrandMark() {
  return (
    <div className="brand-mark">
      <span className="brand-logo-text">SM</span>
      StartMetrics
    </div>
  );
}

// Adım göstergesi bileşeni (Adım 1-5)
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="step-indicator">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === step;
        const isDone = stepNum < step;
        return (
          <div key={i} className={`step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
            <div className="step-circle">
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            <span className="step-label">{label}</span>
            {i < STEP_LABELS.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [branch, setBranch] = useState<string | null>(null);

  // Adım yönetimi (1-5)
  const [step, setStep] = useState(1);

  // Adım 1 verileri
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  // Adım 3-4 verileri
  const [methodology1, setMethodology1] = useState<Record<string, string>>({});
  const [methodology2, setMethodology2] = useState<Record<string, string>>({});

  // Adım 5 verisi
  const [comprehensiveResult, setComprehensiveResult] = useState<ComprehensiveReportResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch(() => setError("Sunucuya bağlanılamadı. Backend çalışıyor mu?"));
  }, []);

  function reset() {
    setBranch(null);
    setStep(1);
    setAnswers({});
    setAnalysisResult(null);
    setMethodology1({});
    setMethodology2({});
    setComprehensiveResult(null);
    setError(null);
  }

  // Adım 1 → 2: /api/analyze çağrısı
  async function handleAnalyze() {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyze(branch, answers);
      setAnalysisResult(result);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  // Adım 4 → 5: /api/comprehensive-report çağrısı
  async function handleComprehensiveReport() {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateComprehensiveReport(
        branch,
        answers,
        methodology1,
        methodology2
      );
      setComprehensiveResult(result);
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rapor oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  // ===== EKRAN 0: Hoş geldin (hero) =====
  if (!branch) {
    return (
      <div className="hero">
        <ParticleBackground theme={theme} />

        <nav className="hero-nav">
          <BrandMark />
          <button className="theme-toggle" onClick={toggle} title="Tema değiştir">
            {theme === "dark" ? "Aydınlık Mod" : "Karanlık Mod"}
          </button>
        </nav>

        <div className="hero-content">
          <motion.span
            className="hero-pill"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="dot" /> Hibrit AI · Analitik Skor + Yapay Zekâ Mentor
          </motion.span>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            Girişimin için <span className="grad">akıllı navigasyon</span>
          </motion.h1>

          <motion.p
            className="hero-lead"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            5 aşamalı analiz süreciyle olgunluk skorunu ölç, metodolojini test et ve
            kişiselleştirilmiş AI yol haritanı al. Nerede olduğunu seç — sana yol gösterelim.
          </motion.p>

          <AnimatePresence>
            {error && <PremiumError error={error} onClose={() => setError(null)} />}
          </AnimatePresence>

          <div className="branch-grid">
            {config &&
              BRANCH_ORDER.map((key, i) => (
                <motion.button
                  key={key}
                  className="branch-card"
                  onClick={() => {
                    setBranch(key);
                    setStep(1);
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <span className="branch-index">{i + 1}</span>
                  <h3>{config[key].title}</h3>
                  <p>{BRANCH_TONE[key]}</p>
                  <span className="cta">Başla</span>
                </motion.button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  const branchConfig = config![branch];
  const methodologyConfig = METHODOLOGY_CONFIGS[branch];

  // ===== EKRAN 5: Kapsamlı Sonuç =====
  if (step === 5 && comprehensiveResult) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <BrandMark />
          <div className="header-actions">
            <button className="theme-toggle light" onClick={toggle}>
              {theme === "dark" ? "Aydınlık Mod" : "Karanlık Mod"}
            </button>
            <button className="back-btn" onClick={reset}>
              Baştan başla
            </button>
          </div>
        </header>
        <div className="container">
          <StepIndicator step={5} />
          <ComprehensiveResult
            result={comprehensiveResult}
            branch={branch}
            step1Answers={answers}
            methodology1Answers={methodology1}
            methodology2Answers={methodology2}
            onRestart={reset}
          />
        </div>
      </div>
    );
  }

  // ===== EKRANLAR 1-4: Form akışı =====
  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandMark />
        <div className="header-actions">
          <button className="theme-toggle light" onClick={toggle}>
            {theme === "dark" ? "Aydınlık Mod" : "Karanlık Mod"}
          </button>
          <button className="back-btn" onClick={reset}>
            Baştan başla
          </button>
        </div>
      </header>

      <div className="container">
        <StepIndicator step={step} />

        <div className="branch-heading">
          <h2>{branchConfig.title}</h2>
          <span className="branch-chip">
            {STAGE_LABEL[branchConfig.funding_stage] ?? branchConfig.funding_stage}
          </span>
        </div>
        <p className="branch-sub">{BRANCH_TONE[branch]}</p>

        <AnimatePresence>
          {error && <PremiumError error={error} onClose={() => setError(null)} />}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Adım 1: Kullanıcı Bilgi Formu */}
          {step === 1 && (
            <DynamicForm
              key="step1-form"
              config={branchConfig}
              answers={answers}
              onChange={(k, v) => setAnswers((p) => ({ ...p, [k]: v }))}
              onSubmit={handleAnalyze}
              loading={loading}
            />
          )}

          {/* Adım 2: Navigasyon Raporu */}
          {step === 2 && analysisResult && (
            <motion.div
              key="step2-result"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", margin: "0 auto" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="nav-report-wrapper">
                <NavigationReport result={analysisResult} branch={branch} answers={answers} />
                <motion.button
                  className="continue-btn"
                  onClick={() => setStep(3)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                >
                  Metodoloji Analizine Devam Et
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Adım 3: Metodoloji Formu-1 */}
          {step === 3 && methodologyConfig && (
            <MethodologyForm
              key="step3-methodology"
              config={methodologyConfig.step3}
              answers={methodology1}
              onChange={(k, v) => setMethodology1((p) => ({ ...p, [k]: v }))}
              onSubmit={() => setStep(4)}
              onBack={() => setStep(2)}
              submitLabel="Devam Et"
            />
          )}

          {/* Adım 4: Metodoloji Formu-2 */}
          {step === 4 && methodologyConfig && (
            <MethodologyForm
              key="step4-methodology"
              config={methodologyConfig.step4}
              answers={methodology2}
              onChange={(k, v) => setMethodology2((p) => ({ ...p, [k]: v }))}
              onSubmit={handleComprehensiveReport}
              onBack={() => setStep(3)}
              submitLabel={loading ? "Rapor Oluşturuluyor…" : "Kapsamlı Rapor Oluştur"}
              loading={loading}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface PremiumErrorProps {
  error: string;
  onClose: () => void;
}

function PremiumError({ error, onClose }: PremiumErrorProps) {
  return (
    <motion.div
      className="error-banner-premium"
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="error-icon">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 13V13.01M10 7V10M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="error-content-wrapper">
        <h4>Doğrulama Hatası</h4>
        <p>{error}</p>
      </div>
      <button className="error-close" onClick={onClose} title="Kapat">
        ×
      </button>
    </motion.div>
  );
}
