<#
.SYNOPSIS
  Builds the debug APK, leaves a copy at the repo root, and uploads it to Google Drive via rclone.

.DESCRIPTION
  Every run signs in to Google Drive in the browser (pick any account) and the
  login is stored only in a temporary rclone config that is deleted when the
  script ends, even on failure. Nothing about the login is kept between runs.

.EXAMPLE
  .\scripts\build-and-upload.ps1                 # sign in, build, upload
  .\scripts\build-and-upload.ps1 -SkipUpload     # build only (no sign-in)
  .\scripts\build-and-upload.ps1 -SkipBuild      # sign in and upload the existing APK

.NOTES
  Paths below can be overridden with environment variables of the same name.
#>
param(
  [string]$DriveFolder = "workspace/Soul-Alcohol",
  [switch]$SkipBuild,
  [switch]$SkipUpload
)

$ErrorActionPreference = "Stop"

function Get-Setting([string]$Name, [string]$Default) {
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) { return $Default }
  return $value
}

$repoRoot    = Split-Path -Parent $PSScriptRoot
$javaHome    = Get-Setting "JAVA_HOME"        "D:\app\version_1\jdk-21_windows-x64_bin\jdk-21.0.9"
$androidHome = Get-Setting "ANDROID_HOME"     "D:\app\Android\Sdk"
$gradleHome  = Get-Setting "GRADLE_USER_HOME" "D:\app\gradle-home"
$rclone      = Get-Setting "RCLONE_EXE"       "D:\app\rclone\rclone.exe"
$apkPath     = Join-Path $repoRoot "android\app\build\outputs\apk\debug\app-debug.apk"
$driveFileName = "Soul-Alcohol.apk"
$remote      = "gdrive"
$rcloneConfig = Join-Path ([IO.Path]::GetTempPath()) ("rclone-soulalcohol-" + [guid]::NewGuid().ToString("N") + ".conf")

# Yes/No dialog; defaults to "No" (keep the file). Falls back to a console prompt
# if the dialog cannot be shown (e.g. no desktop session).
function Confirm-DeleteLocalApk([string]$Path) {
  $message = "Upload finished.`n`nDelete the local APK file?`n$Path"
  try {
    Add-Type -AssemblyName System.Windows.Forms
    $answer = [System.Windows.Forms.MessageBox]::Show(
      $message, "Soul Alcohol - delete local APK?",
      [System.Windows.Forms.MessageBoxButtons]::YesNo,
      [System.Windows.Forms.MessageBoxIcon]::Question,
      [System.Windows.Forms.MessageBoxDefaultButton]::Button2)
    return ($answer -eq [System.Windows.Forms.DialogResult]::Yes)
  } catch {
    $reply = Read-Host "Delete the local APK file? (y/N)"
    return ($reply -match '^(y|yes)$')
  }
}

function Invoke-Rclone {
  # Always uses the throwaway config so the global rclone config is never touched.
  & $rclone --config $rcloneConfig @args
}

try {
  # Sign in first so a refused login fails fast instead of after a 20-minute build.
  if (-not $SkipUpload) {
    if (-not (Test-Path $rclone)) { throw "rclone not found: $rclone" }
    if ($SkipBuild -and -not (Test-Path $apkPath)) { throw "No APK to upload at $apkPath. Run without -SkipBuild first." }

    Write-Host "==> Sign in to Google Drive (a browser window will open)..." -ForegroundColor Cyan
    # scope drive.file = rclone can only see files it created itself, not the whole Drive.
    # Output is discarded on purpose: `config create` echoes the OAuth tokens it just obtained.
    Invoke-Rclone config create $remote drive scope drive.file | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Google Drive sign-in failed (exit code $LASTEXITCODE)." }
  }

  if (-not $SkipBuild) {
    if (-not (Test-Path $javaHome))    { throw "JAVA_HOME not found: $javaHome" }
    if (-not (Test-Path $androidHome)) { throw "ANDROID_HOME not found: $androidHome" }

    $env:JAVA_HOME        = $javaHome
    $env:ANDROID_HOME     = $androidHome
    $env:ANDROID_SDK_ROOT = $androidHome
    $env:GRADLE_USER_HOME = $gradleHome

    Write-Host "==> Building debug APK (first build can take ~20 minutes)..." -ForegroundColor Cyan
    $buildStartedAt = Get-Date
    Push-Location (Join-Path $repoRoot "android")
    try {
      & .\gradlew.bat assembleDebug
      if ($LASTEXITCODE -ne 0) { throw "Gradle build failed (exit code $LASTEXITCODE)." }
    } finally {
      Pop-Location
    }

    if (-not (Test-Path $apkPath)) { throw "Build succeeded but $apkPath was not produced." }
    if ((Get-Item $apkPath).LastWriteTime -lt $buildStartedAt) {
      throw "$apkPath is older than this build - Gradle did not produce a new APK."
    }
    Write-Host "==> APK ready: $apkPath ($([math]::Round((Get-Item $apkPath).Length / 1MB, 1)) MB)" -ForegroundColor Green
  }

  if ($SkipUpload) {
    Write-Host "==> Upload skipped."
  } else {
    if (-not (Test-Path $apkPath)) { throw "No APK to upload at $apkPath. Run without -SkipBuild first." }

    Write-Host "==> Uploading to ${remote}:$DriveFolder/$driveFileName ..." -ForegroundColor Cyan
    Invoke-Rclone copyto $apkPath "${remote}:$DriveFolder/$driveFileName" --progress
    if ($LASTEXITCODE -ne 0) { throw "rclone upload failed (exit code $LASTEXITCODE)." }

    Write-Host "==> Done. Find it in Google Drive > $DriveFolder > $driveFileName" -ForegroundColor Green

    # Only reached after a successful upload, so a failed upload never loses the local APK.
    if (Confirm-DeleteLocalApk $apkPath) {
      Remove-Item $apkPath -Force
      Write-Host "==> Deleted local file: $apkPath" -ForegroundColor Green
    } else {
      Write-Host "==> Kept local file: $apkPath"
    }
  }
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  $script:failed = $true
} finally {
  if (Test-Path $rcloneConfig) { Remove-Item $rcloneConfig -Force }
}

if ($script:failed) { exit 1 }
