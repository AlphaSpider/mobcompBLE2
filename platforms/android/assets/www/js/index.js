
document.addEventListener('deviceready', onDeviceReady, false);

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
	var parDevice = JSON.parse(device);
	var newEntry = document.getElemntById(
								"deviceEntryTemp").cloneNode(true);
	
	//set new id
	newEntry.setAttribute("id","deviceEntry");
	
	//set the value for the device JSON
	var json = newEntry.getElementsByClassName("deviceJSON")
	json[0].innerHTML = parDevice;
	
	//append entry to the list of BLE devices
	document.getElementById("deviceList").appendChild(newEntry);
}

//connect to the device
function connectToDevice(listElement) {
	var rssi = listElement.getElementsByClassName("deviceRSSI")[0].value;
}

$(document).on("pageshow", function() {
	rescaleContent();
});

§(window).on('resize orientationchange', rescaleContent());

// calculate new height for the content div in index.html
function rescaleContent() {
	scroll(0, 0);
	var winHeight = $(window).height();
	var content = $("#content");
	var contentMargins = content.outerHeight() - content.height();
	var contentHeight = winHeight - contentMargins;
	content.height(contentHeight);
}


