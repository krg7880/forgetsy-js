exports.filter = function(arr, filters) {
  var tmp = [];
  var len = arr.length;
  
  for(var i=0; i<len; i++) {
    if (filters[arr[i]]) {
      i+=1;
    } else {
      tmp.push({item: arr[i], score: arr[++i]});
    }
  }

  return tmp;
};