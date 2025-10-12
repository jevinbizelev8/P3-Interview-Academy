$ErrorActionPreference = 'Stop'

param(
  [Parameter(Mandatory=$true)][string]$EnvironmentName,
  [Parameter(Mandatory=$true)][string]$DbUser,
  [Parameter(Mandatory=$true)][string]$DbPassword,
  [Parameter(Mandatory=$true)][string]$DbHost,
  [string]$DbName = 'postgres',
  [int]$DbPort = 5432,
  [switch]$RequireSSL
)

function Get-AppName($envName){
  $e = aws elasticbeanstalk describe-environments --environment-names $envName | ConvertFrom-Json
  return $e.Environments[0].ApplicationName
}

Write-Host "Updating DATABASE_URL on $EnvironmentName ..."
$app = Get-AppName $EnvironmentName
$ssl = if ($RequireSSL) { '?sslmode=require' } else { '' }
$pwdEnc = [System.Net.WebUtility]::UrlEncode($DbPassword)
$url = "postgresql://$DbUser:$pwdEnc@$DbHost:$DbPort/$DbName$ssl"

aws elasticbeanstalk update-environment `
  --environment-name $EnvironmentName `
  --option-settings "Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_URL,Value=$url" | Out-Null

Start-Sleep -Seconds 8

$cfg = aws elasticbeanstalk describe-configuration-settings --application-name $app --environment-name $EnvironmentName | ConvertFrom-Json
$val = [string]($cfg.ConfigurationSettings[0].OptionSettings | Where-Object { $_.Namespace -eq 'aws:elasticbeanstalk:application:environment' -and $_.OptionName -eq 'DATABASE_URL' } | Select-Object -First 1).Value
$masked = $val -replace '(^[^:]+://)[^@]+@', '$1****:****@'
Write-Host "New DATABASE_URL: $masked"

