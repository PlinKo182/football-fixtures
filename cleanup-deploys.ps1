$deploys = vercel list football-fixtures | Select-String "https://.*" | ForEach-Object { ($_ -split "\s+")[0] }

if ($deploys.Count -le 1) {
    Write-Host "Nenhum deploy antigo para remover."
} else {
    $deploysToRemove = $deploys[1..($deploys.Count - 1)]
    foreach ($d in $deploysToRemove) {
        Write-Host "Removendo deploy: $d"
        vercel remove $d --yes
    }
    Write-Host "Remoção concluída: $($deploysToRemove.Count) deploy(s) removido(s)."
}
