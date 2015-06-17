var database = require('./database.js');

exports.index = function (req, res) {
    res.render('index', {title: "Database Project"});
};

exports.test = function(req, res) {
	var data = database.getTestData();
	res.render('people', {people:data});
}

