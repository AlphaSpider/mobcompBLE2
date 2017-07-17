
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
var deviceNextId		= 0;
var stateConnected		= false;
var missingCalData		= false;
var connectedDevice;
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
$(document).on("pagecreate", function() {
	$("#startScanBtn").click(function() {
		console.log("Starting BLE Scann");
		ble.isEnabled(bleEnabled, bleDisabled);
	});
});


//BLE is enabled on the device
function bleEnabled() {
	$("#deviceList").empty();
	//start the scan
	ble.startScan([], deviceFound, failedToDiscover);
	// show a loader while scanning for devices
	$.mobile.loading("show", {
		text: "Scanning for devices",
		textVisible: true,
		theme: "a",
		textonly: false,
		html: ""
	});
	setTimeout(stopScan, 5000);
}

//BLE is disabled on the device
function bleDisabled() {
	//Try to enable BLE
	ble.enable(bleEnabled, enableFail);
}

function enableFail(err) {
	alert('Cannot enable Bluetooth: ' + err);
}

function failedToDiscover() {
	alert("Failed to discover a device.")
}

function stopScan() {
	alert('Finished Scanning');
	// hide loader
	$.mobile.loading("hide");
	ble.stopScan;
}
//found a Device, add it to the device list
function deviceFound(device) {
	console.log("[deviceFound] " + device.name);
	console.log(device);
	var newEntry = "<div data-role='collapsible' id='deviceListItem" + deviceNextId + "' data-iconpos='left'>" +
						"<h1 id='name" + deviceNextId + "'>" + device.name + "</h1>" +						
						"<p id='info" + deviceNextId + "'>INFO: Placeholder</p>" +
						"<p id='RSSI" + deviceNextId + "'>RSSI: 000000000000</p>" +
						"<div class='row center-xs'>" +
							"<div class='col-xs-12'>" +
								"<button id='conBtn" + deviceNextId + "' class='ui-btn ui-btn-inline ui-btn-fab ui-btn-raised clr-primary clr-bg-green clr-btn-accent-black'>T</button>" +
							"</div>" +
						"</div>" +
						"<p>" + device + "</p>"
					"</div>";
	if(deviceNextId == 0) {
		// remove the palceholder text
		$("listPlaceholder").remove();
	}
	
	if(device.name.toUpperCase == "TECO_ENV") {
		// chain method-calls on jQuery object
		newEntry.find("info" + deviceNextId)
		.html("You can connect to this device");
		
		// add onClick to List item
		// when clicked, check if connected or not
		newEntry.getElementById("conBtn" + deviceNextId).click(function() {
			var currentDevice = device;
			tryConnect(currentDevice);
		});
	} else {
		newEntry.switchClass("listItemUnusable")
		.find("#info" + deviceNextId)
		.html("Unkown device. Unable to connect.");
		newEntry.find("#conBtn" + deviceNextId).className += 'ui-disabled';
	}
	deviceNextId++;
	$("#deviceList").append(newEntry).collapsibleset("refresh");
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
		alert("Currently connected to device: " + connectedDevice.name);
	}
}

function connectionSuccess() {
	//Switch to new Page
	console.log("Page-Switch: try to sensorPage");
	$.mobile.pageContainer.pagecontainer("change", "#devicePage",
	{
		transition: 'slide',
		changeHash: false,
		reverse:	true,
		showLoadMsg:	true
	});
	
	//1. start retrieving calibration data
	
	// read CO calibration
	ble.read(connectedDevice.id, GAS_SERVICE, GAS_CO_CALIB, calibCOSucc, calibFail);
	// read NO2 calibration
	ble.read(connectedDevice.id, GAS_SERVICE, GAS_NO2_CALIB, calibNO2Succ, calibFail);
	// read NH3 calibration
	ble.read(connectedDevice.id, GAS_SERVICE, GAS_NH3_CALIB, calibNH3Succ, calibFail);
		
	//2. register for notification with Temp/Hum/Pres
	// register for Temp
	ble.startNotification(connectedDevice.id, ENV_SERVICE, ENV_TEMP, notifyTemp, notifyFailure);
	// register for Hum 
	ble.startNotification(connectedDevice.id, ENV_SERVICE, ENV_HUM, notifyHum, notifyFailure);
	// register for Pres
	ble.startNotification(connectedDevice.id, ENV_SERVICE, ENV_PRESS, notifyPres, notifyFailure);
	
	// register for CO
	ble.startNotification(connectedDevice.id, GAS_SERVICE, GAS_CO_RAW, notifyCO, notifyFailure);
	// register for NO2
	ble.startNotification(connectedDevice.id, GAS_SERVICE, GAS_NO2_RAW, notifyNO, notifyFailure);
	// register for NH3
	ble.startNotification(connectedDevice.id, GAS_SERVICE, GAS_NH3_RAW, notifyNH, notifyFailure)
/*	
	//3. after 7s register for notification CO/NO2/NH3
	setTimeout(function() {
		// stop former notifications 
		
	}, 7000);
*/
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
	$("#value_temp").html(bytesToString(buffer));
}

function notifyHum(buffer) {
	console.log("Notification Hum: " + buffer)
	$("#value_hum").html(bytesToString(buffer));
}

function notifyPres(buffer) {
	console.log("Notification Pres: " + buffer);
	$("#value_pres").html(bytesToString(buffer));
}

function notifyCO(buffer) {
	console.log("Notifcation CO: " + buffer);
	$("#value_co").html(bytesToString(buffer));
}

function notifyNO(buffer) {
	console.log("Notification NO: " + buffer);
	$("#value_no").html(bytesToString(buffer));
}

function notifyNH(buffer) {
	console.log("Notification NH: " + buffer);
	$("#value_nh").html(bytesToString(buffer));
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
	console.log("Adding some stuff");
	$("#Sensors").on("swipeleft", function(event) {
		// switch the scan button
		console.log("swipeleft :)");
	});
	$("#Sensors").on("swiperight", function(event) {
		// switch the scan button
		console.log("swiperight (:");
	});
});

function bytesToString(buffer) {
	return String.fromCharCode.apply(null, new Uint8Array(buffer));
}