// ==================== 1D GP VISUALIZATION ====================
// Built incrementally: Step 1 = plot data, Step 2 = GP, Step 3 = slider

// Equatorial SST slice (MODIS Aqua, March 3 2026, lat ~ 0°)
var equatorObs = [
  {lon: -139.062, sst: 26.160},
  {lon: -138.438, sst: 26.260},
  {lon: -137.812, sst: 26.100},
  {lon: -137.188, sst: 25.930},
  {lon: -136.562, sst: 26.145},
  {lon: -135.938, sst: 26.345},
  {lon: -135.312, sst: 26.040},
  {lon: -134.688, sst: 26.170},
  {lon: -134.062, sst: 26.350},
  {lon: -133.438, sst: 25.745},
  {lon: -132.812, sst: 26.360},
  {lon: -132.188, sst: 25.460},
  {lon: -131.562, sst: 23.190},
  {lon: -130.938, sst: 24.870},
  {lon: -130.312, sst: 25.215},
  {lon: -129.688, sst: 26.050},
  {lon: -129.062, sst: 26.060},
  {lon: -128.438, sst: 26.075},
  {lon: -127.812, sst: 26.155},
  {lon: -127.188, sst: 26.135},
  {lon: -126.562, sst: 25.795},
  {lon: -125.938, sst: 25.950},
  {lon: -125.312, sst: 26.020},
  {lon: -124.688, sst: 26.405},
  {lon: -124.062, sst: 26.875},
  {lon: -123.438, sst: 27.100},
  {lon: -122.812, sst: 27.380},
  {lon: -122.188, sst: 27.485},
  {lon: -121.562, sst: 27.340},
  {lon: -120.896, sst: 26.015},
  {lon: -120.271, sst: 26.960}
];

// ---- STEP 1: Just plot the observation dots ----
function plotObservations1d(svgId, obs) {
    var svg = d3.select('#' + svgId);
    if (!svg.node()) { console.error('SVG #' + svgId + ' not found'); return; }
    svg.selectAll('*').remove();

    var container = svg.node().parentNode;
    var totalWidth = container.clientWidth || 700;
    var totalHeight = 380;
    svg.attr('width', totalWidth).attr('height', totalHeight);

    var margin = {top: 25, right: 30, bottom: 50, left: 65};
    var w = totalWidth - margin.left - margin.right;
    var h = totalHeight - margin.top - margin.bottom;

    var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Scales
    var xMin = d3.min(obs, function(d){ return d.lon; }) - 0.5;
    var xMax = d3.max(obs, function(d){ return d.lon; }) + 0.5;
    var yMin = d3.min(obs, function(d){ return d.sst; }) - 0.8;
    var yMax = d3.max(obs, function(d){ return d.sst; }) + 0.8;

    var xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, w]);
    var yScale = d3.scaleLinear().domain([yMin, yMax]).range([h, 0]);

    // Grid lines
    g.append('g').attr('class', 'grid')
        .attr('transform', 'translate(0,' + h + ')')
        .call(d3.axisBottom(xScale).ticks(8).tickSize(-h).tickFormat(''))
        .selectAll('line').attr('stroke', '#eee');
    g.append('g').attr('class', 'grid')
        .call(d3.axisLeft(yScale).ticks(6).tickSize(-w).tickFormat(''))
        .selectAll('line').attr('stroke', '#eee');

    // Remove domain lines from grid
    g.selectAll('.grid .domain').attr('stroke', 'none');

    // Axes
    g.append('g').attr('transform', 'translate(0,' + h + ')')
        .call(d3.axisBottom(xScale).ticks(8).tickFormat(function(d){ return Math.abs(d) + '\u00B0W'; }))
        .selectAll('text').style('font-size', '11px');
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(6).tickFormat(function(d){ return d.toFixed(1) + '\u00B0C'; }))
        .selectAll('text').style('font-size', '11px');

    // Axis labels
    g.append('text').attr('x', w / 2).attr('y', h + 40)
        .attr('text-anchor', 'middle').style('font-size', '13px').style('fill', '#555')
        .text('Longitude');
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -h / 2).attr('y', -50)
        .attr('text-anchor', 'middle').style('font-size', '13px').style('fill', '#555')
        .text('SST (\u00B0C)');

    // Observation dots
    g.selectAll('.obs-dot')
        .data(obs)
        .enter().append('circle')
        .attr('class', 'obs-dot')
        .attr('cx', function(d){ return xScale(d.lon); })
        .attr('cy', function(d){ return yScale(d.sst); })
        .attr('r', 5)
        .attr('fill', '#333')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5);

    return {g: g, xScale: xScale, yScale: yScale, w: w, h: h, margin: margin};
}

