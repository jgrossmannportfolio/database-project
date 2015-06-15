var userdb = require ('./userdb.js');
var database = require('./database.js');



exports.index = function (req, res) {
    var username = userdb.get_user_name(req.session.id);
    res.render('index', {title: "Database Project"});
};

exports.test = function(req, res) {
	var data = database.getTestData();
	res.render('people', {people:data});
}

exports.recommendations = function(req, res) {
    var recommendations = database.get_recommendations();
    res.render('recommendations', {recommendations:recommendations});
};

exports.reset_addin = function(req, res) {
    res.render('addin', {});
};
