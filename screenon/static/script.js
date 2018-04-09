var FULL_TIME_ENTRIES = [];
var DAY_MIN_INSTANTS = [];

function create_chart(data) {
var ctx = document.getElementById("myChart").getContext('2d');
var myChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        labels: data.map(d => d.instant),
        datasets: [{
            label: 'screen change events',
            data: data.map(d => {return {x: d.instant, y: (d.on_off ? 1 : 0)}}),
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }],
	    line: {
	         steppedLine: 'after'
	    }
        }
    }
});
}

function create_cumulated_chart(data) {
var ctx = document.getElementById("cumulatedChart").getContext('2d');
const cumulated_data = cumulated_time(data);
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: cumulated_data.map(d => d.instant),
        datasets: [{
            label: 'screen on time (cumulated)',
            data: cumulated_data.map(d => {return {x: d.instant, y: d.value}}),
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }],
	    line: {
	         steppedLine: 'after'
	    }
        }
    }
});
}

function create_screenchange_chart(data, chartOptions) {
chartOptions = chartOptions || {
  id: "screenChangesChart",
  grouping_fn: group_by_hour,
  label: "screen change events in an hour"
};
var ctx = document.getElementById(chartOptions.id).getContext('2d');
var grouped_data = chartOptions.grouping_fn(data);
var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: grouped_data.map(d => d.hour),
        datasets: [{
            label: chartOptions.label,
            data: grouped_data.map(d => d.hits),
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }
});
}

function create_table(data) {
  let tableContainer = document.querySelector("#tbody");
    tableContainer.innerHTML = "";
  let counterContainer = document.querySelector("#counter");
    counterContainer.innerHTML = "#entries for the selected day: " + data.length;
  let cumulatedUsageTime = 0;
  data.forEach((entry, entryIndex) => {
    let newTr = document.createElement("tr");
    let instantTd = document.createElement("td");
    let onOffTd = document.createElement("td");
    let deltaTd = document.createElement("td");
    let cumulatedUsageTd = document.createElement("td");
    instantTd.innerHTML = moment.unix(entry.instant).format("MMMM Do YYYY, h:mm:ss a");
    onOffTd.innerHTML = entry.on_off ? "OFF -> ON" : "ON -> OFF";
    let delta = entryIndex === 0 ? 0 : Math.round(entry.instant - data[entryIndex-1].instant);
    deltaTd.innerHTML = entryIndex === 0 ? "" : (delta < 61 ? delta + " s" : delta + " s ~ " + Math.round(delta/60) + " minute(s)");
    if(entry.on_off) cumulatedUsageTime += delta;
    cumulatedUsageTd.innerHTML = entry.on_off ? ""+cumulatedUsageTime : "";
    newTr.appendChild(instantTd);
    newTr.appendChild(onOffTd);
    newTr.appendChild(deltaTd);
    newTr.appendChild(cumulatedUsageTd);
    tableContainer.appendChild(newTr);
  });
}

function fillDaySelector(data) {
  let current_day = "";
  let selector = document.querySelector("#daySelector");
  data.forEach((entry) => {
    let formatted_day = moment.unix(entry.instant).format("MMMM Do YYYY");
    if(current_day !== formatted_day) {
	    let new_option = document.createElement("option");
	    new_option.value = formatted_day;
	    new_option.key = entry.instant;
	    new_option.innerHTML = formatted_day;
	    daySelector.appendChild(new_option);
	    current_day = formatted_day;
	    DAY_MIN_INSTANTS.push(entry.instant);
    }
  });
}

function fillHourSelector(){
  let selector = document.querySelector("#hourSelector");
  for(let i=0; i<24; i++) {
    let new_option = document.createElement("option");
    new_option.key = i;
    new_option.innerHTML = "Hour "+i;
    selector.appendChild(new_option);
  }
}

function retrieveData() {
  var ajax = new AJAX(true);
  ajax.getJSON('/data/all',function(data) {
    data = {response: merge_consecutive_entries(data.response)};
    // create_chart(data.response)
    // create_table(data.response)
    fillDaySelector(data.response);
    fillHourSelector();
    FULL_TIME_ENTRIES = data.response;

    changeDay({currentTarget: {selectedOptions: [{key: data.response[0].instant}], selectedIndex: 0}});
    changeHour({currentTarget: {selectedOptions: [{key: 0}], selectedIndex: 0}});
  }, function(statusCode) {
    console.error(statusCode);
    alert("could not download data");
  });
}

function changeDay(e) {
  let min_instant = e.currentTarget.selectedOptions[0].key;
  let max_instant = DAY_MIN_INSTANTS[e.currentTarget.selectedIndex+1] || Infinity;
  const day_data = filter_day_data(min_instant, max_instant);
  create_chart(day_data);
  create_screenchange_chart(day_data);
  create_table(day_data);
  create_cumulated_chart(day_data);
  setTimeout(() => changeHour({currentTarget: document.querySelector("#hourSelector")}), 0);
}

function retrieve_selected_day_instants() {
  let daySelector = document.querySelector("#daySelector");
  let min_instant = daySelector.selectedOptions[0].key;
  let max_instant = DAY_MIN_INSTANTS[daySelector.selectedIndex+1] || Infinity;
  return {"min": min_instant, "max": max_instant};
}

function filter_day_data(min_instant, max_instant) {
  return FULL_TIME_ENTRIES.filter(entry => min_instant <= entry.instant && entry.instant < max_instant);
}

function changeHour(e) {
  let hour = e.currentTarget.selectedOptions[0].key;
  let instants = retrieve_selected_day_instants();
  let day_data = filter_day_data(instants.min, instants.max);
  create_screenchange_chart(day_data.filter(entry => 1*moment.unix(entry.instant).format("HH") === hour), {
	  id: "hourlyScreenChangesChart",
	  grouping_fn: group_by_minute,
	  label: "change events in a minute"
  });
}

function toggleChart(dom_node) {
  function _toggle() {
    if(dom_node.style.display === "none") {
       dom_node.style.display = "block";
    }
    else {
       dom_node.style.display = "none";
    }
  }
  return _toggle;
}

document.addEventListener("DOMContentLoaded", function() {
  document.querySelector("#daySelector").onchange=changeDay;
  document.querySelector("#hourSelector").onchange=changeHour;

  document.querySelector("#scatterChartContainer > span").onclick = toggleChart(document.querySelector("#scatterChartContainer > div"));
  document.querySelector("#screenChangesChartContainer > span").onclick = toggleChart(document.querySelector("#screenChangesChartContainer > div"));
  document.querySelector("#tableChartContainer > span").onclick = toggleChart(document.querySelector("#tableChartContainer > table"));
  document.querySelector("#githubChartContainer > span").onclick = toggleChart(document.querySelector("#githubChartContainer > table"));
});
