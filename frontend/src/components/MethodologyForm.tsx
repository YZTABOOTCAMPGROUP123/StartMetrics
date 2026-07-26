import { motion } from "framer-motion";

// MethodologyForm — Adım 3 & 4 için kategori-spesifik metodoloji formları.

export interface MethodologyField {
  key: string;
  label: string;
  placeholder?: string;
  kind: "textarea" | "select" | "checkbox";
  options?: string[];
  required?: boolean;
}

export interface MethodologyConfig {
  title: string;
  subtitle: string;
  description: string;
  fields: MethodologyField[];
}

// ===== FIKRIM VAR =====

const LEAN_CANVAS_FIELDS: MethodologyField[] = [
  { key: "musteri_segmenti", label: "Müşteri Segmenti", placeholder: "Kimin sorununu çözüyorsunuz? (örn: küçük işletme sahipleri, öğrenciler…)", kind: "textarea" },
  { key: "problem", label: "Problem", placeholder: "Hedef kitlenizin yaşadığı en önemli 3 sorunu tanımlayın.", kind: "textarea" },
  { key: "cozum", label: "Çözüm", placeholder: "Her probleme karşılık önerilen çözümünüzü yazın.", kind: "textarea" },
  { key: "deger_onermesi", label: "Benzersiz Değer Önermesi", placeholder: "Sizi rakiplerinizden ayıran tek şey nedir?", kind: "textarea" },
  { key: "rekabetci_avantaj", label: "Rakipsiz Avantaj", placeholder: "Kolayca kopyalanamayacak özel bir gücünüz var mı?", kind: "textarea" },
  { key: "kanallar", label: "Kanallar", placeholder: "Müşterilerinize nasıl ulaşacaksınız?", kind: "textarea" },
  { key: "gelir_akislari", label: "Gelir Akışları", placeholder: "Nasıl para kazanacaksınız? (abonelik, komisyon, satış…)", kind: "textarea" },
  { key: "maliyet_yapisi", label: "Maliyet Yapısı", placeholder: "En büyük giderleriniz nelerdir?", kind: "textarea" },
  { key: "anahtar_metrikler", label: "Anahtar Metrikler", placeholder: "Başarıyı nasıl ölçeceksiniz? (CAC, LTV, DAU…)", kind: "textarea" },
];

const JAVELIN_BOARD_FIELDS: MethodologyField[] = [
  { key: "varsayimlar", label: "🧠 Beyin Fırtınası — Varsayımlar Listesi", placeholder: "Doğrulanmamış en riskli varsayımlarınızı listeleyin.", kind: "textarea" },
  { key: "yardim_surecleri", label: "💬 Yardıma mı ihtiyacınız var? — Süreçler & İhtiyaçlar", placeholder: "Deneyinizi ilerletmek için hangi kaynak, kişi veya süreçlere ihtiyacınız var?", kind: "textarea" },
  { key: "nasil_test", label: "🧪 Deney #1 — Nasıl Test Edeceksiniz?", placeholder: "En riskli varsayımı test etmek için ne yapacaksınız?", kind: "textarea" },
  { key: "basari_kriteri", label: "🧪 Deney #2 — Başarı Kriterin Ne?", placeholder: "Testin başarılı sayılması için minimum hangi sonucu elde etmeniz gerekiyor?", kind: "textarea" },
];

// ===== STARTUP'IM VAR =====

const FOUNDER_READINESS_FIELDS: MethodologyField[] = [
  {
    key: "musteri_mulakat_tepki",
    label: "Ego & Müşteri Empatisi — Müşteri mülakatı tepkisi",
    kind: "select",
    options: [
      "Fikirlerimi doğrulayan cevaplar aradım",
      "Beklentilerimin dışındaki her şeyi not ettim",
      "Müşteriyi ikna etmeye çalıştım",
      "Sadece dinledim ve takip soruları sordum",
    ],
  },
  {
    key: "olumsuz_elestirim_tepki",
    label: "Ego & Müşteri Empatisi — Olumsuz eleştiriye tepki",
    kind: "select",
    options: [
      "Müşteri yanlış anlıyor, savunma yaptım",
      "Üzüldüm ama haklılar diye revize ettim",
      "Bunu daha önce de duyduk, kritik değil dedim",
      "Teşekkür edip hangi kısım olduğunu sordum",
    ],
  },
  {
    key: "minimum_kabul_seviyesi",
    label: "Hız & Mükemmeliyetçilik — Kabul edilebilir minimum seviye",
    kind: "select",
    options: [
      "Ürün mükemmel olmadan piyasaya çıkmam",
      "%80 hazır olunca kullanıcı alabiliriz",
      "İlk beta'yı 2 hafta içinde yayına aldım",
      "Bugün bile 10 kullanıcıyla manuel test yapabilirim",
    ],
  },
  {
    key: "gorev_takip",
    label: "Delege Etme & Güven — Görev takip tarzı",
    kind: "select",
    options: [
      "Her detayı kendim kontrol ederim",
      "Haftalık toplantılarda gözden geçiririm",
      "Hedef koyup ekibe güvenirim",
      "Ekip benden habersiz karar alamaz",
    ],
  },
  {
    key: "kullanilmayan_ozellik",
    label: "Pivot & Değişim Cesareti — Kullanılmayan ana özellik senaryosu",
    kind: "select",
    options: [
      "Kullanıcıları o özelliği kullanmaya ikna ederim",
      "Neden kullanmadıklarını 10 müşteri görüşmesiyle anlarım",
      "Tamamen kaldırıp yerine yenisini denerim",
      "Rakipler de sunuyor mu diye bakarım",
    ],
  },
  {
    key: "stratejik_karar_pusulasi",
    label: "Karar Alma Mekanizması — Stratejik kararı nasıl alırsınız?",
    kind: "select",
    options: [
      "İçgüdüme güvenirim",
      "En kıdemli ekip üyesiyle karar alırım",
      "Veri yoksa varsayım testleri yaparım",
      "Yatırımcı ne derse onu yaparım",
    ],
  },
];

