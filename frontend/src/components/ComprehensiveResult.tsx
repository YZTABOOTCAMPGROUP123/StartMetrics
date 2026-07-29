import { useEffect, useState, type ReactNode } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { ComprehensiveReportResponse } from "../api";
import { downloadCertificateFromComprehensive } from "../api";

interface Props {
  result: ComprehensiveReportResponse;
  branch: string;
  step1Answers: Record<string, string | number>;
  methodology1Answers: Record<string, string>;
  methodology2Answers: Record<string, string>;
  onRestart: () => void;
}

type RoadmapBlock =
  | { type: "heading"; level: 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "rule" };

const RISK_COLOR: Record<string, string> = {
  Düşük: "var(--risk-low)",
  Orta: "var(--risk-med)",
  Yüksek: "var(--risk-high)",
};

const RISK_SOFT: Record<string, string> = {
  Düşük: "var(--risk-low-soft)",
  Orta: "var(--risk-med-soft)",
  Yüksek: "var(--risk-high-soft)",
};

const R = 78;
const CIRC = 2 * Math.PI * R;

function scoreColor(score: number): string {
  if (score >= 75) return "var(--risk-low)";
  if (score >= 45) return "var(--brand)";
  return "var(--risk-med)";
}

function parseRoadmap(markdown: string): RoadmapBlock[] {
  const blocks: RoadmapBlock[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (line === "---") {
      flushList();
      blocks.push({ type: "rule" });
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      blocks.push({ type: "heading", level: 4, text: line.slice(4) });
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      blocks.push({ type: "heading", level: 3, text: line.slice(3) });
      continue;
    }

    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      continue;
    }

    flushList();
    blocks.push({ type: "paragraph", text: line });
  }

  flushList();
  return blocks;
}

