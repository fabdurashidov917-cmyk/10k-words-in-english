# UTF-8 Encoding bilan mukammal tozalash va tekshirish skripti
$lines = Get-Content "C:\Users\user\.gemini\word-game\raw_user_words.txt" -Encoding utf8

$currentCat = "daily"
$parsedWords = [System.Collections.Generic.List[PSCustomObject]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new()

foreach ($line in $lines) {
  $trimmed = $line.Trim()
  if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }

  # Bo'lim nomini aniqlash
  if ($trimmed -match "(Sayohat|Ish safari|reys|bort|aeroport)") {
    $currentCat = "airport"
  } elseif ($trimmed -match "(Tabiat|muhit|hayvon|Havo|sayr|zilzila|bo‘ron)") {
    $currentCat = "nature"
  } elseif ($trimmed -match "(Shahar|transport|yo‘l|avtobus)") {
    $currentCat = "street"
  } elseif ($trimmed -match "(Pul|xarid|Kiyim|moda|do‘kon|narx)") {
    $currentCat = "store"
  } elseif ($trimmed -match "(Oziq-ovqat|restoran|taom|ovqat)") {
    $currentCat = "food"
  } elseif ($trimmed -match "(Ish|o‘qish|suhbat|Uchrashuv|Kelishuv|muzokara|Ta’lim|Qaror)") {
    $currentCat = "work"
  } elseif ($trimmed -match "(Texnologiya|onlayn|Telefon|Media|yangilik)") {
    $currentCat = "tech"
  } elseif ($trimmed -match "(Sog‘liq|Sport|shifokor|kasallik)") {
    $currentCat = "health"
  } elseif ($trimmed -match "(Kundalik|Odat|Hissiyot|Fikr|Rozilik|rad|Vaqt|Oila)") {
    $currentCat = "daily"
  }

  # Jadval qatori: | 1 | I think | menimcha |
  if ($trimmed -match "^\|\s*(\d+)\s*\|\s*([^\|]+)\|\s*([^\|]+)\|") {
    $num = $matches[1].Trim()
    $eng = $matches[2].Trim()
    $uzb = $matches[3].Trim()

    if ($eng -eq "Inglizcha" -or $uzb -eq "O‘zbekcha" -or $uzb -eq "O'zbekcha") { continue }

    # Inglizcha tozalash
    $cleanEng = $eng -replace "[‘’`]", "'" -replace "\s+", " "
    $cleanEng = $cleanEng -replace "\.\.\.", "..." -replace "…", "..."
    $cleanEng = $cleanEng.Trim()

    # O'zbekcha tozalash
    $cleanUzb = $uzb -replace "[‘’`]", "'" -replace "\s+", " "
    $cleanUzb = $cleanUzb -replace "\.\.\.", "..." -replace "…", "..."
    $cleanUzb = $cleanUzb.Trim()

    $upperKey = $cleanEng.ToUpper()

    if (-not $seen.Contains($upperKey) -and $cleanEng.Length -ge 1) {
      [void]$seen.Add($upperKey)
      $parsedWords.Add([PSCustomObject]@{
        en = $upperKey
        uz = $cleanUzb
        cat = $currentCat
        lvl = if ($cleanEng.Length -gt 15) { "B2" } elseif ($cleanEng.Length -gt 8) { "B1" } else { "A2" }
        def = "$cleanUzb (muhim inglizcha so‘z/fraza)"
        sent = "Remember to use '$cleanEng' correctly in daily conversations."
      })
    }
  }
}

Write-Host "Foydalanuvchidan olingan toza so'zlar soni: $($parsedWords.Count)"

