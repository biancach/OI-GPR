// ==================== D3 VISUALIZATIONS ====================
// All figure-drawing functions for the SST interpolation article.
// Depends on: gp.js (math utilities), d3.v4, numeric.js

// ==================== HERO VISUALIZATION ====================
function drawHeroViz() {
    var container = d3.select('#hero-viz');
    var width = parseInt(container.style('width')) || 650;
    var height = 400;

    var margin = { top: 20, right: 20, bottom: 40, left: 50 };
    var plotWidth = width - margin.left - margin.right;
    var plotHeight = height - margin.top - margin.bottom;

    var svg = container.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xScale = d3.scaleLinear().domain([120, 280]).range([0, plotWidth]);
    var yScale = d3.scaleLinear().domain([-60, 60]).range([plotHeight, 0]);

    // Generate synthetic SST field
    var obsPoints = generateSyntheticData(15, 120, 280, -60, 60);
    var grid = generateGrid(120, 280, -60, 60, 40, 40);
    var predictions = predictGP(grid, obsPoints, obsPoints.map(function(p) { return p.temp; }), 30, 1, 0.01);

    // Color scale: blue (cold) → white → red (warm)
    var colorScale = d3.scaleLinear()
        .domain([15, 20, 25])
        .range(['#313695', '#ffffbf', '#a50026']);

    // Draw grid cells as circles
    svg.selectAll('circle')
        .data(predictions)
        .enter()
        .append('circle')
        .attr('cx', function(d) { return xScale(d.x); })
        .attr('cy', function(d) { return yScale(d.y); })
        .attr('r', 5)
        .attr('fill', function(d) { return colorScale(d.mean); })
        .attr('opacity', 0.8);

    // Draw observation points
    svg.selectAll('.obs-point')
        .data(obsPoints)
        .enter()
        .append('circle')
        .attr('class', 'obs-point')
        .attr('cx', function(d) { return xScale(d.x); })
        .attr('cy', function(d) { return yScale(d.y); })
        .attr('r', 3)
        .attr('fill', 'black')
        .attr('stroke', 'white')
        .attr('stroke-width', 1);

    // Axes
    svg.append('g')
        .attr('transform', 'translate(0,' + plotHeight + ')')
        .call(d3.axisBottom(xScale).ticks(5))
        .append('text')
        .attr('x', plotWidth / 2)
        .attr('y', 35)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .text('Longitude (°E)');

    svg.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -plotHeight / 2)
        .attr('y', -35)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .text('Latitude (°N)');
}

