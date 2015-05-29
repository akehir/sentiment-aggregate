var port = (process.env.VCAP_APP_PORT || 3010);
var express = require("express");
var mongoClient = require("mongodb").MongoClient;
var mqlight = require('mqlight');
var sentiment = require('sentiment');


// Settings
var dbKeywordsCollection	= "keywords";
var dbResultsCollection		= "results";
var dbCacheCollection		= "cache";

var mqlightTweetsTopic = "mqlight/ase/tweets";
var mqlightAnalyzedTopic = "mqlight/ase/analyzed";
var mqlightAggregateTopic = "mqlight/ase/aggregate";

var mqlightShareID = "ase-aggregate";
var mqlightServiceName = "mqlight";
var mqlightSubInitialised = false;
var mqlightClient = null;


/*
 * Establish MQ credentials
 */
var opts = {};
var mqlightService = {};
if (process.env.VCAP_SERVICES) {
  var services = JSON.parse(process.env.VCAP_SERVICES);
  console.log( 'Running BlueMix');
  if (services[ mqlightServiceName ] == null) {
    throw 'Error - Check that app is bound to service';
  }
  mqlightService = services[mqlightServiceName][0];
  opts.service = mqlightService.credentials.connectionLookupURI;
  opts.user = mqlightService.credentials.username;
  opts.password = mqlightService.credentials.password;
} else {
  opts.service = 'amqp://localhost:5672';
}


// defensiveness against errors parsing request bodies...
process.on('uncaughtException', function (err) {
	console.log('Caught exception: ' + err.stack);
});

var app = express();
// Configure the app web container
app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
});



// Database Connection
var mongo = {};
var keywordsCollection = null;
var cacheCollection = null;
var resultsCollection = null;

if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);

    if (env['mongodb-2.4']) {
        mongo['url'] = env['mongodb-2.4'][0]['credentials']['url'];
    }

    console.log("Mongo URL:" + mongo.url);
} else {
   console.log("No VCAP Services!");
   mongo['url'] = "mongodb://localhost:27017/ase";
} 

var myDb; 
var mongoConnection = mongoClient.connect(mongo.url, function(err, db) {
    
   if(!err) {
    console.log("Connection to mongoDB established");
    myDb = db;

	keywordsCollection = myDb.collection(dbKeywordsCollection);
	resultsCollection = myDb.collection(dbResultsCollection);
	cacheCollection = myDb.collection(dbCacheCollection);

	// Start the App after DB Connection
	startApp();

  } else {
  	console.log("Failed to connect to database!");
  }
}); 


function startApp() {
	/*
	 * Create our MQ Light client
	 * If we are not running in Bluemix, then default to a local MQ Light connection  
	 */
	 
	runGC();
	 
	mqlightClient = mqlight.createClient(opts, function(err) {
	    if (err) {
	      console.error('Connection to ' + opts.service + ' using client-id ' + mqlightClient.id + ' failed: ' + err);
	    }
	    else {
	      console.log('Connected to ' + opts.service + ' using client-id ' + mqlightClient.id);
	    }
	    /*
	     * Create our subscription
	     */
	    mqlightClient.on('message', processMessage);
	    mqlightClient.subscribe(mqlightAggregateTopic, mqlightShareID, 
	        {credit : 5,
	           autoConfirm : true,
	           qos : 0}, function(err) {
	             if (err) console.error("Failed to subscribe: " + err); 
	             else {
	               console.log("Subscribed");
	               mqlightSubInitialised = true;
	             }
	           });
	  });
}


/*
 * Handle each message as it arrives
 */
function processMessage(data, delivery) {
	  var analyzed = data.analyzed;
	  try {
	    // Convert JSON into an Object we can work with 
	    data = JSON.parse(data);
	    analyzed = data.analyzed;
	  } catch (e) {
	    // Expected if we already have a Javascript object
	  }
	  if (!tweet) {
	    console.error("Bad data received: " + data);
	  }
	  else {
	    console.log("Received data: " + JSON.stringify(data));
	    // Upper case it and publish a notification
	    
	    // Aggregate data!
	  }
}


function runGC() {
 setTimeout(function () {    //  call a 30s setTimeout when the loop is called
		console.log("Running GC.");
		global.gc();
		console.log("Completed GC.");
	}, 30000)
}

app.listen(port);
console.log("Server listening on port " + port);