const LEAN_DISCIPLINE_FIELDS: MethodologyField[] = [
  { key: "problem_dogrulama", label: "✅ Problem Doğrulama — 15 birebir mülakat gerçekleştirdiniz mi?", kind: "select", options: ["Evet, 15+ mülakat yaptım", "Kısmen, 5-14 mülakat", "Hayır, henüz başlamadım", "Online anket yaptım, yüz yüze değil"] },
  { key: "cozum_dogrulama", label: "✅ Çözüm Doğrulama — Görsel/Figma prototype müşteriye gösterildi mi?", kind: "select", options: ["Evet, en az 5 kişiye gösterdim", "Sadece ekip içi test yaptım", "Hayır, henüz tasarım yok", "Sadece sözel olarak anlattım"] },
  { key: "musteri_edinme", label: "✅ Müşteri Edinme — İlk 100 kullanıcı planınız var mı?", kind: "select", options: ["Evet, yazılı bir kanallar planı var", "Genel fikrim var ama detaylandırmadım", "Hayır, organik bekliyorum", "Yatırımcı kanallarını kullanacağım"] },
  { key: "mvp_sadeligi", label: "✅ En Basit Ürün (MVP) — MVP'niz tek bir sorunu mu çözüyor?", kind: "select", options: ["Evet, net bir değer önerisi var", "2-3 sorun var ama hepsi birbiriyle bağlı", "Hayır, kapsamlı bir platform", "Henüz MVP tanımlı değil"] },
  { key: "rakip_analizi", label: "✅ Rakipleri Tanıma — En büyük 3 rakibinizin zayıf yönlerini biliyor musunuz?", kind: "select", options: ["Evet, hepsini detaylı analiz ettim", "1-2 rakibi inceledim", "Genel bir fikrim var ama derinlemedim", "Rakibimiz yok diye düşünüyorum"] },
  { key: "basari_metrik", label: "✅ Başarı Kriteri — 30 günlük odak metriğiniz nedir?", kind: "textarea", placeholder: "Örn: 50 kayıtlı kullanıcı, 10 ödeme yapan müşteri, %5 haftalık büyüme…" },
];

// ===== SIRKETIM VAR =====

const SUREC_KOR_NOKTA_FIELDS: MethodologyField[] = [
  {
    key: "en_yavaslayan_departman",
    label: "Hangi departman en fazla tıkanıklık yaşıyor?",
    kind: "select",
    options: ["Satış & Pazarlama", "Ürün & Geliştirme", "Operasyon & Lojistik", "Müşteri Hizmetleri", "Finans & Muhasebe", "İnsan Kaynakları"],
  },
  {
    key: "tikaniklik_nedeni",
    label: "Bu tıkanıklığın temel nedeni nedir?",
    kind: "select",
    options: [
      "Manuel/tekrarlayan süreçler (otomasyon yok)",
      "Departmanlar arası iletişim kopukluğu",
      "Yanlış araçlar veya sistemler",
      "Yetersiz ekip kapasitesi",
      "Net süreç / SOP tanımlarının olmaması",
      "Veri eksikliği veya yanlış veri",
    ],
  },
  { key: "operasyonel_tikaniklik_aciklama", label: "Operasyonel tıkanıklığı kısaca açıklayın", placeholder: "Hangi süreç, nerede, nasıl tıkandığını ve ne kadar zaman/para kaybettirdiğini yazın.", kind: "textarea" },
  {
    key: "mevcut_cozum_denemesi",
    label: "Bu sorunu çözmek için daha önce ne denediniz?",
    kind: "select",
    options: [
      "Yeni bir araç/yazılım satın aldık",
      "Ekip içi eğitimler yaptık",
      "Süreç dökümantasyonu oluşturduk",
      "Dış danışman/ajans tuttuk",
      "Hiçbir şey denemedik",
    ],
  },
  { key: "kor_nokta_aciklama", label: "Şirketinizin gördüğünüz en büyük kör noktası nedir?", placeholder: "Ekibinizin farkında olmadığı veya konuşmaktan kaçındığı bir risk veya büyüme engelini yazın.", kind: "textarea" },
  { key: "en_kritik_metrik", label: "Şu an için en kritik iş metriğiniz nedir?", placeholder: "Örn: müşteri churn oranı, brüt marj, satış döngüsü süresi…", kind: "textarea" },
];

