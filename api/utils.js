exports.arrayToObject = function(arr) {
	var tmp = {};
	var len = arr.length;
	for(var i=0; i<len; i++) {
		tmp[arr[i]] = arr[++i];
	}

	return tmp;
};