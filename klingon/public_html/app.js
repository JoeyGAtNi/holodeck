var express = require('express');
var app = express();
var server = require('http').createServer(app);
var http = require('http');
var path = require('path');
var MongoClient = require('mongodb').MongoClient
        , format = require('util').format;


server.listen(3000);


app.use(express.bodyParser());
app.use(express.methodOverride());
//app.use(express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname + '/public')));
app.use(app.router);

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

app.use(express.logger('dev'));

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index1.html');
});

app.get('/visitors', function(req, res) {
    res.sendfile(__dirname + '/visitor.html');
});

app.get('/songlist', function(req, res) {
    res.sendfile(__dirname + '/songlist.html');
});

app.get('/socialmedia', function(req, res) {
    res.sendfile(__dirname + '/socialmedia.html');
});

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
        var timelineObjects=[];
        if (err)
            throw err;
        var currentTime = new Date().getTime();
        var collection = db.collection('crowd');
        var bandcollection;
        collection.update(
                {_id: userId},
        {
            $addToSet: {"visited": {"uuid": bandId, "timestamp": currentTime}}
        }, function(err, records) {
            if (err) {
                return res.status(400).send("Failed");
            }
            bandcollection = db.collection("bands");
            bandcollection.findOne({"_id": bandId}, function(err, result) {

                    if (err){
                        console.log(err.message);
                        return res.status(500).send("error : " + err);
                    }
                    if (result)
                    {
                        console.log("in result");

                        var options = {
                            host: 'api.openaura.com',
                            path: '/v1/info/artists/' + result.aura_id + '?id_type=oa%3Aartist_id&api_key=hack-sxsw',
                            method: 'GET'
                        };

                        var openAura = http.request(options, function( response) {
                           
                            console.log(options.path);
                            response.setEncoding('utf-8');
                            //console.log(index);
                            var responseString = '';

                            response.on('data', function(data) {
                                responseString += data;
                            });
                            response.on('error' , function(e){
                                console.log(e);
                            });
                            response.on('end', function() {
                                var responseObject = JSON.parse(responseString);
                                //console.log(responseObject);
                                var like= false;
                                
                                var spotifyUrl ="";
                                if(result.spotify_track_id != null){
                                    //spotifyUrl = "<iframe src='https://embed.spotify.com/?uri="+result.spotify_track_id+"' width='250' height='80' frameborder='0' allowtransparency='true'></iframe>";
                                    spotifyUrl = "https://embed.spotify.com/?uri="+result.spotify_track_id;
                                }
                                var bandsInTown = "";
                                if(result.bands_in_town != null)
                                    bandsInTown = result.bands_in_town;
                                
                                if(responseObject == ""){
                                    
                                timelineObjects.push({timestamp: currentTime, image: "",
                                headline: "", links: "", isLiked: like ,
                                spotify_track_id : spotifyUrl , bands_in_town : bandsInTown});
                                }else{
                                    //console.log(responseObject);
                                timelineObjects.push({uuid : bandId, timestamp: currentTime, image: responseObject.profile_photo.media[0].url,
                                    headline: responseObject.name, links: responseObject.fact_card.media[0].data.website, isLiked: like ,
                                spotify_track_id : spotifyUrl , bands_in_town : bandsInTown});
                                }
                                
                                    return res.send(timelineObjects);
                                
                                
                            });
                            
                        });
                       
                        
                            openAura.write("");
                        openAura.end();
                        
                    }else{
                        console.log("no result");
                        return res.send("No band info");
                    }

                });
            //return res.send("Visited added");
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
    'use strict';
    MongoClient.connect('mongodb://127.0.0.1:27017/holodeck', function(dberr, db) {
        if (dberr)
            throw dberr;

        var userId = req.param('id');

        var collection = db.collection('crowd');
        var visitedList;
        var likedList;

        collection.findOne({"_id": userId}, function(collerr, results) {
            if (collerr) {
                return res.status(400).send("Failed");
            }
            if(results == null){
                return res.status(404).send("no band visits");
            }
            likedList = results.liked;
            visitedList = results.visited;
            if (visitedList == null) {
                return res.status(200).send("No bands visited");
            }
            console.log(visitedList);
            var bandcollection;
            for (var i = 0; i < visitedList.length; i++) {

                var str = "";
                var timelineObjects = [];
                bandcollection = db.collection('bands');
                var index = 0;
                bandcollection.findOne({"_id": visitedList[i].uuid}, function(err, result) {

                    if (err){
                        console.log(err.message);
                        return res.status(500).send("error : " + err);
                    }
                    if (result)
                    {
                        console.log("in result");

                        var options = {
                            host: 'api.openaura.com',
                            path: '/v1/info/artists/' + result.aura_id + '?id_type=oa%3Aartist_id&api_key=hack-sxsw',
                            method: 'GET'
                        };

                        var openAura = http.request(options, function( response) {
                            var delay = 1000;
                        setTimeout(function(){},1000);
//                            if(error){
//                                console.log(error);
//                                return res.send("aura error : "+ error);
//                                
//                            }
                            console.log(options.path);
                            response.setEncoding('utf-8');
                            //console.log(index);
                            var responseString = '';

                            response.on('data', function(data) {
                                responseString += data;
                            });
                            response.on('error' , function(e){
                                console.log(e);
                            });
                            response.on('end', function() {
                                var responseObject = JSON.parse(responseString);
                                //console.log(responseObject);
                                var like= false;
                                if(likedList != null){
                                        like=checkifBandLiked(likedList ,visitedList[index].uuid );
                                }
                                var spotifyUrl ="";
                                if(result.spotify_track_id != null){
                                    spotifyUrl = "<iframe src='https://embed.spotify.com/?uri="+result.spotify_track_id+"' width='250' height='80' frameborder='0' allowtransparency='true'></iframe>";
                                }
                                var bandsInTown = "";
                                if(result.bands_in_town != null)
                                    bandsInTown = result.bands_in_town;
                                
                                if(responseObject == ""){
                                    
                                timelineObjects.push({timestamp: visitedList[index].timestamp, image: "",
                                headline: "", links: "", isLiked: like ,
                                spotify_track_id : spotifyUrl , bands_in_town : bandsInTown});
                                }else{
                                    //console.log(responseObject);
                                timelineObjects.push({uuid : visitedList[index].uuid, timestamp: visitedList[index].timestamp, image: responseObject.profile_photo.media[0].url,
                                    headline: responseObject.name, links: responseObject.fact_card.media[0].data.website, isLiked: like ,
                                spotify_track_id : spotifyUrl , bands_in_town : bandsInTown});
                                }
                                if (index == visitedList.length - 1) {
                                    //console.log(timelineObjects);
                                    return res.send(timelineObjects);
                                }
                                index++;
                                //success(responseObject);
                            });
                            
                        });
                       
                        
                            openAura.write("");
                        openAura.end();
                        
                    }else{
                        console.log("no result");
                        index++;

                    }

                });
            }

        });
    });
});

function checkifBandLiked(likedList , uuid){
    for(var i= 0 ; i < likedList.length ; i++){
        if(likedList[i].uuid === uuid)
            return true;
    }
}

app.put('/user/:id/drawing/:uuid', function(req, res) {
    MongoClient.connect('mongodb://127.0.0.1:27017/holodeck', function(err, db) {
        var userId = req.param('id');
        var bandId = req.param('uuid');

        if (err)
            throw err;

        var collection = db.collection('bands');

        collection.update(
                {_id: bandId},
        {
            $addToSet: {"drawing":userId}
        }, function(err, records) {
            if (err) {
                return res.status(400).send("Failed");
            }
            return res.send("Successfully entered the drawign");
        });

    });
    
});