function formatInline(text: string): ReactNode[] {
  return text
    .split(/(\*\*.*?\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
}

function RoadmapContent({ markdown }: { markdown: string }) {
  const blocks = parseRoadmap(markdown);

  return (
    <div className="roadmap-content">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = block.level === 3 ? "h3" : "h4";
          return (
            <Heading key={index} className={block.level === 3 ? "roadmap-h3" : "roadmap-h4"}>
              {formatInline(block.text)}
            </Heading>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="roadmap-ul">
              {block.items.map((item, itemIndex) => (
                <motion.li
                  key={itemIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: itemIndex * 0.05 }}
                >
                  {formatInline(item)}
                </motion.li>
              ))}
            </ul>
          );
        }

        if (block.type === "rule") {
          return <hr key={index} className="roadmap-hr" />;
        }

        return (
          <p key={index} className="roadmap-p">
            {formatInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function deltaLabel(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

// BCG Matrix Görsel Bileşeni
function BcgMatrixWidget({ answers }: { answers: Record<string, string> }) {
  const usage = (answers.kullanim_sikligi || "").toLowerCase();
  const satisfaction = (answers.musteri_memnuniyeti || "").toLowerCase();
  const growth = (answers.pazar_buyume_potansiyeli || "").toLowerCase();

  const isHighGrowth = growth.includes("lider") || growth.includes("hizli") || growth.includes("yüksek");
  const isHighShare = usage.includes("gunluk") || usage.includes("temel") || satisfaction.includes("memnun") || satisfaction.includes("ustun");

  let activeQuadrant: "stars" | "question" | "cows" | "dogs" = "question";
  if (isHighGrowth && isHighShare) activeQuadrant = "stars";
  else if (isHighGrowth && !isHighShare) activeQuadrant = "question";
  else if (!isHighGrowth && isHighShare) activeQuadrant = "cows";
  else activeQuadrant = "dogs";

  return (
    <div className="bcg-card card">
      <div className="bcg-header">
        <div>
          <h3 className="panel-title">BCG Matrisi Görünümü</h3>
          <p className="panel-cap">Ürün ve pazar konumlandırması çıkarımı</p>
        </div>
        <span className="bcg-active-badge">
          {activeQuadrant === "stars" && "Yıldız Ürün (Star)"}
          {activeQuadrant === "question" && "Soru İşareti (Question Mark)"}
          {activeQuadrant === "cows" && "Nakit İneği (Cash Cow)"}
          {activeQuadrant === "dogs" && "Evcil Hayvan (Dog)"}
        </span>
      </div>

      <div className="bcg-grid">
        <div className={`bcg-quadrant stars ${activeQuadrant === "stars" ? "active" : ""}`}>
          <div className="quadrant-head">
            <span className="quadrant-name">Yıldızlar (Stars)</span>
          </div>
          <p className="quadrant-desc">Yüksek Pazar Büyümesi & Yüksek Pazar Payı. Yatırımı artırın.</p>
        </div>

        <div className={`bcg-quadrant question ${activeQuadrant === "question" ? "active" : ""}`}>
          <div className="quadrant-head">
            <span className="quadrant-name">Soru İşaretleri (Question Marks)</span>
          </div>
          <p className="quadrant-desc">Yüksek Pazar Büyümesi & Düşük Pay. Stratejik karar gerekli.</p>
        </div>

        <div className={`bcg-quadrant cows ${activeQuadrant === "cows" ? "active" : ""}`}>
          <div className="quadrant-head">
            <span className="quadrant-name">Nakit İnekleri (Cash Cows)</span>
          </div>
          <p className="quadrant-desc">Düşük Pazar Büyümesi & Yüksek Pay. Nakit akışı sağlar.</p>
        </div>

        <div className={`bcg-quadrant dogs ${activeQuadrant === "dogs" ? "active" : ""}`}>
          <div className="quadrant-head">
            <span className="quadrant-name">Evcil Hayvanlar (Dogs)</span>
          </div>
          <p className="quadrant-desc">Düşük Pazar Büyümesi & Düşük Pay. Yeniden yapılanma gerekli.</p>
        </div>
      </div>
    </div>
  );
}

// Form Girdilerinden Dinamik Çıkarım (Insight Badges) Bileşeni
function DynamicInsightsWidget({ answers }: { answers: Record<string, string | number> }) {
  const insights: { type: "warning" | "success" | "info"; label: string; detail: string }[] = [];

  const turnOver = Number(answers.personel_devir_hizi ?? answers.devir_hizi);
  if (!isNaN(turnOver) && turnOver > 0) {
    if (turnOver >= 20) {
      insights.push({
        type: "warning",
        label: `Personel Devir Hızı: %${turnOver}`,
        detail: "Devir hızınız yüksek! Ekip motivasyonu ve elde tutma stratejilerine odaklanın.",
      });
    } else {
      insights.push({
        type: "success",
        label: `Personel Devir Hızı: %${turnOver}`,
        detail: "Sağlıklı personel devir oranı. Ekip istikrarı yüksek.",
      });
    }
  }

  const burnRate = Number(answers.aylik_yakma_miktari);
  const runway = Number(answers.pist_suresi_ay);
  if (!isNaN(runway) && runway > 0) {
    const burnInfo = !isNaN(burnRate) && burnRate > 0 ? ` (Aylık Yakma: ₺${burnRate.toLocaleString("tr-TR")})` : "";
    if (runway < 6) {
      insights.push({
        type: "warning",
        label: `Pist Süresi: ${runway} Ay${burnInfo}`,
        detail: "Nakit pisti daralıyor (6 aydan az). Yatırım veya maliyet optimizasyonu öncelikli.",
      });
    } else {
      insights.push({
        type: "success",
        label: `Pist Süresi: ${runway} Ay${burnInfo}`,
        detail: "Nakit akışı ve pist süresi güvenli aralıkta.",
      });
    }
  }

  const growth = Number(answers.aylik_buyume_orani);
  if (!isNaN(growth) && growth > 0) {
    if (growth >= 15) {
      insights.push({
        type: "success",
        label: `Aylık Büyüme: %${growth}`,
        detail: "Güçlü büyüme ivmesi! Ölçeklenme aşaması destekleniyor.",
      });
    }
  }

  if (insights.length === 0) return null;

  return (
    <div className="card insights-card">
      <h3 className="panel-title">Form Verilerinden Otomatik Çıkarımlar</h3>
      <p className="panel-cap">Girdiğiniz verilerin raporda öne çıkan detayları</p>
      <div className="insights-grid">
        {insights.map((item, index) => (
          <div key={index} className={`insight-chip ${item.type}`}>
            <span className="insight-badge-title">{item.label}</span>
            <p className="insight-detail">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComprehensiveResult({
  result,
  branch,
  step1Answers,
  methodology1Answers,
  methodology2Answers,
  onRestart,
}: Props) {
  const {
    maturity_score,
    base_maturity_score,
    score_delta,
    risk_percent,
    risk_band,
    drivers,
    adjustment_reasons,
    certificate_available,
    roadmap_report,
  } = result;
  const [display, setDisplay] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const mv = useMotionValue(0);

  useEffect(() => {
    const controls = animate(mv, maturity_score, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [maturity_score, mv]);

  const offset = CIRC - (display / 100) * CIRC;
  const color = scoreColor(maturity_score);
  const deltaClass = score_delta > 0 ? "positive" : score_delta < 0 ? "negative" : "neutral";
  const scoreReasons =
    adjustment_reasons.length > 0 ? adjustment_reasons : ["Metodoloji cevapları skoru sabit tuttu."];

  const safeRiskBand = risk_band === "D???k" ? "Düşük" : risk_band === "Y?ksek" ? "Yüksek" : risk_band;

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadCertificateFromComprehensive(
        branch,
        step1Answers,
        methodology1Answers,
        methodology2Answers
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <motion.div
      className="comprehensive-result"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="result-header">
        <motion.span
          className="result-badge"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          Kapsamlı Analiz Tamamlandı
        </motion.span>
        <motion.h2
          className="result-main-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Stratejik Yol Haritanız Hazır
        </motion.h2>
        <motion.p
          className="result-main-sub"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ML skoru, metodoloji cevapları ve AI yorumu tek ekranda birleşti.
        </motion.p>
      </div>

      <div className="result-top-grid">
        <motion.div
          className="card panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="panel-title">Olgunluk Skoru</h3>
          <p className="panel-cap">Final skor</p>

          <div className="gauge-wrap">
            <div className="gauge">
              <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
                <circle cx="90" cy="90" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="13" />
                <motion.circle
                  cx="90"
                  cy="90"
                  r={R}
                  fill="none"
                  stroke={color}
                  strokeWidth="13"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={offset}
                  transform="rotate(-90 90 90)"
                />
              </svg>
              <div className="gauge-center">
                <span className="gauge-value">{display}</span>
                <span className="gauge-max">/ 100</span>
              </div>
            </div>
          </div>

          <div className="score-comparison">
            <span>Başlangıç skoru</span>
            <strong>{base_maturity_score}</strong>
          </div>

          <div
            className="risk-badge"
            style={{
              background: RISK_SOFT[safeRiskBand] || "var(--risk-med-soft)",
              color: RISK_COLOR[safeRiskBand] || "var(--risk-med)",
            }}
          >
            <span
              className="risk-dot"
              style={{ background: RISK_COLOR[safeRiskBand] || "var(--risk-med)" }}
            />
            Batma Riski: %{risk_percent} ({safeRiskBand})
          </div>
        </motion.div>

        <motion.div
          className="card panel score-impact-panel"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="panel-title">Metodoloji Etkisi</h3>
          <p className="panel-cap">Adım 3-4 cevaplarından gelen puan barajı</p>
          <div className={`score-delta ${deltaClass}`}>{deltaLabel(score_delta)}</div>

          <div className="score-bar-visualizer">
            <div className="bar-track">
              <div
                className="bar-fill base"
                style={{ width: `${Math.min(base_maturity_score, 100)}%` }}
                title={`Başlangıç Skoru: ${base_maturity_score}`}
              />
              <div
                className={`bar-fill delta ${score_delta >= 0 ? "positive" : "negative"}`}
                style={{
                  width: `${Math.min(Math.abs(score_delta), 100)}%`,
                  left: `${score_delta >= 0 ? base_maturity_score : Math.max(0, base_maturity_score + score_delta)}%`,
                }}
                title={`Etki: ${deltaLabel(score_delta)} Puan`}
              />
              <div className="target-marker" style={{ left: "75%" }} title="Sertifika Hedefi: 75">
                <span className="target-line" />
                <span className="target-text">75 Hedef</span>
              </div>
            </div>
            <div className="bar-labels">
              <span>Başlangıç: <strong>{base_maturity_score}</strong></span>
              <span>Final: <strong>{maturity_score}</strong></span>
            </div>
          </div>

          <ul className="impact-reasons">
            {scoreReasons.map((reason, index) => (
              <li key={index}>
                <span className="reason-bullet" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="card panel cert-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="panel-title">Güvenirlik Sertifikası</h3>
          {certificate_available ? (
            <>
              <p className="cert-congrats">
                Tebrikler! Final skor 75 üzeri ve risk düşük seviyede olduğu için sertifika indirilebilir.
              </p>
              <motion.button
                className="cert-btn"
                onClick={handleDownload}
                disabled={downloading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {downloading ? "Hazırlanıyor…" : "Sertifikayı İndir (PDF)"}
              </motion.button>
            </>
          ) : (
            <>
              <p className="cert-hint-main">
                Sertifika için final skorun 75 üzeri ve riskin düşük seviyede olması gerekiyor.
              </p>
              <div className="cert-progress">
                <div className="cert-progress-bar">
                  <div
                    className="cert-progress-fill"
                    style={{ width: `${Math.min(maturity_score, 100)}%` }}
                  />
                </div>
                <span className="cert-progress-label">%{maturity_score} / 75 hedef</span>
              </div>
            </>
          )}

          <div className="cert-divider" />
          <button className="restart-btn" onClick={onRestart}>
            Yeni Analiz Başlat
          </button>
        </motion.div>
      </div>

      {/* Form Verisi Dinamik Çıkarım Kartı */}
      <DynamicInsightsWidget answers={step1Answers} />

      {/* Şirketim Var Dalı İçin BCG Matrisi */}
      {branch === "sirketim_var" && <BcgMatrixWidget answers={methodology2Answers} />}

      {drivers.length > 0 && (
        <motion.div
          className="card signal-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h3 className="panel-title">Skoru Etkileyen Sinyaller</h3>
            <p className="panel-cap">Model ve metodoloji çıktıları</p>
          </div>
          <ul className="drivers compact">
            {drivers.slice(0, 5).map((driver, index) => (
              <li className="driver" key={index}>
                <span className="signal-bullet" />
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div
        className="card roadmap-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="roadmap-header">
          <h3 className="roadmap-title">AI Yol Haritası Raporu</h3>
          <span className={`roadmap-source ${result.report_source}`}>
            {result.report_source === "llm" ? "Gemini AI" : "Otomatik"}
          </span>
        </div>
        <RoadmapContent markdown={roadmap_report} />
      </motion.div>
    </motion.div>
  );
}
