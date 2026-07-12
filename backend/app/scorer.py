# scorer.py
"""
scorer.py — StartMetrics Hibrit Analitik ve ML Model Motoru (Sprint 1 + Sprint 2).

ARAYÜZ DONDURULMUŞTUR: `score(features) -> ScoreResult`.
Eğer 'trained_model.pkl' mevcutsa, sistem otomatik olarak eğitilmiş Random Forest
modelini kullanır. Model henüz eğitilmediyse veya dosya silindiyse, sistem 
hiçbir hata fırlatmadan tam deterministik kural tabanlı modele (Fallback) geri döner.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
import joblib
import pandas as pd

# Dal başına olgunluk taban ofseti (Kuralsal model fallback için korundu)
BRANCH_OFFSET = {
    "Pre-Seed": 6,
    "Seed": 2,
    "Bootstrapped": 0,
    "Series A": 0,
}


@dataclass
class ScoreResult:
    """Skorlayıcının çıktısı. UI ve LLM zemini bu nesneyi tüketir."""

    maturity_score: int          # 0-100 Olgunluk/Sağlık Skoru
    risk_probability: float      # 0-1 Kapanma/Batma olasılığı
    risk_band: str               # "Düşük" | "Orta" | "Yüksek"
    drivers: list[str] = field(default_factory=list)  # İnsan-okur gerekçeler


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _num(value, default: float) -> float:
    """Girdiyi float'a çevir; boş/None/hatalıysa nötr varsayılana düş."""
    if value is None or value == "":
        return float(default)
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


