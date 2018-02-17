$(window).on('resize orientationchange', rescaleContent());


// calculate new height for the content div in index.html
function rescaleContent() {
	console.log("[RESCALING] rescaling now");
	scroll(0, 0);
	var winHeight 		= $(window).height();
	var winWidth 		= $(window).width();
	var content 		= $("#content");
	var contentMargins 	= content.outerHeight() - content.height();
	var contentHeight 	= winHeight - contentMargins;
	content.height(contentHeight);
	
	if(winHeight > winWidth) {
		// normal one-hand
	} else {
		// panorama view
	}
	
}