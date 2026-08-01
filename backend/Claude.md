### Platform için Optimize Edilmiş Sistem ve Akış Tanımı 

**Genel Amacı:** Kullanıcıların girişimcilik aşamalarına göre özelleştirilmiş formlar ve 
metodolojiler aracılığıyla adımları takip ettiği, arka planda bir Makine Öğrenmesi (ML) 
modeli ile Olgunluk Skoru hesaplayan ve üretken yapay zeka (GenAI) ile kapsamlı yol 
haritaları çıkaran çok aşamalı bir platform akışı oluşturmak. 

### Temel Kullanıcı Akış Şeması (Tüm kategoriler için ortak mimari)  
Sistemdeki 3 ana kategori de (Fikrim Var, Start-up'ım Var, Şirketim Var) aynı dinamik 
ekran akış sırasını takip eder: 

[Adım 1: Kullanıcı Bilgi Formu]  
⬇ (Kullanıcı "Analiz Et" butonuna tıklar)  
[Adım 2: Navigasyon Raporu Ekranı]  
⬇ (Kullanıcı "Devam Et" butonuna tıklar)  
[Adım 3: Aşama Metodoloji Formu - 1] (Kategoriye göre değişir)  
⬇ (Kullanıcı "Devam Et" butonuna tıklar)  
[Adım 4: Aşama Metodoloji Formu - 2] (Kategoriye göre değişir)  
⬇ (Kullanıcı "Kapsamlı Rapor Oluştur" butonuna tıklar)  
[Adım 5: Sonuç Ekranı] -> (ML Olgunluk Skoru + AI Yol Haritası Raporu + %75 Üzerine 
Sertifika) 
 
### Kategorilere Göre Dinamik Form İçerikleri  
1. "Fikrim Var" Kategorisi Aşama Metodoloji Formu - 1: Lean Canvas (Yalın Tuval) 
Modülü. İçerik(Metin): Girişimciler için klasikleşmiş Lean Canvas tablosu. 

• Aşama Metodoloji Formu - 2: Javelin Experiment Board Modülü.   
o İçerik(Metin): Beyin Fırtınası (Müşteri kim?, Sorun nedir?, Çözüm yolu, 
Varsayımlar listesi), "Yardıma mı ihtiyacınız var?" (Kullanıcı, deneyine 
yardımcı olabilecek süreçleri ve ihtiyaçları yazar.), Deney 1# (Nasıl Test 
Edeceksin?, Başarı Kriterin Ne?). 

 
2. "Start-up'ım Var" Kategorisi 
• Aşama Metodoloji Formu - 1: Founder Readiness (Kurucu Hazırlık) Testi.  
o İçerik (Çoktan Seçmeli/Metin): Ego ve Müşteri Empatisi (Müşteri mülakatı 
tepkisi, olumsuz eleştiri tepkisi), Hız ve Mükemmeliyetçilik Dengesi (Kabul 
edilebilir minimum seviye), Delege Etme ve Güven (Görev takip tarzı), Pivot ve 
Değişim Cesareti (Kullanılmayan ana özellik senaryosu), Karar Alma 
Mekanizması (Stratejik karar pusulası). 

• Aşama Metodoloji Formu - 2: Lean Discipline Checklist (Yalın Disiplin Kontrol 
Listesi).   
o İçerik (Evet/Hayır veya Kontrol Listesi): Problem Doğrulama (15 birebir 
mülakat), Çözüm Doğrulama (Görsel/Figma tasarımı), Müşteri Edinme 
Kanalları (İlk 100 kullanıcı planı), En Basit Ürün (MVP sadeliği), Rakipleri 
Tanıma (En büyük 3 rakibin zayıf yönleri), Başarı Kriteri (30 günlük odak 
metrik). 
 
3. "Şirketim Var" Kategorisi  
• Aşama Metodoloji Formu - 1: Süreç Kör Noktası Formu.   
o İçerik(Çoktan Seçmeli/Metin): Departmanların mevcut durumları, 
operasyonel tıkanıklıklar ve kör noktalar hakkında bilgi toplayan dinamik veri 
formu. 

• Aşama Metodoloji Formu - 2: BCG Matrix Modülü.   
o İçerik/Başlık: "Ürüne eklenen yeni bir özellik veya yeni yatırım yapılan bir ürün 
özelliği." Eksenler: X Ekseni = Ürün Kullanım Sıklığı, Y Ekseni = Müşteri 
Memnuniyeti. 


### Arka Plan Mantığı ve Çıktı Yönetimi (Sonuç Ekranı) 
- ML Olgunluk Skoru: [Adım 1]'deki ilk kullanıcı form bilgilerinden beslenen Makine 
öğrenmesi modeli, "Olgunluk Skoru hesaplar" 
- Sertifika Tetikleyicisi: Eğer hesaplanan Olgunluk Skoru Büyük Eşittir %75 ise, 
sistem kullanıcıya otomatik olarak başarı sertifikası üretir ve indirilebilir kılar.  
- AI Yol Haritası Raporu (Kapsamlı AI raporu): Kullanıcının süreç boyunca girdiği 
tüm veriler (Bilgi formu + Metodoloji 1 + Metodoloji 2) birleştirilerek GenAI 
API'sine gönderilir. AI, bu verilere dayanarak kapsamlı, kişiselleştirilmiş bir 
stratejik yol haritası raporu oluşturur.  
 


 
## Projenin Mevcut Durumu ve Teknik Notları !!  
- Proje aktif olarak geliştirilmektedir. Arka planda FastAPI backend ve frontend 
entegrasyonu mevcuttur. 
- [Adım 1]'deki Kullanıcı Bilgi Formu doldurulduktan sonra çalışan ve GenAI 
API'sine bağlanarak dinamik "Navigasyon Raporu" üreten fonksiyon/endpoint şu 
an HALİHAZIRDA ÇALIŞMAKTADIR.  
- Arka planda verileri işleyen ve Olgunluk Skoru üreten ML model yapısı 
kurulmuştur. 
- Senden ricam, halihazırda çalışan bu Navigasyon Raporu ve ML model 
entegrasyonlarına DOKUNMADAN, Yukarıda açıklamalara göre sistemimi 
düzenlemendir.