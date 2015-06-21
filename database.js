var userhash = { };
var next_anonymous = 1; 
var HOME = __dirname+"/../";

var mysql = require('mysql');
var db = mysql.createConnection({
	host : 'cs4111.cyiqnfca9p2n.us-west-2.rds.amazonaws.com',
	user : 'dhc2131',
	password: '4111database',
	database: 'cs4111',
});

var currentUser = null;
var allPeople = [];
var testData = "";
var temp = "";



function Person(email, name, age) {
    this.email = email;
    this.name = name;
    this.age = age;
}

function Want(email, upc, event_id, quant) {
    this.email = email;
    this.upc = upc;
    this.event_id = event_id;
    this.quant = quant;
}


var test_database = function(req) {
	//db.connect();

	db.query('SELECT * from Person', function(err, rows, fields) {
		if (!err) {
			console.log('Database fields: ', fields);
			testData = "";
			for(i=0; i<rows.length; i++) {
				testData += "Email: "+rows[i].email+"\tName: "+rows[i].name+"\tAge: "+rows[i].age+"\n";
			}
			req.io.emit("test database result");
		} else {
			console.log('Error while performing Query.');
		}
	});
	
	//db.end();
	
};
exports.test_database = test_database;

var getTestData = function(req) {
	return testData
};
exports.getTestData = getTestData;

var getAllUsers = function(callback) {
    var users = null;
    console.log("database: getting users");
    db.query('SELECT * from Person', function(err, rows, fields) {
		if (!err) {
            callback(null, rows);
            return;
		} else {
			console.log('Error while performing Query.');
            callback(err, null);
            return;
		}
	});
}
exports.getAllUsers = getAllUsers;


var getCurrentUser = function(callback) {
    if(currentUser === null) {
        console.log("getCurrentUser: no current user");
        callback(new Error("no current user"), null);
    }else {
        callback(null, currentUser);
        return;
    }
}
exports.getCurrentUser = getCurrentUser;

var setCurrentUser = function(req) {
    var newEmail = req.data.email;
    var allUsers = getAllUsers(function(err, data) {
        if(err) {
            console.log(err);
            return;
        }
    
        if(data) {
            for(i=0; i<data.length; i++) {
                if(newEmail === data[i].email) {
                    currentUser = data[i];
                    console.log("set the new user to "+newEmail);
                    req.io.emit("Change User Success");
                    return;
                }
            }
        }

    });
   
    
}
exports.setCurrentUser = setCurrentUser;

var createNewUser = function(req, callback) {
    var user = new Person(req.email1+"@"+req.email2, req.name, req.age);
    db.query('INSERT INTO Person set ?', user, function(err, rows) {
		if (err) {
            console.log(err);
            callback(err, null);
		} else {
            console.log(rows);
            callback(null, rows);
		}
	});
}
exports.createNewUser = createNewUser;

var removeUsers = function(data, callback) {
    var error = null;
    for(i=0; i<data.length; i++) {
        db.query('DELETE FROM Person where email = ?', data[i], function(err, rows) {
            if (err) {
                console.log(err);
                if(error != null) {
                    error = error + "\n"+err;
                }else {
                    error = ""+err;
                }
                /*if(i === (data.length - 1)) {
                    callback(error, null);
                    return;
                }*/
		    } else {
                /*if(i === (data.length - 1)) {
                    callback(error, rows);
                    return;
                }*/
		    }
        });
    }
    if(i == data.length) {
        callback(error);
    }
}   
exports.removeUsers = removeUsers;

var getUserEvents = function(email, callback) {
    db.query('Select * FROM Event WHERE email = ?', email, function(err, rows) {
        if (err) {
            console.log('Error while performing Query.');
            callback(err, null);
            return;
            
		} else {
			callback(null, rows);
            return;
		}
    });
}
exports.getUserEvents = getUserEvents;

var getEventItems = function(eventId, callback) {
    db.query('Select * FROM wants W, Item I WHERE W.upc = I.upc AND W.event_id = ?', eventId, function(err, rows) {
        if (err) {
            console.log('Error while performing Query.');
            callback(err, null);
            return;
            
		} else {
			callback(null, rows);
            return;
		}
    });
}
exports.getEventItems = getEventItems;

var getAllItems = function(callback) {
    db.query('Select * FROM Item', function(err, rows) {
        if(err) {
            console.log('Error while performing query');
            callback(err, null);
            return;
        } else {
            callback(null, rows);
            return;
        }
    });
}
exports.getAllItems = getAllItems;

var addItem = function(req) {
    var want = new Want(currentUser.email, req.data.upc, req.data.event_id, req.data.quant);
    var upc = req.data.upc;
    var quant = req.data.quant;
    var event_id = req.data.event_id;
    db.query('INSERT INTO wants set ?', want, function(err, rows) {
        if(err) {
            console.log('Query Error');
            req.io.emit('Added Item', {alert:""+err});
        }else {
            req.io.emit('Added Item', {});
        }
    });
}
exports.addItem = addItem;



