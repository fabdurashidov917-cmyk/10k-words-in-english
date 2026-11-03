# Build js/flashcards_data.js and enrich word bank
$raw = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\flashcards_raw.txt", [System.Text.Encoding]::UTF8)

$lines = $raw -split "`r?`n"
$cards = [System.Collections.Generic.List[PSObject]]::new()
$seenIds = [System.Collections.Generic.HashSet[int]]::new()

$currentPack = "1-100"

foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if ($trimmed -match 'Flashcard\s+(\d+)\s*[–-]\s*(\d+)') {
        $currentPack = "$($Matches[1])-$($Matches[2])"
        continue
    }
    
    $parts = $trimmed -split "`t"
    if ($parts.Length -ge 4 -and $parts[0] -match '^\d+$') {
        $num = [int]$parts[0]
        $word = $parts[1].Trim()
        $uzb = $parts[2].Trim()
        $example = $parts[3].Trim()
        
        $cat = "Kundalik"
        if ($num -le 100) { $cat = "Kundalik" }
        elseif ($num -le 250) { $cat = "Muloqot" }
        elseif ($num -le 400) { $cat = "Shahar va Hayot" }
        elseif ($num -le 550) { $cat = "Hissiyot va Fikr" }
        elseif ($num -le 700) { $cat = "Ish va O'qish" }
        elseif ($num -le 850) { $cat = "Harakat va Qobiliyat" }
        else { $cat = "Mukammal Leksika" }

        if (-not $seenIds.Contains($num)) {
            $seenIds.Add($num) | Out-Null
            $cards.Add([PSCustomObject]@{
                id = $num
                word = $word
                uzb = $uzb
                example = $example
                pack = $currentPack
                category = $cat
            })
        }
    }
}

Write-Output "Parsed $($cards.Count) flashcards successfully."

# Generate js/flashcards_data.js
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("/**")
[void]$sb.AppendLine(" * FLASHCARDS_DATA - 1,000 Essential English-Uzbek Flashcards with Real Examples")
[void]$sb.AppendLine(" * Format: Word + Tarjimasi + Misol Gap + Ovozli Talaffuz")
[void]$sb.AppendLine(" */")
[void]$sb.AppendLine("window.FLASHCARDS_DATA = [")

for ($i = 0; $i -lt $cards.Count; $i++) {
    $c = $cards[$i]
    $jsonObj = [PSCustomObject]@{
        id = $c.id
        word = $c.word
        uzb = $c.uzb
        example = $c.example
        pack = $c.pack
        category = $c.category
    }
    $comma = if ($i -lt $cards.Count - 1) { "," } else { "" }
    $json = $jsonObj | ConvertTo-Json -Compress
    [void]$sb.AppendLine("  $json$comma")
}

[void]$sb.AppendLine("];")
[void]$sb.AppendLine("")
[void]$sb.AppendLine('console.log("Flashcards Data Loaded: " + window.FLASHCARDS_DATA.length + " cards");')

[System.IO.File]::WriteAllText("C:\Users\user\.gemini\word-game\js\flashcards_data.js", $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Wrote C:\Users\user\.gemini\word-game\js\flashcards_data.js successfully."