// ==================== PROBLEM VISUALIZATION ====================
function drawProblemViz() {
    var container = d3.select('#problem-viz');
    var width = parseInt(container.style('width')) || 650;
    var height = 350;

    var margin = { top: 20, right: 20, bottom: 40, left: 50 };
    var plotWidth = (width - margin.left - margin.right) / 2 - 20;
    var plotHeight = height - margin.top - margin.bottom;

    var svg = container.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xScale = d3.scaleLinear().domain([0, 10]).range([0, plotWidth]);
    var yScale = d3.scaleLinear().domain([0, 10]).range([plotHeight, 0]);

    // Sparse observations
    var obsPoints = [
        {x: 1, y: 2, val: 18},
        {x: 3, y: 7, val: 22},
        {x: 5, y: 5, val: 20},
        {x: 7, y: 3, val: 19},
        {x: 9, y: 8, val: 23}
    ];

    // --- Left panel: Sparse observations ---
    var leftG = svg.append('g');

    leftG.append('text')
        .attr('x', plotWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text('Observations (Data)');

    leftG.append('rect')
        .attr('width', plotWidth)
        .attr('height', plotHeight)
        .attr('fill', 'none')
        .attr('stroke', '#ddd');

    leftG.selectAll('.obs')
        .data(obsPoints)
        .enter()
        .append('circle')
        .attr('class', 'obs')
        .attr('cx', function(d) { return xScale(d.x); })
        .attr('cy', function(d) { return yScale(d.y); })
        .attr('r', 4)
        .attr('fill', 'black');

    leftG.append('g')
        .attr('transform', 'translate(0,' + plotHeight + ')')
        .call(d3.axisBottom(xScale).ticks(3));

    leftG.append('g')
        .call(d3.axisLeft(yScale).ticks(3));

    // --- Right panel: Interpolated field ---
    var rightG = svg.append('g')
        .attr('transform', 'translate(' + (plotWidth + 40) + ', 0)');

    var grid = generateGrid(0, 10, 0, 10, 12, 12);
    var predictions = predictGP(grid, obsPoints, obsPoints.map(function(p) { return p.val; }), 2, 4, 0.2);

    var colorScale = d3.scaleLinear()
        .domain([17, 20, 24])
        .range(['#4575b4', '#f7f7f7', '#d73027']);

    rightG.append('text')
        .attr('x', plotWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text('Interpolation + Uncertainty');

    rightG.append('rect')
        .attr('width', plotWidth)
        .attr('height', plotHeight)
        .attr('fill', 'none')
        .attr('stroke', '#ddd');

    rightG.selectAll('circle')
        .data(predictions)
        .enter()
        .append('circle')
        .attr('cx', function(d) { return xScale(d.x); })
        .attr('cy', function(d) { return yScale(d.y); })
        .attr('r', 4)
        .attr('fill', function(d) { return colorScale(d.mean); })
        .attr('opacity', function(d) { return Math.max(0.2, 1 - d.variance / 2); });

    rightG.append('g')
        .attr('transform', 'translate(0,' + plotHeight + ')')
        .call(d3.axisBottom(xScale).ticks(3));

    rightG.append('g')
        .call(d3.axisLeft(yScale).ticks(3));
}

// ==================== LENGTHSCALE INTERACTIVE ====================
function drawLengthscaleDemo() {
    var lengthscale = 0.3;
    var obsPoints = [
        {x: 0.2, y: 5}, {x: 0.8, y: 7}, {x: 1.5, y: 4},
        {x: 2.2, y: 8}, {x: 2.8, y: 5}, {x: 3.5, y: 6}
    ];
    var signalVar = 3;
    var noiseVar = 0.1;

    function update(ls) {
        lengthscale = ls;

        var container = d3.select('#lengthscale-viz');
        container.selectAll('*').remove();

        var width = parseInt(container.style('width')) || 650;
        var height = 400;
        var margin = { top: 20, right: 20, bottom: 40, left: 50 };
        var plotWidth = width - margin.left - margin.right;
        var plotHeight = height - margin.top - margin.bottom;

        var svg = container.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var xScale = d3.scaleLinear().domain([0, 4]).range([0, plotWidth]);
        var yScale = d3.scaleLinear().domain([2, 10]).range([plotHeight, 0]);

        var grid = generateGrid(0, 4, 2, 10, 40, 30);
        var predictions = predictGP(grid, obsPoints, obsPoints.map(function(p) { return p.y; }), ls, signalVar, noiseVar);

        var colorScale = d3.scaleLinear()
            .domain([3, 6, 9])
            .range(['#4575b4', '#f7f7f7', '#d73027']);

        svg.selectAll('circle')
            .data(predictions)
            .enter()
            .append('circle')
            .attr('cx', function(d) { return xScale(d.x); })
            .attr('cy', function(d) { return yScale(d.y); })
            .attr('r', 3)
            .attr('fill', function(d) { return colorScale(d.mean); })
            .attr('opacity', function(d) { return Math.max(0.1, 0.8 - d.variance * 0.1); });

        // Observation markers
        svg.selectAll('.lengthscale-obs')
            .data(obsPoints)
            .enter()
            .append('circle')
            .attr('class', 'lengthscale-obs')
            .attr('cx', function(d) { return xScale(d.x); })
            .attr('cy', function(d) { return yScale(d.y); })
            .attr('r', 4)
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        // Axes
        svg.append('g')
            .attr('transform', 'translate(0,' + plotHeight + ')')
            .call(d3.axisBottom(xScale).ticks(5))
            .append('text')
            .attr('x', plotWidth / 2)
            .attr('y', 35)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .text('X (arbitrary units)');

        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(5))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -plotHeight / 2)
            .attr('y', -35)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .text('Temperature (°C)');
    }

    // Create slider and wire it up
    createLengthscaleSlider(update);

    // Initial draw
    update(lengthscale);
}