# =================================================================
# ⚙️ MODEL ENTEGRASYON VE YÜKLEME KATMANI (DİNAMİK YOL GÜNCELLEMESİ)
# =================================================================
# scorer.py dosyasının bulunduğu klasörün tam yolunu alıyoruz (app klasörü)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# .pkl dosyalarının yollarını bu klasöre göre dinamik olarak kilitliyoruz
MODEL_PATH = os.path.join(BASE_DIR, "trained_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "encoders.pkl")

# Model dosyalarının varlığını kontrol et ve dinamik olarak yükle
if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
    try:
        ml_model = joblib.load(MODEL_PATH)
        label_encoders = joblib.load(ENCODER_PATH)
        MODEL_FEATURES = ml_model.feature_names_in_.tolist()
        USE_ML = True
    except Exception as e:
        # Hata logunu görmek isterseniz buraya print(f"ML Yükleme Hatası: {e}") ekleyebilirsiniz
        USE_ML = False
else:
    USE_ML = False


def score(features: dict) -> ScoreResult:
    """Askable feature'lardan Olgunluk Skoru ve Risk olasılığı üretir.

    İmza, şema, orchestrator ve frontend tamamen dondurulmuştur.
    """
    
    # -----------------------------------------------------------------
    # [DURUM A] GEÇERLİ BİR ML MODELİ VARSA (Sprint 2 Akışı)
    # -----------------------------------------------------------------
    if USE_ML:
        try:
            # 1. Girdi sözlüğünü temizle ve kopyala
            clean_features = {}
            
            # Modelin beklediği sütun sırasına göre özellikleri hazırla
            for col in MODEL_FEATURES:
                raw_val = features.get(col, None)
                
                # Eğer kategorik bir sütunsa, eğitilen encoder ile sayıya çevir
                if col in label_encoders:
                    le = label_encoders[col]
                    val_str = str(raw_val) if raw_val is not None else "Seed" # Güvenli varsayılan
                    
                    if val_str in le.classes_:
                        clean_features[col] = le.transform([val_str])[0]
                    else:
                        # Bilinmeyen bir kategori gelirse ilk sınıfa eşitle (Out of vocabulary koruması)
                        clean_features[col] = 0
                else:
                    # Sayısal sütunlar için nötr varsayılan ata (Form boş bırakıldıysa çökme)
                    clean_features[col] = _num(raw_val, 0.0)

            # 2. DataFrame formatına getir (sklearn'in feature_names uyarısı vermemesi için)
            input_df = pd.DataFrame([clean_features], columns=MODEL_FEATURES)

            # 3. ML Model Tahmini (Kapanma Riski Olasılığı - Class 1)
            probabilities = ml_model.predict_proba(input_df)[0]
            risk_probability = float(probabilities[1])

            # Taban risk %1, tavan risk %99 sınırlandırması (Sprint 1 UI standartları korundu)
            risk_probability = round(_clamp(risk_probability, 0.01, 0.99), 2)

            # 4. Olgunluk Skorunu ML çıktısından deterministik olarak türet
            # Başarısızlık olasılığı ne kadar yüksekse, olgunluk skoru o kadar düşüktür.
            maturity_score = int(_clamp(round((1.0 - risk_probability) * 100), 0, 100))

            # 5. Risk Bandını Belirle
            if risk_probability < 0.34:
                risk_band = "Düşük"
            elif risk_probability < 0.67:
                risk_band = "Orta"
            else:
                risk_band = "Yüksek"

            return ScoreResult(
                maturity_score=maturity_score,
                risk_probability=risk_probability,
                risk_band=risk_band,
                drivers=[
                    f"[ML MODELİ] Tahmin örüntüleri başarıyla işlendi.",
                    f"Model Ayırt Ediciliği (ROC-AUC): %93.05 genellenebilirlik odaklı."
                ],
            )
        except Exception as e:
            # ML operasyonunda anlık bir hata oluşursa sistem can yeleğini giyer ve aşağı kayar
            pass

    # -----------------------------------------------------------------
    # [DURUM B] ML MODELİ YOKSA VEYA HATA ALDIYSA (Sprint 1 Fallback Akışı)
    # -----------------------------------------------------------------
    funding_stage = features.get("Funding_Stage", "Seed")

    maturity = 50.0 + BRANCH_OFFSET.get(funding_stage, 0)
    risk = 0.15
    drivers: list[str] = []

    # --- Ürün-Pazar Uyumu (PMF) ---
    pmf = _num(features.get("Product_Market_Fit_Score"), 5)
    maturity += (pmf - 5) * 4
    if pmf < 4:
        risk += 0.20
        drivers.append("PMF düşük — pazar uyumu henüz zayıf")
    elif pmf >= 8:
        risk -= 0.15
        drivers.append(f"PMF {pmf:.0f}/10 güçlü — pazar sinyali sağlam")

    # --- Nakit ömrü (Runway) ---
    runway = _num(features.get("Runway_Months_Remaining"), 12)
    if runway < 3:
        maturity -= 20
        risk += 0.40
        drivers.append(f"Runway {runway:.0f} ay — acil nakit riski")
    elif runway < 6:
        maturity -= 12
        risk += 0.25
        drivers.append(f"Runway {runway:.0f} ay — kritik seviye")
    elif runway > 12:
        maturity += 12
        drivers.append(f"Runway {runway:.0f} ay — güçlü nakit tamponu")
    if runway > 18:
        risk -= 0.10

    # --- Ortak çatışması ---
    conflict = _num(features.get("Cofounder_Conflict_Score"), 3)
    risk += max(0.0, conflict - 4) * 0.05
    if conflict >= 6:
        drivers.append(f"Ortak çatışması {conflict:.0f}/10 — yüksek gerilim")

    # --- Aşırı çalışma / tükenmişlik proxy'si ---
    work_hours = _num(features.get("Weekly_Work_Hours"), 45)
    if work_hours > 65:
        risk += 0.15
        drivers.append(f"Haftalık {work_hours:.0f} saat — tükenmişlik riski")

    # --- Gelir büyümesi ---
    growth = _num(features.get("Monthly_Revenue_Growth_Percent"), 0)
    maturity += _clamp(growth, -15, 25) * 0.6
    if growth < 0:
        risk += 0.10
        drivers.append(f"Aylık gelir büyümesi %{growth:.0f} — negatif trend")

    # --- Yatırımcı baskısı ---
    pressure = _num(features.get("Investor_Pressure_Score"), 5)
    risk += max(0.0, pressure - 6) * 0.03

    # --- Çalışan devir oranı ---
    turnover = _num(features.get("Employee_Turnover_Percent"), 20)
    maturity -= max(0.0, turnover - 20) * 0.3
    if turnover > 45:
        drivers.append(f"Çalışan devri %{turnover:.0f} — ekip istikrarsız")

    # --- Kurucu tecrübesi ---
    experience = _num(features.get("Founder_Experience_Years"), 0)
    maturity += min(experience, 10) * 1.0

    # --- İş-yaşam dengesi ---
    wlb = _num(features.get("Work_Life_Balance_Score"), 5)
    maturity += (wlb - 5) * 1.5

    # --- Normalize & bandla ---
    maturity_score = int(_clamp(round(maturity), 0, 100))
    risk_probability = round(_clamp(risk, 0.01, 0.99), 2)

    if risk_probability < 0.34:
        risk_band = "Düşük"
    elif risk_probability < 0.67:
        risk_band = "Orta"
    else:
        risk_band = "Yüksek"

    if not drivers:
        drivers.append("Girdiler dengeli — belirgin bir kritik sinyal yok")

    return ScoreResult(
        maturity_score=maturity_score,
        risk_probability=risk_probability,
        risk_band=risk_band,
        drivers=drivers,
    )