var page = require('webpage').create();
var system = require('system');
var fs = require('fs');

var address = system.args[1];
var dest = system.args[2];

page.viewportSize = {width:1280, height:720};
page.clipRect = {top:0, left:0, width:1280, height:720};


page.open(address, function () {
    console.log('rendering ' + dest + ' ...');
    page.render(dest);
    console.log('rendering finished');
    phantom.exit();
});

