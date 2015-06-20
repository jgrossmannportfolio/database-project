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
    this.fullName = name;
    this.age = age;
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
     db.query('SELECT * from Person', function(err, rows, fields) {
		if (!err) {
            callback(null, rows);
		} else {
			console.log('Error while performing Query.');
            callback(err, null);
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