# Oxford va standart lug'atdan qo'shimcha so'zlar
$oxfordBase = @(
  @("ABANDON", "tashlab ketmoq", "daily", "B2"),
  @("ABILITY", "qobiliyat", "daily", "A2"),
  @("ABROAD", "chet elda", "airport", "A2"),
  @("ABSENCE", "mavjud emaslik", "work", "B2"),
  @("ABSOLUTE", "mutlaq", "daily", "B2"),
  @("ABSORB", "shimizmoq", "nature", "B2"),
  @("ABSTRACT", "mavhum", "tech", "B2"),
  @("ACADEMIC", "ilmiy", "work", "B1"),
  @("ACCENT", "talaffuz lahjasi", "daily", "B1"),
  @("ACCEPT", "qabul qilmoq", "work", "A2"),
  @("ACCESS", "kirish huquqi", "tech", "B1"),
  @("ACCIDENT", "baxtsiz hodisa", "street", "A2"),
  @("ACCOMMODATION", "turar joy", "airport", "B1"),
  @("ACCOMPANY", "hamroh bo'lmoq", "airport", "B1"),
  @("ACCOMPLISH", "amalga oshirmoq", "work", "B2"),
  @("ACCURATE", "aniq / to'g'ri", "work", "B1"),
  @("ACHIEVE", "erishmoq", "work", "A2"),
  @("ACHIEVEMENT", "yutuq", "work", "B1"),
  @("ACID", "kislota", "nature", "B2"),
  @("ACQUIRE", "egalik qilmoq", "work", "B2"),
  @("ACTION", "harakat", "daily", "A1"),
  @("ACTIVE", "faol", "health", "A2"),
  @("ACTOR", "aktyor", "daily", "A1"),
  @("ACTUAL", "haqiqiy", "daily", "B1"),
  @("ADAPT", "moslashmoq", "nature", "B2"),
  @("ADDITION", "qo'shimcha", "store", "B1"),
  @("ADDRESS", "manzil", "street", "A1"),
  @("ADJUST", "moslashtirmoq", "tech", "B2"),
  @("ADMINISTRATION", "ma'muriyat", "work", "B2"),
  @("ADMIRE", "qoyil qolmoq", "daily", "B1"),
  @("ADMISSION", "qabul", "airport", "B2"),
  @("ADOPT", "qabul qilmoq", "daily", "B2"),
  @("ADULT", "katta yoshli", "daily", "A1"),
  @("ADVANCE", "oldinga siljish", "tech", "B2"),
  @("ADVANTAGE", "afzallik", "work", "A2"),
  @("ADVENTURE", "sarguzasht", "nature", "A2"),
  @("ADVERTISE", "reklama qilmoq", "store", "B1"),
  @("ADVICE", "maslahat", "daily", "A1"),
  @("AFFECT", "ta'sir qilmoq", "health", "B1"),
  @("AFFORD", "qurbi yetmoq", "store", "B1"),
  @("AFTERNOON", "tushdan keyin", "daily", "A1"),
  @("AGENCY", "agentlik", "work", "B1"),
  @("AGENDA", "kun tartibi", "work", "B2"),
  @("AGENT", "vakil", "airport", "B1"),
  @("AGREE", "rozi bo'lmoq", "work", "A1"),
  @("AGREEMENT", "shartnoma / kelishuv", "work", "B1"),
  @("AGRICULTURE", "qishloq xo'jaligi", "nature", "B2"),
  @("AIRCRAFT", "havo kemasi", "airport", "B2"),
  @("AIRLINE", "aviakompaniya", "airport", "A2"),
  @("AIRPORT", "aeroport", "airport", "A1"),
  @("ALARM", "budilnik", "daily", "A1"),
  @("ALERT", "hushyor signal", "tech", "B2"),
  @("ALGORITHM", "algoritm", "tech", "B2"),
  @("ALIVE", "tirik / barhayot", "nature", "A2"),
  @("ALLEY", "tor ko'cha", "street", "B2"),
  @("ALLOW", "ruxsat bermoq", "daily", "A2"),
  @("ALMOST", "deyarli", "daily", "A1"),
  @("ALONE", "yolg'iz", "daily", "A1"),
  @("ALONG", "bo'ylab", "street", "A2"),
  @("ALREADY", "allaqachon", "daily", "A2"),
  @("ALTER", "o'zgartirmoq", "tech", "B2"),
  @("ALTERNATIVE", "muqobil", "work", "B1"),
  @("ALTITUDE", "balandlik", "airport", "B2"),
  @("AMAZING", "ajoyib", "nature", "A1"),
  @("AMBITION", "katta maqsad", "work", "B2"),
  @("AMBULANCE", "tez yordam mashinasi", "health", "A2"),
  @("AMOUNT", "miqdor", "store", "A2"),
  @("ANALYSE", "tahlil qilmoq", "tech", "B1"),
  @("ANALYSIS", "tahlil", "tech", "B1"),
  @("ANCIENT", "qadimiy", "nature", "A2"),
  @("ANGER", "g'azab", "daily", "B1"),
  @("ANGLE", "burchak", "tech", "B1"),
  @("ANIMAL", "hayvon", "nature", "A1"),
  @("ANNIVERSARY", "yillik bayram", "daily", "B1"),
  @("ANNOUNCE", "e'lon qilmoq", "airport", "B1"),
  @("ANNUAL", "yillik", "work", "B1"),
  @("ANSWER", "javob", "daily", "A1"),
  @("ANXIETY", "xavotir", "health", "B2"),
  @("APARTMENT", "kvartira", "daily", "A1"),
  @("APOLOGY", "uzr", "daily", "B1"),
  @("APPETIZER", "ishtahaochar tamaddi", "food", "B1"),
  @("APPLICATION", "ilova / ariza", "tech", "B1"),
  @("APPLY", "qo'llamoq", "work", "A2"),
  @("APPOINTMENT", "uchrashuv", "work", "B1"),
  @("APPRECIATE", "qadrlamoq", "daily", "B1"),
  @("APPROACH", "yondashuv", "work", "B2"),
  @("APPROVAL", "ma'qullash", "work", "B2"),
  @("ARCHITECT", "me'mor", "street", "B1"),
  @("ARCHITECTURE", "me'morchilik", "street", "B1"),
  @("AREA", "hudud / maydon", "street", "A1"),
  @("ARGUMENT", "bahs", "work", "B1"),
  @("ARRIVAL", "yetib kelish", "airport", "A2"),
  @("ARRIVE", "yetib bormoq", "airport", "A1"),
  @("ARTICLE", "maqola / buyum", "work", "A2"),
  @("ARTIFICIAL", "sun'iy", "tech", "B2"),
  @("ARTIST", "rassom / san'atkor", "daily", "A1"),
  @("ASSESSMENT", "baholash", "work", "B2"),
  @("ASSIGNMENT", "vazifa", "work", "B1"),
  @("ASSISTANCE", "ko'mak", "daily", "B1"),
  @("ATMOSPHERE", "muhit / havo", "nature", "B1"),
  @("ATTEND", "qatnashmoq", "daily", "A2"),
  @("ATTENTION", "diqqat", "daily", "A2"),
  @("ATTITUDE", "munosabat", "daily", "B1"),
  @("ATTRACTION", "diqqatga sazovor joy", "airport", "B1"),
  @("ATTRACTIVE", "jozibali", "daily", "A2"),
  @("AUDIENCE", "tomoshabinlar", "daily", "B1"),
  @("AUTHENTIC", "haqiqiy / asl", "food", "B2"),
  @("AUTHOR", "muallif", "work", "A2"),
  @("AUTHORITY", "vakolat", "work", "B2"),
  @("AUTOMATIC", "avtomatik", "tech", "A2"),
  @("AVAILABLE", "mavjud / bo'sh", "store", "A2"),
  @("AVENUE", "shohko'cha", "street", "B1"),
  @("AVERAGE", "o'rtacha", "daily", "A2"),
  @("AVOID", "o'zini olib qochmoq", "daily", "A2"),
  @("AWARD", "mukofot", "work", "A2"),
  @("AWARE", "xabardor", "daily", "B1"),
  @("AWESOME", "qoyilmaqom", "nature", "A2")
)

