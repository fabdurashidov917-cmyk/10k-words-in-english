$files = Get-ChildItem "C:\Users\user\.gemini\word-game\js" -Recurse -Filter "*.js"
Write-Output "Found $($files.Count) JS files."

foreach ($f in $files) {
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    
    # Check basic bracket balance
    $openBraces = ($text.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $closeBraces = ($text.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    $openParen = ($text.ToCharArray() | Where-Object { $_ -eq '(' }).Count
    $closeParen = ($text.ToCharArray() | Where-Object { $_ -eq ')' }).Count
    $openBracket = ($text.ToCharArray() | Where-Object { $_ -eq '[' }).Count
    $closeBracket = ($text.ToCharArray() | Where-Object { $_ -eq ']' }).Count
    
    $status = if ($openBraces -eq $closeBraces -and $openParen -eq $closeParen -and $openBracket -eq $closeBracket) { "OK" } else { "CHECK" }
    Write-Output "$($f.Name) : $status (Braces: $openBraces/$closeBraces, Parens: $openParen/$closeParen, Brackets: $openBracket/$closeBracket, Size: $($f.Length))"
}
