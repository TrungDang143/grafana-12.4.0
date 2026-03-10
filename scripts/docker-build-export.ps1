param(
	[string]$ImageName = "grafana-local",
	[string]$Version = "12.4.0",
	[string]$Platform = "linux/amd64",
	[string]$JsYarnBuildFlag = "build",
	[int]$NodeMaxOldSpaceSizeMb = 8192,
	[switch]$PruneBeforeBuild,
	[switch]$Zip,
	[switch]$NoBuild,
	[switch]$Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Checked {
	param(
		[Parameter(Mandatory = $true)][string]$Description,
		[Parameter(Mandatory = $true)][scriptblock]$Command
	)

	& $Command
	if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
		throw "$Description failed with exit code $LASTEXITCODE"
	}
}

function Show-Usage {
	Write-Host "Build and export Grafana Docker image (.tar, optional .zip)."
	Write-Host ""
	Write-Host "Usage:"
	Write-Host "  powershell -ExecutionPolicy Bypass -File .\\scripts\\docker-build-export.ps1 [options]"
	Write-Host ""
	Write-Host "Options:"
	Write-Host "  -ImageName <name>   Docker image name. Default: grafana-local"
	Write-Host "  -Version <tag>      Docker image tag. Default: 12.4.0"
	Write-Host "  -Platform <value>   Build platform. Default: linux/amd64"
	Write-Host "  -JsYarnBuildFlag    Value for JS_YARN_BUILD_FLAG build-arg. Default: build"
	Write-Host "  -NodeMaxOldSpaceSizeMb  NODE_OPTIONS max-old-space-size in MB. Default: 8192"
	Write-Host "  -PruneBeforeBuild   Run docker builder prune -af before build"
	Write-Host "  -Zip                Also create a .zip from exported .tar"
	Write-Host "  -NoBuild            Skip build and only export existing local image"
	Write-Host "  -Help               Show this help"
	Write-Host ""
	Write-Host "Examples:"
	Write-Host "  powershell -ExecutionPolicy Bypass -File .\\scripts\\docker-build-export.ps1"
	Write-Host "  powershell -ExecutionPolicy Bypass -File .\\scripts\\docker-build-export.ps1 -Version 12.4.1 -Zip"
	Write-Host "  powershell -ExecutionPolicy Bypass -File .\\scripts\\docker-build-export.ps1 -JsYarnBuildFlag \"build --parallel=1\""
	Write-Host "  powershell -ExecutionPolicy Bypass -File .\\scripts\\docker-build-export.ps1 -NodeMaxOldSpaceSizeMb 8192"
	Write-Host "  powershell -ExecutionPolicy Bypass -File .\\scripts\\docker-build-export.ps1 -PruneBeforeBuild"
	Write-Host "  powershell -ExecutionPolicy Bypass -File .\\scripts\\docker-build-export.ps1 -NoBuild -ImageName grafana-local -Version 12.4.0"
}

if ($Help) {
	Show-Usage
	exit 0
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$tag = "$ImageName`:$Version"
$platformSuffix = $Platform -replace '/', '-'
$tarFile = Join-Path $repoRoot "$ImageName`_$Version`_$platformSuffix.tar"
$zipFile = Join-Path $repoRoot "$ImageName`_$Version`_$platformSuffix.zip"

Write-Host "Repository root: $repoRoot"
Write-Host "Image tag:       $tag"
Write-Host "Platform:        $Platform"
Write-Host "JS build flag:   $JsYarnBuildFlag"
Write-Host "NODE_OPTIONS:    --max-old-space-size=$NodeMaxOldSpaceSizeMb"
Write-Host "Output tar:      $tarFile"

if ($Platform -notlike "linux/*") {
	Write-Warning "This repository Dockerfile is Linux-container oriented. Non-linux platform builds may fail."
}

if (-not $NoBuild) {
	if ($PruneBeforeBuild) {
		Write-Host ""
		Write-Host "==> Pruning old Docker build cache..."
		Invoke-Checked -Description "docker builder prune" -Command {
			docker builder prune -af
		}
	}

	Write-Host ""
	Write-Host "==> Building Docker image (multi-stage, Alpine final image)..."
	Invoke-Checked -Description "docker build" -Command {
		docker build `
			--platform $Platform `
			--build-arg BASE_IMAGE=alpine:3.23.3 `
			--build-arg GO_IMAGE=golang:1.25.7-alpine `
			--build-arg JS_IMAGE=node:24-alpine `
			--build-arg JS_PLATFORM=$Platform `
			--build-arg JS_YARN_BUILD_FLAG=$JsYarnBuildFlag `
			--build-arg JS_NODE_OPTIONS=--max-old-space-size=$NodeMaxOldSpaceSizeMb `
			-t $tag `
			-f Dockerfile .
	}

	Write-Host ""
	Write-Host "==> Built image size:"
	Invoke-Checked -Description "docker image ls" -Command {
		docker image ls $tag
	}
}

docker image inspect $tag *> $null
if ($LASTEXITCODE -ne 0) {
	throw "Image '$tag' does not exist locally. Build failed or image tag is incorrect."
}

Write-Host ""
Write-Host "==> Exporting image to tar..."
Invoke-Checked -Description "docker save" -Command {
	docker save -o $tarFile $tag
}

if (-not (Test-Path $tarFile)) {
	throw "Tar output was not created: $tarFile"
}

if ($Zip) {
	Write-Host ""
	Write-Host "==> Compressing tar to zip..."
	if (Test-Path $zipFile) {
		Remove-Item $zipFile -Force
	}
	Compress-Archive -Path $tarFile -DestinationPath $zipFile -Force
	Write-Host "Zip output: $zipFile"
}

Write-Host ""
Write-Host "Done. Import on target machine with:"
Write-Host "  docker load -i `"$tarFile`""
