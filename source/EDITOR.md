# Görsel düzenleyici

Adres: `/editor/` (GitHub Pages üzerinde `/a0001/editor/`).

Düzenleyici herkese açıktır çünkü site statik GitHub Pages üzerindedir ve burada parola toplanmaz. Yaptığı değişiklik yalnız o tarayıcının `localStorage` taslağına ve aynı sekmedeki önizleme çerçevesine yazılır. Ziyaretçiler birbirinin sitesini veya depoyu değiştiremez.

## Yayınlama

**Yayınla düğmesi kapalıdır.** `localStorage` canlı siteyi güncellemez.

Canlı görünüm yalnızca repodaki `source/data/editor-settings.json` dosyasından, `GITHUB_PAGES=1` ile yapılan statik derlemede okunur. Yayın adımları:

1. Düzenleyicide Dışa aktar.
2. Dosyayı `source/data/editor-settings.json` olarak koyun. Şema `1` olmalıdır. `data:` görselleri reddedilir.
3. `main` dalına gönderin.
4. Mevcut GitHub Actions işi `source` içinde derler ve `source/out` çıktısını Pages’e yükler.

Repoya yazmak için GitHub hesabının yazma yetkisi gerekir. Bu sayfa token veya parola istemez. Ayrı bir barındırma hizmetine geçilmedi.

## Desteklenen kontroller

- Ana sayfa bölüm sırası ve görünürlük: açılış, New Drop, işler, dövme, dükkan, kapanış.
- İş ve ürün sırası.
- New Drop ürün seçimi, yazı, punto, kalınlık, küçük görsel boyutu.
- New Drop için mevcut ürün görsellerinden biri, ya da en çok 300 KB yerel görsel. Yerel görsel yalnız önizlemededir.
- Ad, slogan, duyuru, kapanış metni.
- Mürekkep ve kâğıt rengi, logo yüksekliği, iş görseli genişliği, sütun aralığı, sayfa boşluğu, başlık ve duyuru kalınlığı.
- Belirme, gezinen fırça, küçük tıklama izi ve süre.
- Masaüstü, tablet ve telefon önizlemesi.
- Geri al, yinele (son 50 adım), onaylı sıfırlama, şema 1 dışa/içe aktarma.

## Sınırlar

- İşler sayfası dövmesiz ve dikey, dövme sayfası dikey kalır. Bu düzenler ana sayfa şeridinden ayrıdır.
- Yazı tipleri derlemede yüklü Inter, Syne ve IBM Plex Mono ile sınırlıdır; yeni font dosyası eklenmez.
- Görsel yükleme depoya dosya yazmaz.
- Eski `/admin` API rotaları statik derlemede yoktur ve yayınlama yolu değildir.
- Fırça imleci dokunmatikte ve `prefers-reduced-motion` açıkken çalışmaz. Tıklama izi de aynı koşulda kapalıdır.
- Varsayılan `editor-settings.json` mevcut yayın görünümünü hedefler: yatay ana sayfa, damga logo, küçük New Drop, imza yok.
