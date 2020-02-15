var $ = require('../../node_modules/jquery/dist/jquery')
window.jQuery = $;
window.$ = $;
var Chart = require('chart.js');

$(function () {

  window.chartColors = {
    red: "rgb(255, 99, 132)",
    orange: "rgb(255, 159, 64)",
    yellow: "rgb(255, 205, 86)",
    green: "rgb(75, 192, 192)",
    blue: "rgb(54, 162, 235)",
    purple: "rgb(153, 102, 255)",
    grey: "rgb(201, 203, 207)"
  };

  var colorsToAssign = [
    window.chartColors.blue,
    window.chartColors.green,
    window.chartColors.yellow,
    window.chartColors.red
  ]

  if (summaryChartData) {

    var summaryChartDatasetsWithColors = summaryChartData.datasets.map(
      (d, i) => {
        var d2 = { ...d }
        d2.backgroundColor = colorsToAssign[i]
        console.log(d2);
        return d2
      });
    summaryChartData.datasets = summaryChartDatasetsWithColors;
    console.log(summaryChartData)

    var leaderboard = new Chart(
      document.getElementById("FishFryLeaderboard"), {
      type: "bar",
      data: summaryChartData,
      options: {
        title: {
          display: false,
        },
        tooltips: {
          mode: 'index',
          intersect: false
        },
        responsive: true,
        scales: {
          xAxes: [{
            stacked: true,
          }],
          yAxes: [{
            stacked: true
          }]
        }
      }
    }
    );
  } else {
    console.log("No stats");
    $('#LeaderBoardAlert').show();
  }

})