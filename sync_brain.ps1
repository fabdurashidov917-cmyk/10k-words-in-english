$src = "C:\Users\user\.gemini\word-game"
$dst = "C:\Users\user\.gemini\antigravity\brain\265084ad-49a2-474f-9cb7-e67280f41819\word-game"

if (-not (Test-Path $dst)) {
    New-Item -ItemType Directory -Path $dst -Force | Out-Null
}

Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
Write-Output "Successfully synced all word-game files to brain artifacts directory!"

$items = Get-ChildItem -Path $dst -Recurse | Where-Object { -not $_.PSIsContainer }
Write-Output "Total synced files in brain: $($items.Count)"
foreach ($item in $items) {
    Write-Output "  $($item.FullName.Replace($dst, '')) ($($item.Length) bytes)"
}
