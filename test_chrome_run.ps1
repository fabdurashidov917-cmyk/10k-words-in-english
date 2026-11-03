$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$indexPath = 'file:///C:/Users/user/.gemini/word-game/index.html'

# Run headless chrome to dump DOM or check console errors
$logFile = 'C:\Users\user\.gemini\word-game\chrome_debug.log'
if (Test-Path $logFile) { Remove-Item $logFile -Force }

Write-Host "Launching Chrome headless..."
$p = Start-Process -FilePath $chrome -ArgumentList @(
    '--headless=new',
    '--disable-gpu',
    '--enable-logging',
    '--v=1',
    "--log-file=$logFile",
    '--dump-dom',
    $indexPath
) -NoNewWindow -PassThru -RedirectStandardOutput 'C:\Users\user\.gemini\word-game\dom_dump.txt'

$p.WaitForExit(8000)
Write-Host "Process exit code: $($p.ExitCode)"

if (Test-Path 'C:\Users\user\.gemini\word-game\dom_dump.txt') {
    $len = (Get-Item 'C:\Users\user\.gemini\word-game\dom_dump.txt').Length
    Write-Host "DOM dump generated, length: $len bytes"
}

if (Test-Path $logFile) {
    Write-Host "--- CHROME LOG ---"
    Get-Content $logFile -Tail 30
}
