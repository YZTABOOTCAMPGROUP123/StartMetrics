"""
schemas.py — Pydantic request/response modelleri.

Edge doğrulaması burada yapılır (rubrikteki "girdi temizleme"nin bir parçası).
AnalysisResponse frontend ile aramızdaki kontrattır.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Frontend'den gelen analiz isteği."""

    branch: str = Field(..., description="fikrim_var | startup_var | sirketim_var")
    # Serbest sözlük: form_config'e göre değişen alanlar. Orchestrator
    # bunları kanonik veri seti anahtarlarına eşleyip clamp'ler.
    answers: dict = Field(default_factory=dict)


class NavigationItem(BaseModel):
    """3 maddelik navigasyon raporunun tek bir maddesi."""

    title: str
    body: str


class AnalysisResponse(BaseModel):
    """Analiz sonucu — sol panel (skor) + sağ panel (rapor) + sertifika bayrağı."""

    maturity_score: int = Field(..., ge=0, le=100)
    risk_probability: float = Field(..., ge=0.0, le=1.0)
    risk_percent: int = Field(..., ge=0, le=100)
    risk_band: str
    drivers: list[str] = Field(default_factory=list)
    navigation_report: list[NavigationItem]
    certificate_available: bool
    # "llm" | "stub" — dürüstlük bayrağı; UI'da gösterilmez, teşhis içindir.
    report_source: str

# ---------------------------------------------------------------------------
# Kapsamlı Rapor (Adım 5) — tüm adımların verisi birleştirilir
# ---------------------------------------------------------------------------

class ComprehensiveReportRequest(BaseModel):
    """Adım 5 için frontend'den gelen istek: 3 adımın verisi + dal."""

    branch: str = Field(..., description="fikrim_var | startup_var | sirketim_var")
    step1_answers: dict = Field(default_factory=dict, description="Adım 1 kullanıcı bilgi formu cevapları")
    methodology1_answers: dict = Field(default_factory=dict, description="Adım 3 metodoloji formu-1 cevapları")
    methodology2_answers: dict = Field(default_factory=dict, description="Adım 4 metodoloji formu-2 cevapları")


class ComprehensiveReportResponse(BaseModel):
    """Kapsamlı sonuç ekranı verisi."""

    maturity_score: int = Field(..., ge=0, le=100)
    base_maturity_score: int = Field(0, ge=0, le=100)
    score_delta: int = Field(0)
    risk_probability: float = Field(..., ge=0.0, le=1.0)
    risk_percent: int = Field(..., ge=0, le=100)
    risk_band: str
    drivers: list[str] = Field(default_factory=list)
    adjustment_reasons: list[str] = Field(default_factory=list)
    certificate_available: bool
    # Kapsamlı AI Yol Haritası Raporu — markdown formatında uzun metin
    roadmap_report: str
    report_source: str  # "llm" | "stub"

