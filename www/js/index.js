
var SERVICE				= "713D0000-503E-4C75-BA94-3148F18D941E";
/** 
*	1 Byte - READ
*	Amount of connected Motors
*/
var CHAR_MOTOR_COUNT	= "713D0001-503E-4C75-BA94-3148F18D941E";
/**
*	1 Byte - READ
*	maximum update frequency (per second) for the motors
*/
var CHAR_UPDT_FREQU		= "713D0002-503E-4C75-BA94-3148F18D941E";
/**
*	5 Byte - READ/WRITE
*	current force for the motors
*	Bsp: 0x 00 00 FF 00 00 => 3. Motor on maximum force
*/
var CHAR_MOTOR_FORCE	= "713D0003-503E-4C75-BA94-3148F18D941E";

// BLE Connection variables
var stateConnected		= false;
var connectedDevice;
var deviceNextId		= 0;
var isScanning 			= false;

// App options variables
var motorForceOff		= 0//0x00;
var motorForceOn		= 255;//0xFF;
var motorCount			= 0;
var updateFreq			= 0;
var outBufferOn;
var outBufferOff;

// Game variables
var shortLongRatio		= 0.5;
var timeBaseMax			= 1000;
var timeBreak			= 500;
var timeShort			= 500;
var timeLong			= 1000;
var advancedCode;
var selectedCode;

var numberOffset 		= 25
var maxNumSymb			= 36
var alpha 				= ["A", "B", "C", "D", "E", "F", "G", "H", "I",
							"J", "K", "L", "M", "N", "O", "P", "Q", "R", 
							"S", "T", "U", "V", "W", "X", "Y", "Z", 
							"0","1", "2", "3", "4", "5", "6", "7", "8", "9",
							"_"];
var code 				= ["·−", "−···", "−·−·", "−··", "·", "··−·", "−−·", "····", "··", 
							"·−−−", "−·−", "·−··", "−−", "−·", "−−−", "·−−·", "−−·−", "·−·",
							"···", "−", "··−", "···−", "·−−", "−··−", "−·−−", "−−··",
							"−−−−−", "·−−−−", "··−−−", "···−−", "····−", "·····", "−····", "−−···", "−−−··", "−−−−·",
							"|"];

$( document ).ready(function() {
	console.log("ready!");
	$("#codeOptionPanel").panel();

});
document.addEventListener("deviceready", function() {
	//console.log(navigator.vibrate);
}, false);

$(document).on("pageshow", function() {
	rescaleContent();
});

// handle Back navigation between pages
$(document).on("pagecontainerbeforechange", function (e, data) {
																		// && data.prevPage[0].id == "PageX"
    if (typeof data.toPage == "string" && data.options.direction == "back") {
		console.log("[onChangePage]: try to move to page");
		switch($.mobile.activePage.attr("id")) {
			case "gameOptionPage":
				console.log("[onChangePage]: Called");
				if(stateConnected) {
					console.log("[onChangePage]: Disconnecting from device: " + connectedDevice.id);
					ble.disconnect(connectedDevice.id, showToast("Disconnected", 2000));
					stateConnected = false;
					connectedDevice = null;
				}
				data.toPage = "#startPage";
				break;
			case "advancedGamePage":
				data.toPage = "#gameOptionPage";
				break;
			case "easyGamePage":
				data.toPage = "#gameOptionPage";
				break;
			case "startPage":
				data.toPage = "#startPage";
				break;
			case "codeTablePage":
				data.toPage = "#gameOptionPage";
				break;
			default:
				console.log("[NavError] Not in scope of navigation");
				break;
		}
    }
});


/*
	Everything starts with this
*/
$(document).on("pagecreate", function() {
	
	$("#startScanBtn").click(function() {
		if(!isScanning) {
			$("#listPlaceholder").hide();
			$("#withoutDevBtn").removeClass("ui-disabled");
			console.log("Starting BLE Scann");
			ble.isEnabled(bleEnabled, bleDisabled);
		}
	});
	$("#withoutDevBtn").addClass("ui-disabled");
});


