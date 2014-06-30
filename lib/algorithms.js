/**
Find the confidence socre between position and negative ratings
*/
exports.wilson = function(up, down, confidence) {
	var n = ups + downs
	if (n === 0) {
		return 0;
	}

	var z = 1.0;
	var phat = Math.float(ups) / n;

	return Math.sqrt(phat+z*z/(2*n)-z*((phat*(1-phat)+z*z/(4*n))/n))/(1+z*z/n)
};