[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]
    [string]$Name,
    [switch]$DryRun,
    [string]$SourceRoot,
    [string]$DestinationRoot,
    [string]$BackupRoot
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $SourceRoot) {
    $SourceRoot = Join-Path $repoRoot 'skills'
}
if (-not $DestinationRoot) {
    $DestinationRoot = Join-Path $HOME '.codex\skills'
}
if (-not $BackupRoot) {
    $BackupRoot = Join-Path $repoRoot '.artifacts\backups'
}

$SourceRoot = [System.IO.Path]::GetFullPath($SourceRoot)
$DestinationRoot = [System.IO.Path]::GetFullPath($DestinationRoot)
$BackupRoot = [System.IO.Path]::GetFullPath($BackupRoot)
$SourcePath = [System.IO.Path]::GetFullPath((Join-Path $SourceRoot $Name))
$DestinationPath = [System.IO.Path]::GetFullPath((Join-Path $DestinationRoot $Name))

function Invoke-PythonFile {
    param([Parameter(Mandatory)][string]$Script, [string[]]$Arguments)

    $launcher = Get-Command 'py' -ErrorAction SilentlyContinue
    if ($launcher) {
        & $launcher.Source -3 $Script @Arguments
    }
    else {
        $python = Get-Command 'python' -ErrorAction Stop
        & $python.Source $Script @Arguments
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Validation failed: $Script (exit $LASTEXITCODE)"
    }
}

if (-not (Test-Path -LiteralPath $SourcePath -PathType Container)) {
    throw "Skill source not found: $SourcePath"
}

$allowedTopLevel = @('SKILL.md', 'agents', 'references', 'scripts', 'assets', 'rules', 'workflows', 'templates', 'docs')
$unexpected = Get-ChildItem -LiteralPath $SourcePath -Force | Where-Object { $_.Name -notin $allowedTopLevel }
if ($unexpected) {
    throw "Installable Skill contains unexpected top-level items: $($unexpected.Name -join ', ')"
}
if (-not (Test-Path -LiteralPath (Join-Path $SourcePath 'SKILL.md') -PathType Leaf)) {
    throw "Installable Skill is missing SKILL.md: $SourcePath"
}

$repoValidator = Join-Path $repoRoot 'tests\validate_repository.py'
if (-not (Test-Path -LiteralPath $repoValidator -PathType Leaf)) {
    throw "Repository validator not found: $repoValidator"
}
Invoke-PythonFile -Script $repoValidator -Arguments @('--skill', $Name)

$sourceFiles = @(Get-ChildItem -LiteralPath $SourcePath -File -Recurse)
$knownDeprecated = @()
if ($Name -eq 'design-image-prompt-engineer') {
    $knownDeprecated = @(
        (Join-Path $DestinationPath 'README.md'),
        (Join-Path $DestinationPath 'CHANGELOG.md'),
        (Join-Path $DestinationPath 'references\prompt-templates.md')
    )
}

if (Test-Path -LiteralPath (Join-Path $DestinationPath 'tests')) {
    throw 'Existing destination contains a tests directory. Tests are repository-only and will not be deleted automatically.'
}

Write-Host "Skill:       $Name"
Write-Host "Source:      $SourcePath"
Write-Host "Destination: $DestinationPath"
Write-Host "Files:       $($sourceFiles.Count)"
Write-Host 'Unknown destination files will be preserved.'

if ($DryRun) {
    Write-Host 'DRY RUN: no backup, deletion, directory creation, or copy was performed.'
    foreach ($path in $knownDeprecated) {
        if (Test-Path -LiteralPath $path) {
            Write-Host "Would remove known deprecated item: $path"
        }
    }
    Write-Host "Would back up the complete existing destination under: $BackupRoot\<timestamp>\$Name"
    Write-Host 'Would copy every source file and then verify SHA-256 content equality.'
    exit 0
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$backupContainer = Join-Path $BackupRoot $timestamp
if (Test-Path -LiteralPath $DestinationPath -PathType Container) {
    New-Item -ItemType Directory -Path $backupContainer -Force | Out-Null
    Copy-Item -LiteralPath $DestinationPath -Destination $backupContainer -Recurse
    Write-Host "Backup:      $backupContainer\$Name"
}

New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
foreach ($path in $knownDeprecated) {
    if (Test-Path -LiteralPath $path) {
        Remove-Item -LiteralPath $path -Force
        Write-Host "Removed known deprecated item: $path"
    }
}

foreach ($sourceFile in $sourceFiles) {
    $relative = $sourceFile.FullName.Substring($SourcePath.Length).TrimStart('\', '/')
    $targetFile = Join-Path $DestinationPath $relative
    $targetDirectory = Split-Path -Parent $targetFile
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    Copy-Item -LiteralPath $sourceFile.FullName -Destination $targetFile -Force
}

foreach ($sourceFile in $sourceFiles) {
    $relative = $sourceFile.FullName.Substring($SourcePath.Length).TrimStart('\', '/')
    $targetFile = Join-Path $DestinationPath $relative
    if (-not (Test-Path -LiteralPath $targetFile -PathType Leaf)) {
        throw "Installed file missing: $relative"
    }
    $sourceHash = (Get-FileHash -LiteralPath $sourceFile.FullName -Algorithm SHA256).Hash
    $targetHash = (Get-FileHash -LiteralPath $targetFile -Algorithm SHA256).Hash
    if ($sourceHash -ne $targetHash) {
        throw "Installed file differs from source: $relative"
    }
}

foreach ($path in $knownDeprecated) {
    if (Test-Path -LiteralPath $path) {
        throw "Known deprecated item remains after installation: $path"
    }
}
if (Test-Path -LiteralPath (Join-Path $DestinationPath 'tests')) {
    throw 'Tests directory must not be installed with the Skill.'
}

Write-Host "Installed and verified $($sourceFiles.Count) files for $Name."
