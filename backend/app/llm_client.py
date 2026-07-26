"""
llm_client.py — AI Yön Raporu üretici (Vercel Optimize Edilmiş)

Sorumluluk: Skorlayıcının çıktısını ve alanları Türkçe mentor prompt'una
gömüp LLM'den navigasyon raporu almak. Sadece Vercel Environment Variables
(Ortam Değişkenleri) üzerinden çalışır.
"""

from __future__ import annotations

import json
import os

from .scorer import ScoreResult


SYSTEM_PROMPT = (
    "Sen bir girişim mentorusun — öğretmen değil, akıllı bir Waze/GPS "
    "navigasyonu gibisin. Sana verilen girişim verilerine ve bizim modelimizin "
    "ürettiği Olgunluk Skoru ile Risk yüzdesine bakarak, öğretmenlik taslamadan, "
    "girişimcinin önündeki riskleri ve yön önerilerini TAM 3 maddede yaz. "
    "Her madde en fazla 2 cümle olsun ve bir yol/rota metaforu içersin "
    "(örn. 'Önünde görünmez bir duvar var…', 'Bu virajda yavaşla…'). "
    "Genel motivasyon cümlesi KURMA; sadece bu veriye özel, somut, aksiyon "
    "alınabilir uyarılar ver. Yanıtı SADECE şu formatta bir JSON dizisi olarak "
    'döndür: [{"title": "...", "body": "..."}, ...] — tam 3 eleman, başka metin yok.'
)

def _resolve_provider() -> tuple[str, str | None]:
    """
    Sadece Vercel Environment Variables'a bakarak API anahtarını bulur.
    Öncelik sırası: OpenAI -> Anthropic -> Gemini -> OpenRouter
    Returns: (provider_name, api_key)
    """
    if os.environ.get("OPENAI_API_KEY"):
        return "openai", os.environ.get("OPENAI_API_KEY")
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "anthropic", os.environ.get("ANTHROPIC_API_KEY")
    if os.environ.get("GEMINI_API_KEY"):
        return "gemini", os.environ.get("GEMINI_API_KEY")
    if os.environ.get("OPENROUTER_API_KEY"):
        return "openrouter", os.environ.get("OPENROUTER_API_KEY")
    
    return "", None


def generate_report(branch: str, features: dict, result: ScoreResult) -> dict:
    """3 maddelik navigasyon raporu üretir."""
    provider, api_key = _resolve_provider()

    if not provider or not api_key:
        return _stub_report(result)

    try:
        user_prompt = _build_user_prompt(branch, features, result)
        
        if provider == "openai":
            text = _call_openai(user_prompt, api_key)
        elif provider == "anthropic":
            text = _call_anthropic(user_prompt, api_key)
        elif provider == "gemini":
            text = _call_gemini(user_prompt, api_key)
        elif provider == "openrouter":
            text = _call_openrouter(user_prompt, api_key)
        else:
            return _stub_report(result)

        items = _parse_three_items(text)
        return {"items": items, "source": "llm"}
    except Exception as e:
        stub = _stub_report(result)
        stub["items"][0]["title"] = "SİSTEM HATASI"
        stub["items"][0]["body"] = f"Hata Detayı: {type(e).__name__} - {str(e)}"
        return stub

def _build_user_prompt(branch: str, features: dict, result: ScoreResult) -> str:
    public = {k: v for k, v in features.items() if not k.startswith("_")}
    return (
        f"Dal: {branch}\n"
        f"Girişim verileri: {json.dumps(public, ensure_ascii=False)}\n"
        f"Olgunluk Skoru: {result.maturity_score}/100\n"
        f"Risk: %{round(result.risk_probability * 100)} ({result.risk_band})\n"
        f"Skorun sürücüleri (aynı gerekçeleri kullan): {result.drivers}\n"
        f"Bu verilere göre tam 3 maddelik navigasyon raporunu üret."
    )


