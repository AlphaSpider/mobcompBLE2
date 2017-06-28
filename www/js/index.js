
/* Characteristics for the SparkFun BME 280 Sensor */
var ENV_SERVICE	       	= "181a";
var ENV_TEMP			= "2a6e";
var ENV_HUM				= "2a6f";
var ENV_PRESS			= "2a6d";

/*  Characteristics for the MiCS-6814 Sensor */
var GAS_SERVICE   		= "4b822f90-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_CO_RAW			= "4b822fa1-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_CO_CALIB		= "4b822fa2-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_NO2_RAW			= "4b822f91-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_NO2_CALIB		= "4b822f92-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_NH3_RAW			= "4b822fb1-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_NH3_CALIB		= "4b822fb2-3941-4a4b-a3cc-b2602ffe0d00";

var deviceCounter 		= 0;
var stateConnected		= false;
var missingCalData		= false;
var connectedDevice;
var sensorUI;
var calibData = [];

$( document ).ready(function() {
	console.log("ready!");
});


$(document).on("pageshow", function() {
	rescaleContent();
});

$(window).on('resize orientationchange', rescaleContent());

/*
	Everything starts with this
*/
function startBLEScan() {
	ble.isEnabled(bleEnabled, bleDisabled);
}

//BLE is enabled on the device
function bleEnabled() {
	//start the scan
	ble.startScan([], deviceFound, failedToDiscover);
	setTimeout(stopScan, 5000);
}

//BLE is disabled on the device
function bleDisabled() {
	//Try to enable BLE
	ble.enable(bleEnabled, enableFail);
}

function enableFail(err) {
	alert('Cannot enable Bluetooth');
}

function stopScan() {
	alert('Finished Scanning');
	ble.stopScan;
}
//found a Device, add it to the device list
function deviceFound(device) {
	console.log("[deviceFound] " + device.name);
	var newEntry 		= $("#listItem").clone();
	
	if(device.name.toUpperCase == "TECO_ENV") {
		// chain method-calls on jQuery object
		newEntry.switchClass("listItemTemplate", "listItem")
		newEntry.find("info")
		.html("You can connect to this device");
		
		// add onClick to List item
		// when clicked, check if connected or not
		newEntry.click(tryConnect(device));
		
	} else {
		newEntry.switchClass("listItemUnusable")
		.find("#info")
		.html("Unkown device. Unable to connect.");
	}
	newEntry.attr("id", deviceCounter++)
	.appendTo("#deviceList")
	.find("#name").html(device.name)
	newEntry.find("RSSI").html("RSSI: " + device.rssi);
}

//connect to device
function tryConnect(device) {
	if(!stateConnected) {
		ble.connect(device.id, 
		function(peripheral) {
			connectedDevice = device;
			stateConnected = true;
			console.log(JSON.stringify(peripheral));
			connectionSuccess(peripheral);
		}, 
		connectionFailure());
	} else {
		// currently connected to a device
		// show allert
	}
}

function connectionSuccess() {
	//Switch to new Page
	console.log("Page-Switch: try to sensorPage");
	$.mobile.pageContainer.pagecontainer("change", "#sensorPage",
	{
		transition: 'slide',
		changeHash: false,
		reverse:	true,
		showLoadMsg:	true
	});
	
	// TODO: populate content with sensorData.html
	
	
	
	//1. start retrieving calibration data
	
	// read CO calibration
	ble.read(connectedDevice.id, GAS_SERVICE, GAS_CO_CALIB, calibSucc, calibFail);
	// read NO2 calibration
	ble.read(connectedDevice.id, GAS_SERVICE, GAS_NO2_CALIB, calibSucc, calibFail);
	// read NH3 calibration
	ble.read(connectedDevice.id, GAS_SERVICE, GAS_NH3_CALIB, calibSucc, calibFail);
		
	//2. register for notification with Temp/Hum/Pres
	// register for Temp
	ble.startNotification(connectedDevice.id, ENV_SERVICE, ENV_TEMP, notifyTemp, notifyFailure);
	// register for Hum 
	ble.startNotification(connectedDevice.id, ENV_SERVICE, ENV_HUM, notifyHum, notifyFailure);
	// register for Pres
	ble.startNotification(connectedDevice.id, ENV_SERVICE, ENV_PRESS, notifyPres, notifyFailure)
	//3. after 7s register for notification CO/NO2/NH3
	setTimeout(function() {
		// stop former notifications 
		
	}, 7000);
}

function connectionFailure(peripheral) {
	console.log("Failed to connect: " + peripheral);
}

function calibCOSucc(buffer) {
	calibData[0] = new Int16Array(buffer);
}

function calibNO2Succ(buffer) {
	calibData[1] = new Int16Array(buffer);
}

function calibNH3Succ(buffer) {
	calibData[2] = new Int16Array(buffer);
}

function calibFail(reason) {
	console.log(reason);
	missingCalData = true;
}

function notifyTemp(buffer) {
	console.log("Notification Temp: " + buffer);
}

function notifyHum(buffer) {
	console.log("Notification Hum: " + buffer)
}

function notifyPres(buffer) {
	console.log("Notification Pres: " + buffer);
}

function notifyFailure(reason) {
	console.log("Notification failed: " + reason);
}

// calculate new height for the content div in index.html
function rescaleContent() {
	console.log("[RESCALING] rescaling now");
	scroll(0, 0);
	var winHeight 		= $(window).height();
	var content 		= $("#content");
	var contentMargins 	= content.outerHeight() - content.height();
	var contentHeight 	= winHeight - contentMargins;
	content.height(contentHeight);
}

$(document).on("pagecreate", function() {
	var nextId = 1;
	$("#addListBTN").click(function() {
		var content = 	"<div data-role='collapsible' id='test" + nextId + "' data-iconpos='right'>" +
						"	<h1 id='name'>Name of Device2" + nextId + "</h1>" +
						"	<p id='info'>INFO: Some information about this device</p>" +
						"	<p id='RSSI'>RSSI: 4455q412</p>" +
						"</div>";
		$("#deviceList").append(content).collapsibleset("refresh");
		nextId++;
	});
});
