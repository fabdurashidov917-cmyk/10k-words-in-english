# Parse 1000 flashcards from flashcards_raw.txt into js/flashcards_data.js
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
    
    # Check tab separated
    $parts = $trimmed -split "`t"
    if ($parts.Length -ge 4 -and $parts[0] -match '^\d+$') {
        $num = [int]$parts[0]
        $word = $parts[1].Trim()
        $uzb = $parts[2].Trim()
        $example = $parts[3].Trim()
        
        if (-not $seenIds.Contains($num)) {
            $seenIds.Add($num) | Out-Null
            $cards.Add([PSCustomObject]@{
                id = $num
                word = $word
                translation = $uzb
                example = $example
                pack = $currentPack
            })
        }
    }
}

Write-Output "Parsed count: $($cards.Count)"
if ($cards.Count -gt 0) {
    Write-Output "First: $($cards[0].id) | $($cards[0].word) | $($cards[0].translation) | $($cards[0].example)"
    $lastIdx = $cards.Count - 1
    Write-Output "Last: $($cards[$lastIdx].id) | $($cards[$lastIdx].word) | $($cards[$lastIdx].translation) | $($cards[$lastIdx].example)"
}

$missing = @()
for ($i = 1; $i -le 1000; $i++) {
    if (-not $seenIds.Contains($i)) {
        $missing += $i
    }
}
Write-Output "Missing IDs count: $($missing.Count)"
if ($missing.Count -gt 0) {
    Write-Output "Missing IDs: $($missing -join ', ')"
}
