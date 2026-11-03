$f = Get-Item "C:\Users\user\.gemini\word-game\js\words_data.js"
Write-Output "Size: $($f.Length)"
$firstLines = Get-Content $f.FullName -TotalCount 20
Write-Output "First 20 lines:"
$firstLines | ForEach-Object { Write-Output $_ }
