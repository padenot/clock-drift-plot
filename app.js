$ = document.querySelector.bind(document);
var root = $(".root");

function plot(data) {
  return new Promise((resolve, reject) => {
    var plotRoot = document.createElement("div");
    plotRoot.className = "load plot";
    var plotRoot2 = document.createElement("div");
    plotRoot2.className = "load plot2";
    var plotRoot3 = document.createElement("div");
    plotRoot3.className = "load plot3";
    var plotRoot4 = document.createElement("div");
    plotRoot4.className = "load plot4";
    var plotRootHist = document.createElement("div");
    plotRootHist.className = "hist plot";

    var system = {
      x: data.time,
      y: data.system_clock,
      name: "System",
      yaxis: "system clock vs. audio clock",
      type: "scatter"
    }

    var system_incr = new Uint32Array(data.system_clock.length - 1);
    for (var i = 0; i < system_incr.length; i++) {
      system_incr[i] = data.system_clock[i+1] - data.system_clock[i];
    }

    var system_incr_plot = {
      x: data.time,
      y: system_incr,
      name: "System clock increments",
      yaxis: "system clock increments",
      type: "scatter"
    }

    var audio = {
      x: data.time,
      y: data.audio_clock,
      name: "Audio",
      yaxis: "audio clock",
      type: "scatter"
    }

    var audio_incr = new Uint32Array(data.audio_clock.length - 1);
    for (var i = 0; i < audio_incr.length; i++) {
      audio_incr[i] = data.audio_clock[i+1] - data.audio_clock[i];
    }

    var audio_incr_plot = {
      x: data.time,
      y: audio_incr,
      name: "Audio clock increment",
      yaxis: "audio clock increments",
      type: "scatter"
    }

    var diff = {
      x: data.time,
      y: data.diff,
      name: "Diff",
      yaxis: "diff between system and audio clocks",
      type: "scatter"
    }

    var end = data.time[data.time.length - 1];

    var graphSeries = [
      system,
      audio,
    ];

    graphSeries2 = [
      diff
    ]

    graphSeries3 = [
      system_incr_plot
    ]

    graphSeries4 = [
      audio_incr_plot
    ]

    console.log(system_incr);
    console.log(audio_incr);

    var layout_both = {
      title: 'System clock vs. Audio clock',
      width: window.innerWidth * 0.75,
      xaxis: {
        exponentformat: "none"
      },
      yaxis: {
        title: 'system clock ',
      },
      yaxis2: {
        title: 'audio clock',
        overlaying: 'y',
      },
    };

    Plotly.newPlot(plotRoot, graphSeries, layout_both);

    var layout2 = {
      title: 'Diff between system clock and audio clock',
      width: window.innerWidth * 0.75,
      xaxis: {
        exponentformat: "none"
      },
      yaxis: {
        title: 'system clock - audio clock',
      },
    };

    var layout3 = {
      title: 'Increments of system clock',
      width: window.innerWidth * 0.75,
      xaxis: {
        exponentformat: "none"
      },
      yaxis: {
        title: 'system clock[i+1] - system clock[i]',
      },
    };

    var layout4 = {
      title: 'Increments of audio clock',
      width: window.innerWidth * 0.75,
      xaxis: {
        exponentformat: "none"
      },
      yaxis: {
        title: 'audio clock[i+1] - audio clock[i]',
      },
    };

    Plotly.newPlot(plotRoot2, graphSeries2, layout2);
    Plotly.newPlot(plotRoot3, graphSeries3, layout3);
    Plotly.newPlot(plotRoot4, graphSeries4, layout4);

    // var trace = {
    //   title: 'clock diff histogram',
    //   x: diff.y,
    //   histnorm: 'probability',
    //   type: 'histogram',
    //   autosize: true,
    // };
    // var layoutHist = {
    //   width: window.innerWidth * 0.75,
    //   title: 'Callback duration histogram',
    // }
    //Plotly.newPlot(plotRootHist, [trace], layoutHist);
    root.appendChild(plotRoot);
    root.appendChild(plotRoot2);
    root.appendChild(plotRoot3);
    root.appendChild(plotRoot4);
    // root.appendChild(plotRootHist);
    resolve(data);
  });
}
function parse(str) {
  return new Promise((resolve, reject) => {
    var len = str.length;

    var lines = str.split("\n");
    var result = {
      audio_clock: new Uint32Array(lines.length - 1),
      system_clock: new Uint32Array(lines.length - 1),
    };
    for (var i = 0; i < lines.length; i++) {
      var sp = lines[i].split(" ");
      if (sp.length != 2) {
        break; // end of file
      }
      result.audio_clock[i] = parseInt(sp[1]);
      result.system_clock[i] = parseInt(sp[0]);
    }

    console.log(result)

    resolve(result);
  });
}

function do_it(data) {
  parse(data).then(function(data) {
    return new Promise((resolve, reject) => {
      // compute ts diff between system clock and audio clock
      var diff = new Uint32Array(data.system_clock.length - 1);
      for (var i = 0; i < diff.length; i++) {
        diff[i] = data.system_clock[i] - data.audio_clock[i];
      }

      data.diff = diff;
      // Median
      var copyDiff = diff.slice(0);
      copyDiff.sort((a, b) => a - b);
      var median = copyDiff[Math.floor(copyDiff.length / 2)];

      // Mean
      var sum = 0;
      var len = diff.length;
      for (var i = 0; i < len; i++) {
        sum += diff[i];
      }
      var mean = sum / len;

      // Variance
      var variance = 0;
      for (var i = 0; i < len; i++) {
        variance += Math.pow(diff[i] - mean, 2);
      }
      variance /= len;

      // Standard deviation
      stddev = Math.sqrt(variance);

      var metricsRoot = document.createElement("div");
      metricsRoot.className = "metrics";
      metricsRoot.innerHTML = `
          <table>
          <tr><td> Mean</td><td> ${mean.toPrecision(4)}</td></tr>
          <tr><td> Median</td><td> ${median.toPrecision(4)}</td></tr>
          <tr><td> Variance</td><td> ${variance.toPrecision(4)}</td></tr>
          <tr><td> Standard deviation</td><td> ${stddev.toPrecision(4)}</td></tr>
          </table>
          `;
      root.appendChild(metricsRoot);

      var t = new Uint32Array(diff.length);
      for (var i = 0; i < t.length; i++) {
        t[i] = i; // ridiculous
      }

      data.mean = mean;
      data.variance = variance;
      data.stddev = stddev;
      data.median = median;
      data.time = t;

      resolve(data);
    });
  }).then(plot);
}
window.onload = function() {
  $('#data-file-input').onchange = function(e) {
    var file = e.target.files[0];
    var fr = new FileReader();
    fr.readAsText(file);
    fr.onload = function() {
      do_it(fr.result);
    }
  }

  $('button').onclick = function(e) {
    var url = $('#url-input').value;
    fetch(url).then(response => response.text()).then(function (text) {
      do_it(text);
    })
  }
}
