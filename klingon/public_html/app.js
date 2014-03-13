var express = require('express');
var app = express();
var server  = require('http').createServer(app);

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;


server.listen(3000);

app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

//app.use(express.static(__dirname + '/public'));

app.put('/:uuid/saveopenaura/:auraid',function(req,res){
     MongoClient.connect('mongodb://127.0.0.1:27017/holodeck', function(err, db) {
    if(err) throw err;

    var collection = db.collection('vendors');
    
    collection.find().toArray(function(err, results) {
        return res.send(results);
        // Let's close the db
        db.close();
      });
    
  }); 
});

app.post('/user',function(req,res){
    MongoClient.connect('mongodb://127.0.0.1:27017/holodeck', function(err, db) {
    if(err) throw err;

    var collection = db.collection('crowd');
    
        
    var jsonBody = req.body;
        
        
    collection.insert(jsonBody, {safe: true}, function(err, records){
        if(err){
            return res.status(400).send("Failed");
        }
        console.log("Record added as "+records[0]._id);
        return res.send("User added");
    });
    
  }); 
});








