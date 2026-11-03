$css1 = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\style.css", [System.Text.Encoding]::UTF8)
$css2 = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\keyboard_styles.css", [System.Text.Encoding]::UTF8)
$combined = $css1 + "`r`n`r`n" + $css2
[System.IO.File]::WriteAllText("C:\Users\user\.gemini\word-game\style.css", $combined, [System.Text.Encoding]::UTF8)
Write-Output "Successfully appended keyboard styles to style.css. New length: $($combined.Length)"