// ---- STEP 2: 1D RBF kernel + GP posterior ----
function rbfKernel1d(x1, x2, lengthscale, signalVar) {
    var d = x1 - x2;
    return signalVar * Math.exp(-0.5 * d * d / (lengthscale * lengthscale));
}

function gpPosterior1d(obsX, obsY, testX, lengthscale, signalVar, noiseVar) {
    var n = obsX.length;
    var nTest = testX.length;

    // Build K (n x n) + noise on diagonal
    var K = [];
    for (var i = 0; i < n; i++) {
        K[i] = [];
        for (var j = 0; j < n; j++) {
            K[i][j] = rbfKernel1d(obsX[i], obsX[j], lengthscale, signalVar);
            if (i === j) K[i][j] += noiseVar + 1e-6; // jitter for stability
        }
    }

    var Kinv = numeric.inv(K);
    var alpha = numeric.dot(Kinv, obsY);

    var mean = [], upper = [], lower = [];
    for (var t = 0; t < nTest; t++) {
        var kStar = [];
        for (var i = 0; i < n; i++) {
            kStar.push(rbfKernel1d(testX[t], obsX[i], lengthscale, signalVar));
        }
        var mu = numeric.dot(kStar, alpha);
        var v = numeric.dot(Kinv, kStar);
        var variance = Math.max(0, signalVar - numeric.dot(kStar, v));
        var std = Math.sqrt(variance);

        mean.push(mu);
        upper.push(mu + 2 * std);
        lower.push(mu - 2 * std);
    }
    return {mean: mean, upper: upper, lower: lower};
}

// Draw GP posterior (mean line + uncertainty band) on top of existing plot
function drawGPOverlay(ctx, obs, testX, post) {
    var g = ctx.g, xScale = ctx.xScale, yScale = ctx.yScale;

    // ±2σ band
    var bandData = testX.map(function(x, i) {
        return {x: x, upper: post.upper[i], lower: post.lower[i]};
    });
    var area = d3.area()
        .x(function(d){ return xScale(d.x); })
        .y0(function(d){ return yScale(d.lower); })
        .y1(function(d){ return yScale(d.upper); });

    g.insert('path', '.obs-dot')
        .datum(bandData).attr('d', area)
        .attr('fill', '#4dabf7').attr('opacity', 0.2);

    // ±1σ band
    var inner = testX.map(function(x, i) {
        var s1 = (post.upper[i] - post.mean[i]) / 2;
        return {x: x, upper: post.mean[i] + s1, lower: post.mean[i] - s1};
    });
    g.insert('path', '.obs-dot')
        .datum(inner).attr('d', area)
        .attr('fill', '#4dabf7').attr('opacity', 0.2);

    // Mean line
    var line = d3.line()
        .x(function(d, i){ return xScale(testX[i]); })
        .y(function(d){ return yScale(d); });

    g.insert('path', '.obs-dot')
        .datum(post.mean).attr('d', line)
        .attr('fill', 'none').attr('stroke', '#1971c2').attr('stroke-width', 2.5);
}

