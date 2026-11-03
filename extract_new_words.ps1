$logPath = "C:\Users\user\.gemini\antigravity\brain\265084ad-49a2-474f-9cb7-e67280f41819\.system_generated\logs\transcript_full.jsonl"
$outputPath = "C:\Users\user\.gemini\word-game\new_words_raw.txt"

$stream = [System.IO.File]::OpenRead($logPath)
$reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)

$lastUserInput = $null
while (-not $reader.EndOfStream) {
    $line = $reader.ReadLine()
    if ($line -like '*"type":"USER_INPUT"*') {
        $lastUserInput = $line
    }
}
$reader.Close()
$stream.Close()

if ($lastUserInput) {
    $json = $lastUserInput | ConvertFrom-Json
    [System.IO.File]::WriteAllText($outputPath, $json.content, [System.Text.Encoding]::UTF8)
    Write-Output "Extracted latest USER_INPUT content successfully. Length: $($json.content.Length)"
} else {
    Write-Output "No USER_INPUT found!"
}
