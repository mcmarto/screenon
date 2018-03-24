function create_chart(data) {
var ctx = document.getElementById("myChart").getContext('2d');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: data.map(d => d.instant),
        datasets: [{
            label: 'screen time',
            data: data.map(d => d.on_off ? 1 : 0),
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
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
  data.forEach((entry, entryIndex) => {
    let newTr = document.createElement("tr");
    let instantTd = document.createElement("td");
    let onOffTd = document.createElement("td");
    let deltaTd = document.createElement("td");
    instantTd.innerHTML = moment.unix(entry.instant).format("MMMM Do YYYY, h:mm:ss a");
    onOffTd.innerHTML = entry.on_off ? "ON" : "OFF";
    deltaTd.innerHTML = entryIndex === 0 ? "" : (entry.instant - data[entryIndex-1].instant)
    newTr.appendChild(instantTd);
    newTr.appendChild(onOffTd);
    newTr.appendChild(deltaTd);
	
    tableContainer.appendChild(newTr);
  });
}

function retrieveData() {
  var ajax = new AJAX(true);
  ajax.getJSON('http://127.0.0.1:5000/data/all',function(data) {
    create_chart(data.response)
    create_table(data.response)
  }, function(statusCode) {
    console.error(statusCode);
    alert("could not download data");
  });
}
