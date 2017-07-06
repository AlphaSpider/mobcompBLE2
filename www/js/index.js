
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
$(document).on("pagecreate", function() {
	$("#addListBtn").click(function() {
		console.log("Starting BLE Scann");
		ble.isEnabled(bleEnabled, bleDisabled);
	});
});


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
	console.log(device);
	var newEntry = 
		"<div data-role='collapsible' id='deviceListItem" + deviceNextId + "' data-iconpos='left'>" +
			"<h1 id='name" + deviceNextId + "'>" + device.name + "</h1>" +						
			"<p id='info" + deviceNextId + "'>INFO: Placeholder</p>" +
			"<p id='RSSI" + deviceNextId + "'>RSSI: 000000000000</p>" +
			"<div class='row center-xs'>" +
				"<div class='col-xs-12'>" +
					"<button id='conBtn" + deviceNextId + "' class='ui-btn ui-btn-inline ui-btn-fab ui-btn-raised clr-primary clr-bg-green clr-btn-accent-black'>T</button>" +
				"</div>" +
			"</div>" +
		"</div>";
	$("#deviceList").append(newEntry);
	if(deviceNextId == 0) {
		// remove the palceholder text
		$("listPlaceholder").remove();
	}
	
	if("undefined" === typeof device.name) {
		$("#deviceListItem" + deviceNextId).html(
			"<h1>No Name</h1>" +
			"<p>Cannot connect to this device.</p>"
		);
			
	} else if(device.name.toUpperCase() == "TECO_ENV") {
		// chain method-calls on jQuery object
		$("#info" + deviceNextId).html("You can connect to this device");
		// add onClick to List item
		// when clicked, check if connected or not
		$("#conBtn" + deviceNextId).click(function() {
			currentDevice = device;
			tryConnect(currentDevice);
		});
		
	} else {
		$("#info" + deviceNextId).html("Unkown device. Unable to connect.")
		$("#conBtn" + deviceNextId).addClass("ui-disabled");
	}
	$("#RSSI" + deviceNextId).html(device.rssi);
	deviceNextId++;
	$("#deviceList").collapsibleset("refresh");
}

function failedToDiscover(reason) {
	console.log("[Scanning]: Failed to scann for device. No Reason why. Stop Scanning.");
	alert("Failed to scann for device. No Reason why. Stop Scanning.");
	stopScan();
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
