
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
var connectedDevice;

$( document ).ready(function() {
	console.log("ready!");
});

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
		newEntry.click(function() {
			/*TODO*/
			if(!stateConnected) {
				// connect to device
				
			} else {
				// disconnect from former device
			}
		});
		
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

$(document).on("pageshow", function() {
	rescaleContent();
});

$(window).on('resize orientationchange', rescaleContent());


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


