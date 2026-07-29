"""Methodology answer based score adjustment rules.

The first-step ML score remains the baseline. These rules only apply to the
final comprehensive report, where the user has also completed the methodology
steps. The output is intentionally capped at -10 / +10 to keep the model score
as the main signal.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass, field


@dataclass
class MethodologyAdjustment:
    delta: int = 0
    reasons: list[str] = field(default_factory=list)


POSITIVE_PHRASES = (
    "sadece dinledim",
    "takip sorulari",
    "10 musteri",
    "5 kisiye",
    "15+ mulakat",
    "yazili bir kanallar plani",
    "net bir deger onerisi",
    "detayli analiz ettim",
    "veri yoksa varsayim",
    "hedef koyup ekibe guvenirim",
    "gunluk aktif kullanim",
    "temel is akisinin ayrilmaz parcasi",
    "kullanicilar memnun",
    "rakiplerden ustun",
    "hizli buyuyen ve lider",
)

NEGATIVE_PHRASES = (
    "savunma yaptim",
    "ikna etmeye calistim",
    "mukemmel olmadan",
    "her detayi kendim",
    "ekip benden habersiz karar alamaz",
    "yatirimci ne derse",
    "henuz baslamadim",
    "henuz tasarim yok",
    "organik bekliyorum",
    "rakibimiz yok",
    "cok dusuk",
    "dusuk",
    "aktif sikayet",
    "memnun degil",
    "buyume bitti",
)


def evaluate_methodology_adjustment(
    branch: str,
    methodology1_answers: dict,
    methodology2_answers: dict,
) -> MethodologyAdjustment:
    """Return a capped score delta derived from methodology answers."""

    signals = 0
    reasons: list[str] = []
    all_answers = {**methodology1_answers, **methodology2_answers}

    for key, raw_value in all_answers.items():
        value = _normalize(raw_value)
        if not value:
            signals -= 1
            reasons.append(f"{_label(key)} cevabi eksik oldugu icin metodoloji guveni azaldi.")
            continue

        if _has_any(value, POSITIVE_PHRASES):
            signals += 2
            reasons.append(f"{_label(key)} cevabi skoru destekleyen guclu bir sinyal verdi.")
            continue

        if _has_any(value, NEGATIVE_PHRASES):
            signals -= 2
            reasons.append(f"{_label(key)} cevabi skor uzerinde risk sinyali olusturdu.")
            continue

        if len(value) >= 60:
            signals += 1
        elif len(value) < 12:
            signals -= 1

    if branch == "sirketim_var":
        signals += _company_bcg_signal(methodology2_answers, reasons)

    if signals >= 5:
        return MethodologyAdjustment(delta=10, reasons=_top_reasons(reasons, positive=True))
    if signals <= -5:
        return MethodologyAdjustment(delta=-10, reasons=_top_reasons(reasons, positive=False))
    return MethodologyAdjustment(delta=0, reasons=_top_reasons(reasons, positive=None))


def _company_bcg_signal(answers: dict, reasons: list[str]) -> int:
    usage = _normalize(answers.get("kullanim_sikligi"))
    satisfaction = _normalize(answers.get("musteri_memnuniyeti"))
    growth = _normalize(answers.get("pazar_buyume_potansiyeli"))

    signal = 0
    if _has_any(usage, ("gunluk aktif", "temel is akisinin")):
        signal += 1
    if _has_any(satisfaction, ("kullanicilar memnun", "rakiplerden ustun")):
        signal += 1
    if _has_any(growth, ("lider konumdayiz", "lider olabilir")):
        signal += 1
    if _has_any(usage + " " + satisfaction + " " + growth, ("cok dusuk", "buyume bitti", "memnun degil")):
        signal -= 2

    if signal > 0:
        reasons.append("BCG cevaplari urun yatiriminin stratejik olarak desteklenebilecegini gosterdi.")
    elif signal < 0:
        reasons.append("BCG cevaplari urun yatirimi icin yeniden onceliklendirme gerektigini gosterdi.")
    return signal


def _normalize(value) -> str:
    if value is None:
        return ""
    text = str(value).casefold().replace("||", " ")
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def _has_any(value: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in value for phrase in phrases)


def _label(key: str) -> str:
    return key.replace("_", " ").title()


def _top_reasons(reasons: list[str], positive: bool | None) -> list[str]:
    if not reasons:
        if positive is True:
            return ["Metodoloji cevaplari genel skoru guclendirdi."]
        if positive is False:
            return ["Metodoloji cevaplari genel skorda risk ayarlamasi gerektirdi."]
        return ["Metodoloji cevaplari skoru sabit tuttu."]
    return reasons[:3]
