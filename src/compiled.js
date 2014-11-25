function f(){this.k=null;this.h=0;this.l=!1}function g(a){if(a.l)throw"You can't add a callback after finalizing";a.h++;return function(){this.h--;0===this.h&&this.l&&this.k()}.bind(a)}function h(a,b){a.k=b;a.l=!0;0===a.h&&a.k()};function k(a){this.uuid=a;this.a=this.address=null;this.state=l;this.o=this.n=this.socketId=null}var l=0;
k.prototype.connect=function(a,b,e,d){var c=this;c.address=a;c.a=d;c.n=function(){b()};c.o=function(){e()};4==this.state?c.a.write("Device "+c.address+" is being disconnectd."):3==this.state?c.a.write("Device "+c.address+" is already connected."):2==c.state?c.a.write("Device "+c.address+" is already connecting."):1==c.state?c.a.write("Device "+c.address+" is already creating."):(c.state=1,chrome.bluetoothSocket.create({},function(a){c.state=2;c.a.write("Created a socket ("+a.socketId+")");c.socketId=
a.socketId;chrome.bluetoothSocket.connect(c.socketId,c.address,c.uuid,function(){chrome.runtime.lastError?(c.a.write("Connection failed: "+chrome.runtime.lastError.message),c.disconnect()):(chrome.bluetoothSocket.onReceive.addListener(function(a){if(a.socketId==c.socketId)c.onReceive(a.data)}),c.state=3,c.a.write("Connected to device: "+c.address),c.n())})}))};
k.prototype.disconnect=function(){var a=this;4!=a.state&&a.state!=l&&(a.state=4,a.a.write("Closing connection with socket "+a.socketId+" ("+a.address+")"),chrome.bluetoothSocket.close(a.socketId,function(){a.state=l;var b=a.socketId;a.socketId=null;a.a.write("Socket ID "+b+" is closed");a.o()}))};
k.prototype.send=function(a){var b=this;if(3!=b.state)b.a.write("Send failed: Not connected to device"),b.disconnect();else{for(var e=new ArrayBuffer(a.length),d=new Uint8Array(e),c=0;c<a.length;c++)d[c]=a[c];chrome.bluetoothSocket.send(b.socketId,e,function(){chrome.runtime.lastError&&(b.a.write("Send failed: "+chrome.runtime.lastError.message),b.disconnect())})}};k.prototype.onReceive=function(){};function n(a,b,e){a.i?b(a.i):chrome.fileSystem.chooseEntry({type:"openDirectory"},function(d){d?(a.i=d,b(a.i)):e()})}function p(a){this.fileSystem=a;this.f=[];this.g=this.m=this.fileName=null;this.c=r;this.prefix=function(){return""}}var r=0;p.prototype.open=function(a,b,e,d){var c=this;console.log("Opening "+a);c.fileName=a;c.c=1;n(c.fileSystem,function(q){q.getFile(a,{create:!0,exclusive:!1},function(a){u(c,a,b,e,d)},d)},d)};
function u(a,b,e,d,c){a.m=b;"w"==e?a.m.createWriter(function(b){b.onwriteend=function(){v(a)};a.g=b;a.c=2;v(a);d()},c):c()}p.prototype.seek=function(a){var b=this;2!=b.c&&1!=b.c?console.log("The file is not opened"):(b.f.push(function(e){e=a(e);b.g.seek(e)}),v(b))};p.prototype.write=function(a){var b=this;2!=b.c&&1!=b.c?console.log("The file is not opened"):(b.f.push(function(e){var d=new Blob([b.prefix()+a+"\n"]);e.write(d)}),v(b))};
p.prototype.close=function(a){var b=this;b.f.push(function(){0<b.f.length&&console.log("Operations added after calling close()");b.g=null;b.c=r;a()});v(b)};function v(a){for(;0<a.f.length&&2==a.c&&1!=a.g.readyState;)a.f.shift()(a.g)};function w(a){var b=new Date;a||(a="YYYY-MM-DD hh:mm:ss.SSS");a=a.replace(/YYYY/g,""+b.getFullYear());a=a.replace(/MM/g,("0"+(b.getMonth()+1)).slice(-2));a=a.replace(/DD/g,("0"+b.getDate()).slice(-2));a=a.replace(/hh/g,("0"+b.getHours()).slice(-2));a=a.replace(/mm/g,("0"+b.getMinutes()).slice(-2));a=a.replace(/ss/g,("0"+b.getSeconds()).slice(-2));if(a.match(/S/g))for(var b=("00"+b.getMilliseconds()).slice(-3),e=a.match(/S/g).length,d=0;d<e;d++)a=a.replace(/S/,b.substring(d,d+1));return a};function x(a){this.d={};this.e={};this.fileSystem=a;this.stream=null;this.b=0;this.j=null}x.prototype=new k("1101");x.p=function(a){return-1!=a.name.search(/F-PLUG/)};
function y(a){var b=a.address+"_"+w("YYYYMMDD")+".txt";if(null==a.stream||a.stream.fileName!=b)a.stream&&a.stream.close(function(){}),a.stream=new p(a.fileSystem),a.stream.open(b,"w",function(){},function(){a.a.write("Failed to open "+b);console.log("Failed to open "+b);a.disconnect()}),a.stream.seek(function(a){console.log(a.length);return a.length});return a.stream}
x.prototype.loop=function(){var a=this,b=new f,e=w("YYYY-MM-DD hh:mm:ss");a.d[e]={};z(a,e,g(b));A(a,e,g(b));B(a,e,g(b));C(a,e,g(b));h(b,function(){function b(a){var d=c[a];return 0===d||0!=c[a]?d:null}var c=a.d[e],q=w("YYYY/MM/DD hh:mm:ss")+","+b("temperature")+","+b("humidity")+","+b("brightness")+","+b("electricity");delete a.d[e];y(a).write(q)});a.j=window.setTimeout(function(){a.loop()},1E3)};x.prototype.stop=function(){null!=this.j&&(window.clearTimeout(this.j),this.j=null)};
function z(a,b,e){var d=a.b;a.b=a.b+1&65535;a.e[d]=function(c){a.d[b].temperature=(c[14]+256*c[15])/10;e()};a.send([16,129,d%256,d/256,14,240,0,0,17,0,98,1,224,0])}function C(a,b,e){var d=a.b;a.b=a.b+1&65535;a.e[d]=function(c){a.d[b].electricity=(c[14]+256*c[15])/10;e()};a.send([16,129,d%256,d/256,14,240,0,0,34,0,98,1,226,0])}function A(a,b,e){var d=a.b;a.b=a.b+1&65535;a.e[d]=function(c){a.d[b].humidity=c[14];e()};a.send([16,129,d%256,d/256,14,240,0,0,18,0,98,1,224,0])}
function B(a,b,e){var d=a.b;a.b=a.b+1&65535;a.e[d]=function(c){a.d[b].brightness=c[14]+256*c[15];e()};a.send([16,129,d%256,d/256,14,240,0,0,13,0,98,1,224,0])}x.prototype.onReceive=function(a){a=new Uint8Array(a);if(2!=a.length||135!=a[0]&&133!=a[0]){var b=a[2]+256*a[3];this.e[b](a);delete this.e[b]}};function D(a,b){chrome.bluetooth.getAdapterState(function(e){console.log("Bluetooth adapter state: [powered:"+e.powered+"] [available:"+e.available+"] [discovering:"+e.discovering+"]");e.powered&&e.available&&!e.discovering?a(e):b()})}var E=new function(){this.i=null};
function F(a,b){function e(d){a.write("+ "+d.address+" "+d.name+" ("+d.type+")");console.log("+ "+d.address+" "+d.name+" ("+d.type+")");if(d.paired)for(var c=[x],e=0;e<c.length;e++){var t=c[e];if(t.p(d)){a.write(d.address+" matched with a device type.");console.log(d.address+" matched with a device type.");var m=new p(E);m.prefix=function(){return w("[YYYY/MM/DD hh:mm:ss] ")};var s="error_"+d.address+".txt";m.open(s,"w",function(){m.seek(function(a){return a.length});var c=new t(E);c.connect(d.address,
function(){c.loop()},function(){c.stop();a.write("Disconnected. Trying to reconnect in 5 sec");console.log("Disconnected. Trying to reconnect in 5 sec");window.setTimeout(function(){F(a,b)},5E3)},m)},function(){m.write("Failed to open "+s);console.log("Failed to open "+s)});break}}else a.write(d.address+" is not paired"),console.log(d.address+" is not paired")}console.log("==== Paired devices ====");chrome.bluetooth.getDevices(function(a){console.log(a);for(var b=0;b<a.length;b++)e(a[b])})}
(function(){var a=new p(E);a.prefix=function(){return w("[YYYY/MM/DD hh:mm:ss] ")};a.open("error_log.txt","w",function(){a.seek(function(a){return a.length});D(function(b){F(a,b)},function(){a.write("Bluetooth device is not available now.");console.log("Bluetooth device is not available now.")})},function(){console.log("Failed to open error_log.txt")})})();
