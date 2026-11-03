# Diagnostic Test Script: Check syntax of all JS files using Windows JScript engine or Node if available
$jsFiles = Get-ChildItem "C:\Users\user\.gemini\word-game\js" -Recurse -Filter "*.js"

Write-Output "=== 1. FILE SIZES AND ENCODINGS ==="
foreach ($f in $jsFiles) {
    Write-Output "File: $($f.FullName.Replace('C:\Users\user\.gemini\word-game\', '')) - Size: $($f.Length) bytes"
}

# Check for undefined method calls or mismatches
Write-Output "`n=== 2. AUDIO ENGINE METHOD CALL AUDIT ==="
$audioCalls = @()
foreach ($f in $jsFiles) {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $matches = [regex]::Matches($content, 'soundEngine\.([a-zA-Z0-9_]+)\(')
    foreach ($m in $matches) {
        $call = "$($f.Name) -> $($m.Groups[1].Value)"
        if ($audioCalls -notcontains $call) { $audioCalls += $call }
    }
}
$audioCalls | ForEach-Object { Write-Output "  $_" }

Write-Output "`n=== 3. EFFECTS ENGINE METHOD CALL AUDIT ==="
$effectCalls = @()
foreach ($f in $jsFiles) {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $matches = [regex]::Matches($content, 'effectsEngine\.([a-zA-Z0-9_]+)\(')
    foreach ($m in $matches) {
        $call = "$($f.Name) -> $($m.Groups[1].Value)"
        if ($effectCalls -notcontains $call) { $effectCalls += $call }
    }
}
$effectCalls | ForEach-Object { Write-Output "  $_" }

