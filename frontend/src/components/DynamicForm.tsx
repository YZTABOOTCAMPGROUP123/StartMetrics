import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BranchConfig } from "../api";

// Dinamik form: alanları backend /config tanımına göre çizer (staggered giriş).

interface Props {
  config: BranchConfig;
  answers: Record<string, string | number>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function DynamicForm({
  config,
  answers,
  onChange,
  onSubmit,
  loading,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (val: any, field: any): string => {
    if (val === undefined || val === null || val === "") {
      return "Bu alan zorunludur.";
    }
    if (field.kind === "number" || field.kind === "scale") {
      const num = parseFloat(String(val));
      if (isNaN(num)) {
        return "Geçerli bir sayı giriniz.";
      }
      if (field.min !== undefined && num < field.min) {
        return `Değer ${field.min} veya daha büyük olmalıdır.`;
      }
      if (field.max !== undefined && num > field.max) {
        return `Değer ${field.max} veya daha küçük olmalıdır.`;
      }
      if (field.kind === "scale" && num % 1 !== 0) {
        return "Lütfen tam sayı giriniz.";
      }
    }
    return "";
  };

  const handleInputChange = (key: string, val: string, field: any) => {
    onChange(key, val);
    const err = validateField(val, field);
    setErrors((prev) => ({
      ...prev,
      [key]: err,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    let firstInvalidKey: string | null = null;

    config.fields.forEach((field) => {
      const val = answers[field.key];
      const err = validateField(val, field);
      if (err) {
        newErrors[field.key] = err;
        if (!firstInvalidKey) {
          firstInvalidKey = field.key;
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const el = document.getElementsByName(firstInvalidKey!)[0];
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    onSubmit();
  };

  return (
    <motion.form
      className="card form-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="fields">
        {config.fields.map((field, i) => {
          const hasError = !!errors[field.key];
          return (
            <motion.label
              key={field.key}
              className="field"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <span className="field-label">{field.label}</span>

              {field.kind === "select" ? (
                <select
                  name={field.key}
                  value={answers[field.key] ?? ""}
                  onChange={(e) => handleInputChange(field.key, e.target.value, field)}
                  className={hasError ? "input-error" : ""}
                  required
                >
                  <option value="" disabled>
                    Seçiniz…
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  name={field.key}
                  value={answers[field.key] ?? ""}
                  min={field.min}
                  max={field.max}
                  step={field.kind === "scale" ? 1 : "any"}
                  placeholder={
                    field.kind === "scale"
                      ? `${field.min}–${field.max} arası`
                      : "Sayısal değer"
                  }
                  onChange={(e) => handleInputChange(field.key, e.target.value, field)}
                  className={hasError ? "input-error" : ""}
                  required
                />
              )}

              <AnimatePresence>
                {hasError && (
                  <motion.span
                    className="field-error-msg"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors[field.key]}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.label>
          );
        })}
      </div>

      <button type="submit" className="analyze-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" /> Analiz ediliyor…
          </>
        ) : (
          <>⚡ Analiz Et</>
        )}
      </button>
    </motion.form>
  );
}
