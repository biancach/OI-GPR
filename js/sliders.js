// ==================== SLIDER SETUP ====================
// Creates d3-simple-slider instances for hyperparameter controls
// Each slider calls its corresponding update function in visualizations.js

/**
 * Create the lengthscale slider
 * @param {function} updateFn - callback(lengthscaleValue) to redraw the visualization
 */
function createLengthscaleSlider(updateFn) {
    var sliderContainer = d3.select('#lengthscale-slider');
    var width = parseInt(sliderContainer.style('width')) || 600;

    var slider = d3.sliderBottom()
        .min(0.1)
        .max(1.0)
        .step(0.01)
        .width(width - 80)
        .default(0.3)
        .fill('#ff9800')
        .on('onchange', function(val) {
            document.getElementById('lengthscale-value').textContent = val.toFixed(2);
            updateFn(val);
        });

    sliderContainer.append('g')
        .attr('transform', 'translate(40, 10)')
        .call(slider);
}

/**
 * Create the signal variance slider
 * @param {function} updateFn - callback(signalVarianceValue) to redraw
 */
function createSignalVarianceSlider(updateFn) {
    var sliderContainer = d3.select('#signal-variance-slider');
    var width = parseInt(sliderContainer.style('width')) || 600;

    var slider = d3.sliderBottom()
        .min(0.1)
        .max(3.0)
        .step(0.05)
        .width(width - 80)
        .default(1.0)
        .fill('#ff9800')
        .on('onchange', function(val) {
            document.getElementById('signal-variance-value').textContent = val.toFixed(2);
            updateFn(val);
        });

    sliderContainer.append('g')
        .attr('transform', 'translate(40, 10)')
        .call(slider);
}

/**
 * Create the noise variance slider
 * @param {function} updateFn - callback(noiseVarianceValue) to redraw
 */
function createNoiseVarianceSlider(updateFn) {
    var sliderContainer = d3.select('#noise-variance-slider');
    var width = parseInt(sliderContainer.style('width')) || 600;

    var slider = d3.sliderBottom()
        .min(0.01)
        .max(1.0)
        .step(0.01)
        .width(width - 80)
        .default(0.05)
        .fill('#ff9800')
        .on('onchange', function(val) {
            document.getElementById('noise-variance-value').textContent = val.toFixed(2);
            updateFn(val);
        });

    sliderContainer.append('g')
        .attr('transform', 'translate(40, 10)')
        .call(slider);
}
