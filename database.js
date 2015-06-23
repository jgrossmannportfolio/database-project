var async = require('async');
var next_anonymous = 1; 
var HOME = __dirname+"/../";
var util = require("util");
var encode = require("hashcode").hashCode;

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

function Event(email, e_name, date_start, date_end) {
    this.email = email;
    this.e_name = e_name;
    this.date_start = date_start;
    this.date_end = date_end;
}

function Friendship(wanter, gifter) {
    this.wanter = wanter;
    this.gifter = gifter;
}

function Address(email, a1, a2, city, state, zip) {
    this.email = email;
    this.a1 = a1;
    this.a2 = a2;
    this.city = city;
    this.state = state;
    this.zip = zip;
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
    console.log("current user: "+currentUser);
    db.query('SELECT * from Person', function(err, rows, fields) {
        console.log('query complete');
		if (err) {
            console.log('Error while performing Query.');
            callback(err, null);
            return;
		} else {
            console.log("success");
			callback(null, rows);
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
        }else{
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
    console.log("getting user events");
    db.query('Select * FROM Event WHERE email = ?', email, function(err, rows) {
        if (err) {
            console.log('Error while performing Query.');
            callback(err, null);
            return;
            
		} else {
            console.log("events no error");
			callback(null, rows, email);
            return;
		}
    });
}
exports.getUserEvents = getUserEvents;

var getEventItems = function(eventId, callback) {
    db.query('Select * FROM wants W, Item I WHERE W.upc = I.upc AND W.event_id = ?', eventId, function(err, rows) {
        if (err) {
            console.log('Error while performing Query.');
            callback(err, null, null);
            return;
            
		} else {
			callback(null, rows, eventId);
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
    console.log(want);
    if(event_id == null) {
        console.log("No event_id so this will go under general");
    }
    if(upc == null || quant == null || currentUser.email == null) {
        req.io.emit('Added Item', {alert:"One or more of the required fields is null"});
        return;
    }else {
        db.query('INSERT INTO wants set ?', want, function(err, rows) {
            if(err) {
                console.log('Query Error');
                req.io.emit('Added Item', {alert:""+err});
            }else {
                req.io.emit('Added Item', {});
            }
        });
    }
}
exports.addItem = addItem;

var getUserGeneralItems = function(email, callback) {
    db.query('SELECT * FROM Item I, wants W WHERE I.upc = W.upc AND W.event_id IS NULL AND W.email = ?', email, function(err, rows) {
        if(err) {
            console.log(err);
            callback(err, null);
        }else {
            callback(null, rows, email);
        }
    });
}
exports.getUserGeneralItems = getUserGeneralItems;

var removeItem = function(email, upc, callback) {
    if(email == null) {
        email = currentUser.email;
    }
    console.log(email, " "+upc);
    db.query('DELETE FROM wants WHERE email = ? AND upc = ?', [email, upc], function(err, rows) {
        if(err) {
            console.log(err);
            callback(err, null);
        }else {
            console.log("deleted?");
            callback(null, rows);
        }
    });
}
exports.removeItem = removeItem;

var newEvent = function(e_name, start_date, end_date, callback) {
    var email = currentUser.email;
    var event = new Event(email, e_name, start_date, end_date);
    if(e_name == null || start_date == null || end_date == null || email == null) {
        console.log("a value to new event is null");
        callback("A value to new event is null");
    }else {
        db.query('INSERT INTO Event set ?', event, function(err, rows) {
            if(err) {
                console.log(err);
                callback(err, null);
            }else {
                callback(null, rows);
            }
        });
    }
}
exports.newEvent = newEvent;

var getFriends = function(callback) {
    var email = currentUser.email;
    db.query('SELECT P.name, P.email FROM is_friend F, Person P WHERE F.wanter = P.email AND F.gifter = ?', email, function(err, rows) {
        if(err) {
            console.log(err);
            callback(err, null);
        }else {
            callback(null, rows);
        }
    });
}
exports.getFriends = getFriends;

var getNonFriends = function(callback) {
    var email = currentUser.email;
    db.query('SELECT P.name, P.email FROM Person P WHERE P.email NOT IN (SELECT P1.email FROM Person P1, is_friend F WHERE F.wanter = P1.email AND F.gifter = ?) AND P.email != ?', [email, email], function(err, rows) {
        if(err) {
            console.log(err);
            callback(err, null);
        }else {
            callback(null, rows);
        }
    });
}
exports.getNonFriends = getNonFriends;

var addFriend = function(wanter, callback) {
    var gifter = currentUser.email;
    var friendship = new Friendship(wanter, gifter);
    db.query('INSERT INTO is_friend set ?', friendship, function(err, rows) {
        if(err) {
            console.log(err);
            callback(err, null);
        }else {
            callback(null, rows);
        }
    });
}
exports.addFriend = addFriend;

var removeFriend = function(wanter, callback) {
    var gifter = currentUser.email;
    db.query('DELETE FROM is_friend WHERE wanter = ? AND gifter = ?', [wanter, gifter], function(err, rows) {
        if(err) {
            console.log(err);
            callback(err, null);
        }else {
            callback(null, rows);
        }
    });
}
exports.removeFriend = removeFriend;


var getFriendData = function(otherCallBack) {
    async.waterfall([
        function(callback) {
            getFriends(function(err, friends) {
                if(err) {
                    callback(err, null);
                }else {
                    callback(null, friends);
                }
            });
        },
    
        function(friends, callback) {
            var friendEventItems= {};
            var friendHash = {};
            var eventHash = {};
            async.forEach(friends, function(friend, callback) {
                friend.hash = encode().value(friend.email);
                friendHash[friend.email] = {name: friend.name, hash: friend.hash};
                getUserGeneralItems(friend.email, function(err, items) {
                    friendEventItems[friend.email] = {};
                    if(err) {
                        callback(err);
                    }else {
                        friendEventItems[friend.email].General = items;
                        eventHash.General = 'General';
                        //console.log("Got general items: "+items);
                        getUserEvents(friend.email, function(err, events) {
                            if(err) {
                                callback(err);
                            }else {
                                async.forEach(events, function(event, callback) {
                                    getEventItems(event.event_id, function(err, items) {
                                        if(err) {
                                            callback(err);
                                        }else {
                                            //console.log("got event items: "+items);
                                            eventHash[event.event_id] = event.e_name;
                                            friendEventItems[friend.email][event.event_id] = items;
                                            callback();
                                        }
                                    });
                                }, function(err) {
                                    if(err) {
                                        callback(err);
                                    }else {
                                        callback();
                                    }
                                });
                            }
                        });
                    }
                });
            }, function(err) {
                if(err) {
                    callback(err);
                }else {
                    callback(null, friendEventItems, friendHash, eventHash);
                }
            });
        }
    ], function(err, friendEventItems, friendHash, eventHash) {
            //console.log(util.inspect(friendEventItems, false, null));
            if(err) {
                console.log(err);
            }
            otherCallBack(err, friendEventItems, friendHash, eventHash);
        });
}
exports.getFriendData = getFriendData;

var getFriendEmailHash = function(callback) {
    friendHash = {};
    getFriends(function(err, friends) {
        if(err) {
            console.log(err);
            callback(err, null);
        }else {
            async.forEach(friends, function(friend, callback) {
                
                callback();
            }, function(err) {
                //console.log(util.inspect(friendHash, false, null));
                callback(null, friendHash);
            });
        }
    });
}
exports.getFriendEmailHash = getFriendEmailHash;

var getItemVendForEvent = function(req) {
    var event_id = req.data.event_id;
    var itemVendors = {};
    var email = req.data.email;
    var query;
    var param;
    //itemVendors[items.upc] = {}
    if(event_id == "General") {
        param = email;
        console.log("General query id "+email);
        query = "SELECT T2.upc, T2.vid, T2.name, T2.quat, T2.price, T2.discount, T1.email "+
                "FROM (SELECT W.upc, W.email "+
		            "FROM wants W "+
		            "WHERE W.event_id IS NULL AND W.email = ?) T1, "+
	                "(SELECT IV.upc, IV.vid, IV.quat, IV.price, IV.name, S.discount "+
	                "FROM (select V.name, IV.upc, IV.vid, IV.quat, IV.price from Vendor V, Item_vend IV where IV.vid = V.vid) IV "+
	                "Left Join Sale S "+
	                "ON IV.upc = S.upc And IV.vid = S.vid) T2 "+
                    "Where T1.upc = T2.upc";
    }else {
        param = event_id;
        query = "SELECT T2.upc, T2.vid, T2.name, T2.quat, T2.price, T2.discount, T1.email "+
                "FROM (SELECT E.event_id, W.upc, E.email "+
		            "FROM Event E, wants W "+
		            "WHERE W.event_id = E.event_id) T1, "+
	                "(SELECT IV.upc, IV.vid, IV.quat, IV.price, IV.name, S.discount "+
	                "FROM (select V.name, IV.upc, IV.vid, IV.quat, IV.price from Vendor V, Item_vend IV where IV.vid = V.vid) IV "+
	                "Left Join Sale S "+
	                "ON IV.upc = S.upc And IV.vid = S.vid) T2 "+
                    "Where T1.upc = T2.upc AND T1.event_id = ?";
    }
    //console.log(param);
    db.query(query, param, function(err, rows) {
        if(err) {
            console.log("error database query");
            console.log(err);
            req.io.emit("Vendors Finished", {itemVendors:itemVendors, event_id:event_id, err:err});
        }else {
            //console.log("query results: "+util.inspect(rows, false, null));
            async.forEach(rows, function(row, callback) {
                console.log("row: "+row.upc);
                if(itemVendors[row.upc] == null) {
                    itemVendors[row.upc] = [row];
                    callback();
                }else {
                    //console.log(row.upc);
                    itemVendors[row.upc].push(row);
                    callback();
                }
            }, function(err) {
                if(err) {
                    console.log(err);
                    req.io.emit("Vendors Finished", {itemVendors:itemVendors, event_id:event_id, err:err});
                }else {
                    req.io.emit("Vendors Finished", {itemVendors:itemVendors, event_id:event_id, err:err});
                }
            });
        }
    });
}
exports.getItemVendForEvent = getItemVendForEvent;

var getItemVend = function(req) {
    console.log("getting item vend");
    var vid = req.data.vid;
    var upc = req.data.upc;
    var event_id = req.data.event_id;
    var query = "SELECT S.discount, IV.price, S.vid, IV.upc "+
                "FROM (SELECT iv.price, iv.vid, iv.upc FROM Item_vend iv WHERE iv.vid = ? AND iv.upc = ?) IV "+
                "LEFT JOIN (SELECT s.discount, s.vid FROM Sale s WHERE s.vid = ? AND s.upc = ?) S "+
                "ON S.vid = IV.vid";
    db.query(query, [vid, upc, vid, upc], function(err, rows) {
        if(err) {
            console.log(err);
            req.io.emit("Got ItemVend", {data:rows, vid:vid, upc:upc, event_id:event_id, err:err});
        }else {
            //console.log(rows);
            req.io.emit("Got ItemVend", {data:rows, vid:vid, upc:upc, event_id:event_id, err:err});
        }
    });
};
exports.getItemVend = getItemVend;

var getOrderHistory = function(callback) {
    var email = currentUser.email;
    var query = "SELECT V.iname, B.quant, V.vname, B.name "+
                "FROM (SELECT * "+
                        "FROM buys B, Person P "+
                        "WHERE B.wanter = P.email "+
                        "AND B.gifter = ?) B, "+
                     "(SELECT IV.vid, IV.upc, V.name as vname, IV.iname "+
                                "FROM (SELECT IV.upc, IV.vid, I.name as iname "+
                                        "FROM Item I, Item_vend IV "+
                                        "WHERE I.upc = IV.upc) IV, Vendor V "+
                                "WHERE IV.vid = V.vid) V "+
                "WHERE B.upc = V.upc "+
                "AND B.vid = V.vid";
    db.query(query, email, function(err, rows) {
        if(err) {
            console.log(err);
            callback(err, null);
        }else {
            console.log(rows);
            callback(null, rows);
        }
    });
}
exports.getOrderHistory = getOrderHistory;

var getShippingAddresses = function(callback) {
    var email = currentUser.email;
    var query = "SELECT * "+
                "FROM Address A "+
                "WHERE A.email = ?";
    db.query(query, email, function(err, rows) {
        if(err) {
            console.log(err);
            callback(err, null);
        }else {
            callback(null, rows);
        }
    });
}
exports.getShippingAddresses = getShippingAddresses;

var removeAddress = function(a1, a2, city, state, zip, callback) {
    var email = currentUser.email;
    var address = [email, a1, a2, city, state, zip];
    var query = "DELETE FROM Address WHERE email = ? AND a1 = ? AND a2 = ? AND city = ? AND state = ? AND zip = ?";
    db.query(query, address, function(err, rows) {
        if(err) {
            console.log(err);
            callback(err);
        }else {
            callback();
        }
    });
}
exports.removeAddress = removeAddress;
    
var addAddress = function(a1, a2, city, state, zip, callback) {
    var email = currentUser.email;
    var address = new Address(email, a1, a2, city, state, zip);
    var query = "INSERT INTO Address set ?";
    console.log(address);
    db.query(query, address, function(err, rows) {
        if(err) {
            console.log(err);
            callback(err);
        }else {
            callback();
        }
    });
}
exports.addAddress = addAddress;         

var updateWant = function(wanter, upc, event_id, quantity, wantQuantity, min_age, callback) {
    var age = currentUser.age;
    if(age < min_age) {
        console.log("Too young to purchase");
        callback("You must be at least: "+min_age+" to purchase this item");
    }else {
        var quant = wantQuantity - quantity;
        if(quant == 0) {
            console.log("removing item");
            removeItem(wanter, upc, function(err, data) {
                if(err) {
                    console.log(err);
                    callback(err);
                }else {
                    console.log("removed");
                    console.log(data);
                    callback(null);
                }
            });
        }else {
            var query = 'UPDATE wants set ? WHERE upc = ? AND email = ?';
            db.query(query, [{quant:quant}, upc, wanter], function(err, rows) {
                if(err) {
                    console.log(err);
                    callback(err);
                }else {
                    callback(null);
                }
            });
        }
    }
}
exports.updateWant = updateWant;      
                        

