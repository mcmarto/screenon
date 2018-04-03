const is_off = (on_off) => on_off === false;

function cumulated_time(data) {
  let cumulated = [];
  let currentTotal = 0;
  let last_entry = null;
  data.forEach(entry => {
    //if(entry.on_off === false) {
    if(is_off(entry.on_off)) { // if it is now off
	if(last_entry !== null) {
	  const delta = entry.instant - last_entry.instant;
	  currentTotal += delta;
	  cumulated.push({instant: entry.instant, value: currentTotal});
	}
    }
    last_entry = entry;
  });
  return cumulated;
}

// data: Entry[] where every entry belong to the same day
function group_by_hour(data) {
  var result = [];
  for(let i = 0; i<24; i++) {
    result.push({hour: i, hits: 0});
  }

  data.forEach(entry => {
    let hour_of_entry = 1 * moment.unix(entry.instant).format("HH");
    result[hour_of_entry].hits += 1;
  });

  return result;
}

// data: Entry[] where every entry belong to the same day and hour
function group_by_minute(data) {
  var result = [];
  for(let i = 0; i<60; i++) {
    result.push({hour: i, hits: 0});
  }

  data.forEach(entry => {
    let hour_of_entry = 1 * moment.unix(entry.instant).format("mm");
    result[hour_of_entry].hits += 1;
  });

  return result;
}


