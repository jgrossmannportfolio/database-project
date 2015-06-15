//Template code to add in a user database to the application

var userhash = { };
var next_anonymous = 1; 

var add_user = function(id, user) {
    if (userhash[id] === undefined) {
        if (!user) {
            user = "anonymous" + next_anonymous;
            next_anonymous += 1;
        }
        userhash[id] = {
            'id': id,
            'user': user,
            'latency_results': [],
            'throughput': [],
        };
    }
    return userhash[id];
};
exports.add_user = add_user;

exports.get_user_name = function(id) {
    if (userhash[id] === undefined) {
        add_user(id, undefined);
    };
    return userhash[id].user;
};
exports.get_RTT_average = function(id) {
    results = userhash[id].latency_results;
    var i = 0;
    var avg = 0;
    if(results.length == 0) {
        return '';
    };
    for(i;i<5;i=i+1) {
        avg = avg + results[i];
    };  
    return avg / results.length;
};
exports.get_num_latency_results = function(id) {
    return userhash[id].latency_results.length;
};

var clear_latency_results = function(id) {
    userhash[id].latency_results = [];
};

exports.clear_latency_results = clear_latency_results;

exports.add_RTT = function(id, RTT) {
    if(userhash[id].latency_results.length >= 5) {
        return;
    } else{
        userhash[id].latency_results.push(RTT);
    };
};

exports.add_throughput= function(id, time) {
    if(userhash[id].throughput.length >= 5) {
        return;
    };
    userhash[id].throughput.push(time);
};

exports.clear_throughput = function(id) {
    userhash[id].throughput = [];
};

exports.get_throughput_average = function(id) {
    var i = 0;
    var avg = 0;
    throughput = userhash[id].throughput;
    if(throughput.length == 0) {
        return '';
    };
    for(i;i<throughput.length;i=i+1) {
        avg = avg + throughput[i];
    };
    avg = avg / throughput.length;
    return avg
};
        