const BCG_MATRIX_FIELDS: MethodologyField[] = [
  { key: "ozellik_veya_urun_adi", label: "📦 Analiz Edilen Özellik / Ürün", placeholder: "Ürüne eklenen yeni özelliğin veya yeni yatırım yapılan ürünün adı nedir?", kind: "textarea" },
  {
    key: "kullanim_sikligi",
    label: "📊 X Ekseni — Ürün Kullanım Sıklığı",
    kind: "select",
    options: [
      "Çok Düşük — Kullanıcılar bu özelliği nadiren kullanıyor",
      "Düşük — Aylık birkaç kez kullanılıyor",
      "Orta — Haftalık düzenli kullanım var",
      "Yüksek — Günlük aktif kullanım",
      "Çok Yüksek — Temel iş akışının ayrılmaz parçası",
    ],
  },
  {
    key: "musteri_memnuniyeti",
    label: "📊 Y Ekseni — Müşteri Memnuniyeti",
    kind: "select",
    options: [
      "Çok Düşük — Müşteriler bu konuda aktif şikâyet ediyor",
      "Düşük — Kullanıcılar memnun değil, alternatif arıyor",
      "Orta — Nötr, ne şikâyet ne övgü",
      "Yüksek — Kullanıcılar memnun, genel geri bildirim olumlu",
      "Çok Yüksek — Kullanıcılar bu özelliği rakiplerden üstün buluyor",
    ],
  },
  {
    key: "pazar_buyume_potansiyeli",
    label: "Bu özelliğin/ürünün pazar büyüme potansiyeli nasıl?",
    kind: "select",
    options: [
      "Büyüme bitti, pazar olgunlaştı (Dog)",
      "Yavaş büyüyen istikrarlı bir pazar (Cash Cow)",
      "Hızlı büyüyen, lider olabilir miyiz bilmiyoruz (Question Mark)",
      "Hızlı büyüyen ve lider konumdayız (Star)",
    ],
  },
  { key: "yatirim_justifikasyonu", label: "Bu özelliğe/ürüne neden yatırım yapıyorsunuz?", placeholder: "Bu özelliğin şirket stratejinize nasıl katkıda bulunduğunu açıklayın.", kind: "textarea" },
  { key: "alternatif_yatirim", label: "Bu yatırımı yapamasaydınız, kaynakları nereye harcardınız?", placeholder: "Alternatif kullanım senaryosunu yazın.", kind: "textarea" },
];

// ===== KONFİGÜRASYON HARİTASI =====

export const METHODOLOGY_CONFIGS: Record<
  string,
  { step3: MethodologyConfig; step4: MethodologyConfig }