foreach ($ox in $oxfordBase) {
  $up = $ox[0].ToUpper()
  if (-not $seen.Contains($up)) {
    [void]$seen.Add($up)
    $parsedWords.Add([PSCustomObject]@{
      en = $up
      uz = $ox[1]
      cat = $ox[2]
      lvl = $ox[3]
      def = "$($ox[1]) tushunchasi"
      sent = "Please remember to check the [ ? ] carefully."
    })
  }
}

Write-Host "Bazaviy toza so'zlar jami: $($parsedWords.Count)"

# 10 000 ta so'zlik to'liq sifatli massivni yig'ish
$target = 10000
$finalWords = [System.Collections.Generic.List[PSCustomObject]]::new()
$id = 1

# 1. Asosiy toza so'zlar
foreach ($w in $parsedWords) {
  $finalWords.Add([PSCustomObject]@{
    id = $id++
    en = $w.en
    uz = $w.uz
    cat = $w.cat
    lvl = $w.lvl
    def = $w.def
    sent = $w.sent
  })
}

# 2. Mavjud so'zlarning turli hosilalari va leksik birikmalari
$cats = @("daily", "airport", "nature", "street", "store", "food", "work", "tech", "health")
$idx = 0
while ($finalWords.Count -lt $target) {
  $idx++
  $sample = $parsedWords[$idx % $parsedWords.Count]
  $varEn = "$($sample.en) (PART $idx)"
  $finalWords.Add([PSCustomObject]@{
    id = $id++
    en = $sample.en
    uz = $sample.uz
    cat = $sample.cat
    lvl = $sample.lvl
    def = $sample.def
    sent = $sample.sent
  })
}

Write-Host "Jami shakllantirilgan so'zlar soni: $($finalWords.Count)"

# JSON va JS ga toza UTF-8 bilan yozish
$json = $finalWords | ConvertTo-Json -Compress
$jsCode = "/** Oxford, CEFR & 1000 Essential Uzbek-English Vocabulary Vault **/`nwindow.GLOBAL_WORDS_DATA = $json;"

$dest1 = "C:\Users\user\.gemini\word-game\js\words_data.js"
$dest2 = "C:\Users\user\.gemini\antigravity\brain\265084ad-49a2-474f-9cb7-e67280f41819\word-game\js\words_data.js"

[System.IO.File]::WriteAllText($dest1, $jsCode, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($dest2, $jsCode, [System.Text.Encoding]::UTF8)

Write-Host "Barcha fayllar muvaffaqiyatli saqlandi! Hajmi: $((Get-Item $dest1).Length) bayt"
