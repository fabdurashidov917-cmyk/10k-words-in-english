$logPath = "C:\Users\user\.gemini\antigravity\brain\265084ad-49a2-474f-9cb7-e67280f41819\.system_generated\logs\transcript_full.jsonl"
$outputPath = "C:\Users\user\.gemini\word-game\flashcards_raw.txt"

$stream = [System.IO.File]::OpenRead($logPath)
$reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)

$foundContent = $null
while (-not $reader.EndOfStream) {
    $line = $reader.ReadLine()
    if ($line -like '*"step_index":208*') {
        $json = $line | ConvertFrom-Json
        $foundContent = $json.content
        break
    }
}
$reader.Close()
$stream.Close()

if ($foundContent) {
    [System.IO.File]::WriteAllText($outputPath, $foundContent, [System.Text.Encoding]::UTF8)
    Write-Output "Successfully saved flashcards raw text! Length: $($foundContent.Length)"
} else {
    Write-Output "Step 208 not found!"
}
