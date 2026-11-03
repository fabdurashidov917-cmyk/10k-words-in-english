$raw = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\flashcards_raw.txt", [System.Text.Encoding]::UTF8)
$lines = $raw -split "`r?`n"
Write-Output "Total raw lines: $($lines.Length)"
$cardLines = $lines | Where-Object { $_ -match '^\d+\t' -or $_ -match '^\d+\s+' }
Write-Output "Matching card lines: $($cardLines.Length)"
$cardLines | Select-Object -First 5 | ForEach-Object { Write-Output "SAMPLE: $_" }
$cardLines | Select-Object -Last 5 | ForEach-Object { Write-Output "SAMPLE LAST: $_" }
