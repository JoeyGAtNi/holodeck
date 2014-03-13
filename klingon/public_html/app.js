var express = require('express');
var app = express();
var server = require('http').createServer(app);
var http = require('http');

var MongoClient = require('mongodb').MongoClient
        , format = require('util').format;


server.listen(3000);

app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

//app.use(express.static(__dirname + '/public'));



app.post('/user', function(req, res) {
    MongoClient.connect('mongodb://127.0.0.1:27017/holodeck', function(err, db) {
        if (err)
            throw err;

        var collection = db.collection('crowd');


        var jsonBody = req.body;


        collection.insert(jsonBody, {safe: true}, function(err, records) {
            if (err) {
                return res.status(400).send("Failed");
            }
            console.log("Record added as " + records[0]._id);
            return res.send("User added");
        });

    });
});

app.put('/user/:id/visited/:uuid', function(req, res) {
    MongoClient.connect('mongodb://127.0.0.1:27017/holodeck', function(err, db) {
        var userId = req.param('id');
        var bandId = req.param('uuid');

        if (err)
            throw err;

        var collection = db.collection('crowd');

        collection.update(
                {_id: userId},
        {
            $addToSet: {"visited": {"uuid": bandId, "timestamp": new Date().getTime()}}
        }, function(err, records) {
            if (err) {
                return res.status(400).send("Failed");
            }
            return res.send("Visited added");
        });

    });
});


app.put('/user/:id/liked/:uuid', function(req, res) {
    MongoClient.connect('mongodb://127.0.0.1:27017/holodeck', function(err, db) {
        var userId = req.param('id');
        var bandId = req.param('uuid');

        if (err)
            throw err;

        var collection = db.collection('crowd');

        collection.update(
                {_id: userId},
        {
            $addToSet: {"liked": {"uuid": bandId, "timestamp": new Date().getTime()}}
        }, function(err, records) {
            if (err) {
                return res.status(400).send("Failed");
            }
            return res.send("Visited added");
        });

    });
});


app.get('/user/:id/timeline', function(req, res) {
    MongoClient.connect('mongodb://127.0.0.1:27017/holodeck', function(err, db) {
        if (err)
            throw err;

        var userId = req.param('id');

        var collection = db.collection('crowd');
        var visitedList ;
        
    
        collection.findOne({"_id": userId},function(err, results) {
            if (err) {
                return res.status(400).send("Failed");
            }
            visitedList = results.visited;
            if(visitedList === null){
                return res.status(200).send("No bands visited");
            }
            
            var bandcollection;
            for(var i=0 ; i < visitedList.length ; i++){
                var index = 0;
                var str="";
                var timelineObjects = [];
                bandcollection = db.collection('bands');
                bandcollection.findOne({"_id": visitedList[i].uuid},function(err, result) { 
                    
                    
                    if(err) 
                        return res.status(500).send("failed with "+err);
                    if(result != null)
                        {
//                            str += result.aura_id + ",";
                            timelineObjects.push({timestamp: visitedList[index].timestamp, image: "" , 
                                                    headline : "" ,links :"" , isLiked: true});
                            console.log("index "+index);
                            if(index == visitedList.length-1)
                                return res.send(timelineObjects);
                        }
                    index++;
                });
            }
            //console.log("result "+str)
            //return res.status(200).send(""+str);
        });
    });
});

app.get('/data', function(req, res) {
    
    MongoClient.connect('mongodb://127.0.0.1:27017/holodeck', function(err, db) {
        if (err)
            throw err;
        var bandcollection = db.collection('bands');
        var str = "";
        var index =0;
        bandcollection.find().toArray(function(err, results) {  
            
                    if(err) 
                        return res.status(500).send("failed with "+err);
                    for(var i = 0 ; i < results.length ; i++){
                        str += results[i].aura_id;
                        
                        if(i == results.length-1)
                            return res.send(str);
                    }
                    
        db.close();
                    
        });
        //res.send("str = "+str);
    });
});








