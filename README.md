# Introduction

In this experiment, my group will be using [Percona Server for MongoDB](https://www.percona.com/mongodb/software/percona-server-for-mongodb) as our NoSQL setup.

We will be comparing the query speed between encrypted vs non-encrypted setup.

# Requirements

1. Windows Machine to run PowerShell Script for benchmarking
2. [Docker Desktop](https://www.docker.com/)
3. Percona Server:

   ```
   docker pull percona/percona-server-mongodb:8.0
   ```

---

# How to clone setup:

**Note:** 

**1. Change "cleme" to your username.**

**2. JavaScript/PowerShell Script code is provided but please generate key/database file manually by running Step 1 and 2. (Unable to upload to GitHub due to file size issues)**

1. Create folder and key file

   ```
   mkdir C:\Users\cleme\Downloads\mongo_keys
   mkdir C:\Users\cleme\Downloads\mongo_data_encrypted
   mkdir C:\Users\cleme\Downloads\mongo_data_plain

   echo mysecretkey > C:\Users\cleme\Downloads\mongo_keys\mongodb-keyfile
   ```
2. Run Docker Containers

   ```
   docker run -d --name mongo_encrypted `
     -v 'C:\Users\cleme\Downloads\mongo_keys:/keys' `
     -v 'C:\Users\cleme\Downloads\mongo_data_encrypted:/data/db' `
     -e ENCRYPTION_KEY_FILE=/keys/mongodb-keyfile `
     -p 27017:27017 `
     percona/percona-server-mongodb:8.0

   docker run -d --name mongo_plain `
     -v 'C:\Users\cleme\Downloads\mongo_data_plain:/data/db' `
     -p 27018:27017 `
     percona/percona-server-mongodb:8.0
   ```

   If you want to run the docker command again later but facing errors about name/folder already exist, run the following command to troubleshoot:

   ```
   docker stop mongo_encrypted mongo_plain
   docker rm mongo_encrypted mongo_plain
   ```
3. Create benchmark.js file and paste the following code:

   ```javascript
   async function timeIt(fn, iters = 5, label = "test") {
     const times = [];
     for (let i = 0; i < iters; i++) {
       const start = Date.now();
       const res = fn();
       if (res && typeof res.then === 'function') {
         await res;
       }
       const end = Date.now();
       times.push(end - start);
     }
     const avg = times.reduce((a,b)=>a+b,0) / times.length;
     print(`${label},${avg}`);
   }

   (async function() {
     // Load data if empty
     db = connect("mongodb://localhost:27017/test");
     if (db.bench.count() === 0) {
       let bulk = db.bench.initializeUnorderedBulkOp();
       for (let i = 0; i < 100000; i++) {
         bulk.insert({
           userId: Math.floor(Math.random()*10000),
           ts: new Date(),
           value: Math.random()*1000,
           tags: ["a","b","c"][Math.floor(Math.random()*3)]
         });
       }
       const r = bulk.execute();
       if (r && typeof r.then === 'function') await r;
       db.bench.createIndex({userId:1});
       db.bench.createIndex({tags:1});
     }

     // Benchmarks
     await timeIt(()=>db.bench.find({userId:1234}).limit(100).toArray(), 5, "point_read");
     await timeIt(()=>db.bench.aggregate([
       {$match:{tags:"a"}},
       {$group:{_id:"$userId", total:{$sum:"$value"}, cnt:{$sum:1}}},
       {$sort:{total:-1}},
       {$limit:1000}
     ]).toArray(), 5, "aggregation");
     await timeIt(()=>{
       let bulk = db.bench.initializeUnorderedBulkOp();
       for (let i=0;i<5000;i++){
         bulk.insert({userId:i, ts:new Date(), value:Math.random()*1000, tags:"b"});
       }
       const r2 = bulk.execute();
       if (r2 && typeof r2.then === 'function') return r2;
     }, 3, "bulk_write");

   })();
   ```
4. Create mongo_benchmark.ps1 file (PowerShell script to compare Encrypted vs Non-Encrypted speed) and paste the following code:

   ```powershell
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
   ```
5. Run the PowerShell script and the result will be available at:

   `C:\Users\cleme\Downloads\mongo_benchmark_results.csv `

   Incase any issue running the PowerShell script, please run the following command first on PowerShell:

   ```
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

---



# Conclusion/Results:

Results Table from the csv file:

| Test        | Encrypted avg ms | Plain avg ms | Delta (%) |
| ----------- | ---------------- | ------------ | --------- |
| point_read  | 7                | 8            | -12.5     |
| aggregation | 1385.8           | 1191.8       | 16.28     |
| bulk_write  | 341.67           | 190.33       | 79.51     |

The Encrypted file uses more time compared to the Plain Unencrypted file.
