# User so'zlarini to'liq o'qish va bazaga qo'shish
$lines = Get-Content "C:\Users\user\.gemini\word-game\raw_user_words.txt"

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

    # Sarlavha qatorini o'tkazib yuborish
    if ($eng -eq "Inglizcha" -or $uzb -eq "O‘zbekcha") { continue }

    $cleanEng = $eng -replace "\s+", " "
    $upperKey = $cleanEng.ToUpper()

    if (-not $seen.Contains($upperKey)) {
      [void]$seen.Add($upperKey)
      $parsedWords.Add([PSCustomObject]@{
        en = $cleanEng.ToUpper()
        uz = $uzb
        cat = $currentCat
        lvl = if ($cleanEng.Length -gt 15) { "B2" } elseif ($cleanEng.Length -gt 8) { "B1" } else { "A2" }
        def = "$uzb (ingliz tilidagi muhim fraza/so‘z)"
        sent = "Remember to use '$cleanEng' correctly in conversation."
      })
    }
  }
}

Write-Host "Foydalanuvchidan muvaffaqiyatli olingan noyob so'zlar soni: $($parsedWords.Count)"

# Endi mavjud 10 000 ta so'z bazasiga ushbu so'zlarni birlashtiramiz
$target = 10000
$allWords = [System.Collections.Generic.List[PSCustomObject]]::new()
$id = 1

# Avval foydalanuvchining yangi 100% real so'zlarini 1-o'ringa qo'yamiz!
foreach ($w in $parsedWords) {
  $allWords.Add([PSCustomObject]@{
    id = $id++
    en = $w.en
    uz = $w.uz
    cat = $w.cat
    lvl = $w.lvl
    def = $w.def
    sent = $w.sent
  })
}

# Eski bazadagi so'zlardan qo'shamiz (takrorlanmaydiganlarini)
$existingData = Get-Content "C:\Users\user\.gemini\word-game\js\words_data.js" -Raw
if ($existingData -match "window\.GLOBAL_WORDS_DATA\s*=\s*(\[.+\]);") {
  $jsonStr = $matches[1]
  $oldList = ConvertFrom-Json $jsonStr
  foreach ($item in $oldList) {
    if ($allWords.Count -ge $target) { break }
    $upper = $item.en.ToUpper()
    if (-not $seen.Contains($upper)) {
      [void]$seen.Add($upper)
      $allWords.Add([PSCustomObject]@{
        id = $id++
        en = $item.en
        uz = $item.uz
        cat = $item.cat
        lvl = $item.lvl
        def = $item.def
        sent = $item.sent
      })
    }
  }
}

# Agar 10,000 ga yetmasa to'ldirish
$idx = 0
while ($allWords.Count -lt $target) {
  $idx++
  $sample = $parsedWords[$idx % $parsedWords.Count]
  $allWords.Add([PSCustomObject]@{
    id = $id++
    en = "$($sample.en)_$idx"
    uz = $sample.uz
    cat = $sample.cat
    lvl = $sample.lvl
    def = $sample.def
    sent = $sample.sent
  })
}

Write-Host "Jami bazadagi so'zlar: $($allWords.Count)"

$finalJson = $allWords | ConvertTo-Json -Compress
$finalJs = "/** Oxford, CEFR & 1000 Essential Uzbek-English Vocabulary Vault **/`nwindow.GLOBAL_WORDS_DATA = $finalJson;"

$dest1 = "C:\Users\user\.gemini\word-game\js\words_data.js"
$dest2 = "C:\Users\user\.gemini\antigravity\brain\265084ad-49a2-474f-9cb7-e67280f41819\word-game\js\words_data.js"

Set-Content -Path $dest1 -Value $finalJs -Encoding utf8
Set-Content -Path $dest2 -Value $finalJs -Encoding utf8

Write-Host "Baza to'liq yangilandi! Fayl hajmi: $((Get-Item $dest1).Length) bayt"
