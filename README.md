# ⚡ SHADOW LEXICON // 10,000 Words English-Uzbek Game Arena

> **Zerikarli yodlashni unuting!** Xotirani majburan ishlatadigan, vizual assotsiatsiyalar, kontekstual shifrlar va tezkor reaksiyaga asoslangan 4 xil noodatiy veb-o‘yin.

![GitHub Pages Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages-blueviolet?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Vanilla%20HTML5%20%7C%20CSS3%20%7C%20JS%20%7C%20Web%20Audio-magenta?style=for-the-badge)
![Words Bank](https://img.shields.io/badge/Vocabulary-10%2C000%2B%20Words-success?style=for-the-badge)

---

## 🌌 Loyiha Dizayni va Atmosferasi

Loyiha binafsharang tumanli (Purple Fog / Cyber-Synth Aesthetic), **glassmorphism** panellar va sirli siluet vizuali asosida yaratilgan.
* **Asosiy qahramon:** Qora fonda sochlariga kuchli nur tushib turgan sirli qiz silueti.
* **Dinamik fon:** HTML5 Canvas orqali doimiy harakatlanuvchi binafsha zarrachalar va tuman simulyatsiyasi.
* **Ovoz tizimi:** Tashqi audio fayllarsiz, toza **Web Audio API** sintizatori va **Web Speech API** (haqiqiy inglizcha native talaffuz).

---

## 🎮 4 Ta Noodatiy Veb-Mexanika

| # | O'yin Nomi | Mexanika | Xotira Turi | Texnologiya |
|---|---|---|---|---|
| **1** | **«Piksel Detektiv»** | Ekranda rasm juda xira/blur holatda chiqadi. Har 2 soniyada aniqlashib boradi. Qanchalik tez topsangiz, shuncha ko'p ball. | **Vizual Assotsiatsiya** | CSS blur filtri + Score multiplier |
| **2** | **«Matn Shifri»** | Gap ichida so'z o'rnida `[ ? ]` turadi. Kontekst va ta'rifdan foydalanib, aralash harf kataklaridan so'zni tering. | **Kontekstual Xotira** (3x samarali) | Scrambled Tiles + Slot Engine |
| **3** | **«Juftlik Blitz»** | Ekranda 10-12 ta neon karta suzadi (English + Uzbek). Mos juftliklar bosilganda ovoz effekti bilan yo'qoladi. 45 soniyalik taymer! | **Tezkor Refleks & Reaksiya** | Match & Vanish CSS Animatsiyasi |
| **4** | **«Spelling Bomb»** | So'z ta'rifi chiqadi va 12 soniyalik bomba taymeri ishga tushadi. Har bir xato harf -2s yeydi. Bomba portlashidan oldin to'g'ri yozing! | **Imlo va Harfiy Barmoq Xotirasi** | JavaScript `keydown` hodisasi |

---

## 📚 Hayotiy Bo'limlar (Kategoriyalar)

1. ✈️ **Aeroport & Sayohat** (*Boarding, Luggage, Runway, Passport, Customs, Departure...*)
2. 🌿 **Tabiat & Atrof-muhit** (*Waterfall, Meadow, Lightning, Glacier, Forest...*)
3. 🏙️ **Ko'chada & Shahar** (*Crosswalk, Skyscraper, Pavement, Traffic, Lantern...*)
4. 🛒 **Do'konda & Savdo** (*Receipt, Discount, Cashier, Trolley, Bargain...*)
5. ☕ **Kundalik so'zlar** (*Breakfast, Routine, Habit, Alarm, Mirror, Kitchen...*)
6. 🍽️ **Restoran & Taomlar** (*Appetizer, Dessert, Beverage, Recipe...*)
7. 💼 **Ish & Biznes** (*Deadline, Contract, Colleague, Presentation...*)
8. 💻 **Texnologiya & IT** (*Algorithm, Database, Encryption, Network...*)
9. ❤️ **Salomatlik & Sport** (*Wellness, Nutrition, Strength, Recovery...*)

---

## 🚀 GitHub Pages-ga Yuklash (Deploy)

Loyiha hech qanday framework (React, Vue, Node backend) talab qilmaydi. To'liq mustaqil (Zero-dependency Vanilla JS):

1. Loyihani GitHub-da yangi repository sifatida oching:
```bash
cd word-game
git init
git add .
git commit -m "Initial commit: Shadow Lexicon 10k word game"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git
git push -u origin main
```
2. GitHub-da repongizga kiring:
   - **Settings** -> **Pages** bo'limiga o'ting.
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `root` ni tanlang va **Save** tugmasini bosing.
3. 1 daqiqa ichida saytingiz jonli efirga chiqadi: `https://USERNAME.github.io/REPOSITORY_NAME/`

---

## 🛠️ Mahalliy kompyuterda ishga tushirish

Fayllarni xohlagan veb server bilan ochish mumkin:
```bash
# Python bilan:
python -m http.server 8080

# Yoki NodeJS bilan:
npx serve .

# Yoki to'g'ridan to'g'ri brauzerda index.html ni ikki marta bosing!
```
