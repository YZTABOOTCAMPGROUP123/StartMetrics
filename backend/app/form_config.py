"""
form_config.py — 3 dal için veri-güdümlü soru konfigürasyonu (TEK KAYNAK).

Dal başına hardcode YOK: her dal, göstereceği "askable feature" alt kümesine
+ etiket/tip/aralığa eşlenir. Dal seçimi Funding_Stage'i sabitler. Frontend
(formConfig.ts) bu anahtarları birebir yansıtır. Soru eklemek/çıkarmak = burayı
düzenlemek.

Alan tipleri:
    "select"  -> options listesinden seçim (kategorik)
    "number"  -> serbest sayısal giriş
    "scale"   -> 1-10 arası puan
"""

from __future__ import annotations

INDUSTRIES = [
    "SaaS", "AI", "FinTech", "E-commerce", "EdTech",
    "ClimateTech", "Cybersecurity", "Gaming", "Diğer",
]


def _field(key: str, label: str, kind: str, **kw) -> dict:
    return {"key": key, "label": label, "kind": kind, **kw}


# Sık kullanılan alanların yeniden kullanılabilir tanımları
_INDUSTRY = _field("Industry", "Sektör", "select", options=INDUSTRIES)
_PMF = _field("Product_Market_Fit_Score", "Ürün-pazar uyumu hissin (1-10)", "scale", min=1, max=10)
_TEAM = _field("Team_Size", "Kaç kişisiniz? (ekip büyüklüğü)", "number", min=1)
_EXPERIENCE = _field("Founder_Experience_Years", "Kurucu tecrübesi (yıl)", "number", min=0)
_WORK_HOURS = _field("Weekly_Work_Hours", "Haftalık çalışma saatin", "number", min=0)
_CONFLICT = _field("Cofounder_Conflict_Score", "Ortaklar arası anlaşmazlık (1-10)", "scale", min=1, max=10)
_RUNWAY = _field("Runway_Months_Remaining", "Kaç aylık nakit/öz kaynağın kaldı?", "number", min=0)
_RUNWAY_Fikrim_var = _field("Runway_Months_Remaining", "Bu fikir için kaç aylık bütçe ayırabilirsin", "number", min=0)
_STARTUP_AGE = _field("Startup_Age_Months", "Girişim yaşı (ay)", "number", min=0)
_PRESSURE = _field("Investor_Pressure_Score", "Yatırımcı baskısı (1-10)", "scale", min=1, max=10)
_GROWTH = _field("Monthly_Revenue_Growth_Percent", "Aylık gelir büyümesi (%)", "number")
_TURNOVER = _field("Employee_Turnover_Percent", "Yıllık çalışan devir oranı (%)", "number", min=0)
_WLB = _field("Work_Life_Balance_Score", "İş-yaşam dengesi (1-10)", "scale", min=1, max=10)
_ECONOMIC_CLIMATE = _field("Economic_Climate", "Ekonomik iklim", "select", options=["Recession", "Stable", "Boom"])
_Work_Mode = _field("Work_Mode", "Çalışma şekli", "select", options=["Remote", "Hybrid", "In-office"])
_Funding_Stage = _field("Funding_Stage", "Finansman aşaması", "select", options=["Pre-Seed", "Seed", "Bootstrapped", "Series A"])
_Founder_Age = _field("Founder_Age", "Kurucu yaşı", "number", min=18, max=100) 
_VDT = _field("Vacation_Days_Taken", "Yıllık izin süresi (gün)", "number", min=0)
_Decision_Fatigue = _field("Decision_Fatigue_Score", "Karar yorgunluğu (1-10)", "scale", min=1, max=10)


FORM_CONFIG: dict[str, dict] = {
    # A) "Sadece Bir Fikrim Var" — keşfettirici ton, pazar gerçekliği testi
    "fikrim_var": {
        "title": "Fikrim Var",
        "funding_stage": "Pre-Seed",
        "maturity_offset": 6,
        "fields": [
            _INDUSTRY, 
            _EXPERIENCE,
            _TEAM,
            _WORK_HOURS,
            _Work_Mode,
            _Founder_Age,
            _PMF,
            _CONFLICT,
            _RUNWAY_Fikrim_var
        ],
    },
    # B) "Bir Startup'ım Var" — test edici, risk analizine odaklı ton
    "startup_var": {
        "title": "Startup'ım Var",
        "funding_stage": "Seed",
        "maturity_offset": 2,
        "fields": [
            _INDUSTRY,
            _STARTUP_AGE,
            _Funding_Stage,
            _TEAM,
            _Work_Mode,
            _WORK_HOURS,
            _GROWTH,
            _RUNWAY,
            _PRESSURE,
            _PMF,
            _WLB,
            _TURNOVER,
            _CONFLICT,
        ],
    },
    # C) "Mevcut Bir Şirketim Var" — analitik, verimlilik odaklı ton
    "sirketim_var": {
        "title": "Şirketim Var",
        "funding_stage": "Bootstrapped",
        "maturity_offset": 0,
        "fields": [
            _INDUSTRY,
            _Founder_Age,
            _TEAM,
            _Work_Mode,
            _WORK_HOURS,
            _VDT,
            _GROWTH,
            _RUNWAY,
            _TURNOVER,
            _PMF,
            _WLB,
            _Decision_Fatigue,
            _CONFLICT,
        ],
    },
}


def get_branch(branch: str) -> dict:
    """Dal konfigürasyonunu döndürür; bilinmeyen dal için KeyError yerine
    anlamlı bir ValueError fırlatır (orchestrator temiz mesaj versin diye)."""
    if branch not in FORM_CONFIG:
        raise ValueError(
            f"Bilinmeyen dal: {branch!r}. "
            f"Geçerli dallar: {', '.join(FORM_CONFIG)}"
        )
    return FORM_CONFIG[branch]
