$raw = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\new_words_raw.txt", [System.Text.Encoding]::UTF8)

# Strip <USER_REQUEST> tags and prompt instructions at end
$clean = $raw -replace "<USER_REQUEST>", "" -replace "</USER_REQUEST>", ""
$lines = $clean -split "`r?`n"

$wordLines = [System.Collections.Generic.List[string]]::new()
foreach ($l in $lines) {
    $w = $l.Trim().ToLower()
    if ($w.Length -gt 0 -and -not $w.Contains("bazani") -and -not $w.Contains("takrorlanganini") -and -not $w.Contains("bo'limga")) {
        $wordLines.Add($w)
    }
}

Write-Output "Total word lines extracted: $($wordLines.Count)"

# Deduplicate
$uniqueWords = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$duplicatesCount = 0

foreach ($w in $wordLines) {
    if (-not $uniqueWords.Add($w)) {
        $duplicatesCount++
    }
}

Write-Output "Unique words: $($uniqueWords.Count)"
Write-Output "Duplicates removed: $duplicatesCount"

