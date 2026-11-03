$files = Get-ChildItem "C:\Users\user\.gemini\word-game\js" -Recurse -Filter "*.js"

function Get-Calls($objName) {
    $set = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($f in $files) {
        $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
        $pattern = "$objName\.([a-zA-Z0-9_]+)\("
        $m = [regex]::Matches($text, $pattern)
        foreach ($match in $m) {
            [void]$set.Add("$($f.Name): $($match.Groups[1].Value)")
        }
    }
    return $set
}

Write-Output "--- WORDBANK CALLS ---"
Get-Calls "wordBank" | ForEach-Object { Write-Output "  $_" }

Write-Output "`n--- SOUNDENGINE CALLS ---"
Get-Calls "soundEngine" | ForEach-Object { Write-Output "  $_" }

Write-Output "`n--- EMOTION / EFFECTS CALLS ---"
Get-Calls "emotionEngine" | ForEach-Object { Write-Output "  $_" }
Get-Calls "effectsEngine" | ForEach-Object { Write-Output "  $_" }

Write-Output "`n--- APP CALLS ---"
Get-Calls "app" | ForEach-Object { Write-Output "  $_" }

Write-Output "`n--- FLASHCARDS CALLS ---"
Get-Calls "flashcards" | ForEach-Object { Write-Output "  $_" }