> = {
  fikrim_var: {
    step3: {
      title: "Lean Canvas — Yalın İş Modeli",
      subtitle: "Adım 3 / 4",
      description:
        "Lean Canvas, iş fikrinizi tek sayfada görselleştiren girişimciler için klasik bir metodoloji aracıdır. Her alanı dürüstçe doldurun — bu formun amacı sizi test etmek değil, fikrinizi netleştirmektir.",
      fields: LEAN_CANVAS_FIELDS,
    },
    step4: {
      title: "Javelin Experiment Board",
      subtitle: "Adım 4 / 4",
      description:
        "Javelin, varsayımlarınızı hızlıca test etmenizi sağlayan bir deney çerçevesidir. Müşterinizi ve sorunu netleştirin, ardından en riskli varsayımı test edecek bir deney tasarlayın.",
      fields: JAVELIN_BOARD_FIELDS,
    },
  },
  startup_var: {
    step3: {
      title: "Founder Readiness — Kurucu Hazırlık Testi",
      subtitle: "Adım 3 / 4",
      description:
        "Bu test, bir kurucunun startup zorluklarına karşı zihinsel ve davranışsal hazırlığını ölçer. Dürüst cevaplar verin — doğru cevap yoktur, kör noktalarınızı görmek için tasarlanmıştır.",
      fields: FOUNDER_READINESS_FIELDS,
    },
    step4: {
      title: "Lean Discipline Checklist — Yalın Disiplin Kontrol Listesi",
      subtitle: "Adım 4 / 4",
      description:
        "Lean startup metodolojisinin temel adımlarını ne kadar uyguladığınızı değerlendirin. Bu checklist, büyüme öncesi sağlam bir temel kurmanızı kontrol eder.",
      fields: LEAN_DISCIPLINE_FIELDS,
    },
  },
  sirketim_var: {
    step3: {
      title: "Süreç Kör Noktası Formu",
      subtitle: "Adım 3 / 4",
      description:
        "Şirketinizin operasyonel tıkanıklıklarını ve görünmez engelleri tespit etmek için tasarlanmış bir veri toplama formu.",
      fields: SUREC_KOR_NOKTA_FIELDS,
    },
    step4: {
      title: "BCG Matrix — Ürün/Özellik Yatırım Analizi",
      subtitle: "Adım 4 / 4",
      description:
        "BCG Matrisi, ürün veya özelliklere yapılan yatırımları kullanım sıklığı ve müşteri memnuniyeti eksenlerinde değerlendiren stratejik bir araçtır.",
      fields: BCG_MATRIX_FIELDS,
    },
  },
};

// ===== BILEŞEN =====

interface Props {
  config: MethodologyConfig;
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export default function MethodologyForm({
  config,
  answers,
  onChange,
  onSubmit,
  onBack,
  submitLabel = "Devam Et →",
  loading = false,
}: Props) {
  const isLeanCanvas = config.title.includes("Lean Canvas");

  const renderLcField = (key: string) => {
    const field = config.fields.find((f) => f.key === key);
    if (!field) return null;
    return (
      <div className="lc-field">
        <label htmlFor={field.key} className="lc-label">
          {field.label}
        </label>
        <textarea
          id={field.key}
          className="lc-textarea"
          value={answers[field.key] ?? ""}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          required={field.required !== false}
        />
      </div>
    );
  };

  return (
    <motion.div
      className="methodology-wrapper"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="methodology-header">
        <span className="methodology-subtitle">{config.subtitle}</span>
        <h2 className="methodology-title">{config.title}</h2>
        <p className="methodology-description">{config.description}</p>
      </div>

      <form
        className={`methodology-form ${isLeanCanvas ? "" : "card"}`}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {isLeanCanvas ? (
          <div className="lean-canvas-board">
            <div className="lc-top">
              <div className="lc-box">{renderLcField("problem")}</div>
              <div className="lc-split">
                <div className="lc-box">{renderLcField("cozum")}</div>
                <div className="lc-box">{renderLcField("anahtar_metrikler")}</div>
              </div>
              <div className="lc-box">{renderLcField("deger_onermesi")}</div>
              <div className="lc-split">
                <div className="lc-box">{renderLcField("rekabetci_avantaj")}</div>
                <div className="lc-box">{renderLcField("kanallar")}</div>
              </div>
              <div className="lc-box">{renderLcField("musteri_segmenti")}</div>
            </div>
            <div className="lc-bottom">
              <div className="lc-box">{renderLcField("maliyet_yapisi")}</div>
              <div className="lc-box">{renderLcField("gelir_akislari")}</div>
            </div>
          </div>
        ) : (
          <div className="methodology-fields">
            {config.fields.map((field, i) => (
              <motion.div
                key={field.key}
                className="methodology-field"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <label className="field-label" htmlFor={field.key}>
                  {field.label}
                </label>

                {field.kind === "textarea" && (
                  <textarea
                    id={field.key}
                    className="methodology-textarea"
                    value={answers[field.key] ?? ""}
                    placeholder={field.placeholder ?? ""}
                    rows={3}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    required={field.required !== false}
                  />
                )}

                {field.kind === "select" && (
                  <select
                    id={field.key}
                    className="methodology-select"
                    value={answers[field.key] ?? ""}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    required={field.required !== false}
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
                )}

                {field.kind === "checkbox" && (
                  <div className="methodology-checkbox-group">
                    {field.options?.map((opt) => (
                      <label key={opt} className="methodology-checkbox-label">
                        <input
                          type="checkbox"
                          checked={answers[field.key]?.includes(opt) ?? false}
                          onChange={(e) => {
                            const current = answers[field.key]
                              ? answers[field.key].split("||")
                              : [];
                            const updated = e.target.checked
                              ? [...current, opt]
                              : current.filter((v) => v !== opt);
                            onChange(field.key, updated.join("||"));
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <div className="methodology-actions">
          <button type="button" className="back-btn" onClick={onBack}>
            ← Geri
          </button>
          <button type="submit" className="analyze-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> Oluşturuluyor…
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
