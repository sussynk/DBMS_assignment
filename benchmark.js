function timeIt(fn, iters = 5, label = "test") {
  const times = [];
  for (let i = 0; i < iters; i++) {
    const start = Date.now();
    fn();
    const end = Date.now();
    times.push(end - start);
  }
  const avg = times.reduce((a,b)=>a+b,0) / times.length;
  print(`${label},${avg}`);
}

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
  bulk.execute();
  db.bench.createIndex({userId:1});
  db.bench.createIndex({tags:1});
}

// Benchmarks
timeIt(()=>db.bench.find({userId:1234}).limit(100).toArray(), 5, "point_read");
timeIt(()=>db.bench.aggregate([
  {$match:{tags:"a"}},
  {$group:{_id:"$userId", total:{$sum:"$value"}, cnt:{$sum:1}}},
  {$sort:{total:-1}},
  {$limit:1000}
]).toArray(), 5, "aggregation");
timeIt(()=>{
  let bulk = db.bench.initializeUnorderedBulkOp();
  for (let i=0;i<5000;i++){
    bulk.insert({userId:i, ts:new Date(), value:Math.random()*1000, tags:"b"});
  }
  bulk.execute();
}, 3, "bulk_write");