//BLE is enabled on the device
function bleEnabled() {

	if(!isScanning) {
		isScanning = true;
		
		// show a toast informing about the scann
		showToast("Started scanning...", 2000);
		
		$("#deviceList").empty();
		//start the scan
		ble.startScan([], deviceFound, failedToDiscover);
		// show a loader while scanning for devices
		$.mobile.loading("show", {
			text: "Scanning for devices...",
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
	$("#withoutDevBtn").removeClass("ui-disabled");
}

function failedToDiscover() {
	alert("Failed to discover a device.")
}

function stopScan() {
	showToast("Finished Scan", 2000);
	// hide loader
	$.mobile.loading("hide");
	ble.stopScan(
		function() {console.log("[stopScan]: Stop successful.");},
		function() {console.log("[stopScan]: Stop failed.");}
	);
	isScanning = false;
	if(deviceNextId == 0) {
		// nothing was found
		$("#listPlaceholder").html("No devices found. Try again").show();
		$("#withoutDevBtn").removeClass("ui-disabled");
	}
}
//found a Device, add it to the device list
function deviceFound(device) {
	if(!device.name){
		console.log("[deviceFound]: no device name found.");
		console.log(device);
		return;
	} else {
		var newEntry = $("<div data-role='collapsible' id='deviceListItem" + deviceNextId + "' data-iconpos='left'>" +
							"<h1 id='name" + deviceNextId + "'>" + device.name + "</h1>" +						
							"<p id='info" + deviceNextId + "'>ID:"+ device.id + "</p>" +
							"<p id='RSSI" + deviceNextId + "'>RSSI:" + device.rssi + "</p>" +
							"<div class='row center-xs'>" +
								"<div class='col-xs-12'>" +
									"<a href='#' id='conBtn" + deviceNextId + "' class='ui-btn ui-btn-inline ui-btn-fab ui-btn-raised clr-primary clr-bg-green clr-btn-accent-black'>" +
										"<i class='zmdi zmdi-remote-control zmdi-2x'></i>" +
									"</a>" +
								"</div>" +
							"</div>" +
						"</div>");
		console.log(newEntry);
		if(deviceNextId == 0) {
			// remove the palceholder text
			$("#listPlaceholder").hide();
		}
		
		if(device.name.toUpperCase() == "TECO WEARABLE 6") {
			// chain method-calls on jQuery object
			newEntry.find("#info" + deviceNextId)
			.html("You can connect to this device");
			
			// add onClick to List item
			// when clicked, check if connected or not
			newEntry.find("#conBtn" + deviceNextId).click(function() {
				var currentDevice = device;
				tryConnect(currentDevice);
			});
		} else {
			newEntry.switchClass("listItemUnusable")
			.find("#info" + deviceNextId)
			.html("Unkown device. Unable to connect.");
			newEntry.find("#conBtn" + deviceNextId).addClass("ui-disabled");
		}
		deviceNextId++;
		$("#deviceList").append(newEntry).collapsibleset("refresh");
	}
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
		connectionFailure);
	} else {
		// currently connected to a device
		// show allert
		alert("Currently connected to device: " + connectedDevice.name);
		// switch to gameOptionPage
		$.mobile.pageContainer.pagecontainer("change", "#gameOptionPage",
			{transition: 'slide',
			changeHash: false,
			reverse:	true,
			showLoadMsg:	true
		});
	}
}

function connectionSuccess() {
	//Switch to new Page
	console.log("Page-Switch: try to gameOptionPage");
	$.mobile.pageContainer.pagecontainer("change", "#gameOptionPage",
	{
		transition: 'slide',
		changeHash: false,
		reverse:	true,
		showLoadMsg:	true
	});
	initConnectedDevice();
}

function connectionFailure(peripheral) {
	console.log("Failed to connect: " + peripheral);
	stateConnected = false;
	$("#withoutDevBtn").removeClass("ui-disabled");
}

function initConnectedDevice() {
	// 1. read amount of motors
	ble.read(connectedDevice.id, SERVICE, CHAR_MOTOR_COUNT, 
		function(buffer) {
			var temp = new Uint8Array(buffer);
			motorCount = temp[0];
			// 2. prepare the buffers for the motors
			outBufferOn = new Uint8Array(motorCount);
			outBufferOff = new Uint8Array(motorCount);
			for(var i = 0; i < motorCount; i++) {
				outBufferOn[i] = motorForceOn;
				outBufferOff[i] = motorForceOff;
			}
			// 3. set the force for each motor to show success
			var outBuffer = new Uint8Array(motorCount);
			for(var i = 0; i < motorCount; i++) {
				outBuffer[i] = motorForceOff;
			}
			for(var i = 0; i <= motorCount; i++) {
				if(i < motorCount) {
					setTimeout(function() {
					outBuffer[i] = motorForceOn;
					ble.write(connectedDevice.id, SERVICE, CHAR_MOTOR_FORCE, outBuffer.buffer,
					function(){
						console.log("[initiConnectedDevice.readSuccess.writeSuccess]:" + i + "-th Force was written.");
					}, 
					function(){
						console.log("[initConnectedDevice.readSuccess.writeFail]: Failed to write a motors force.");
					});
					}, i * 500);
				} else {
					setTimeout(function() {
					for(var i = 0; i < motorCount; i++) {
						outBuffer[i] = motorForceOff;
					}
					ble.write(connectedDevice.id, SERVICE, CHAR_MOTOR_FORCE, outBuffer.buffer, null, null);
					}, i * 500);
				}
			}
		}, 
		function(){
			console.log("[initConnectedDevice.readFail]: Error while reading the amount of motors. = " + motorCount);
		});
	// 3. read the update frequency
	ble.read(connectedDevice.id, SERVICE, CHAR_UPDT_FREQU, 
		function(data){
			var temp = new Uint8Array(data);
			console.log("[initConnectedDevice.readSuccess]: Data content " + JSON.stringify(data));
			updateFreq = temp[0];
		}, 
		function(){
			console.log("[initConnectedDevice.readFail]: Error while reading the update frequency...");
		});
}

// Init the optionSubmitBtn
$("#optionSubmitBtn").on("click", function() {
	// 1. get value for long and short signal time
	var shortPercent = parseInt($("#sliderSignal").val());
	// 2. calc new values for short, long and break times
	timeShort = Math.floor(timeBaseMax * (shortPercent / 100.0));
	timeLong = Math.floor(timeShort / shortLongRatio); 
	timeBreak = parseInt($("#sliderBreak").val());
	console.log("[optionSubmitBtn.onClick]: New timeShort = " 
				+ timeShort 
				+ " new timeLong = " + timeLong 
				+ " new timeBreak = " + timeBreak);
				
	// 3. get value for vibration strength
	var vibStrPercent = parseInt($("#sliderVibration").val());
	// 4. adjust the motor strength settings
	var minVibStr = 178;
	var difference = 255 - minVibStr;
	motorForceOn = minVibStr + Math.floor(difference * vibStrPercent / 100.0);
	console.log("[optionSubmitBtn.onClick] New Motor Force: "  + motorForceOn);
	for(var i = 0; i < outBufferOn.length; i++) {
		outBufferOn[i] = motorForceOn;
	}

	// 5. update values in UI
	$("#slideSigValue").html("  " + shortPercent);
	$("#slideBreakValue").html("  " + timeBreak);
	$("#slideVibValue").html("  " + vibStrPercent);
	// 6. close Panel
	$("#codeOptionPanel").panel("close");
});

$("#easyGamePage").on("pageshow", function() {
	initEasyGame();
	newEasyRound();
})
$("#advancedGamePage").on("pageshow", function() {
	initAdvancedRound();
	newAdvancedRound();
});

$("#codeTablePage").on("pageshow", function() {
	$("#codeListView").empty();
	$("#vibSelBtn").off("click");
	$("#vibSelBtn").on("click", function() {
		// 1. get the selected item from the list
		var temp = selectedCode.split("-");
		var tCode = code[temp[1]];
		// 2. vibrate the code of the item
		vibrate(getCodeVibPattern(tCode));
	});
	$("#vibSelBtn").addClass("ui-disabled");
	
	// add all alpha-code matches to the searchable table
	var template = "";
	for(var i = 0; i < maxNumSymb; i++) {
		// add index to id
		template = "<li id='listItem-"
					+ i
					+ "'><a href='#' " 
					+ "class='waves-effect waves-button waves-effect waves-button custom-font'"
					+ " id='codeItem-" 
					+ i 
					+ "'>"
					+ alpha[i] + " <span class='custom-code-margin'>" + code[i]
					+"</span></a></li>";
		$("#codeListView").append(template);
	}
	// add onClick for the li-elements,
	// to save the selected item
	$("#codeListView").children("li").on("click", function() {
		var index = $(this).index();
		// 1. Remove all "selected" indication from the elements
		$("#codeListView>li.item-selected").removeClass("item-selected");
		$("#listItem-" + index).addClass("item-selected");
		// 2. get ID of the clicked element
		selectedCode = "codeItem-" + index;
		$("#vibSelBtn").removeClass("ui-disabled");
	});
	// refresh the widget
	$("#codeListView").listview("refresh");
});

function initAdvancedRound() {
	console.log("[initAdvancedRound]: New ROUND!!!!");
	// 1. clear all UI/Navigation values and events
	$("#answerInput").val('');
	$("#advancedRatio").html("0/0");
	$("#resendBtn").off("click");
	$("#approveBtn").off("click");
	advancedCode = null;
	// 2. Click event to vibrate the morse code
	$("#resendBtn").on("click", function() {
		console.log("[initAdvancedRound.#resendBtn.onClick]: Playing code: " + advancedCode);
		if(advancedCode != null) {
			var pattern = getCodeVibPattern(advancedCode);
			console.log("[initAdvancedRound.#resendBtn.onClick]: Vibrate pattern: " + pattern);
			vibrate(pattern);
		} else {
			// show error for wrong input
		}
	});
	// 3. re-add the click event for approval
	$("#approveBtn").click(function() {
		var answer = $("#answerInput").val();
		var ratio = $("#advancedRatio").html().split("/");
		var total = parseInt(ratio[1]);
		var correct = parseInt(ratio[0]);
		console.log("Check answer: " + answer);
		if( answer.length == 1 && code[alpha.indexOf(answer)] == advancedCode) {
			// a proper answer, check if is correct
			// animate correct answer
			$(".ui-content").animate({
				backgroundColor: '#33cc33' 
			}, 200);
			$(".ui-content").animate({
				backgroundColor: '#ffffff' 
			}, 250);
			$("#advancedRatio").html((++correct) + "/" + (++total));
		} else {
			// not a proper answer
			$(".ui-content").animate({
				backgroundColor: '##ff3300' 
			}, 200);
			$(".ui-content").animate({
				backgroundColor: '#ffffff' 
			}, 250);
			showToast("Wrong answer. Correct was > " + codeToChar(advancedCode) + " <", 1000);
			$("#advancedRatio").html((correct) + "/" + (++total));
		}
		$("#answerInput").val('');
		newAdvancedRound();
	});
	// 4. populate the select input
}

function getCodeVibPattern(codeStr) {
	var pattern = [];
	for(var i = 0; i < codeStr.length; i++) {
		// vibrate with pattern
		switch (codeStr[i]) {
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
				console.log("[getCodeVibPattern] Not playable at Index " + i + " Content= " + codeStr[i]);
				break;
		}
	}
	return pattern;
}

/**
*	Vibrate the connected Wearable or the smartphone, 
*	if no wearable is connected.
*	pattern: array of signal-durations for a code
*/
function vibrate(pattern) {
	if(stateConnected) {
		console.log("[vibrate]: Connected, vibrate on device...");
		// 1. 	calculate a time array to fire on and off events
		//		starting with the first OFF event
		var etp = [];
		for(var i = 0; i < (pattern.length * 2) - 1; i++) {
			if(i % 2 === 1) {
				// add break time
				etp[i] = timeBreak;
			} else {
				// add duration time
				etp[i] = pattern[(i / 2)];
			}
		}		
		for(var i = 1; i < etp.length; i++) {
			etp[i] += etp[i - 1];
		}
		
		var temp;
		// dark magic :/ maybe refactor...
		// vibrate the Gatt device for the given pattern
		var logStr = "[vibrate]: ";
		setMotorState("ON");
		for(var i = 0; i < etp.length; i++) {
						
			(i % 2 === 0) ? temp = "OFF" : temp = "ON";
			logStr += "[" + temp + "] - after " + etp[i] + "ms| \n";
			// trigger new motor state for the next pattern value
			setTimeout(setMotorState, etp[i], temp);
		}
		console.log(logStr);
	} else {
		console.log("[vibrate]: Not connected to device, use smartphone.");
		// use backup method
		navigator.vibrate(pattern);
	}
}

function setMotorState(state) {
	if(state === "ON") {
		ble.write(connectedDevice.id, SERVICE, CHAR_MOTOR_FORCE, outBufferOn.buffer, 
			function() {
				console.log("[setMotorState]: ON");
			}, 
			function() {
				console.log("[setMotorState]: Failed to ON!");
			});
	} else if (state === "OFF") {
		ble.write(connectedDevice.id, SERVICE, CHAR_MOTOR_FORCE, outBufferOff.buffer, 
			function() {
				console.log("[setMotorState]: OFF");
			}, 
			function() {
				console.log("[setMotorState]: Failed to OFF!");
			});
	} else {
		console.log("[setMotorState]: Wrong state - " + state);
	}
}

function codeToChar(c) {
	return alpha[code.indexOf(c)];
}

function newAdvancedRound() {
	// 1. Select a new random morse code from 0 - (36 - 1)
	advancedCode = code[Math.floor(Math.random() * (maxNumSymb - 1))];
	console.log("New Code: " + advancedCode);
	// 2. clear the input area
	$("#answerInput").val('');
}

// game Logic for an easy game
function initEasyGame() {

	$("#easyRatio").html("0/0");

	for(var i = 0; i < 4; i++) {
		$("#ans" + i + "Btn").off("click");
		$("#ans" + i + "Btn").click(function() {
			// check if answer is correct and update the UI
			var ansSym = $("#" + this.id).text();	// alpha-num symbol
			var questSym = $("#easySymbol").text(); // coded symbol

			// 1. get the ratio text
			var ratio = $("#easyRatio").text().split("/");
			var correct = parseInt(ratio[0]);
			var total = parseInt(ratio[1]);
			if(code.indexOf(questSym) == alpha.indexOf(ansSym)) {
				// answer was correct
				$(".ui-content").animate({
					backgroundColor: '#33cc33' 
				}, 200);
				$(".ui-content").animate({
					backgroundColor: '#ffffff' 
				}, 200);
				// update ratio
				$("#easyRatio").html("" + (++correct) + "/" + (++total));
			} else {
				// answer was incorrect
				$(".ui-content").animate({
					backgroundColor: '##ff3300' 
				}, 200);
				$(".ui-content").animate({
					backgroundColor: '#ffffff' 
				}, 200);
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

function showToast(strMsg, time) {
			new $.nd2Toast({
			message: strMsg,
			ttl:	time
		});
}