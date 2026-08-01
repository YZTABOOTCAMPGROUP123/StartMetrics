"""
test_api_key.py — LLM_PROVIDER + ilgili API anahtarını bağımsız olarak test eder.

Kullanım:
    python test_api_key.py

Bu script projenin geri kalanına dokunmaz; sadece .env'i okur ve seçili
sağlayıcıya (openai/anthropic/gemini) gerçek, küçük bir istek atıp sonucu
açıkça raporlar. Hata varsa TAM exception mesajını gösterir (llm_client.py
gibi sessizce stub'a düşmez).
"""

from __future__ import annotations

import os
import sys
import traceback

# --- 1) .env yükle -----------------------------------------------------
try:
    from dotenv import load_dotenv
except ImportError:
    print("HATA: python-dotenv kurulu değil. Kurmak için:")
    print("    pip install python-dotenv")
    sys.exit(1)

# Script'in bulunduğu klasördeki .env'i açıkça hedefle (isim/konum
# hatalarını tamamen ortadan kaldırmak için).
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

if not os.path.exists(ENV_PATH):
    print(f"UYARI: '{ENV_PATH}' bulunamadı.")
    print("       '.env' dosyasının bu script ile aynı klasörde ve tam olarak")
    print("       '.env' adında olduğundan emin olun (örn. '_env' DEĞİL).")
else:
    load_dotenv(dotenv_path=ENV_PATH)
    print(f"OK: '{ENV_PATH}' yüklendi.")

print("-" * 60)

# --- 2) Ortam değişkenlerini oku ----------------------------------------
provider = os.getenv("LLM_PROVIDER", "gemini").lower()
openai_key = os.getenv("OPENAI_API_KEY")
anthropic_key = os.getenv("ANTHROPIC_API_KEY")
gemini_key = os.getenv("GEMINI_API_KEY")
openrouter_key = os.getenv("OPENROUTER_API_KEY")

print(f"LLM_PROVIDER      = {provider!r}")
print(f"OPENAI_API_KEY    = {'VAR (' + openai_key[:6] + '...)' if openai_key else 'YOK'}")
print(f"ANTHROPIC_API_KEY = {'VAR (' + anthropic_key[:6] + '...)' if anthropic_key else 'YOK'}")
print(f"GEMINI_API_KEY    = {'VAR (' + gemini_key[:6] + '...)' if gemini_key else 'YOK'}")
print(f"OPENROUTER_API_KEY= {'VAR (' + openrouter_key[:6] + '...)' if openrouter_key else 'YOK'}")
print("-" * 60)

TEST_PROMPT = "Sadece 'ok' kelimesiyle cevap ver."


def test_openai():
    from openai import OpenAI

    client = OpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    resp = client.chat.completions.create(
        model=model,
        max_tokens=10,
        messages=[{"role": "user", "content": TEST_PROMPT}],
    )
    return resp.choices[0].message.content


def test_anthropic():
    import anthropic

    client = anthropic.Anthropic()
    model = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5")
    msg = client.messages.create(
        model=model,
        max_tokens=10,
        messages=[{"role": "user", "content": TEST_PROMPT}],
    )
    return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")


def test_gemini():
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    resp = client.models.generate_content(
        model=model,
        contents=TEST_PROMPT,
        config=types.GenerateContentConfig(
            max_output_tokens=200,  # thinking token'ları da bu bütçeden düşer
            thinking_config=types.ThinkingConfig(thinking_budget=0),  # thinking'i kapat
        ),
    )
    if resp.candidates:
        print(f"[debug] finish_reason: {resp.candidates[0].finish_reason}")
    return resp.text


def test_openrouter():
    from openai import OpenAI

    api_key = os.getenv("OPENROUTER_API_KEY")
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-20b:free")
    resp = client.chat.completions.create(
        model=model,
        max_tokens=800,
        messages=[{"role": "user", "content": TEST_PROMPT}],
    )
    return resp.choices[0].message.content


TESTERS = {
    "openai": (test_openai, "OPENAI_API_KEY"),
    "anthropic": (test_anthropic, "ANTHROPIC_API_KEY"),
    "gemini": (test_gemini, "GEMINI_API_KEY"),
    "openrouter": (test_openrouter, "OPENROUTER_API_KEY"),
}

if provider not in TESTERS:
    print(f"HATA: Bilinmeyen LLM_PROVIDER: {provider!r}")
    print(f"      Geçerli değerler: {list(TESTERS.keys())}")
    sys.exit(1)

test_fn, key_name = TESTERS[provider]

if not os.getenv(key_name):
    print(f"HATA: LLM_PROVIDER={provider!r} ama {key_name} tanımlı değil.")
    print("      llm_client.py bu durumda sessizce stub rapora düşer.")
    sys.exit(1)

print(f"'{provider}' sağlayıcısına test isteği gönderiliyor...")
print("-" * 60)

try:
    result = test_fn()
    print("BAŞARILI ✅")
    print(f"Model cevabı: {result!r}")
    print()
    print(f"Sonuç: {provider.upper()} API anahtarınız ÇALIŞIYOR.")
except Exception as e:
    print("BAŞARISIZ ❌")
    print(f"Hata tipi : {type(e).__name__}")
    print(f"Hata mesajı: {e}")
    print()
    print("--- Tam traceback ---")
    traceback.print_exc()
    print("-" * 60)
    print(f"Sonuç: {provider.upper()} API anahtarınız ÇALIŞMIYOR ya da istek başarısız oluyor.")
    print("       Yukarıdaki hata mesajı genellikle nedeni açıkça söyler")
    print("       (örn. 'invalid api key', '401', '403', 'quota exceeded' vb.)")
    sys.exit(1)