import { motion } from "framer-motion";
import type { AnalysisResponse } from "../api";

// Sağ panel: 3 maddelik Waze/GPS tarzı AI Navigasyon Raporu (staggered). (Sertifika butonu 5. adıma taşındı)

interface Props {
  result: AnalysisResponse;
  branch: string;
  answers: Record<string, string | number>;
}

export default function NavigationReport({ result, branch, answers }: Props) {
  return (
    <div className="card panel">
      <h3 className="panel-title">Navigasyon Raporu</h3>
      <p className="panel-cap">Yapay Zekâ Mentor · Dinamik Yol Haritası</p>

      <ol className="nav-items">
        {result.navigation_report.map((item, i) => (
          <motion.li
            className="nav-item"
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.12, ease: "easeOut" }}
          >
            <span className="nav-badge">{i + 1}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}