const turned_off = (on_off) => on_off === false;

function cumulated_time(data) {
  let cumulated = [];
  let currentTotal = 0;
  let last_entry = null;
  cumulated.push({instant: data[0].instant, value: 0});
  data.forEach(entry => {
    if(turned_off(entry.on_off)) {
	// TODO: for the time being, we decide to ignore the time before
	// the first screen change event if the screen was ON
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

function _group_by(data, ranges_number, time_format) {
  let result = [];
  for(let i=0; i<ranges_number; i++){
    result.push({interval: i, hits: 0});
  }

  data.forEach(entry => {
    let hour_of_entry = 1 * moment.unix(entry.instant).format(time_format);
    result[hour_of_entry].hits += 1;
  });

  return result;  
}

function group_by_day(data) {
  //return _group_by(data, 32, "YYYY MM DD")
  let result = [];
  
  data.forEach(entry => {
    
    let entry_interval = moment.unix(entry.instant).format("YYYY MM DD");
    if(result[entry_interval]) {
        result[entry_interval].value += 1;
    }
    else {
        result[entry_interval] = {interval: entry_interval, value: 1}
    }
  });

  return Object.values(result);
}

// data: Entry[] where every entry belong to the same day
function group_by_hour(data) {
  return _group_by(data, 24, "HH");
}

// data: Entry[] where every entry belong to the same day and hour
function group_by_minute(data) {
  return _group_by(data, 60, "mm");
}

function filter_by_day(data, requested_day) {
  let result = [];

  data.forEach(entry => {
    let day = moment.unix(entry.instant).format("YYYY MM DD");
    if(day === requested_day) {
        result.push(entry);
    }
  });

  return result;  
}

function merge_consecutive_entries(data) {
  return data.reduce((prev, entry) => {
    if(prev.length === 0) return [entry];

    const last_pos = prev.length - 1;
    if(prev[last_pos].on_off === entry.on_off) {
	// console.log(prev[last_pos].instant, entry.instant);
        prev[last_pos].instant = entry.instant;
    }
    else {
        prev.push(entry);
    }
    return prev;
  }, []);
}

function fix_data(data) {
  let merged_data = merge_consecutive_entries(data);

  // group entries by day
  let grouped_by_day = {};
  merged_data.forEach(entry => {
    let day = moment.unix(entry.instant).format("YYYY MM DD");
    if(grouped_by_day[day]) {
      grouped_by_day[day].push(entry);
    }
    else {
      grouped_by_day[day] = [entry];
    }
  });

  // add entries at midnight
  Object.keys(grouped_by_day).forEach((day, i) => {
    // TODO: replace this condition with fake "opposite" entry(?)
    if(i === 0) return;

    // not using moment.utc here because timestamps on server are not utc
    let midnight = moment(day, "YYYY MM DD");
    let previous_day_entries = grouped_by_day[Object.keys(grouped_by_day)[i-1]];
    let last_entry_of_previous_day = previous_day_entries[previous_day_entries.length-1];
    grouped_by_day[day].splice(0, 0, {instant: midnight.valueOf()/1000, on_off: last_entry_of_previous_day.on_off});
  });

  // flatten
  return Object.values(grouped_by_day).reduce((result, entries) => result.concat(entries), []);
}

function duration_distribution(single_day_data) {
  let cache = {};
  let currentTotal = 0;
  let last_entry = null;
  single_day_data.forEach(entry => {
    if(turned_off(entry.on_off)) {
	if(last_entry !== null) {
	  const delta = Math.round(entry.instant - last_entry.instant);
          if(cache[delta] !== undefined) {
              cache[delta] += 1;
	  }
          else {
	      cache[delta] = 1;
	  }
	}
    }
    last_entry = entry;
  });

  let distribution = [];
  let sorted_durations = Object.keys(cache).sort();
  sorted_durations.forEach(delta => {
    if(delta < 200) distribution.push({delta, hits: cache[delta]});
  });
  return distribution;
}
