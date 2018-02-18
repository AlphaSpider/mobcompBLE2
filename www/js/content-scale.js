
$(document).ready(function() {
	$(window).on('resize orientationchange', rescaleContent());
});
$(function() {
    var timer_id;
    $(window).resize(function() {
        clearTimeout(timer_id);
        timer_id = setTimeout(function() {
            rescaleContent();
        }, 300);
    });
});
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
		console.log("[rescaleContent:] normal one-hand view");
		$("#responsBlock1").removeClass("responsive-block");
		$("#responsBlock2").removeClass("responsive-block");
	} else {
		// panorama view
		console.log("[rescaleContent]: panorama view");
		$("#responsBlock1").addClass("responsive-block");
		$("#responsBlock2").addClass("responsive-block");
	}
	
}