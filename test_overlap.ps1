# Check matching between new words and existing databases
$flashRaw = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\flashcards_raw.txt", [System.Text.Encoding]::UTF8)
$flashDict = [System.Collections.Generic.Dictionary[string, PSObject]]::new([System.StringComparer]::OrdinalIgnoreCase)

$lines = $flashRaw -split "`r?`n"
foreach ($l in $lines) {
    $p = $l.Trim() -split "`t"
    if ($p.Length -ge 4 -and $p[0] -match '^\d+$') {
        $w = $p[1].Trim().ToLower()
        if (-not $flashDict.ContainsKey($w)) {
            $flashDict[$w] = [PSCustomObject]@{
                uzb = $p[2].Trim()
                example = $p[3].Trim()
            }
        }
    }
}

Write-Output "Flashcards dict entries: $($flashDict.Count)"

$userWordsRaw = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\raw_user_words.txt", [System.Text.Encoding]::UTF8)
$userLines = $userWordsRaw -split "`r?`n"
$userDict = [System.Collections.Generic.Dictionary[string, string]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($l in $userLines) {
    if ($l -match '^\d+\.\s+([A-Za-z\s\-\'']+?)\s*[-–—]\s*(.+)$') {
        $w = $Matches[1].Trim().ToLower()
        $uz = $Matches[2].Trim()
        if (-not $userDict.ContainsKey($w)) {
            $userDict[$w] = $uz
        }
    }
}
Write-Output "User essential dict entries: $($userDict.Count)"

