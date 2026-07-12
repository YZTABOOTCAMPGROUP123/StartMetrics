import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_validate
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score

print("=== STARTMETRICS MODEL EĞİTİM VE DOĞRULAMA SÜRECİ (SPRINT 2) ===")

# 1. Veriyi Oku
df = pd.read_csv('./data/startup_founder_burnout_2026.csv')

# 2. Ön İşleme (Kategorik Alanları Sayısallaştır)
label_encoders = {}
for col in df.select_dtypes(include=['object']).columns:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    label_encoders[col] = le

# 3. Girdi ve Hedef Ayrımı
target_col = 'Startup_Failure_Flag'

# HİLELİ/SIZINTI YAPAN SÜTUNLARI EĞİTİMDEN ÇIKARIYORUZ (Sadece ham form girdileri kalmalı)
leaky_columns = [
    target_col, 
    'Shutdown_Probability', 
    'Shutdown_Risk', 
    'Burnout_Score', 
    'Burnout_Level', 
    'Founder_Burnout_Flag'
]

# X'i oluştururken bu sütunların hepsini atıyoruz
X = df.drop(columns=[col for col in leaky_columns if col in df.columns])
y = df[target_col].astype(int)

# =================================================================
# EKSİK OLAN KISIM: TRAIN / TEST SPLIT (Overfitting Kontrolü İçin Veriyi Bölme)
# =================================================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# =================================================================
# JÜRİ SAVUNMASI AŞAMASI 2: 5-FOLD CROSS-VALIDATION (Genellenebilirlik)
# =================================================================
print("\n[INFO] 5-Fold Cross-Validation hesaplanıyor...")
cv_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42) # max_depth=8 overfitting'i engeller
scoring_metrics = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']

cv_results = cross_validate(cv_model, X_train, y_train, cv=5, scoring=scoring_metrics)

print("\n>>> JÜRİ İÇİN CROSS-VALIDATION (5-FOLD) SONUÇLARI <<<")
print(f"CV Accuracy  : %{cv_results['test_accuracy'].mean()*100:.2f} (+/- %{cv_results['test_accuracy'].std()*100:.2f})")
print(f"CV Precision : %{cv_results['test_precision'].mean()*100:.2f}")
print(f"CV Recall    : %{cv_results['test_recall'].mean()*100:.2f}")
print(f"CV F1-Score  : %{cv_results['test_f1'].mean()*100:.2f}")
print(f"CV ROC-AUC   : %{cv_results['test_roc_auc'].mean()*100:.2f}")

# =================================================================
# JÜRİ SAVUNMASI AŞAMASI 3: FINAL MODEL EĞİTİMİ VE TEST METRİKLERİ
# =================================================================
print("\n[INFO] Final modeli Train seti üzerinde eğitiliyor...")
final_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
final_model.fit(X_train, y_train)

# Train ve Test skorlarını karşılaştırarak Overfitting analizi yapalım
train_preds = final_model.predict(X_train)
test_preds = final_model.predict(X_test)
test_probs = final_model.predict_proba(X_test)[:, 1]

train_acc = accuracy_score(y_train, train_preds)
test_acc = accuracy_score(y_test, test_preds)

print("\n>>> OVERFITTING KONTROLÜ <<<")
print(f"Train Seti Accuracy: %{train_acc*100:.2f}")
print(f"Test Seti Accuracy : %{test_acc*100:.2f}")

# Eğer Train ve Test başarıları birbirine çok yakınsa jüriye "Overfitting yoktur" diyebilirsiniz.
if (train_acc - test_acc) < 0.07:
    print("[SAĞLIKLI] Train ve Test başarıları dengeli. Modelde Overfitting (Ezberleme) yoktur.")
else:
    print("[UYARI] Train başarısı testten yüksek. Model hafifçe ezberlemeye meyilli (Overfitting riski).")

print("\n>>> DETAYLI TEST SETİ SINIFLANDIRMA RAPORU (Classification Report) <<<")
print(classification_report(y_test, test_preds, target_names=['Başarılı (0)', 'Batma Riski (1)']))
print(f"Test ROC-AUC Skoru: {roc_auc_score(y_test, test_probs):.4f}")

# 4. Modeli ve Encoders'ı Sakla
joblib.dump(final_model, 'trained_model.pkl')
joblib.dump(label_encoders, 'encoders.pkl')
print("\n[BAŞARILI] Model ve Encoder nesneleri sisteme entegrasyon için kaydedildi!")