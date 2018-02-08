
var stateConnected		= false;
var connectedDevice;
var deviceNextId		= 0;
var isScanning 			= false;

var timeBreak			= 500;
var timeShort			= 500;
var timeLong			= 1000;
var advancedCode;

var numberOffset 		= 25
var maxNumSymb			= 36
var alpha 				= ["A", "B", "C", "D", "E", "F", "G", "H", "I",
							"J", "K", "L", "M", "N", "O", "P", "Q", "R", 
							"S", "T", "U", "V", "W", "X", "Y", "Z", 
							"0","1", "2", "3", "4", "5", "6", "7", "8", "9",
							"_"];
var code 				= ["·-", "-···", "−·−·", "−··", "·", "··−·", "−−·", "····", "··", 
							"·−−−", "−·−", "·−··", "−−", "−·", "−−−", "·−−·", "−−·−", "·−·",
							"···", "−", "··−", "···−", "·−−", "−··−", "−·−−", "−−··",
							"−−−−−", "·−−−−", "··−−−", "···−−", "····−", "·····", "−····", "−−···", "−−−··", "−−−−·",
							"|"];


$( document ).ready(function() {
	console.log("ready!");
});
document.addEventListener("deviceready", function() {
	console.log(navigator.vibrate);
}, false);

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

	if(!isScanning) {
		isScanning = true;
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
	isScanning = false;
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
								"<button id='checkConBtn'" + deviceNextId + "' class='ui-btn ui-btn-inline ui-btn-fab ui-btn-raised clr-primary clr-bg-green clr-btn-accent-black'>T</button>" +
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
}

function connectionFailure(peripheral) {
	console.log("Failed to connect: " + peripheral);
}

$("#easyGamePage").on("pageshow", function() {
	initEasyGame();
	newEasyRound();
})
$("#advancedGamePage").on("pageshow", function() {
	initAdvancedRound();
	newAdvancedRound();
});

function initAdvancedRound() {
	$("#answerInput").val('');
	$("#advancedRatio").html("0/0");
	advancedCode = null;
	// Click event to vibrite the morse code
	$("#resendBtn").click(function() {
		console.log("Playing code: " + advancedCode);
		if(advancedCode != null) {
			var pattern = [];
			for(var i = 0; i < advancedCode.length - 1; i++) {
				// vibrate with pattern
				switch (advancedCode[i]) {
					case "·":
						// short vibration
						pattern.push(timeShort);
						//navigator.vibrate(timeShort);
						break;
					case "−":
						// long vibration
						pattern.push(timeLong);
						//navigator.vibrate(timeLong);
						break;
					default:
						console.log("Not playable at Index " + i);
						break;
				}
				// short break between each 
				pattern.push(timeBreak);
			}
			console.log(pattern);
			navigator.vibrate(pattern);
		}
	});
		// 3. readd the click event for approval
	$("#approveBtn").click(function() {
		var answer = $("#answerInput").val();
		var ratio = $("#advancedRatio").html().split("/");
		var total = parseInt(ratio[1]);
		var correct = parseInt(ratio[0]);
		console.log("Check answer: " + answer);
		if( answer.length == 1 && code[alpha.indexOf(answer)] == advancedCode) {
			// a proper answer, check if is correct
			$("#advancedRatio").html((++correct) + "/" + (++total));
		} else {
			// not a proper answer
			alert("Wrong answer. Length:" + answer.length);
			$("#advancedRatio").html((correct) + "/" + (++total));
		}
		$("#answerInput").val('');
		newAdvancedRound();
	});
	
}

function newAdvancedRound() {
	// 1. Select a new random morse code from 0 - (36 - 1)
	advancedCode = code[Math.floor(Math.random() * (maxNumSymb - 1))];
	console.log("New Code: " + advancedCode);
	// 2. clear the input area
	$("#answerInput").val('');
}

// plays the current advancedCode as vibrations


// game Logic for an easy game
function initEasyGame() {
	$("#easyRatio").html("0/0");

	for(var i = 0; i < 4; i++) {
		$("#ans" + i + "Btn").click(function() {
			// check if answer is correct and update the UI
			var ansSym = $("#" + this.id).text();
			var questSym = $("#easySymbol").text();

			// 1. get the ratio text
			var ratio = $("#easyRatio").text().split("/");
			var correct = parseInt(ratio[0]);
			var total = parseInt(ratio[1]);

			if(code.indexOf(questSym) == alpha.indexOf(ansSym)) {
				// answer was correct
				// update ratio
				$("#easyRatio").html("" + (++correct) + "/" + (++total));
			} else {
				// answer was incorrect
				// update only total
				$("#easyRatio").html("" + correct + "/" + (++total));
			}
			newEasyRound();
		});
	}
}

function newEasyRound() {
	
	// 1. Pick the random symbol index between 0 - (36 - 1)
	var symbolIndex = Math.floor(Math.random() * (maxNumSymb - 1));
	
	// 2. Show the new choosen Symbol 
	$("#easySymbol").html(code[symbolIndex]);

	// 3. Pick the random index for the correct option between 0 - 3
	var correctIndex = Math.floor(Math.random() * 4);
	
	// 4. Show other symbols on the option-buttons
	for(var i = 0; i < 4; i++) {
		if(i == correctIndex) {
			$("#ans" + i + "Btn").html(alpha[symbolIndex]);
		} else {
			$("#ans" + i + "Btn").html(alpha[Math.floor(Math.random() * (maxNumSymb - 1))]);
		}
	}
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