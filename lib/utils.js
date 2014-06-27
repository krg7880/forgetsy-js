exports.arrayToObject = function(arr) {
	if (!arr instanceof Array) {
		throw new TypeError('Expected an array');
	}

  let tmp = {};
  let len = arr.length;
  for (let i=0; i<len; i++) {
    if ((i % 2) == 0) {
      tmp[arr[i]] = arr[++i];
    }
  }

  return tmp;
};