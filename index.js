const http = require('https');

let trackingNumber = null;
if(process.argv[2]) {
  trackingNumber = process.argv[2];
}
else {
  console.log('no tracking number provided. usage: ups <trackingnumber>');
  process.exit()
}

var data = JSON.stringify(
  { 
    TrackingNumber: [ trackingNumber ] 
  }
);

var options = {
  "method": "POST",
  "hostname": "wwwapps.ups.com",
  "port": 443,
  "path": "/track/api/Track/GetStatus",
  "headers": {
    "Content-Type": "application/json",
    "cache-control": "no-cache",
    "Content-Length": data.length,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36"
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    var data = JSON.parse(body);
    if(+data.statusCode === 200) {
      
      console.log("\u001b[0m")
      const current = data.trackDetails[0].shipmentProgressActivities.filter((d) => {
        return (d.milestone && d.milestone.isCurrent) 
      });

      data.trackDetails[0].shipmentProgressActivities.reverse().map((d) => {
        if(d.date) {
          console.log(' -> ', d.date + ' ' + d.time, ' | ', `it was ${d.actCode === 'DP' ? 'departed from' : 'at'} ${d.location}`);
          console.log(' -> -> ', d.activityScan);
          console.log("\u001b[0m")
        }
      })

      if(current.length) {
        console.log("\u001b[32m")
        console.log(' -> ', current[0].date + ' ' + current[0].time, ' | ', `its currently ${current[0].actCode === 'DP' ? 'departed from' : 'at'} ${current[0].location}`);
        console.log("\u001b[0m")
      }
      
      console.log("your package status is: ", data.trackDetails[0].packageStatus);
      console.log("it is scheduled on: \u001b[33m", data.trackDetails[0].scheduledDeliveryDate);
    }
  });
});

req.write(data);
req.end();
