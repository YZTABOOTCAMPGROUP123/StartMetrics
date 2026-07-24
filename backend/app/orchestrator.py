"""
orchestrator.py — ORKESTRASYON KATMANI (ekstra puan getiren kısım).

Tek sorumluluk: girdiyi temizle/normalize et -> deterministik skorla ->
skoru gömen LLM prompt'unu kur -> LLM'i çağır -> tek yanıt nesnesini birleştir.

Bu, proje notlarındaki "ORKESTRASYON KATMANI (Girdileri temizler ve AI'a
dağıtır)" kutusunun çalışan hâlidir. Skorlayıcı deterministik ve ağ-bağımsız
olduğu için skor HER ZAMAN üretilir; LLM sadece rapor katmanını besler.
"""

from __future__ import annotations

from . import llm_client, scorer
from .form_config import get_branch
from .schemas import AnalysisResponse, NavigationItem


# Sertifika eşiği: yüksek olgunluk VE düşük risk.
CERT_MIN_MATURITY = 75
CERT_MAX_RISK = 0.34


def analyze(branch: str, raw_answers: dict) -> AnalysisResponse:
    """Formu uçtan uca işleyip AnalysisResponse üretir."""
    features = _clean(branch, raw_answers)

    result = scorer.score(features)                       # deterministik, her zaman çalışır
    report = llm_client.generate_report(branch, features, result)  # hata olursa stub döner

    certificate_available = (
        result.maturity_score > CERT_MIN_MATURITY
        and result.risk_probability < CERT_MAX_RISK
    )

    return AnalysisResponse(
        maturity_score=result.maturity_score,
        risk_probability=result.risk_probability,
        risk_percent=round(result.risk_probability * 100),
        risk_band=result.risk_band,
        drivers=result.drivers,
        navigation_report=[NavigationItem(**item) for item in report["items"]],
        certificate_available=certificate_available,
        report_source=report["source"],
    )


def _clean(branch: str, raw_answers: dict) -> dict:
    """Form girdisini skorlayıcının beklediği kanonik sözlüğe dönüştürür.

    - Funding_Stage'i daldan sabitler (kullanıcı girdisine güvenmeyiz).
    - number/scale alanlarını float'a çevirir; min/max sınırlarını doğrular.
    - form_config'de tanımlı olmayan fazladan anahtarları yok sayar.
    """
    cfg = get_branch(branch)
    features: dict = {"Funding_Stage": cfg["funding_stage"]}

    for field in cfg["fields"]:
        key = field["key"]
        value = raw_answers.get(key)

        if field["kind"] in ("number", "scale"):
            value = _to_float(value)
            if value is not None:
                min_val = field.get("min")
                max_val = field.get("max")
                if min_val is not None and value < min_val:
                    raise ValueError(f"{field['label']} değeri en az {min_val} olmalıdır.")
                if max_val is not None and value > max_val:
                    raise ValueError(f"{field['label']} değeri en fazla {max_val} olmalıdır.")
                
                if field["kind"] == "scale":
                    value = max(1.0, min(10.0, value))

        features[key] = value

    # Skorlayıcının dal ofsetiyle tutarlı olması için ipucu (opsiyonel).
    features["_maturity_offset"] = cfg["maturity_offset"]
    return features


def _to_float(value):
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
