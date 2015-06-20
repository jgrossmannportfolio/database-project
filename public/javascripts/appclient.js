var socket = io.connect();
var myapp = (function(){

	var test = function() {
		socket.emit('test_database', {});
	};

	socket.on('test database result', function() {
		jQuery('#people').empty();
		jQuery('#people').load('/test');

	});

    var changeUser = function() {
        var temp = $(this).text();
        console.log("changing user to: "+temp);
        socket.emit('Change User', {email:temp});
    };

    socket.on('Change User Success', function() {
        console.log("want to change page to wishlist");
        window.location.href = "/wishlist";
    });


    return {
        init: function() {
            //console.log("Client-side app starting up")
			jQuery("#testbutton").click(test);
            jQuery("#Select-User a").click(changeUser);
        }
    }
})();
jQuery(myapp.init);

