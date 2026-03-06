// ==================== GP MATH UTILITIES ====================
// Core Gaussian Process computations for spatial interpolation

/**
 * Square a number
 */
function sqr(x) { return x * x; }

/**
 * 2D Euclidean distance
 */
function dist2d(x1, y1, x2, y2) {
    return Math.sqrt(sqr(x1 - x2) + sqr(y1 - y2));
}

/**
 * Gaussian (RBF / Squared Exponential) kernel
 * @param {number} d - distance between two points
 * @param {number} lengthscale - characteristic length scale
 * @param {number} signalVar - signal variance (sigma_f^2)
 * @param {number} noiseVar - noise variance added on diagonal (sigma_n^2)
 * @returns {number} kernel value
 */
function gaussianKernel(d, lengthscale, signalVar, noiseVar) {
    if (noiseVar === undefined) noiseVar = 0;
    return signalVar * Math.exp(-(d * d) / (2 * lengthscale * lengthscale)) + (d === 0 ? noiseVar : 0);
}

/**
 * Generate synthetic SST-like observations
 * True field: warm in west, cool in east, with sinusoidal meridional pattern
 * @param {number} n - number of observations
 * @param {number} xMin - minimum x (longitude)
 * @param {number} xMax - maximum x (longitude)
 * @param {number} yMin - minimum y (latitude)
 * @param {number} yMax - maximum y (latitude)
 * @returns {Array} array of {x, y, temp} objects
 */
function generateSyntheticData(n, xMin, xMax, yMin, yMax) {
    var observations = [];
    for (var i = 0; i < n; i++) {
        var x = xMin + Math.random() * (xMax - xMin);
        var y = yMin + Math.random() * (yMax - yMin);
        // Synthetic SST: warm in west, cool in east, with variation
        var temp = 20 + (xMax - x) / (xMax - xMin) * 8 + Math.sin(y * Math.PI / (yMax - yMin)) * 3;
        var noise = (Math.random() - 0.5) * 0.5;
        observations.push({ x: x, y: y, temp: temp + noise });
    }
    return observations;
}

/**
 * Cholesky-based solve with fallback regularization
 * Solves K * alpha = y for alpha
 * @param {Array} K - covariance matrix (2D array)
 * @param {Array} y - target vector
 * @returns {Array} solution vector
 */
function choleskySolve(K, y) {
    try {
        var Lt = numeric.cholesky(K);
        var sol = numeric.solve(K, y);
        return sol;
    } catch (e) {
        console.warn('Cholesky decomposition failed, adding jitter:', e.message);
        // Fallback: add small regularization (jitter)
        var eps = 1e-6;
        for (var i = 0; i < K.length; i++) {
            K[i][i] += eps;
        }
        return numeric.solve(K, y);
    }
}

/**
 * Build the covariance matrix for a set of points
 * @param {Array} points - array of {x, y} objects
 * @param {number} lengthscale
 * @param {number} signalVar
 * @param {number} noiseVar
 * @returns {Array} n x n covariance matrix
 */
function buildCovarianceMatrix(points, lengthscale, signalVar, noiseVar) {
    var n = points.length;
    var K = numeric.rep([n, n], 0);
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            var d = dist2d(points[i].x, points[i].y, points[j].x, points[j].y);
            K[i][j] = gaussianKernel(d, lengthscale, signalVar, i === j ? noiseVar : 0);
        }
    }
    return K;
}

/**
 * GP prediction at test points given observations
 * Computes posterior mean and variance at each test point
 * @param {Array} testPoints - array of {x, y} to predict at
 * @param {Array} obsPoints - array of {x, y} observation locations
 * @param {Array} obsValues - array of observed values
 * @param {number} lengthscale
 * @param {number} signalVar
 * @param {number} noiseVar
 * @returns {Array} array of {x, y, mean, variance}
 */
function predictGP(testPoints, obsPoints, obsValues, lengthscale, signalVar, noiseVar) {
    var K = buildCovarianceMatrix(obsPoints, lengthscale, signalVar, noiseVar);
    var Kinv = numeric.inv(K);

    var predictions = [];
    for (var t = 0; t < testPoints.length; t++) {
        var testPt = testPoints[t];
        var k_star = [];
        for (var i = 0; i < obsPoints.length; i++) {
            var d = dist2d(testPt.x, testPt.y, obsPoints[i].x, obsPoints[i].y);
            k_star.push(gaussianKernel(d, lengthscale, signalVar, 0));
        }

        var k_starstar = signalVar;

        var mean = numeric.dot(k_star, numeric.dot(Kinv, obsValues));
        var variance = k_starstar - numeric.dot(k_star, numeric.dot(Kinv, k_star));

        predictions.push({
            x: testPt.x,
            y: testPt.y,
            mean: mean,
            variance: Math.max(0, variance)
        });
    }
    return predictions;
}

/**
 * Generate a regular 2D grid of test points
 * @param {number} xMin
 * @param {number} xMax
 * @param {number} yMin
 * @param {number} yMax
 * @param {number} nx - number of grid points in x
 * @param {number} ny - number of grid points in y
 * @returns {Array} array of {x, y} grid points
 */
function generateGrid(xMin, xMax, yMin, yMax, nx, ny) {
    var grid = [];
    var dx = (xMax - xMin) / (nx - 1);
    var dy = (yMax - yMin) / (ny - 1);
    for (var i = 0; i < nx; i++) {
        for (var j = 0; j < ny; j++) {
            grid.push({
                x: xMin + i * dx,
                y: yMin + j * dy
            });
        }
    }
    return grid;
}

// Note: Math rendering is handled by Distill's template.v2.js via <d-math> and $...$ syntax.
// No manual KaTeX rendering needed.