// ==================== SIGNAL VARIANCE INTERACTIVE ====================
function drawSignalVarianceDemo() {
    var signalVar = 1.0;
    var obsPoints = [
        {x: 0.2, y: 5}, {x: 0.8, y: 7}, {x: 1.5, y: 4},
        {x: 2.2, y: 8}, {x: 2.8, y: 5}, {x: 3.5, y: 6}
    ];
    var lengthscale = 0.4;
    var noiseVar = 0.1;

    function update(sv) {
        signalVar = sv;

        var container = d3.select('#signal-variance-viz');
        container.selectAll('*').remove();

        var width = parseInt(container.style('width')) || 650;
        var height = 400;
        var margin = { top: 20, right: 20, bottom: 40, left: 50 };
        var plotWidth = width - margin.left - margin.right;
        var plotHeight = height - margin.top - margin.bottom;

        var svg = container.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var xScale = d3.scaleLinear().domain([0, 4]).range([0, plotWidth]);
        var yScale = d3.scaleLinear().domain([0, 10]).range([plotHeight, 0]);

        var grid = generateGrid(0, 4, 0, 10, 40, 30);
        var predictions = predictGP(grid, obsPoints, obsPoints.map(function(p) { return p.y; }), lengthscale, sv, noiseVar);

        var colorScale = d3.scaleLinear()
            .domain([2, 5, 8])
            .range(['#4575b4', '#f7f7f7', '#d73027']);

        svg.selectAll('circle')
            .data(predictions)
            .enter()
            .append('circle')
            .attr('cx', function(d) { return xScale(d.x); })
            .attr('cy', function(d) { return yScale(d.y); })
            .attr('r', 3)
            .attr('fill', function(d) { return colorScale(d.mean); })
            .attr('opacity', 0.8);

        svg.selectAll('.signal-var-obs')
            .data(obsPoints)
            .enter()
            .append('circle')
            .attr('class', 'signal-var-obs')
            .attr('cx', function(d) { return xScale(d.x); })
            .attr('cy', function(d) { return yScale(d.y); })
            .attr('r', 4)
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        svg.append('g')
            .attr('transform', 'translate(0,' + plotHeight + ')')
            .call(d3.axisBottom(xScale).ticks(5))
            .append('text')
            .attr('x', plotWidth / 2)
            .attr('y', 35)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .text('X (arbitrary units)');

        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(5))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -plotHeight / 2)
            .attr('y', -35)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .text('Temperature (°C)');
    }

    createSignalVarianceSlider(update);
    update(signalVar);
}

