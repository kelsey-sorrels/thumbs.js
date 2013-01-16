var express = require('express');
var sys = require('sys');
var fs = require('fs');
var http = require('http');
var url = require('url');
var crypto = require('crypto');
var AWS = require('aws-sdk');

AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_KEY, region: 'us-east-1'});
var s3 = new AWS.S3();


var app = express.createServer(express.logger());

// Render a page and redirect to the image file
app.get('/thumb', function(request, response) {
    var address = url.parse(request.url, true).query.href;
	var size = parseInt(url.parse(request.url, true).query.size || 64);
    var bucket = process.env.AWS_BUCKET;
    var key = address.replace('http://', '').replace(/[^a-zA-Z0-9]/g, '-');
    var dest =  key + '.jpg';
	console.log('Recv reqeust for: ' + address);
	console.log('Checking cache @ http://s3.amazonaws.com/' + bucket + '/' + dest);
    // Perform a HEAD on 'http://s3.amazonaws.com/' + bucket + '/' + dest
	http.request({host: 's3.amazonaws.com',
                  port: 80,
                  path: '/' + bucket + '/' + dest,
                  method: 'HEAD'}, function (res) {
        console.log('Response code: ' + res.statusCode);
        // if 200 then redirect
		if (res.statusCode == 200)
		{
            console.log('Cache hit. Redirecting.');
            response.writeHead(302, {'Location': 'http://s3.amazonaws.com/' + bucket + '/' + dest});
            response.end();
		}
		else
		{
            // else make thumb
            console.log('Cache miss.');
            // Call bin/phantomjs ...
            var cmdLine = ['phantomjs', './src/phantom.js/thumb.js', address, dest].join(' '); 
            console.log('Calling: ' + cmdLine);
            sys.exec(cmdLine, function (error, stdout, stderr) {
                // get favicon using google.com/s2
            	http.get({host: 'www.google.com',
                          port: 80,
                          path: '/s2/favicons?domain=' + address.replace('http://', '')}, function (res) {
                    var imagedata = ''
                    res.setEncoding('binary')

                    res.on('data', function(chunk){
                        imagedata += chunk;
                    })

                    res.on('end', function(){
                        var faviconPath = key + '-favicon.png';
                        fs.writeFile(faviconPath, imagedata, 'binary', function(err){
                            if (err) throw err
                            // shrink dest and composite favicon into bottom left corner (drop shadow?)
                            var cmdLine = ['convert', dest, 
                                           '-resize ' + size + 'x' + size,,
                                           '-gravity South-West',
                                           '-draw "image over 0,0, 0,0 \'' + faviconPath + '\'"',
                                            dest].join(' ');
                            console.log('Calling: ' + cmdLine);
                            sys.exec(cmdLine, function (error, stdout, stderr) {
                                // Read the image file as data
                                fs.readFile(dest, function (err, data) {
                                    // upload to s3
                                    s3.client.putObject({Bucket: bucket,
                                                         Key: dest,
                                                         ContentType: 'image/jpeg',
                                                         ACL: 'public-read',
                                                         Body: data}, function () {
                                        // redirect to s3
                                        response.writeHead(302, {'Location': 'http://s3.amazonaws.com/' + bucket + '/' + dest});
                                        response.end();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
    }).end();
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
