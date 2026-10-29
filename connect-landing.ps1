$ErrorActionPreference = "Stop"
$root    = $PSScriptRoot
$landing = Join-Path $root "neuro-ai-landing-page-development"
$appUrl  = "http://localhost:3000"
$utf8    = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path $landing)) { throw "Landing folder not found: $landing" }

# ---- 1. Detect the frontend login route ----
$loginRoute = "/login"
$found = $false
foreach ($name in @("login", "signin", "sign-in", "auth/login")) {
  foreach ($base in @("frontend\app", "frontend\src\app", "frontend\pages", "frontend\src\pages")) {
    $p = Join-Path $root "$base\$name"
    if ((Test-Path $p) -or (Test-Path "$p.js") -or (Test-Path "$p.jsx") -or (Test-Path "$p.tsx")) {
      $loginRoute = "/$name"; $found = $true; break
    }
  }
  if ($found) { break }
}
$loginUrl = "$appUrl$loginRoute"
Write-Host "Login URL: $loginUrl"

# ---- 2. Make the landing page run on port 3001 ----
$pkgPath = Join-Path $landing "package.json"
if (-not (Test-Path $pkgPath)) {
  $json = @'
{
  "name": "neuro-landing",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "npx --yes serve -l 3001 ."
  }
}
'@
  [System.IO.File]::WriteAllText($pkgPath, $json, $utf8)
  Write-Host "No package.json found: created static-site config (port 3001)."
}
else {
  $pkg  = Get-Content $pkgPath -Raw | ConvertFrom-Json
  $deps = @()
  if ($pkg.dependencies)    { $deps += $pkg.dependencies.PSObject.Properties.Name }
  if ($pkg.devDependencies) { $deps += $pkg.devDependencies.PSObject.Properties.Name }

  if     ($deps -contains "next") { $dev = "next dev -p 3001" }
  elseif ($deps -contains "vite") { $dev = "vite --port 3001 --strictPort" }
  else   { $dev = $null; Write-Warning "Unknown stack: set the dev script to use port 3001 manually." }

  if ($dev) {
    if (-not $pkg.scripts) { $pkg | Add-Member -NotePropertyName scripts -NotePropertyValue ([pscustomobject]@{}) }
    if ($pkg.scripts.PSObject.Properties.Name -contains "dev") { $pkg.scripts.dev = $dev }
    else { $pkg.scripts | Add-Member -NotePropertyName dev -NotePropertyValue $dev }
    [System.IO.File]::WriteAllText($pkgPath, ($pkg | ConvertTo-Json -Depth 20), $utf8)
    Write-Host "Landing dev script set to: $dev"
  }
}

# ---- 3. Rewrite Sign In / Login links ----
$pattern = @'
(?<pre><(?:a|Link)\b[^>]*?\bhref\s*=\s*)(?<q>["'])[^"']*\k<q>(?<post>[^>]*>\s*(?:<[^>]+>\s*)*(?:Sign\s?In|Log\s?In|Login)\b)
'@.Trim()

$files = Get-ChildItem $landing -Recurse -File -Include *.html,*.js,*.jsx,*.ts,*.tsx,*.vue |
  Where-Object { $_.FullName -notmatch "node_modules|\\\.next\\|\\dist\\|\\build\\" }

$changed = @()
foreach ($f in $files) {
  $text = [System.IO.File]::ReadAllText($f.FullName)
  $new  = [regex]::Replace($text, $pattern, ('${pre}"' + $loginUrl + '"${post}'), "IgnoreCase")
  if ($new -ne $text) {
    [System.IO.File]::WriteAllText($f.FullName, $new, $utf8)
    $changed += $f.FullName
  }
}

if ($changed.Count -gt 0) {
  Write-Host "`nUpdated Sign In links in:" -ForegroundColor Green
  $changed | ForEach-Object { Write-Host "  $_" }
} else {
  Write-Warning "No <a>/<Link> Sign In found. It may be a <button>. Candidates:"
  $files | Select-String -Pattern "sign ?in|log ?in" |
    Select-Object -First 15 | ForEach-Object { "  $($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }
}

Write-Host "`nInstalling landing dependencies..."
npm --prefix $landing i
Write-Host "`nDone. Run: npm run dev"