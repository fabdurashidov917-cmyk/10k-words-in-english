$browserPaths = @(
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$found = $null
foreach ($bp in $browserPaths) {
    if (Test-Path $bp) {
        Write-Host "Found browser: $bp"
        $found = $bp
        break
    }
}