// ==================== NOISE VARIANCE INTERACTIVE ====================
function drawNoiseVarianceDemo() {
    var noiseVar = 0.05;
    var obsPoints = [
        {x: 0.2, y: 5}, {x: 0.8, y: 7}, {x: 1.5, y: 4},
        {x: 2.2, y: 8}, {x: 2.8, y: 5}, {x: 3.5, y: 6}
    ];
    var lengthscale = 0.4;
    var signalVar = 1.0;

    function update(nv) {
        noiseVar = nv;

        var container = d3.select('#noise-variance-viz');
        container.selectAll('*').remove();

        var width = parseInt(container.style('width')) || 650;
        var height = 400;
        var margin = { top: 20, right: 20, bottom: 40, left: 50 };
        var plotWidth = width - margin.left - margin.right;
        var plotHeight = height - margin.top - margin.bottom;

        var svg = container.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var xScale = d3.scaleLinear().domain([0, 4]).range([0, plotWidth]);
        var yScale = d3.scaleLinear().domain([2, 10]).range([plotHeight, 0]);

        var grid = generateGrid(0, 4, 2, 10, 40, 30);
        var predictions = predictGP(grid, obsPoints, obsPoints.map(function(p) { return p.y; }), lengthscale, signalVar, nv);

        var colorScale = d3.scaleLinear()
            .domain([3, 6, 9])
            .range(['#4575b4', '#f7f7f7', '#d73027']);

        svg.selectAll('circle')
            .data(predictions)
            .enter()
            .append('circle')
            .attr('cx', function(d) { return xScale(d.x); })
            .attr('cy', function(d) { return yScale(d.y); })
            .attr('r', 3)
            .attr('fill', function(d) { return colorScale(d.mean); })
            .attr('opacity', function(d) { return Math.max(0.1, 0.8 - d.variance * 0.05); });

        svg.selectAll('.noise-var-obs')
            .data(obsPoints)
            .enter()
            .append('circle')
            .attr('class', 'noise-var-obs')
            .attr('cx', function(d) { return xScale(d.x); })
            .attr('cy', function(d) { return yScale(d.y); })
            .attr('r', 4)
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        svg.append('g')
            .attr('transform', 'translate(0,' + plotHeight + ')')
            .call(d3.axisBottom(xScale).ticks(5))
            .append('text')
            .attr('x', plotWidth / 2)
            .attr('y', 35)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .text('X (arbitrary units)');

        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(5))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -plotHeight / 2)
            .attr('y', -35)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .text('Temperature (°C)');
    }

    createNoiseVarianceSlider(update);
    update(noiseVar);
}

// ==================== INTERACTIVE KRIGING ========================
function drawKrigingDemo() {
    var observations = generateSyntheticData(8, 0, 10, 0, 10);
    var lengthscale = 1.5;
    var signalVar = 2.0;
    var noiseVar = 0.05;

    function updateKriging() {
        var container = d3.select('#kriging-viz');
        container.selectAll('*').remove();

        var width = parseInt(container.style('width')) || 650;
        var height = 500;
        var margin = { top: 20, right: 20, bottom: 40, left: 50 };
        var plotWidth = width - margin.left - margin.right;
        var plotHeight = height - margin.top - margin.bottom;

        var svg = container.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var xScale = d3.scaleLinear().domain([0, 10]).range([0, plotWidth]);
        var yScale = d3.scaleLinear().domain([0, 10]).range([plotHeight, 0]);

        var grid = generateGrid(0, 10, 0, 10, 40, 40);
        if (observations.length > 0) {
            var obsValues = observations.map(function(p) { return p.temp; });
            var predictions = predictGP(grid, observations, obsValues, lengthscale, signalVar, noiseVar);

            var colorScale = d3.scaleLinear()
                .domain([15, 20, 25])
                .range(['#4575b4', '#f7f7f7', '#d73027']);

            svg.selectAll('circle')
                .data(predictions)
                .enter()
                .append('circle')
                .attr('cx', function(d) { return xScale(d.x); })
                .attr('cy', function(d) { return yScale(d.y); })
                .attr('r', 4)
                .attr('fill', function(d) { return colorScale(d.mean); })
                .attr('opacity', function(d) { return Math.max(0.15, 0.9 - d.variance * 0.3); });
        }

        // Observation points
        svg.selectAll('.kriging-obs')
            .data(observations)
            .enter()
            .append('circle')
            .attr('class', 'kriging-obs')
            .attr('cx', function(d) { return xScale(d.x); })
            .attr('cy', function(d) { return yScale(d.y); })
            .attr('r', 5)
            .attr('fill', 'black')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);

        // Temperature labels
        svg.selectAll('.kriging-label')
            .data(observations)
            .enter()
            .append('text')
            .attr('class', 'kriging-label')
            .attr('x', function(d) { return xScale(d.x); })
            .attr('y', function(d) { return yScale(d.y) - 10; })
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', 'black')
            .text(function(d) { return d.temp.toFixed(1); });

        // Clickable overlay for adding observations
        svg.append('rect')
            .attr('width', plotWidth)
            .attr('height', plotHeight)
            .attr('fill', 'transparent')
            .style('cursor', 'crosshair')
            .on('click', function(event) {
                var coords = d3.pointer(event);
                var x = xScale.invert(coords[0]);
                var y = yScale.invert(coords[1]);
                var temp = 20 + (10 - x) / 10 * 8 + Math.sin(y * Math.PI / 10) * 3 + (Math.random() - 0.5) * 0.5;
                observations.push({ x: x, y: y, temp: temp });
                updateKriging();
            });

        // Axes
        svg.append('g')
            .attr('transform', 'translate(0,' + plotHeight + ')')
            .call(d3.axisBottom(xScale).ticks(5))
            .append('text')
            .attr('x', plotWidth / 2)
            .attr('y', 35)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .text('Longitude (arbitrary units)');

        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(5))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -plotHeight / 2)
            .attr('y', -35)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .text('Latitude (arbitrary units)');
    }

    // Button handlers
    document.getElementById('add-random-btn').addEventListener('click', function() {
        var x = Math.random() * 10;
        var y = Math.random() * 10;
        var temp = 20 + (10 - x) / 10 * 8 + Math.sin(y * Math.PI / 10) * 3 + (Math.random() - 0.5) * 1;
        observations.push({ x: x, y: y, temp: temp });
        updateKriging();
    });

    document.getElementById('clear-observations-btn').addEventListener('click', function() {
        observations = [];
        updateKriging();
    });

    document.getElementById('sample-pattern-btn').addEventListener('click', function() {
        observations = generateSyntheticData(12, 0, 10, 0, 10);
        updateKriging();
    });

    updateKriging();
}

