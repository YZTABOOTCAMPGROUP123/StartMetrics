import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  analyze,
  fetchConfig,
  type AnalysisResponse,
  type ConfigResponse,
} from "./api";
import { useTheme } from "./useTheme";
import ParticleBackground from "./components/ParticleBackground";
import DynamicForm from "./components/DynamicForm";
import ScoreCard from "./components/ScoreCard";
import NavigationReport from "./components/NavigationReport";

const BRANCH_ORDER = ["fikrim_var", "startup_var", "sirketim_var"] as const;
const BRANCH_TONE: Record<string, string> = {
  fikrim_var: "Fikrini pazar gerçekliğiyle test edelim; nereye gideceğini birlikte bulalım.",
  startup_var: "Kör noktalarını ve büyüme sancılarını erkenden yakalayalım.",
  sirketim_var: "Şirketini verimlilik ve yön açısından baştan aşağı check-up'tan geçirelim.",
};

// Veri setindeki teknik funding_stage değerlerini kullanıcıya gösterilecek
// sade Türkçe aşama etiketlerine çevirir (Pre-Seed vb. ham değer gösterilmez).
const STAGE_LABEL: Record<string, string> = {
  "Pre-Seed": "Fikir Aşaması",
  Seed: "Erken Aşama",
  Bootstrapped: "Büyüme Aşaması",
  "Series A": "Ölçekleme Aşaması",
};

function BrandMark() {
  return (
    <div className="brand-mark">
      <span className="brand-logo">◈</span>
      StartMetrics
    </div>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch(() => setError("Sunucuya bağlanılamadı. Backend çalışıyor mu?"));
  }, []);

  function reset() {
    setBranch(null);
    setAnswers({});
    setResult(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await analyze(branch, answers));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  // ===== EKRAN 1: Hoş geldin (koyu hero + partikül) =====
  if (!branch) {
    return (
      <div className="hero">
        <ParticleBackground theme={theme} />

        <nav className="hero-nav">
          <BrandMark />
          <button className="theme-toggle" onClick={toggle} title="Tema değiştir">
            {theme === "dark" ? "☀️" : "🌙"}
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
            style={{ maxWidth: '700px' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            Olgunluk skorunu ölç, batma riskini gör, önündeki 3 kritik virajı
            yapay zeka analizimizle erkenden öğren. Nerede olduğunu seç — sana yol gösterelim.
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
                  onClick={() => setBranch(key)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <span className="branch-index">{i + 1}</span>
                  <h3>{config[key].title}</h3>
                  <p>{BRANCH_TONE[key]}</p>
                  <span className="cta">Başla →</span>
                </motion.button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  const branchConfig = config![branch];

  // ===== EKRAN 2: Form + Sonuç =====
  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandMark />
        <div className="header-actions">
          <button className="theme-toggle light" onClick={toggle} title="Tema değiştir">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="back-btn" onClick={reset}>
            ← Baştan başla
          </button>
        </div>
      </header>

      <div className="container">
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
          {!result ? (
            <DynamicForm
              key="form"
              config={branchConfig}
              answers={answers}
              onChange={(k, v) => setAnswers((p) => ({ ...p, [k]: v }))}
              onSubmit={handleAnalyze}
              loading={loading}
            />
          ) : (
            <motion.div
              key="result"
              className="result-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ScoreCard result={result} />
              <NavigationReport result={result} branch={branch} answers={answers} />
            </motion.div>
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
