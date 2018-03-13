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

function retrieveData() {
  var ajax = new AJAX(true);
  ajax.getJSON('/data/all',function(data) {
    // create_chart(data.response)
    // create_table(data.response)
    fillDaySelector(data.response)
    FULL_TIME_ENTRIES = data.response;

    changeDay({currentTarget: {selectedOptions: [{key: data.response[0].instant}], selectedIndex: 0}});
  }, function(statusCode) {
    console.error(statusCode);
    alert("could not download data");
  });
}

function changeDay(e) {
  let min_instant = e.currentTarget.selectedOptions[0].key;
  let max_instant = DAY_MIN_INSTANTS[e.currentTarget.selectedIndex+1] || Infinity;
  create_chart(FULL_TIME_ENTRIES.filter(entry => min_instant <= entry.instant && entry.instant < max_instant));
  create_table(FULL_TIME_ENTRIES.filter(entry => min_instant <= entry.instant && entry.instant < max_instant));
}
document.addEventListener("DOMContentLoaded", function() {
  document.querySelector("#daySelector").onchange=changeDay;
});