// ==================== CORRELATION VISUALIZATION ====================
function drawCorrelationViz() {
    var container = d3.select('#correlation-viz');
    var width = parseInt(container.style('width')) || 650;
    var height = 400;

    var margin = { top: 20, right: 20, bottom: 40, left: 50 };
    var plotWidth = (width - margin.left - margin.right) / 2 - 20;
    var plotHeight = height - margin.top - margin.bottom;

    var svg = container.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xScale = d3.scaleLinear().domain([0, 10]).range([0, plotWidth]);
    var yScale = d3.scaleLinear().domain([0, 10]).range([plotHeight, 0]);

    var refPoint = {x: 5, y: 5};
    var lengthscale = 2.0;
    var signalVar = 1.0;

    // --- Left: Reference location ---
    var leftG = svg.append('g');

    leftG.append('text')
        .attr('x', plotWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text('Reference Location');

    leftG.append('rect')
        .attr('width', plotWidth)
        .attr('height', plotHeight)
        .attr('fill', 'none')
        .attr('stroke', '#ddd');

    leftG.append('circle')
        .attr('cx', xScale(refPoint.x))
        .attr('cy', yScale(refPoint.y))
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', 'gold')
        .attr('stroke-width', 3);

    leftG.append('text')
        .attr('x', xScale(refPoint.x))
        .attr('y', yScale(refPoint.y) + 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text('★');

    leftG.append('g')
        .attr('transform', 'translate(0,' + plotHeight + ')')
        .call(d3.axisBottom(xScale).ticks(3));

    leftG.append('g')
        .call(d3.axisLeft(yScale).ticks(3));

    // --- Right: Covariance field ---
    var rightG = svg.append('g')
        .attr('transform', 'translate(' + (plotWidth + 40) + ', 0)');

    rightG.append('text')
        .attr('x', plotWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text('Spatial Covariance');

    var grid = generateGrid(0, 10, 0, 10, 30, 30);
    var covarianceMap = grid.map(function(pt) {
        return {
            x: pt.x,
            y: pt.y,
            cov: signalVar * Math.exp(-Math.pow(dist2d(pt.x, pt.y, refPoint.x, refPoint.y), 2) / (2 * lengthscale * lengthscale))
        };
    });

    var covScale = d3.scaleLinear()
        .domain([0, 1])
        .range(['#e8f4f8', '#1b9e77']);

    rightG.selectAll('circle')
        .data(covarianceMap)
        .enter()
        .append('circle')
        .attr('cx', function(d) { return xScale(d.x); })
        .attr('cy', function(d) { return yScale(d.y); })
        .attr('r', 5)
        .attr('fill', function(d) { return covScale(d.cov); })
        .attr('opacity', 0.9);

    rightG.append('rect')
        .attr('width', plotWidth)
        .attr('height', plotHeight)
        .attr('fill', 'none')
        .attr('stroke', '#ddd');

    rightG.append('g')
        .attr('transform', 'translate(0,' + plotHeight + ')')
        .call(d3.axisBottom(xScale).ticks(3));

    rightG.append('g')
        .call(d3.axisLeft(yScale).ticks(3));
}

// ==================== MARGINAL LIKELIHOOD VISUALIZATION ====================
function drawMarginalLikelihoodViz() {
    var container = d3.select('#marginal-likelihood-viz');
    var width = parseInt(container.style('width')) || 650;
    var height = 400;

    var margin = { top: 20, right: 20, bottom: 50, left: 60 };
    var plotWidth = width - margin.left - margin.right;
    var plotHeight = height - margin.top - margin.bottom;

    var svg = container.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Generate likelihood surface
    var lengthscales = d3.range(0.2, 2.0, 0.1);
    var noiseVars = d3.range(0.01, 0.5, 0.025);

    var lsScale = d3.scaleLinear().domain([0.2, 2.0]).range([0, plotWidth]);
    var nvScale = d3.scaleLinear().domain([0.01, 0.5]).range([plotHeight, 0]);

    // Synthetic likelihood (peaked around ls=1.0, nv=0.1)
    var likelihood = [];
    var maxVal = 10;
    lengthscales.forEach(function(ls) {
        noiseVars.forEach(function(nv) {
            var val = -((ls - 1.0) * (ls - 1.0) + (nv - 0.1) * (nv - 0.1)) * 5 + maxVal;
            likelihood.push({ ls: ls, nv: nv, val: val });
        });
    });

    var colorScale = d3.scaleLinear()
        .domain([d3.min(likelihood, function(d) { return d.val; }), d3.max(likelihood, function(d) { return d.val; })])
        .range(['#4575b4', '#d73027']);

    svg.selectAll('rect')
        .data(likelihood)
        .enter()
        .append('rect')
        .attr('x', function(d) { return lsScale(d.ls); })
        .attr('y', function(d) { return nvScale(d.nv); })
        .attr('width', plotWidth / lengthscales.length)
        .attr('height', plotHeight / noiseVars.length)
        .attr('fill', function(d) { return colorScale(d.val); })
        .attr('opacity', 0.8);

    // Mark maximum
    svg.append('circle')
        .attr('cx', lsScale(1.0))
        .attr('cy', nvScale(0.1))
        .attr('r', 6)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

    svg.append('circle')
        .attr('cx', lsScale(1.0))
        .attr('cy', nvScale(0.1))
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // Axes
    svg.append('g')
        .attr('transform', 'translate(0,' + plotHeight + ')')
        .call(d3.axisBottom(lsScale).ticks(5))
        .append('text')
        .attr('x', plotWidth / 2)
        .attr('y', 40)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text('Lengthscale');

    svg.append('g')
        .call(d3.axisLeft(nvScale).ticks(5))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -plotHeight / 2)
        .attr('y', -45)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text('Noise Variance');

    svg.append('text')
        .attr('x', plotWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text('Marginal Likelihood');
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Delay visualizations slightly to ensure Distill template and DOM are ready
    setTimeout(function() {
        var demos = [
            ['drawProblemViz', drawProblemViz],
            ['initLengthscaleDemo', initLengthscaleDemo],
            ['initSignalVarianceDemo', initSignalVarianceDemo],
            ['initNoiseVarianceDemo', initNoiseVarianceDemo],
            ['drawKrigingDemo', drawKrigingDemo],
            ['drawCorrelationViz', drawCorrelationViz],
            ['drawMarginalLikelihoodViz', drawMarginalLikelihoodViz]
        ];

        demos.forEach(function(pair) {
            try {
                pair[1]();
            } catch (e) {
                console.error('Error initializing ' + pair[0] + ':', e);
            }
        });
    }, 500);
});
