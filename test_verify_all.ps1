# Verify words.js and words_data.js
$dataPath = "C:\Users\user\.gemini\word-game\js\words_data.js"
$wordsPath = "C:\Users\user\.gemini\word-game\js\words.js"

$dataInfo = Get-Item $dataPath
$wordsInfo = Get-Item $wordsPath

Write-Output "words_data.js size: $($dataInfo.Length) bytes"
Write-Output "words.js size: $($wordsInfo.Length) bytes"

# Check first and last few lines of words_data.js
$first5 = Get-Content $dataPath -TotalCount 5
Write-Output "First 5 lines of words_data.js:"
$first5 | ForEach-Object { Write-Output "  $_" }

$last5 = Get-Content $dataPath -Tail 5
Write-Output "Last 5 lines of words_data.js:"
$last5 | ForEach-Object { Write-Output "  $_" }

