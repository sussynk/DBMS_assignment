# Copy benchmark.js into both containers
docker cp C:\Users\cleme\Downloads\benchmark.js mongo_encrypted:/benchmark.js
docker cp C:\Users\cleme\Downloads\benchmark.js mongo_plain:/benchmark.js

# Run benchmarks
$encResults = docker exec -i mongo_encrypted mongosh /benchmark.js
$plainResults = docker exec -i mongo_plain mongosh /benchmark.js

# Parse results into CSV
$encLines = $encResults -split "`n"
$plainLines = $plainResults -split "`n"

$rows = @()
for ($i=0; $i -lt $encLines.Length; $i++) {
    $test = ($encLines[$i] -split ",")[0]
    $encAvg = [double]($encLines[$i] -split ",")[1]
    $plainAvg = [double]($plainLines[$i] -split ",")[1]
    $delta = (($encAvg - $plainAvg) / $plainAvg * 100)
    $rows += [PSCustomObject]@{
        Test = $test
        "Encrypted avg ms" = [math]::Round($encAvg,2)
        "Plain avg ms" = [math]::Round($plainAvg,2)
        "Delta (%)" = [math]::Round($delta,2)
    }
}

$csv = "C:\Users\cleme\Downloads\mongo_benchmark_results.csv"
$rows | Export-Csv -Path $csv -NoTypeInformation
Write-Host "Benchmark complete. Results saved to $csv"