// ---- STEP 3: Full interactive demo with slider ----
function drawFullGP1d(svgId, obs, lengthscale, signalVar, noiseVar) {
    var ctx = plotObservations1d(svgId, obs);
    if (!ctx) return;

    var obsX = obs.map(function(d){ return d.lon; });
    var obsY = obs.map(function(d){ return d.sst; });

    var xMin = d3.min(obsX) - 0.5;
    var xMax = d3.max(obsX) + 0.5;
    var nTest = 200;
    var testX = [];
    for (var i = 0; i < nTest; i++) {
        testX.push(xMin + (xMax - xMin) * i / (nTest - 1));
    }

    var post = gpPosterior1d(obsX, obsY, testX, lengthscale, signalVar, noiseVar);
    drawGPOverlay(ctx, obs, testX, post);

    // Parameter annotation
    var paramStr = '\u2113 = ' + lengthscale.toFixed(1) + '\u00B0   \u03C3\u00B2f = ' + signalVar.toFixed(2) + '   \u03C3\u00B2n = ' + noiseVar.toFixed(3);
    ctx.g.append('text').attr('x', ctx.w).attr('y', -8)
        .attr('text-anchor', 'end').style('font-size', '12px')
        .style('fill', '#888').style('font-family', 'monospace')
        .text(paramStr);
}

function initLengthscaleDemo() {
    var ls = 3.0, sv = 1.5, nv = 0.1;

    function update() {
        drawFullGP1d('lengthscale-viz', equatorObs, ls, sv, nv);
        document.getElementById('lengthscale-value').textContent = ls.toFixed(1) + '\u00B0';
    }

    // Use a plain HTML range input — guaranteed to work everywhere
    var sliderContainer = document.getElementById('lengthscale-slider-container');
    if (!sliderContainer) {
        // Create container if it doesn't exist (replace SVG slider)
        var svgEl = document.getElementById('lengthscale-slider');
        if (svgEl) {
            var div = document.createElement('div');
            div.id = 'lengthscale-slider-container';
            div.innerHTML = '<input type="range" id="lengthscale-range" min="0.3" max="15" step="0.1" value="3.0" style="width:100%">';
            svgEl.parentNode.replaceChild(div, svgEl);
        }
    }
    var rangeInput = document.getElementById('lengthscale-range');
    if (rangeInput) {
        rangeInput.addEventListener('input', function() {
            ls = parseFloat(this.value);
            update();
        });
    }
    update();
}

function initSignalVarianceDemo() {
    var ls = 3.0, sv = 1.5, nv = 0.1;

    function update() {
        drawFullGP1d('signal-variance-viz', equatorObs, ls, sv, nv);
        document.getElementById('signal-variance-value').textContent = sv.toFixed(2);
    }

    var svgEl = document.getElementById('signal-variance-slider');
    if (svgEl) {
        var div = document.createElement('div');
        div.id = 'signal-variance-slider-container';
        div.innerHTML = '<input type="range" id="signal-variance-range" min="0.01" max="10" step="0.05" value="1.5" style="width:100%">';
        svgEl.parentNode.replaceChild(div, svgEl);
    }
    var rangeInput = document.getElementById('signal-variance-range');
    if (rangeInput) {
        rangeInput.addEventListener('input', function() {
            sv = parseFloat(this.value);
            update();
        });
    }
    update();
}

function initNoiseVarianceDemo() {
    var ls = 3.0, sv = 1.5, nv = 0.1;

    function update() {
        drawFullGP1d('noise-variance-viz', equatorObs, ls, sv, nv);
        document.getElementById('noise-variance-value').textContent = nv.toFixed(3);
    }

    var svgEl = document.getElementById('noise-variance-slider');
    if (svgEl) {
        var div = document.createElement('div');
        div.id = 'noise-variance-slider-container';
        div.innerHTML = '<input type="range" id="noise-variance-range" min="0.001" max="3.0" step="0.01" value="0.1" style="width:100%">';
        svgEl.parentNode.replaceChild(div, svgEl);
    }
    var rangeInput = document.getElementById('noise-variance-range');
    if (rangeInput) {
        rangeInput.addEventListener('input', function() {
            nv = parseFloat(this.value);
            update();
        });
    }
    update();
}