def _call_openai(user_prompt: str, api_key: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    model = os.environ.get("OPENAI_MODEL", "gpt-4o")
    
    resp = client.chat.completions.create(
        model=model,
        max_tokens=400,
        temperature=0.5,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return resp.choices[0].message.content or ""


def _call_anthropic(user_prompt: str, api_key: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    model = os.environ.get("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
    
    msg = client.messages.create(
        model=model,
        max_tokens=400,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")


def _call_gemini(user_prompt: str, api_key: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)  
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    
    resp = client.models.generate_content(
        model=model,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            temperature=0.5,
            max_output_tokens=800,
            system_instruction=SYSTEM_PROMPT,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )
    return resp.text or ""


def _call_openrouter(user_prompt: str, api_key: str) -> str:
    from openai import OpenAI
    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key)
    model = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    
    resp = client.chat.completions.create(
        model=model,
        max_tokens=800,
        temperature=0.5,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return resp.choices[0].message.content or ""


def _parse_three_items(text: str) -> list[dict]:
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError("JSON dizisi bulunamadı")
    items = json.loads(text[start : end + 1])
    if not isinstance(items, list) or len(items) < 3:
        raise ValueError("En az 3 madde bekleniyordu")
    
    cleaned = []
    for it in items[:3]:
        cleaned.append(
            {
                "title": str(it.get("title", "Rota Uyarısı")),
                "body": str(it.get("body", "")).strip(),
            }
        )
    return cleaned


def _stub_report(result: ScoreResult) -> dict:
    titles = ["Nakit Rotası", "Ekip Sağlığı", "Pazar Yönü"]
    drivers = result.drivers or ["Veriler dengeli, rotan şimdilik açık."]
    items: list[dict] = []
    
    for i in range(3):
        driver = drivers[i] if i < len(drivers) else None
        if driver:
            body = f"Akıllı radar uyarısı : {driver}. Bu sinyali önümüzdeki 2 haftada ele al."
        else:
            body = "Rota temiz görünüyor; bir sonraki 5 müşteri görüşmeni planla."
        items.append({"title": titles[i], "body": body})
        
    return {"items": items, "source": "stub"}


# ===========================================================================
# Kapsamlı Yol Haritası Raporu (Adım 5)
# ===========================================================================

COMPREHENSIVE_SYSTEM_PROMPT = (
    "Sen StartMetrics platformunun strateji danışmanısın. Bir girişimcinin 4 aşamalık "
    "analiz sürecinden elde edilen verilere bakarak kapsamlı, kişiselleştirilmiş ve "
    "uygulanabilir bir stratejik yol haritası raporu yazacaksın. "
    "Rapor Türkçe olacak. Markdown formatında olacak (## başlıklar, - madde işaretleri). "
    "Şu bölümleri içermelidir: "
    "## 🎯 Genel Değerlendirme (2-3 cümle özet), "
    "## 💡 Kritik Bulgular (en önemli 3-5 tespit), "
    "## 🗺️ 30 Günlük Eylem Planı (somut adımlar), "
    "## 🚀 90 Günlük Büyüme Rotası (stratejik yönelim), "
    "## ⚠️ Öncelikli Riskler ve Çözüm Önerileri. "
    "Genel tavsiyeler değil, VERİLERE ÖZGÜ, uygulanabilir öneriler ver. "
    "Motivasyon konuşması yapma."
)


def generate_comprehensive_report(
    branch: str,
    step1_answers: dict,
    methodology1_answers: dict,
    methodology2_answers: dict,
    score_result: ScoreResult,
) -> dict:
    
    provider, api_key = _resolve_provider()

    if not provider or not api_key:
        return _stub_comprehensive_report(score_result)

    try:
        user_prompt = _build_comprehensive_prompt(
            branch, step1_answers, methodology1_answers, methodology2_answers, score_result
        )
        
        if provider == "openai":
            text = _call_openai_comprehensive(user_prompt, api_key)
        elif provider == "anthropic":
            text = _call_anthropic_comprehensive(user_prompt, api_key)
        elif provider == "gemini":
            text = _call_gemini_comprehensive(user_prompt, api_key)
        elif provider == "openrouter":
            text = _call_openrouter_comprehensive(user_prompt, api_key)
        else:
            return _stub_comprehensive_report(score_result)

        return {"roadmap": text.strip(), "source": "llm"}
    except Exception as e:
        stub = _stub_comprehensive_report(score_result)
        hata_mesaji = f"\n\n### 🚨 HATA DETAYI (Geliştirici Logu)\n**Hata Türü:** `{type(e).__name__}`\n**Açıklama:** `{str(e)}`"
        stub["roadmap"] = hata_mesaji + "\n\n" + stub["roadmap"]
        return stub


def _build_comprehensive_prompt(branch: str, step1: dict, metho1: dict, metho2: dict, result: ScoreResult) -> str:
    public_step1 = {k: v for k, v in step1.items() if not k.startswith("_")}
    branch_labels = {
        "fikrim_var": "Fikrim Var (Pre-Seed)",
        "startup_var": "Startup'ım Var (Seed)",
        "sirketim_var": "Şirketim Var (Bootstrapped)",
    }

    return (
        f"Kategori: {branch_labels.get(branch, branch)}\n\n"
        f"=== ADIM 1: Kullanıcı Profili ===\n{json.dumps(public_step1, ensure_ascii=False, indent=2)}\n\n"
        f"=== ML ANALİZ SONUCU ===\n"
        f"Olgunluk Skoru: {result.maturity_score}/100\n"
        f"Risk: %{round(result.risk_probability * 100)} ({result.risk_band})\n"
        f"Temel Sinyaller: {', '.join(result.drivers)}\n\n"
        f"=== ADIM 3: Metodoloji Formu-1 ===\n{json.dumps(metho1, ensure_ascii=False, indent=2)}\n\n"
        f"=== ADIM 4: Metodoloji Formu-2 ===\n{json.dumps(metho2, ensure_ascii=False, indent=2)}\n\n"
        f"Yukarıdaki tüm verileri analiz ederek kapsamlı stratejik yol haritası raporunu yaz."
    )


def _call_openai_comprehensive(user_prompt: str, api_key: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    model = os.environ.get("OPENAI_MODEL", "gpt-4o")
    
    resp = client.chat.completions.create(
        model=model,
        max_tokens=1500,
        temperature=0.6,
        messages=[
            {"role": "system", "content": COMPREHENSIVE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return resp.choices[0].message.content or ""


def _call_anthropic_comprehensive(user_prompt: str, api_key: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    model = os.environ.get("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
    
    msg = client.messages.create(
        model=model,
        max_tokens=1500,
        system=COMPREHENSIVE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")


def _call_gemini_comprehensive(user_prompt: str, api_key: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    resp = client.models.generate_content(
        model=model,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            temperature=0.6,
            max_output_tokens=2000,
            system_instruction=COMPREHENSIVE_SYSTEM_PROMPT,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )
    return resp.text or ""


def _call_openrouter_comprehensive(user_prompt: str, api_key: str) -> str:
    from openai import OpenAI
    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key)
    model = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    
    resp = client.chat.completions.create(
        model=model,
        max_tokens=1500,
        temperature=0.6,
        messages=[
            {"role": "system", "content": COMPREHENSIVE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return resp.choices[0].message.content or ""


def _stub_comprehensive_report(result: ScoreResult) -> dict:
    score = result.maturity_score
    band = result.risk_band
    drivers_text = "\n".join(f"- {d}" for d in result.drivers) if result.drivers else "- Belirgin sinyal yok."

    roadmap = f"""## 🎯 Genel Değerlendirme

Girişiminizin Olgunluk Skoru **{score}/100** olarak hesaplanmıştır. Risk bandı **{band}** seviyesindedir. Bu rapor, girişiminizin mevcut durumunu özetlemekte ve öncelikli aksiyon adımlarını içermektedir.

## 💡 Kritik Bulgular

{drivers_text}

## 🗺️ 30 Günlük Eylem Planı

- **Hafta 1-2:** Temel riskleri önceliklendirin ve hızlı kazanımlar için fırsatları belirleyin.
- **Hafta 3-4:** Müşteri doğrulama süreçlerini güçlendirin ve geri bildirim döngüsü kurun.
- Metodoloji formlarınızda belirttiğiniz varsayımları en az 5 gerçek müşteri görüşmesiyle test edin.

## 🚀 90 Günlük Büyüme Rotası

- **Ay 1:** Ürün-pazar uyumunu doğrulayacak minimum ölçülebilir deney tasarlayın.
- **Ay 2:** İlk 10 sadık kullanıcıyı kazanın ve onların geri bildirimlerini ürüne yansıtın.
- **Ay 3:** Büyüme kanallarınızı test edin ve en düşük maliyetli kanalı ölçeklendirin.

## ⚠️ Öncelikli Riskler ve Çözüm Önerileri

- **Risk:** Pazar doğrulaması henüz tamamlanmamış olabilir. **Çözüm:** Ödeme yapan ilk müşteri veya LOI (İlgi Mektubu) almadan kaynak harcamayı minimumda tutun.
- **Risk:** Ekip kapasitesi sınırlı. **Çözüm:** Kritik olmayan görevleri erteleyerek tek bir önceliğe odaklanın.

---
*Bu rapor otomatik olarak oluşturulmuştur. Kapsamlı AI analizi için geçerli bir API anahtarı yapılandırın.*
"""
    return {"roadmap": roadmap, "source": "stub"}
