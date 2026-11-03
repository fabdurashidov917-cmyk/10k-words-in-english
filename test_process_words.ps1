# Ingest and classify new 10,000 words list
$raw = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\new_words_raw.txt", [System.Text.Encoding]::UTF8)

# Strip prompt noise
$raw = $raw -replace "<USER_REQUEST>", "" -replace "</USER_REQUEST>", ""
$lines = $raw -split "`r?`n"

$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$validWords = [System.Collections.Generic.List[string]]::new()

$noiseFilter = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@("bazani", "shu", "so'zlar", "bilan", "kengaytir", "har", "bir", "bo'limga", "qosh", "va", "rndomligini", "taminla", "kamida", "3-4", "ta", "oyindan", "song", "qayta", "takrorlansin", "2", "marta", "undan", "ko'p", "takrorlanganini", "olib", "tashlab", "bittasini", "qoldir", "c", "e", "x", "n", "b", "t", "d", "m", "r", "p", "f", "l", "w", "o", "g", "h", "v", "k", "y", "j", "u", "z", "q", "ii", "iii", "iv", "vi", "vii", "viii", "ix", "etc") | ForEach-Object {
    [void]$noiseFilter.Add($_)
}

foreach ($line in $lines) {
    $w = $line.Trim().ToLower()
    if ($w.Length -eq 0) { continue }
    if ($noiseFilter.Contains($w)) { continue }
    # Only letters, hyphens or spaces (e.g. no pure numbers or codes)
    if ($w -notmatch '^[a-z\s\-\'']+$') { continue }
    if ($w.Length -eq 1 -and $w -ne "a" -and $w -ne "i") { continue }
    
    if ($seen.Add($w)) {
        $validWords.Add($w)
    }
}

Write-Output "Extracted clean unique words: $($validWords.Count)"
Write-Output "First 20: $($validWords | Select-Object -First 20 | Out-String)"
Write-Output "Last 20: $($validWords | Select-Object -Last 20 | Out-String)"
