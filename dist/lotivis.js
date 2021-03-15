/*!
 * lotivis.js v1.0.45
 * https://github.com/lukasdanckwerth/lotivis#readme
 * (c) 2021 lotivis.js Lukas Danckwerth
 * Released under the MIT License
 */
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
typeof define === 'function' && define.amd ? define(['exports'], factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.lotivis = {}));
}(this, (function (exports) { 'use strict';

/**
 *
 */
var createID;
(function() {
  let uniquePrevious = 0;
  createID = function() {
    return 'lotivis-id-' + uniquePrevious++;
  };
}());

/**
 *
 * @class Component
 */
class Component {
  element;

  /**
   *
   * @param parent
   */
  constructor(parent) {
    if (!parent) throw 'No parent or selector specified.';
    if (typeof parent === 'string') {
      this.initializeFromSelector(parent);
    } else {
      this.initializeFromParent(parent);
    }
  }

  initializeFromSelector(selector) {
    this.selector = selector;
    this.parent = d3.select('#' + selector);
  }

  initializeFromParent(parent) {
    this.selector = createID();
    this.parent = parent;
  }

  // MARK: - Functions

  show() {
    if (!this.element) return;
    this.element.style('display', '');
  }

  hide() {
    if (!this.element) return;
    this.element.style('display', 'none');
  }

  get isVisible() {
    if (!this.element) return false;
    return this.element.style('display') !== 'none';
  }

  getElementEffectiveSize() {
    let width = this.element.style('width').replace('px', '');
    let height = this.element.style('height').replace('px', '');
    return [Number(width), Number(height)];
  }

  getElementPosition() {
    let element = document.getElementById(this.selector);
    if (!element) return [0, 0];
    let rect = element.getBoundingClientRect();
    let xPosition = rect.x + window.scrollX;
    let yPosition = rect.y + window.scrollY;
    return [xPosition, yPosition];
  }
}

class Color {
  constructor(r, g, b) {
    this.r = Math.round(r);
    this.g = Math.round(g);
    this.b = Math.round(b);
  }

  rgbString() {
    return `rgb(${this.r},${this.g},${this.b})`;
  }

  toString() {
    return this.rgbString();
  }

  colorAdding(r, g, b) {
    return new Color(this.r + r, this.g + g, this.b + b);
  }
}

Color.defaultTint = new Color(0, 122, 255);
Color.organgeLow = new Color(250, 211, 144);
Color.organgeHigh = new Color(229, 142, 38);
Color.redLow = new Color(248, 194, 145);
Color.redHigh = new Color(183, 21, 64);
Color.blueLow = new Color(106, 137, 204);
Color.blueHigh = new Color(12, 36, 97);
Color.lightBlueLow = new Color(130, 204, 221);
Color.lightBlueHight = new Color(10, 61, 98);
Color.greenLow = new Color(184, 233, 148);
Color.greenHight = new Color(7, 153, 146);

Color.stackColors = [
  [Color.blueHigh, Color.blueLow],
  [Color.redHigh, Color.redLow],
  [Color.greenHight, Color.greenLow],
  [Color.organgeHigh, Color.organgeLow],
  [Color.lightBlueHight, Color.lightBlueLow],
];

Color.randomColor = function () {
  return "rgb(" +
    (Math.random() * 255) + ", " +
    (Math.random() * 255) + "," +
    (Math.random() * 255) + ")";
};

Color.colorsForStack = function (stack, amount = 1) {
  if (!Number.isInteger(stack)) {
    return [Color.stackColors[0]];
  }

  let usedAmount = Math.max(amount, 5);
  let stackColors = Color.stackColors[stack % Color.stackColors.length];

  let highColor = stackColors[0];
  let lowColor = stackColors[1];

  let redDiff = lowColor.r - highColor.r;
  let greenDiff = lowColor.g - highColor.g;
  let blueDiff = lowColor.b - highColor.b;

  let redStep = redDiff / usedAmount;
  let greenStep = greenDiff / usedAmount;
  let blueStep = blueDiff / usedAmount;

  let colors = [];

  for (let i = 0; i < amount; i++) {
    let newColor = highColor.colorAdding(redStep * i, greenStep * i, blueStep * i);
    colors.push(newColor);
  }

  return colors;
};

class DateAxisRenderer {

  constructor(timeChart) {

    /**
     *
     */
    this.createAxis = function () {
      this.xAxisGrid = d3
        .axisBottom(timeChart.xChart)
        .tickSize(-timeChart.graphHeight)
        .tickFormat('');

      this.yAxisGrid = d3
        .axisLeft(timeChart.yChart)
        .tickSize(-timeChart.graphWidth)
        .tickFormat('')
        .ticks(20);
    };

    /**
     *
     */
    this.renderAxis = function () {
      timeChart.svg
        .append("g")
        .call(d3.axisBottom(timeChart.xChart))
        .attr("transform", () => `translate(0,${timeChart.height - timeChart.margin.bottom})`);
      timeChart.svg
        .append("g")
        .call(d3.axisLeft(timeChart.yChart))
        .attr("transform", () => `translate(${timeChart.margin.left},0)`);
    };

    /**
     *
     */
    this.renderGrid = function () {
      let color = 'lightgray';
      let width = '0.5';
      let opacity = 0.3;
      timeChart.svg
        .append('g')
        .attr('class', 'x axis-grid')
        .attr('transform', 'translate(0,' + (timeChart.height - timeChart.margin.bottom) + ')')
        .attr('stroke', color)
        .attr('stroke-width', width)
        .attr("opacity", opacity)
        .call(this.xAxisGrid);
      timeChart.svg
        .append('g')
        .attr('class', 'y axis-grid')
        .attr('transform', `translate(${timeChart.margin.left},0)`)
        .attr('stroke', color)
        .attr('stroke-width', width)
        .attr("opacity", opacity)
        .call(this.yAxisGrid);
    };
  }
}

/**
 *
 */
class DateLabelRenderer {

  constructor(timeChart) {

    /**
     *
     * @param stack
     * @param index
     */
    this.renderBarLabels = function (stack, index) {
      let xChartRef = timeChart.xChart;
      let yChartRef = timeChart.yChart;
      let xStackRef = timeChart.xStack;
      let numberFormat = timeChart.numberFormat;
      let labelColor = timeChart.labelColor;
      let numberOfSeries = stack.length;
      let seriesIndex = 0;
      let bandwidth = xStackRef.bandwidth() / 2;

      timeChart
        .svg
        .append("g")
        .selectAll('g')
        .data(stack)
        .enter()
        .append('g')
        .attr('fill', labelColor)
        .selectAll('.text')
        .data(dataset => dataset)
        .enter()
        .append('text')
        .attr("transform", function (item) {
          let x = xChartRef(item.data.date) + xStackRef(stack.label) + bandwidth;
          let y = yChartRef(item[1]) - 5;
          return `translate(${x},${y})rotate(-60)`;
        })
        .attr("font-size", 13)
        .text(function (item, index) {
          if (index === 0) seriesIndex += 1;
          if (seriesIndex !== numberOfSeries) return;
          let value = item[1];
          return value === 0 ? '' : numberFormat.format(value);
        });
    };
  }
}

/**
 * Returns the sum of data values for the given dataset.
 *
 * @param flatData The flat data array.
 * @param dataset The dataset name.
 * @returns {*} The sum.
 */
function sumOfDataset(flatData, dataset) {
  return sumOfValues(flatData.filter(item => item.dataset === dataset));
}

/**
 * Returns the sum of data values for the given label.
 *
 * @param flatData The flat data array.
 * @param label The label.
 * @returns {*} The sum.
 */
function sumOfLabel(flatData, label) {
  return sumOfValues(flatData.filter(item => item.label === label));
}

/**
 * Returns the sum of data values for the given stack.
 *
 * @param flatData The flat data array.
 * @param stack The stack name.
 * @returns {*} The sum.
 */
function sumOfStack(flatData, stack) {
  return sumOfValues(flatData.filter(item => item.stack === stack));
}

/**
 * Returns the sum of the value properties of each item.
 *
 * @param flatData
 * @returns {*}
 */
function sumOfValues(flatData) {
  return flatData
    .map(item => +(item.value || 0))
    .reduce((acc, next) => acc + next, 0);
}

class DateLegendRenderer {

  constructor(timeChart) {

    this.renderNormalLegend = function () {
      let controller = timeChart.datasetController;
      let datasets = controller.workingDatasets;
      let datasetNames = controller.labels;
      let circleRadius = 6;
      let labelMargin = 50;

      let xLegend = d3.scaleBand()
        .domain(datasetNames)
        .rangeRound([timeChart.margin.left, timeChart.width - timeChart.margin.right]);

      let legends = timeChart.graph
        .selectAll('.legend')
        .data(datasets)
        .enter();

      legends
        .append('text')
        .attr("font-size", 13)
        .attr("x", (item) => xLegend(item.label) - 30)
        .attr("y", timeChart.graphHeight + labelMargin)
        .style('cursor', 'pointer')
        .style("fill", function (item) {
          return controller.getColorForDataset(item.label);
        })
        .text((item) => `${item.label} (${controller.getSumOfDataset(item.label)})`)
        .on('click', function (event) {
          if (!event || !event.target) return;
          if (!event.target.innerHTML) return;
          let components = event.target.innerHTML.split(' (');
          components.pop();
          let label = components.join(" (");
          timeChart.toggleDataset(label);
        }.bind(this));

      legends
        .append("circle")
        .attr("r", circleRadius)
        .attr("cx", function (item) {
          return xLegend(item.label) - (circleRadius * 2) - 30;
        }.bind(this))
        .attr("cy", function () {
          return timeChart.graphHeight + labelMargin - circleRadius + 2;
        }.bind(this))
        .style('cursor', 'pointer')
        .style("stroke", function (item) {
          return controller.getColorForDataset(item.label).rgbString();
        }.bind(this))
        .style("fill", function (item) {
          return item.isEnabled ? controller.getColorForDataset(item.label).rgbString() : 'white';
        }.bind(this))
        .style("stroke-width", 2);

    };

    this.renderCombinedStacksLegend = function () {
      let stackNames = timeChart.datasetController.stacks;
      let circleRadius = 6;
      let labelMargin = 50;

      let xLegend = d3
        .scaleBand()
        .domain(stackNames)
        .rangeRound([timeChart.margin.left, timeChart.width - timeChart.margin.right]);

      let legends = timeChart
        .graph
        .selectAll('.legend')
        .data(stackNames)
        .enter();

      legends
        .append('text')
        .attr("font-size", 13)
        .attr("x", (item) => xLegend(item) - 30)
        .attr("y", function () {
          return timeChart.graphHeight + labelMargin;
        }.bind(this))
        .style('cursor', 'pointer')
        .style("fill", function (item, index) {
          return Color.colorsForStack(index)[0].rgbString();
        }.bind(this))
        .text(function (item) {
          return `${item} (${sumOfStack(timeChart.flatData, item)})`;
        }.bind(this));

      legends
        .append("circle")
        .attr("r", circleRadius)
        .attr("cx", item => xLegend(item) - (circleRadius * 2) - 30)
        .attr("cy", timeChart.graphHeight + labelMargin - circleRadius + 2)
        .style('cursor', 'pointer')
        .style("stroke", function (item, index) {
          return Color.colorsForStack(index)[0].rgbString();
        }.bind(this))
        .style("fill", function (item, index) {
          return item.isEnabled ? Color.colorsForStack(index)[0].rgbString() : 'white';
        }.bind(this))
        .style("stroke-width", 2);

    };
  }
}

const log_debug = console.log;

/**
 * Holds
 * @type {{}}
 */
const Constants = {
  tooltipOffset: 7,
  barRadius: 5
};

class DateBarsRenderer {

  constructor(timeChart) {

    /**
     *
     * @param stack
     * @param stackIndex
     */
    this.renderBars = function (stack, stackIndex) {
      let colors = timeChart.datasetController.getColorsForStack(stack.stack);
      timeChart
        .svg
        .append("g")
        .selectAll("g")
        .data(stack)
        .enter()
        .append("g")
        .attr("fill", function (stackData, index) {
          if (timeChart.isCombineStacks) {
            return colors[0].rgbString();
          } else {
            return stack.colors[index].rgbString();
          }
        })
        .selectAll("rect")
        .data((data) => data)
        .enter()
        .append("rect")
        .attr('class', 'lotivis-date-chart-bar')
        .attr("rx", timeChart.isCombineStacks ? 0 : Constants.barRadius)
        .attr("ry", timeChart.isCombineStacks ? 0 : Constants.barRadius)
        .attr("x", (d) => timeChart.xChart(d.data.date) + timeChart.xStack(stack.label))
        .attr("y", (d) => timeChart.yChart(d[1]))
        .attr("width", timeChart.xStack.bandwidth())
        .attr("height", (d) => timeChart.yChart(d[0]) - timeChart.yChart(d[1]));
    };
  }
}

/**
 * Returns a flat version of the given dataset collection.
 *
 * @param datasets The collection of datasets.
 * @returns {[]} The array containing the flat data.
 */
function flatDatasets(datasets) {
  let flatData = [];
  datasets.forEach(function (dataset) {
    flatData = flatData.concat(flatDataset(dataset));
  });
  return flatData;
}

/**
 * Returns an array containing the flat data of the given dataset.
 *
 * @param dataset The dataset with data.
 * @returns {[]} The array containing the flat data.
 */
function flatDataset(dataset) {
  let flatData = [];
  dataset.data.forEach(item => {
    item.dataset = dataset.label;
    item.stack = dataset.stack;
    flatData.push(item);
  });
  return flatData;
}

/**
 * Returns the set of dataset names from the given dataset collection.
 *
 * @param datasets The collection of datasets.
 * @returns {[]} The array containing the flat data.
 */
function extractLabelsFromDatasets(datasets) {
  return toSet(datasets.map(dataset => dataset.label || 'unknown'));
}

/**
 * Returns the set of stacks from the given dataset collection.
 * Will fallback on dataset property if stack property isn't present.
 *
 * @param datasets The collection of datasets.
 * @returns {[]} The array containing the flat data.
 */
function extractStacksFromDatasets(datasets) {
  return toSet(datasets.map(dataset => dataset.stack || dataset.label || 'unknown'));
}

/**
 * Returns the set of dates from the given dataset collection.
 *
 * @param datasets The collection of datasets.
 * @returns {[]} The set containing the dates.
 */
function extractDatesFromDatasets(datasets) {
  return extractDatesFromFlatData(flatDatasets(datasets));
}

/**
 * Returns the set of locations from the given dataset collection.
 *
 * @param datasets The collection of datasets.
 * @returns {[]} The set containing the locations.
 */
function extractLocationsFromDatasets(datasets) {
  return extractLocationsFromFlatData(flatDatasets(datasets));
}

/**
 * Returns the set of dataset names from the given flat data array.
 *
 * @param flatData The flat data array.
 * @returns {[]} The array containing the flat data.
 */
function extractLabelsFromFlatData(flatData) {
  return toSet(flatData.map(item => item.dataset || 'unknown'));
}

/**
 * Returns the set of stacks from the given flat data array.
 * Will fallback on dataset property if stack property isn't present.
 *
 * @param flatData The flat data array.
 * @returns {[]} The array containing the flat data.
 */
function extractStacksFromFlatData(flatData) {
  return toSet(flatData.map(item => item.stack || item.dataset || 'unknown'));
}

/**
 * Returns the set of dates from the given dataset collection.
 *
 * @param flatData The flat data array.
 * @returns {[]} The set containing the dates.
 */
function extractDatesFromFlatData(flatData) {
  return toSet(flatData.map(item => item.date || 'unknown'));
}

/**
 * Returns the set of locations from the given dataset collection.
 *
 * @param flatData The flat data array.
 * @returns {[]} The set containing the locations.
 */
function extractLocationsFromFlatData(flatData) {
  return toSet(flatData.map(item => item.location || "unknown"));
}

/**
 * Return an array containing each equal item of the given array only once.
 *
 * @param array The array to create a set of.
 * @returns {any[]} The set version of the array.
 */
function toSet(array) {
  return Array.from(new Set(array)).sort();
}

/**
 * Returns the earliest date occurring in the flat array of items.
 *
 * @param flatData The flat data array.
 * @returns {*} The earliest date.
 */
function extractEarliestDate(flatData) {
  return extractDatesFromFlatData(flatData).shift();
}

/**
 * Returns the earliest date occurring in the flat array of items.
 *
 * @param flatData The flat data array.
 * @returns {*} The earliest date.
 */
function extractEarliestDateWithValue(flatData) {
  let withValue = flatData.filter(item => (item.value || 0) > 0);
  return extractDatesFromFlatData(withValue).shift();
}

/**
 * Returns the latest date occurring in the flat array of items.
 *
 * @param flatData The flat data array.
 * @returns {*} The latest date.
 */
function extractLatestDate(flatData) {
  return extractDatesFromFlatData(flatData).pop();
}

/**
 * Returns the latest date occurring in the flat array of items.
 *
 * @param flatData The flat data array.
 * @returns {*} The latest date.
 */
function extractLatestDateWithValue(flatData) {
  let withValue = flatData.filter(item => (item.value || 0) > 0);
  return extractDatesFromFlatData(withValue).pop();
}

/**
 * Returns a copy of the passed object.  The copy is created by using the
 * JSON's `parse` and `stringify` functions.
 *
 * @param object The java script object to copy.
 * @returns {any} The copy of the object.
 */
function copy(object) {
  return JSON.parse(JSON.stringify(object));
}

/**
 * Returns
 *
 * @param flattenList
 * @returns {[]}
 */
function combine(flattenList) {
  let combined = [];
  for (let index = 0; index < flattenList.length; index++) {
    let listItem = flattenList[index];
    let entry = combined.find(function (entryItem) {
      return entryItem.dataset === listItem.dataset
        && entryItem.stack === listItem.stack
        && entryItem.label === listItem.label
        && entryItem.location === listItem.location
        && entryItem.date === listItem.date;
    });
    if (entry) {
      entry.value += (listItem.value + 0);
    } else {
      let entry = {};
      if (listItem.label) entry.label = listItem.label;
      if (listItem.dataset) entry.dataset = listItem.dataset;
      if (listItem.stack) entry.stack = listItem.stack;
      if (listItem.location) entry.location = listItem.location;
      if (listItem.locationTotal) entry.locationTotal = listItem.locationTotal;
      if (listItem.date) entry.date = listItem.date;
      if (listItem.dateTotal) entry.dateTotal = listItem.dateTotal;
      if (listItem.locationName) entry.locationName = listItem.locationName;
      entry.value = (listItem.value || 0);
      combined.push(entry);
    }
  }
  return combined;
}

/**
 * Returns
 *
 * @param flattenList
 * @returns {[]}
 */
function combineByStacks(flattenList) {
  let combined = [];
  for (let index = 0; index < flattenList.length; index++) {
    let listItem = flattenList[index];
    let entry = combined.find(function (entryItem) {
      return entryItem.stack === listItem.stack
        && entryItem.label === listItem.label
        && entryItem.location === listItem.location
        && entryItem.date === listItem.date;
    });
    if (entry) {
      entry.value += (listItem.value + 0);
    } else {
      let entry = {};
      if (listItem.label) entry.label = listItem.label;
      if (listItem.stack) entry.stack = listItem.stack;
      if (listItem.location) entry.location = listItem.location;
      if (listItem.locationTotal) entry.locationTotal = listItem.locationTotal;
      if (listItem.date) entry.date = listItem.date;
      if (listItem.dateTotal) entry.dateTotal = listItem.dateTotal;
      if (listItem.locationName) entry.locationName = listItem.locationName;
      entry.value = (listItem.value || 0);
      combined.push(entry);
    }
  }
  return combined;
}

/**
 *
 * @param flatData
 * @returns {[]}
 */
function combineByDate(flatData) {
  let combined = [];
  for (let index = 0; index < flatData.length; index++) {
    let listItem = flatData[index];
    let entry = combined.find(function (entryItem) {
      return  entryItem.dataset === listItem.dataset
        && entryItem.stack === listItem.stack
        && entryItem.label === listItem.label
        && entryItem.date === listItem.date;
    });
    if (entry) {
      entry.value += (listItem.value + 0);
    } else {
      let entry = {};
      if (listItem.label) entry.label = listItem.label;
      if (listItem.dataset) entry.dataset = listItem.dataset;
      if (listItem.stack) entry.stack = listItem.stack;
      if (listItem.date) entry.date = listItem.date;
      if (listItem.dateTotal) entry.dateTotal = listItem.dateTotal;
      if (listItem.locationName) entry.locationName = listItem.locationName;
      entry.value = (listItem.value || 0);
      combined.push(entry);
    }
  }
  return combined;
}

/**
 *
 * @param flatData
 * @returns {[]}
 */
function combineByLocation(flatData) {
  let combined = [];
  for (let index = 0; index < flatData.length; index++) {
    let listItem = flatData[index];
    let entry = combined.find(function (entryItem) {
      return  entryItem.dataset === listItem.dataset
        && entryItem.stack === listItem.stack
        && entryItem.label === listItem.label
        && entryItem.location === listItem.location;
    });
    if (entry) {
      entry.value += listItem.value;
    } else {
      let entry = {};
      if (listItem.label) entry.label = listItem.label;
      if (listItem.dataset) entry.dataset = listItem.dataset;
      if (listItem.stack) entry.stack = listItem.stack;
      if (listItem.location) entry.location = listItem.location;
      if (listItem.locationTotal) entry.locationTotal = listItem.locationTotal;
      if (listItem.locationName) entry.locationName = listItem.locationName;
      entry.value = listItem.value;
      combined.push(entry);
    }
  }
  return combined;
}

/**
 *
 * @class DatasetsColorsController
 */
class DatasetsColorsController {

  /**
   * Creates a new instance of DatasetsColorsController.
   *
   * @param controller
   */
  constructor(controller) {

    let datasets = controller.workingDatasets;
    let stacks = controller.stacks;
    let labelToColor = {};
    let stackToColors = {};

    for (let sIndex = 0; sIndex < stacks.length; sIndex++) {
      let stack = stacks[sIndex];

      // filter datasets for stack
      let filtered = datasets.filter(function (dataset) {
        return dataset.label === stack || dataset.stack === stack;
      });

      let colors = Color.colorsForStack(sIndex, filtered.length);
      stackToColors[stack] = colors;
      for (let dIndex = 0; dIndex < filtered.length; dIndex++) {
        labelToColor[filtered[dIndex].label] = colors[dIndex];
      }
    }

    this.colorForDataset = function (label) {
      return labelToColor[label] || Color.defaultTint;
    };

    this.colorForStack = function (stack) {
      return stackToColors[stack][0] || Color.defaultTint;
    };

    this.colorsForStack = function (stack) {
      return stackToColors[stack] || [];
    };
  }
}

/**
 *
 * @class DatasetsController
 */
class DatasetsController {

  constructor(datasets) {
    this.datasets = copy(datasets);
    this.workingDatasets = copy(datasets)
      .sort((left, right) => left.label > right.label);
    this.workingDatasets.forEach(dataset => dataset.isEnabled = true);
    this.flatData = flatDatasets(this.workingDatasets);
    this.labels = extractLabelsFromDatasets(datasets);
    this.stacks = extractStacksFromDatasets(datasets);
    this.dates = extractDatesFromDatasets(datasets);
    this.locations = extractLocationsFromDatasets(datasets);
    this.datasetsColorsController = new DatasetsColorsController(this);
  }

  get flatDataCombinedStacks() {
    return combineByStacks(this.flatData);
  }

  get flatDataCombinedDates() {
    return combineByDate(this.flatData);
  }

  get flatDataCombinedLocations() {
    return combineByLocation(this.flatData);
  }

  getSumOfLabel(label) {
    return sumOfLabel(this.flatData, label);
  }

  getSumOfDataset(dataset) {
    return sumOfDataset(this.flatData, dataset);
  }

  getSumOfStack(stack) {
    return sumOfStack(this.flatData, stack);
  }

  getMax() {
    return d3.max(this.workingDatasets, function (dataset) {
      return d3.max(dataset.data, function (item) {
        return item.value;
      });
    });
  }

  // MARK: - Colors

  getColorForDataset(label) {
    return this.datasetsColorsController.colorForDataset(label);
  }

  getColorForStack(stack) {
    return this.datasetsColorsController.colorForStack(stack);
  }

  getColorsForStack(stack) {
    return this.datasetsColorsController.colorsForStack(stack);
  }
}

/**
 *
 */
class FilterableDatasetsController extends DatasetsController {

  constructor(datasets) {
    super(datasets);
    this.listeners = [];
    this.locationFilters = [];
    this.dateFilters = [];
    this.datasetFilters = [];
  }

  resetFilters() {
    this.locationFilters = [];
    this.dateFilters = [];
    this.datasetFilters = [];
    this.notifyListeners('reset-filters');
  }

  setLocationsFilter(locations) {
    this.resetFilters();
    this.locationFilters = locations.map(location => String(location));
    this.notifyListeners('location-filter');
  }

  setDatesFilter(dates) {
    this.resetFilters();
    this.dateFilters = dates.map(date => String(date));
    this.notifyListeners('dates-filter');
  }

  setDatasetsFilter(datasets) {
    this.resetFilters();
    this.datasetFilters = datasets.map(dataset => String(dataset));
    this.notifyListeners('dataset-filter');
  }

  toggleDataset(label) {
    this.workingDatasets.forEach(function (dataset) {
      if (dataset.label === label) {
        dataset.isEnabled = !dataset.isEnabled;
      }
    });
    this.notifyListeners('dataset-toggle');
  }

  enableAllDatasets() {
    this.workingDatasets.forEach(function (dataset) {
      dataset.isEnabled = true;
    });
    this.notifyListeners('dataset-enable-all');
  }

  get enabledDatasets() {

    let aCopy = copy(this.workingDatasets);

    let enabled = aCopy
      .filter(dataset => dataset.isEnabled === true);

    if (this.datasetFilters && this.datasetFilters.length > 0) {
      enabled = enabled.filter(dataset => this.datasetFilters.includes(dataset.label));
    }

    if (this.locationFilters && this.locationFilters.length > 0) {
      let locationFilters = this.locationFilters;
      enabled = enabled.map(function (dataset) {
        dataset.data = dataset.data
          .filter(data => locationFilters.includes(String(data.location))) || [];
        return dataset;
      });
    }

    if (this.dateFilters && this.dateFilters.length > 0) {
      let dateFilters = this.dateFilters;
      enabled = enabled.map(function (dataset) {
        dataset.data = dataset.data
          .filter(data => dateFilters.includes(String(data.date))) || [];
        return dataset;
      });
    }

    return enabled;
  }

  get enabledFlatData() {
    return flatDatasets(this.enabledDatasets);
  }

  get enabledLabels() {
    return extractLabelsFromDatasets(this.enabledDatasets);
  }

  get enabledStacks() {
    return extractStacksFromDatasets(this.enabledDatasets);
  }

  get enabledDates() {
    return extractDatesFromDatasets(this.enabledDatasets);
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    let index = this.listeners.indexOf(listener);
    if (index === -1) return;
    this.listeners = this.listeners.splice(index, 1);
  }

  notifyListeners(reason = 'none') {
    for (let index = 0; index < this.listeners.length; index++) {
      let listener = this.listeners[index];
      if (!listener.update) continue;
      listener.update(this, reason);
    }
  }
}

/**
 *
 * @class DateGhostBarsRenderer
 */
class DateGhostBarsRenderer {

  constructor(dateChart) {

    function createID(date) {
      return `ghost-rect-${String(date).replaceAll('.', '-')}`;
    }

    this.hideAll = function () {
      dateChart.svg
        .selectAll('.lotivis-selection-rect')
        // .transition()
        .attr("opacity", 0);
    };

    function onMouseEnter(event, date) {
      this.hideAll();
      let controller = dateChart.datasetController;
      let id = createID(date);

      dateChart.updateSensible = false;
      controller.setDatesFilter([date]);
      dateChart.updateSensible = true;
      dateChart
        .svg
        .select(`#${id}`)
        // .transition()
        .attr("opacity", 0.3);

      dateChart.tooltipRenderer.showTooltip(event, date);
    }

    function onMouserOut(event, date) {
      this.hideAll();
      dateChart.tooltipRenderer.hideTooltip(event, date);
      dateChart.datasetController.resetFilters();
    }

    this.renderGhostBars = function () {
      let dates = dateChart.datasetController.dates;
      dateChart
        .svg
        .append("g")
        .selectAll("rect")
        .data(dates)
        .enter()
        .append("rect")
        .attr("class", 'lotivis-selection-rect')
        .attr("id", date => createID(date))
        .attr("opacity", 0)
        .attr("rx", Constants.barRadius)
        .attr("ry", Constants.barRadius)
        .attr("x", (date) => dateChart.xChart(date))
        .attr("y", dateChart.margin.top)
        .attr("width", dateChart.xChart.bandwidth())
        .attr("height", dateChart.height - dateChart.margin.bottom - dateChart.margin.top)
        .on('mouseenter', onMouseEnter.bind(this))
        .on('mouseout', onMouserOut.bind(this));

    };
  }
}

/**
 * Injects and presents a tooltip on a date chart.
 *
 * @class DateTooltipRenderer
 */
class DateTooltipRenderer {

  /**
   * Creates a new instance of DateTooltipRenderer.
   *
   * @constructor
   */
  constructor(dateChart) {

    const tooltip = dateChart
      .element
      .append('div')
      .attr('class', 'lotivis-tooltip')
      .attr('rx', 5) // corner radius
      .attr('ry', 5)
      .style('opacity', 0);

    /**
     * Returns the size [width, height] of the tooltip.
     *
     * @returns {number[]}
     */
    function getTooltipSize() {
      let tooltipWidth = Number(tooltip.style('width').replace('px', ''));
      let tooltipHeight = Number(tooltip.style('height').replace('px', ''));
      return [tooltipWidth, tooltipHeight];
    }

    /**
     * Calculates and returns the top pixel position for the tooltip.
     *
     * @param factor The size factor of the chart.
     * @param offset The offset of the chart.
     * @param tooltipSize The size of the tooltip.
     * @returns {number}
     */
    function getTop(factor, offset, tooltipSize) {
      let top = dateChart.margin.top * factor;
      top += (((dateChart.graphHeight * factor) - tooltipSize[1]) / 2);
      top += offset[1] - 10;
      return top;
    }

    /**
     * Calculates the x offset to position the tooltip on the left side
     * of a bar.
     *
     * @param date The presented date of selected bar.
     * @param factor The size factor of the chart.
     * @param offset The offset of the chart.
     * @param tooltipSize The size of the tooltip.
     * @returns {number} The x offset for the tooltip.
     */
    function getXLeft(date, factor, offset, tooltipSize) {
      let x = dateChart.xChart(date) * factor;
      return x + offset[0] - tooltipSize[0] - 22 - Constants.tooltipOffset;
    }

    /**
     * Calculates the x offset to position the tooltip on the right side
     * of a bar.
     *
     * @param date The presented date of selected bar.
     * @param factor The size factor of the chart.
     * @param offset The offset of the chart.
     * @returns {number} The x offset for the tooltip.
     */
    function getXRight(date, factor, offset) {
      let x = dateChart.xChart(date) + dateChart.xChart.bandwidth();
      x *= factor;
      x += offset[0] + Constants.tooltipOffset;
      return x;
    }

    /**
     * Returns the HTML content for the given date.
     *
     * @param date The date to get the HTML content for.
     * @returns {string} Return the rendered HTML content.
     */
    function getHTMLForDate(date) {
      let flatData = dateChart.datasetController
        .enabledFlatData
        .filter(item => item.date === date);

      let dataHTML = combineByDate(flatData)
        .filter(item => item.value > 0)
        .map(function (item) {
          let color = dateChart.datasetController.getColorForDataset(item.dataset);
          let divHTML = `<div style="background: ${color};color: ${color}; display: inline;">__</div>`;
          return `${divHTML} ${item.dataset}: <b>${item.value}</b>`;
        })
        .join('<br>');

      return `<b>${date}</b><br>${dataHTML}`;
    }

    /**
     * Presents the tooltip next to bar presenting the given date.
     *
     * @param event The mouse event.
     * @param date The date which is presented.
     */
    this.showTooltip = function (event, date) {

      // set html content before positioning the tooltip cause the size is
      // calculated based on the size
      tooltip.html(getHTMLForDate(date));

      // position tooltip
      let tooltipSize = getTooltipSize();
      let factor = dateChart.getElementEffectiveSize()[0] / dateChart.width;
      let offset = dateChart.getElementPosition();
      let top = getTop(factor, offset, tooltipSize);
      let left = dateChart.xChart(date);

      // differ tooltip position on bar position
      if (left > (dateChart.width / 2)) {
        left = getXLeft(date, factor, offset, tooltipSize);
      } else {
        left = getXRight(date, factor, offset);
      }

      // update position and opacity of tooltip
      tooltip
        .style('left', `${left}px`)
        .style('top', `${top}px`)
        .style('opacity', 1);
    };

    /**
     * Hides the tooltip.
     */
    this.hideTooltip = function () {
      if (+tooltip.style('opacity') === 0) return;
      tooltip.style('opacity', 0);
    };
  }
}

/**
 *
 * @class Chart
 * @extends Component
 */
class Chart extends Component {

  /**
   * Creates an instance of DiachronicChart.
   *
   * @constructor
   * @param {Component} parent The parental component.
   */
  constructor(parent) {
    super(parent);

    if (Object.getPrototypeOf(parent) === String.prototype) {
      this.selector = parent;
      this.element = d3.select('#' + parent);
    } else {
      this.element = parent;
      this.element.attr('id', this.selector);
    }

    this.svgSelector = createID();
    this.updateSensible = true;
    this.initialize();
    this.update();
  }

  initialize() {
    // empty
  }

  update() {
    if (!this.updateSensible) return;
    this.precalculate();
    this.remove();
    this.draw();
  }

  precalculate() {
    // empty
  }

  remove() {
    // empty
  }

  draw() {
    // empty
  }

  makeUpdateInsensible() {
    this.updateSensible = false;
  }

  makeUpdateSensible() {
    this.updateSensible = true;
  }
}

/**
 *
 * @param flatData The array of item.
 */
function dateToItemsRelation(datasets) {

  let flatData = flatDatasets(datasets);
  flatData = combineByDate(flatData);

  let listOfDates = extractDatesFromDatasets(datasets);
  let listOfLabels = extractLabelsFromDatasets(datasets);

  return listOfDates.map(function (date) {
    let datasetDate = { date: date };
    flatData
      .filter(item => item.date === date)
      .forEach(function (entry) {
        datasetDate[entry.dataset] = entry.value;
        datasetDate.total = entry.dateTotal;
      });

    // add zero values for empty datasets
    for (let index = 0; index < listOfLabels.length; index++) {
      let label = listOfLabels[index];
      if (!datasetDate[label]) {
        datasetDate[label] = 0;
      }
    }

    return datasetDate;
  });
}

/**
 *
 * @param datasets
 * @param dateToItemsRelation
 * @returns {*[]}
 */
function createStackModel(controller, datasets, dateToItemsRelation) {
  let listOfStacks = extractStacksFromDatasets(datasets);

  return listOfStacks.map(function (stackName) {

    let stackCandidates = datasets.filter(function (dataset) {
      return dataset.stack === stackName
        || dataset.label === stackName;
    });

    let candidatesNames = stackCandidates.map(stackCandidate => stackCandidate.label);
    let candidatesColors = stackCandidates.map(stackCandidate => controller.getColorForDataset(stackCandidate.label));

    let stack = d3
      .stack()
      .keys(candidatesNames)
      (dateToItemsRelation);

    stack.label = stackName;
    stack.stack = stackName;
    stack.colors = candidatesColors;

    return stack;
  });
}

/**
 *
 * @class Diachronic Chart Component
 * @extends Chart
 */
class DateChart extends Chart {

  /**
   * Initializes this diachronic chart by setting the default values.
   * @override
   */
  initialize() {
    this.initializeDefaultValues();
    this.initializeRenderers();
  }

  initializeDefaultValues() {
    this.width = 1000;
    this.height = 600;
    this.defaultMargin = 60;
    this.margin = {
      top: this.defaultMargin,
      right: this.defaultMargin,
      bottom: this.defaultMargin,
      left: this.defaultMargin
    };

    this.datasets = [];

    this.labelColor = new Color(155, 155, 155).rgbString();
    this.type = 'bar'; // DateChart.ChartType.Bar;
    // this.valueType = 'relative';

    this.isShowLabels = false;
    this.isCombineStacks = false;
    this.updateSensible = true;

    this.numberFormat = new Intl.NumberFormat('de-DE', {
      maximumFractionDigits: 3
    });
  }

  initializeRenderers() {
    this.axisRenderer = new DateAxisRenderer(this);
    this.labelRenderer = new DateLabelRenderer(this);
    this.legendRenderer = new DateLegendRenderer(this);
    this.barsRenderer = new DateBarsRenderer(this);
    this.ghostBarsRenderer = new DateGhostBarsRenderer(this);
    this.tooltipRenderer = new DateTooltipRenderer(this);
  }

  /**
   * @override
   */
  precalculate() {
    let margin = this.margin;
    this.graphWidth = this.width - margin.left - margin.right;
    this.graphHeight = this.height - margin.top - margin.bottom;
    this.precalculateHelpData();
    this.createScales();
  }

  /**
   * Tells the receiving map chart that its `datasets` property did change.
   */
  precalculateHelpData() {
    if (!this.datasetController) return;
    // calculate enabled datasets once
    let enabledDatasets = this.datasetController.enabledDatasets;
    this.dateToItemsRelation = dateToItemsRelation(this.datasetController.workingDatasets);
    this.dateToItemsRelationPresented = dateToItemsRelation(enabledDatasets);
    this.datasetStacks = createStackModel(this.datasetController, this.datasetController.workingDatasets, this.dateToItemsRelation);
    this.datasetStacksPresented = createStackModel(this.datasetController, enabledDatasets, this.dateToItemsRelationPresented);
  }

  /**
   * Creates scales which are used to calculate the x and y positions of bars or circles.
   */
  createScales() {

    this.max = d3.max(this.datasetStacksPresented, function (stack) {
      return d3.max(stack, function (series) {
        return d3.max(series.map(item => item['1']));
      });
    });

    this.xChart = d3
      .scaleBand()
      .domain(this.datasetController.dates)
      .rangeRound([this.margin.left, this.width - this.margin.right])
      .paddingInner(0.1);

    this.xStack = d3
      .scaleBand()
      .domain(this.datasetController.enabledStacks)
      .rangeRound([0, this.xChart.bandwidth()])
      .padding(0.05);

    this.yChart = d3
      .scaleLinear()
      .domain([0, this.max]).nice()
      .rangeRound([this.height - this.margin.bottom, this.margin.top]);

  }

  /**
   * Removes all `svg`s from the parental element.
   * @override
   */
  remove() {
    this.element.selectAll('svg').remove();
  }

  /**
   * Creates and renders the chart.
   * @override
   */
  draw() {
    this.renderSVG();
    if (!this.datasetStacks || this.datasetStacks.length === 0) return;
    this.axisRenderer.createAxis();
    this.axisRenderer.renderAxis();
    this.axisRenderer.renderGrid();
    this.ghostBarsRenderer.renderGhostBars();

    if (this.isCombineStacks) {
      this.legendRenderer.renderCombinedStacksLegend();
    } else {
      this.legendRenderer.renderNormalLegend();
    }

    for (let index = 0; index < this.datasetStacksPresented.length; index++) {
      let stack = this.datasetStacksPresented[index];
      this.barsRenderer.renderBars(stack, index);
      if (this.isShowLabels === false) continue;
      this.labelRenderer.renderBarLabels(stack, index);
    }
  }

  /**
   *
   */
  renderSVG() {
    this.svg = this.element
      .append('svg')
      // .attr('width', this.width)
      // .attr('height', this.height)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr('id', this.svgSelector);

    this.background = this.svg
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'white')
      .attr('opacity', 0);

    // create a background rectangle for receiving mouse enter events
    // in order to reset the location data filter.
    // this.background
    //   .on('mouseenter', function () {
    //     let controller = this.datasetController;
    //     let filters = controller.dateFilters;
    //     if (!filters || filters.length === 0) return;
    //     this.makeUpdateInsensible();
    //     controller.setDatesFilter([]);
    //     this.makeUpdateSensible();
    //     this.ghostBarsRenderer.hideAll();
    //   }.bind(this));

    this.graph = this.svg
      .append('g')
      .attr('width', this.graphWidth)
      .attr('height', this.graphHeight)
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }

  /**
   * Toggle the enabled of the dataset with the given label.
   *
   * @param label The label of the dataset.
   */
  toggleDataset(label) {
    this.datasetController.toggleDataset(label);
  }

  /**
   * Sets a new datasets controller.  The chart is updated automatically.
   *
   * @param newController The new datasets controller.
   */
  setDatasetController(newController) {
    this.datasetController = newController;
    this.datasetController.addListener(this);
    this.update();
  }

  /**
   *
   * @param newDatasets
   */
  set datasets(newDatasets) {
    this.setDatasetController(new FilterableDatasetsController(newDatasets));
  }

  /**
   *
   * @returns {*}
   */
  get datasets() {
    return this.datasetController ? this.datasetController.datasets || [] : [];
  }
}

class Card extends Component {
  constructor(parent) {
    super(parent);
    this.element = this.parent
      .append('div')
      .classed('card', true);
    this.createHeader();
    this.createBody();
    this.createFooter();
  }

  createHeader() {
    this.header = this.element
      .append('div')
      .classed('card-header', true);
    this.headerRow = this.header
      .append('div')
      .classed('row', true);
    this.headerLeftComponent = this.headerRow
      .append('div')
      // .classed('col-lg-2', true)
      .classed('col-3', true);
    this.headerCenterComponent = this.headerRow
      .append('div')
      // .classed('col-lg-2', true)
      .classed('col-6', true);
    this.headerRightComponent = this.headerRow
      .append('div')
      // .classed('col-lg-10', true)
      .classed('col-3 button-group', true)
      .classed('text-end', true);
    this.titleLabel = this.headerLeftComponent
      .append('span')
      .text(this.name);
  }

  createBody() {
    this.body = this.element
      .append('div')
      .classed('card-body', true);
    this.content = this.body
      .append('div')
      .attr('id', 'content');
  }

  createFooter() {
    this.footer = this.element
      .append('div')
      .classed('card-footer', true);
    this.footerRow = this.footer
      .append('div')
      .classed('row', true);
    this.footerLeftComponent = this.footerRow
      .append('div')
      .classed('col-6', true);
    this.footerRightComponent = this.footerRow
      .append('div')
      .classed('col-6', true)
      .classed('text-end', true);
    this.footer.style('display', 'none');
  }
}

/**
 * A button
 *
 * @class Button
 * @extends Component
 */
class Button extends Component {

  /**
   * Creates an instance of Button.
   *
   * @constructor
   * @param {Component} parent The parental component.
   */
  constructor(parent) {
    super(parent);

    let thisRef = this;
    this.element = parent
      .append('button')
      .attr('id', this.selector)
      .on('click', function (event) {
        if (!thisRef.onClick) return;
        thisRef.onClick(event);
      });
  }

  setText(text) {
    this.element.text(text);
  }

  setFontAwesomeImage(imageName) {
    this.element.html('<i class="fas fa-' + imageName + '"></i>');
  }

  onClick(event) {
    // empty
  }
}

/**
 *
 *
 * @class Popup
 * @extends Component
 */
class Popup extends Component {

  /**
   * Creates a new instance of Popup.
   *
   * @param parent The parental component.
   */
  constructor(parent) {
    super(parent);
    this.renderUnderground(parent);
    this.renderContainer();
    this.renderCard();
    this.render();
    this.renderCloseButton();
    this.addCloseActionListeners();
  }

  // MARK: - Render

  /**
   * Appends components to this popup.
   *
   * Should be overridden by subclasses.
   */
  render() {
    // empty
  }

  /**
   * Appends the 'dim' background to the given parent.
   *
   * @param parent The parental element.
   */
  renderUnderground(parent) {
    this.modalBackgroundId = createID();
    this.modalBackground = parent
      .append('div')
      .classed('popup-underground fade-in', true)
      .attr('id', this.modalBackgroundId);
  }

  /**
   *
   */
  renderContainer() {
    this.elementId = createID();
    this.element = this.modalBackground
      .append('div')
      .classed('popup', true)
      .attr('id', this.elementId);
  }

  /**
   *
   */
  renderCard() {
    this.card = new Card(this.element);
    this.card.element.classed('popup arrow arrow-right', true);
  }

  /**
   * Appends a close button to the right header component.
   */
  renderCloseButton() {
    this.closeButton = new Button(this.card.headerRightComponent);
    this.closeButton.element.classed('button-small', true);
    this.closeButton.setText('Close');
  }

  /**
   * Appends an on click listener to the button.
   */
  addCloseActionListeners() {
    let validIDs = [
      this.closeButton.selector,
      this.modalBackgroundId
    ];
    let popup = this;
    this.modalBackground.on('click', function (event) {
      if (!event || !event.target) return;
      if (!validIDs.includes(event.target.id)) return;
      popup.dismiss();
    });
  }

  // MARK: - Life Cycle

  /**
   * Tells the receiving popup that it is about to be presented.
   *
   * Subclasses may override.
   */
  willShow() {
    // empty
  }

  /**
   * Tells the receiving popup that it is now presented.
   *
   * Subclasses may override.
   */
  didShow() {
    // empty
  }

  /**
   * Presents the popup.
   */
  show() {
    if (this.willShow) this.willShow();
    this.getUnderground().style.display = 'block';
    if (this.didShow) this.didShow();
  }

  /**
   * Tells the receiving popup that it is about to be dismissed.
   *
   * Subclasses may override.
   */
  willDismiss() {
    // empty
  }

  /**
   * Tells the receiving popup that the DOM element will be removed.
   *
   * Subclasses may override.
   */
  willRemoveDOMElement() {
    // empty
  }

  /**
   * Dismisses the popup.
   */
  dismiss() {
    if (this.willDismiss) this.willDismiss();
    this.getUnderground().style.display = 'none';
    if (this.willRemoveDOMElement) this.willRemoveDOMElement();
    this.getUnderground().remove();
  }

  getUnderground() {
    return document.getElementById(this.modalBackgroundId);
  }

  showUnder(sourceElement, position = 'center') {
    if (!sourceElement) return;

    let preferredSize = this.preferredSize();
    let origin = this.calculateBottomCenter(sourceElement);

    if (position === 'left') {
      origin.x -= origin.width / 2;
    } else if (position === 'right') {
      origin.x -= preferredSize.width - origin.width / 2;
    } else { // assume center
      origin.x -= (preferredSize.width / 2);
    }

    let id = this.elementId;
    let popup = document.getElementById(id);

    popup.style.position = 'absolute';
    popup.style.width = preferredSize.width + 'px';
    // popup.style.height = preferredSize.height + 'px';
    popup.style.left = origin.x + 'px';
    popup.style.top = origin.y + 'px';

    this.show();
  }

  showBigModal() {
    let id = this.elementId;
    let popup = document.getElementById(id);
    let preferredSize = this.preferredSize();

    popup.style.position = 'relative';
    popup.style.margin = '50px auto';
    popup.style.width = preferredSize.width + 'px';

    this.show();
  }

  /**
   * Returns the preferred size of the popup.  Subclasses may override in order to
   * change the size of the popup.
   *
   * @returns {{width: number, height: number}}
   */
  preferredSize() {
    return {
      width: 300,
      height: 300
    };
  }

  /**
   * Returns the bottom middle point of the passed element.
   *
   * @param element
   * @param respectWindowScroll
   * @returns {{x: number, width: number, y: number, height: number}}
   */
  calculateBottomCenter(element, respectWindowScroll = false) {
    let rect = element.getBoundingClientRect();
    let x = rect.x + (rect.width / 2);
    let y = rect.y + rect.height;

    if (respectWindowScroll) {
      x += window.scrollX;
      y += window.scrollY;
    }

    return {
      x: x,
      y: y,
      width: rect.width,
      height: rect.height
    };
  }
}

class Checkbox extends Component {
  constructor(parent) {
    super(parent);
    this.renderInput();
    this.renderLabel();
  }

  // MARK: - Life Cycle
  renderInput() {
    let thisReference = this;
    this.element = this.parent
      .classed('radio-group', true)
      .append('input')
      .attr('type', 'checkbox')
      .attr('id', this.selector)
      .on('click', function (event) {
        if (!event.target) {
          return;
        }
        let checkbox = event.target;
        if (thisReference.onClick) {
          thisReference.onClick(checkbox.checked);
        }
      });
  }

  renderLabel() {
    this.label = this.parent
      .append('label')
      .attr('for', this.selector)
      .text('Unknown');
  }

  // MARK: - Functions
  setText(text) {
    this.label.text(text);
    return this;
  }

  setChecked(checked) {
    this.element.attr('checked', checked === true ? checked : null);
    return this;
  }

  onClick(checked) {
    // empty
    console.log('onClick: ' + checked);
  }

  enable() {
    this.element.attr('disabled', null);
    this.label.style('color', 'black');
  }

  disable() {
    this.element.attr('disabled', true);
    this.label.style('color', 'gray');
  }
}

/**
 *
 * @class RadioGroup
 * @extends Component
 */
class RadioGroup extends Component {

  /**
   *
   * @param parent The parental component.
   */
  constructor(parent) {
    super(parent);

    this.inputElements = [];
    this.element = this.parent.append('form');
    this.element.classed('radio-group', true);
  }

  /**
   *
   * @param optionId
   * @param optionName
   * @returns {*}
   */
  addOption(optionId, optionName) {
    let inputElement = this.element
      .append('input')
      .attr('type', 'radio')
      .attr('name', this.selector)
      .attr('value', optionId)
      .attr('id', optionId);

    this.element
      .append('label')
      .attr('for', optionId)
      .text(optionName || optionId);

    let thisReference = this;
    inputElement.on("click", function (event) {
      thisReference.onClick(event);
    });

    return inputElement;
  }

  /**
   *
   * @param options
   * @returns {RadioGroup}
   */
  setOptions(options) {
    this.removeOptions();
    this.inputElements = [];
    for (let i = 0; i < options.length; i++) {
      let id = options[i][0] || options[i].id;
      let name = options[i][1] || options[i].translatedTitle;
      let inputElement = this.addOption(id, name);
      if (i === 0) {
        inputElement.attr('checked', 'true');
      }
      this.inputElements.push(inputElement);
    }
    return this;
  }

  /**
   *
   * @param selectedOption
   * @returns {RadioGroup}
   */
  setSelectedOption(selectedOption) {
    for (let i = 0; i < this.inputElements.length; i++) {
      let inputElement = this.inputElements[i];
      let value = inputElement.attr('value');
      if (value === selectedOption) {
        inputElement.attr('checked', 'true');
      }
    }
    return this;
  }

  /**
   *
   * @returns {RadioGroup}
   */
  removeOptions() {
    this.element.selectAll('input').remove();
    this.element.selectAll('label').remove();
    this.inputElements = [];
    return this;
  }

  /**
   *
   * @param event
   */
  onClick(event) {
    let element = event.target;
    if (!element) return;

    let value = element.value;
    if (!this.onChange) return;

    this.onChange(value);

    return this;
  }

  // onChange(newFunction) {
  //     this.onChange = newFunction;
  //     return this;
  // }
  onChange(value) {
  }
}

/**
 *
 * @class URLParameters
 */
class URLParameters {

  /**
   * Returns the singleton instance.
   *
   * @returns {URLParameters}
   */
  static getInstance() {
    if (!URLParameters.instance) {
      URLParameters.instance = new URLParameters();
    }
    return URLParameters.instance;
  }

  /**
   * Return the current window URL.
   * @returns {URL}
   */
  getURL() {
    return new URL(window.location.href);
  }

  getBoolean(parameter, defaultValue = false) {
    let value = this.getURL().searchParams.get(parameter);
    return value ? value === 'true' : defaultValue;
  }

  getString(parameter, defaultValue = '') {
    return this.getURL().searchParams.get(parameter) || defaultValue;
  }

  set(parameter, newValue) {
    const url = this.getURL();

    if (newValue === false) {
      url.searchParams.delete(parameter);
    } else {
      url.searchParams.set(parameter, newValue);
    }

    window.history.replaceState(null, null, url);
    this.updateCurrentPageFooter();
  }

  setWithoutDeleting(parameter, newValue) {
    const url = this.getURL();
    url.searchParams.set(parameter, newValue);
    window.history.replaceState(null, null, url);
    this.updateCurrentPageFooter();
  }

  clear() {
    const url = this.getURL();
    const newPath = url.protocol + url.host;
    const newURL = new URL(newPath);
    window.history.replaceState(null, null, newURL);
    this.updateCurrentPageFooter();
  }

  updateCurrentPageFooter() {
    // console.log('window.lotivisApplication: ' + window.lotivisApplication);
    // window.lotivisApplication.currentPage.updateFooter();
  }
}

URLParameters.language = 'language';
URLParameters.page = 'page';
URLParameters.query = 'query';
URLParameters.searchViewMode = 'search-view-mode';
URLParameters.chartType = 'chart-type';
URLParameters.chartShowLabels = 'chart-show-labels';
URLParameters.chartCombineStacks = 'chart-datasetCombine-stacks';
URLParameters.contentType = 'content-type';
URLParameters.valueType = 'value-type';
URLParameters.searchSensitivity = 'search-sensitivity';
URLParameters.startYear = 'start-year';
URLParameters.endYear = 'end-year';

URLParameters.showTestData = 'show-test-data';

/**
 *
 * @class Option
 */
class Option {

  constructor(id, title) {
    this.id = id;
    this.title = title || id;
  }

  get translatedTitle() {
    return this.title;
  }
}

/**
 *
 * @class DateChartSettingsPopup
 * @extends Popup
 */
class DateChartSettingsPopup extends Popup {

  render() {
    this.card
      .headerRow
      .append('h3')
      .text('Settings');
    // this.card
    //     .header
    //     .style('display', 'none');

    this.row = this.card.body
      .append('div')
      .classed('row', true);

    this.renderShowLabelsCheckbox();
    this.renderCombineStacksCheckbox();
    this.renderRadios();
  }

  renderShowLabelsCheckbox() {
    let container = this.row.append('div').classed('col-12 margin-top', true);
    this.showLabelsCheckbox = new Checkbox(container);
    this.showLabelsCheckbox.setText('Labels');
    this.showLabelsCheckbox.onClick = function (checked) {
      this.diachronicChart.isShowLabels = checked;
      this.diachronicChart.update();
      URLParameters.getInstance().set(URLParameters.chartShowLabels, checked);
    }.bind(this);
  }

  renderCombineStacksCheckbox() {
    let container = this.row.append('div').classed('col-12', true);
    this.combineStacksCheckbox = new Checkbox(container);
    this.combineStacksCheckbox.setText('Combine Stacks');
    this.combineStacksCheckbox.onClick = function (checked) {
      this.diachronicChart.isCombineStacks = checked;
      this.diachronicChart.update();
      URLParameters.getInstance().set(URLParameters.chartCombineStacks, checked);
    }.bind(this);
  }

  renderRadios() {
    let container = this.row.append('div').classed('col-12', true);
    this.typeRadioGroup = new RadioGroup(container);
    this.typeRadioGroup.setOptions([
      new Option('bar', 'Bar'),
      new Option('line', 'Line')
    ]);

    this.typeRadioGroup.onChange = function (value) {
      this.diachronicChart.type = value;
      this.diachronicChart.update();
      URLParameters.getInstance().set(URLParameters.chartType, value);
    }.bind(this);
  }

  preferredSize() {
    return {
      width: 240,
      height: 600
    };
  }

  willShow() {
    this.loadValues();
  }

  loadValues() {
    this.showLabelsCheckbox.setChecked(this.diachronicChart.isShowLabels);
    console.log('this.diachronicChart.showLabels: ' + this.diachronicChart.isShowLabels);
    this.combineStacksCheckbox.setChecked(this.diachronicChart.isCombineStacks);
    console.log('this.diachronicChart.combineGroups: ' + this.diachronicChart.isCombineStacks);
    this.typeRadioGroup.setSelectedOption(this.diachronicChart.type);
  }
}

/**
 *
 * @class ChartCard
 * @extends Card
 */
class ChartCard extends Card {
  chart

  /**
   * Creates a new instance of ChartCard.
   *
   * @param parent The parental component.
   */
  constructor(parent) {
    super(parent);
    this.injectMapChart();
    this.injectButtons();
    this.injectRadioGroup();
  }

  /**
   * Creates and injects a screenshot button and a more button.
   */
  injectButtons() {
    this.screenshotButton = new Button(this.headerRightComponent);
    this.screenshotButton.setText('Screenshot');
    this.screenshotButton.element.classed('simple-button', true);
    this.screenshotButton.setFontAwesomeImage('camera');
    this.screenshotButton.onClick = function (event) {
      this.screenshotButtonAction(event);
    }.bind(this);

    this.moreButton = new Button(this.headerRightComponent);
    this.moreButton.setText('More');
    this.moreButton.element.classed('simple-button', true);
    this.moreButton.setFontAwesomeImage('ellipsis-h');
    this.moreButton.onClick = function (event) {
      this.presentSettingsPopupAction(event);
    }.bind(this);
  }

  /**
   * Creates and injects the chart.
   *
   * Should be overridden by subclasses.
   */
  injectMapChart() {
    // empty
  }

  /**
   * Creates and injects a radio button group.
   */
  injectRadioGroup() {
    this.radioGroup = new RadioGroup(this.headerCenterComponent);
    this.radioGroup.onChange = function (value) {
      let dataset = this.datasets.find(dataset => dataset.label === value);
      this.chart.datasets = [dataset];
      this.chart.update();
    }.bind(this);
  }

  /**
   * Updates the options of the radio button group dependant on the given datasets.
   */
  updateRadioGroup() {
    if (!this.datasets) return;
    let names = this.datasets.map(dataset => dataset.label);
    let options = names.map(name => new Option(name));
    this.radioGroup.setOptions(options);
  }

  setDatasets(datasets) {
    this.datasets = datasets;
    this.updateRadioGroup();
    let firstDataset = datasets[0];
    this.setDataset(firstDataset);
  }

  setDataset(dataset) {
    if (!this.chart) return;
    this.chart.datasets = [dataset];
    this.chart.update();
    if (this.onSelectedDatasetChanged) {
      this.onSelectedDatasetChanged(dataset.stack);
    }
  }

  /**
   * Triggered when the screenshot button is pushed.
   *
   * Should be overridden by subclasses.
   */
  screenshotButtonAction() {
    // empty
  }

  /**
   * Triggered when the more button is pushed.
   *
   * Should be overridden by subclasses.
   */
  presentSettingsPopupAction() {
    // empty
  }

  /**
   * Triggered for a change of the radio group.
   *
   * Should be overridden by subclasses.
   */
  onSelectedDatasetChanged() {
    // empty
  }
}

/**
 * Creates an PNG image from the given svg element and initiates a download of the PNG image.
 *
 * @param selector The id of the svg element.
 * @param filename The name of file which is downloaded.
 */

// http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177

/**
 * Parses a String from the given (D3.js) SVG node.
 *
 * @param svgNode The node of the SVG.
 * @returns {string} The parsed String.
 */
function getSVGString(svgNode) {

  svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
  let cssStyleText = getCSSStyles(svgNode);
  appendCSS(cssStyleText, svgNode);

  let serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgNode);

  // Fix root xlink without namespace
  svgString = svgString.replace(
    /(\w+)?:?xlink=/g,
    'xmlns:xlink='
  );

  // Safari NS namespace fix
  svgString = svgString.replace(
    /NS\d+:href/g,
    'xlink:href'
  );

  return svgString;

  function getCSSStyles(parentElement) {
    let selectorTextArr = [];

    // Add Parent element Id and Classes to the list
    selectorTextArr.push('#' + parentElement.id);
    for (let c = 0; c < parentElement.classList.length; c++) {
      if (!contains('.' + parentElement.classList[c], selectorTextArr)) {
        selectorTextArr.push('.' + parentElement.classList[c]);
      }
    }

    // Add Children element Ids and Classes to the list
    let nodes = parentElement.getElementsByTagName("*");
    for (let i = 0; i < nodes.length; i++) {
      let id = nodes[i].id;
      if (!contains('#' + id, selectorTextArr)) {
        selectorTextArr.push('#' + id);
      }

      let classes = nodes[i].classList;
      for (let c = 0; c < classes.length; c++) {
        if (!contains('.' + classes[c], selectorTextArr)) {
          selectorTextArr.push('.' + classes[c]);
        }
      }
    }

    // Extract CSS Rules
    let extractedCSSText = "";
    for (let i = 0; i < document.styleSheets.length; i++) {
      let s = document.styleSheets[i];

      try {
        if (!s.cssRules) continue;
      } catch (e) {
        if (e.name !== 'SecurityError') throw e; // for Firefox
        continue;
      }

      let cssRules = s.cssRules;
      for (let r = 0; r < cssRules.length; r++) {
        if (contains(cssRules[r].selectorText, selectorTextArr)) {
          extractedCSSText += cssRules[r].cssText;
        }
      }
    }

    return extractedCSSText;

    function contains(str, arr) {
      return arr.indexOf(str) !== -1;
    }
  }

  function appendCSS(cssText, element) {
    let styleElement = document.createElement("style");
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = cssText;
    let refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore(styleElement, refNode);
  }
}

/**
 *
 * @param svgString
 * @param width
 * @param height
 * @param callback
 */
function svgString2Image(svgString, width, height, callback) {

  // Convert SVG string to data URL
  let imageSource = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  let context = canvas.getContext("2d");
  let image = new Image();
  image.onload = function () {
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    let data = canvas.toDataURL("image/png");
    if (callback) callback(data);
  };

  image.src = imageSource;
}

/**
 * Creates and appends an anchor linked to the given data which is then immediately clicked.
 *
 * @param data The data to be downloaded.
 * @param filename The name of the file.
 */
function downloadData(data, filename) {
  let anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(data);
  anchor.download = appendPNGIfNeeded(filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  /**
   * Appends '.png' to the given string if the given string not already has this extension.
   *
   * @param filename The filename with or without the '.png' extension.
   * @returns {*|string} The filename with a '.png' extension.
   */
  function appendPNGIfNeeded(filename) {
    return filename.endsWith('.png') ? filename : `${filename}.png`;
  }
}

/**
 * Returns the size of the viewBox or the normal size.
 *
 * @param svgElement The svg element.
 * @returns {number[]} The size [width, height].
 */
function getOriginalSizeOfSVG(svgElement) {
  let viewBoxBaseValue = svgElement.viewBox.baseVal;
  if (viewBoxBaseValue.width !== 0 && viewBoxBaseValue.height !== 0) {
    return [
      viewBoxBaseValue.width,
      viewBoxBaseValue.height
    ];
  } else {
    return [
      svgElement.width.baseVal.value,
      svgElement.height.baseVal.value,
    ];
  }
}

/**
 * Initiates a download of the PNG image of the SVG with the given selector (id).
 *
 * @param selector The id of the SVG element to create the image of.
 * @param filename The name of the file which is been downloaded.
 */
function downloadImage(selector, filename) {
  let svgElement = d3.select('#' + selector);
  let node = svgElement.node();
  let size = getOriginalSizeOfSVG(node);
  let svgString = getSVGString(node);
  svgString2Image(svgString, 2 * size[0], 2 * size[1], function (dataURL) {
    fetch(dataURL)
      .then(res => res.blob())
      .then(function (dataBlob) {
        downloadData(dataBlob, filename);
      });
  });
}

/**
 *
 *
 * @class DateChartCard
 * @extends Card
 */
class DateChartCard extends ChartCard {

  /**
   *
   * @param selector
   * @param name
   */
  constructor(selector, name) {
    super(selector);
    if (!selector) throw 'No selector specified.';
    this.selector = selector;
    this.name = selector;
    this.datasets = [];
    this.renderChart();
    this.renderRadioGroup();
    this.applyURLParameters();
  }

  /**
   *
   */
  renderChart() {
    this.chart = new DateChart(this.body);
    this.chart.margin.left = 50;
    this.chart.margin.right = 50;
  }

  /**
   *
   */
  renderRadioGroup() {
    this.radioGroup = new RadioGroup(this.headerCenterComponent);
    this.radioGroup.onChange = function (value) {
      let dataset = this.datasets.find(dataset => dataset.label === value);
      this.setDataset(dataset);
    }.bind(this);
  }

  /**
   *
   */
  updateRadioGroup() {
    if (!this.datasets) return;
    let names = this.datasets.map(dataset => dataset.label);
    let options = names.map(name => new Option(name));
    this.radioGroup.setOptions(options);
  }

  /**
   *
   */
  applyURLParameters() {
    this.chart.type = URLParameters.getInstance()
      .getString(URLParameters.chartType, 'bar');
    this.chart.isShowLabels = URLParameters.getInstance()
      .getBoolean(URLParameters.chartShowLabels, false);
    this.chart.isCombineStacks = URLParameters.getInstance()
      .getBoolean(URLParameters.chartCombineStacks, false);
  }

  /**
   *
   */
  presentSettingsPopupAction() {
    let bodyElement = d3.select('body');
    let button = document.getElementById(this.moreButton.selector);
    let settingsPopup = new DateChartSettingsPopup(bodyElement);
    settingsPopup.diachronicChart = this.chart;
    settingsPopup.showUnder(button, 'right');
  }

  /**
   * Creates and downloads a screenshot from the chart.
   * @override
   */
  screenshotButtonAction() {
    let labels = this.chart.datasetController.labels;
    let name = labels.join(',') + '-date-chart';
    downloadImage(this.chart.svgSelector, name);
  }
}

function removeFeatures(geoJSON, removeCandidates) {
  let newGeoJSON = geoJSON;
  for (let index = 0; index < removeCandidates.length; index++) {
    let code = removeCandidates[index];
    let candidate = newGeoJSON.features.find(feature => feature.properties.code === code);
    if (!candidate) continue;
    let candidateIndex = newGeoJSON.features.indexOf(candidate);
    if (candidateIndex < 0) continue;
    newGeoJSON.features.splice(candidateIndex, 1);
  }
  return newGeoJSON;
}

class MapTooltipRenderer {

  constructor(mapChart) {
    this.mapChart = mapChart;

    let color = Color.defaultTint.rgbString();
    let tooltip = mapChart
      .element
      .append('div')
      .attr('class', 'lotivis-tooltip')
      .attr('rx', 5) // corner radius
      .attr('ry', 5)
      .style('position', 'absolute')
      .style('color', 'black')
      // .style('border', function () {
      //   return `solid 1px ${color}`;
      // })
      .style('opacity', 0);

    let bounds = mapChart.svg
      .append('rect')
      .attr('class', 'bounds')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('fill-opacity', 0)
      .style('stroke', 'red')
      .style('stroke-width', '0.7px')
      .style('stroke-dasharray', '1,1');

    this.mouserEnter = function (event, feature) {
      if (!mapChart.datasetController) return;

      d3.select(this)
        .attr('stroke', () => color)
        .attr('stroke-width', '2')
        .attr('stroke-dasharray', '0');

      // set tooltip content
      let properties = feature.properties;
      if (!properties) return;

      let code = properties.code;
      let propertiesSelection = Object.keys(properties);
      let components = propertiesSelection.map(function (propertyName) {
        return `${propertyName}: ${properties[propertyName]}`;
      });

      let flatData = mapChart.datasetController.flatData;
      let combined = combineByLocation(flatData);
      let data = combined.filter(item => +item.location === +code);

      if (data) {
        components.push('');
        for (let index = 0; index < data.length; index++) {
          let item = data[index];
          let label = (item.label || item.dataset || item.stack);
          components.push(label + ': ' + item.value);
        }
      }

      tooltip.html(components.join('<br>'));

      // position tooltip
      let tooltipWidth = Number(tooltip.style('width').replace('px', '') || 200);
      let tooltipHeight = Number(tooltip.style('height').replace('px', ''));
      tooltipWidth += 20;
      tooltipHeight += 20;

      let projection = mapChart.projection;
      let featureBounds = d3.geoBounds(feature);
      let featureLowerLeft = projection(featureBounds[0]);
      let featureUpperRight = projection(featureBounds[1]);
      let featureBoundsWidth = featureUpperRight[0] - featureLowerLeft[0];
      let featureBoundsHeight = featureLowerLeft[1] - featureUpperRight[1];

      // svg is presented in dynamic sized view box so we need to get the actual size
      // of the element in order to calculate a scale for the position of the tooltip.
      let effectiveSize = mapChart.getElementEffectiveSize();
      let factor = effectiveSize[0] / mapChart.width;
      let heightFactor = effectiveSize[1] / mapChart.height;

      // calculate offset
      let positionOffset = mapChart.getElementPosition();

      // calculate scaled position
      let top = 0;

      if ((featureLowerLeft[1] * heightFactor) > (effectiveSize[1] / 2)) {
        top += featureUpperRight[1];
        top *= factor;
        top -= tooltipHeight;
        top -= 5;
      } else {
        top += featureLowerLeft[1];
        top *= factor; // Use width factor instead of heightFactor for propert using. Can't figure out why width factor works better.
        top += 5;
      }

      top += positionOffset[1];

      // calculate tooltip center
      let centerBottom = featureLowerLeft[0];
      centerBottom += (featureBoundsWidth / 2);
      centerBottom *= factor;
      centerBottom -= (Number(tooltipWidth) / 2);
      centerBottom += positionOffset[0];

      tooltip.style('opacity', 1)
        .style('left', centerBottom + 'px')
        .style('top', top + 'px');

      bounds
        .style('opacity', 1)
        .style('width', featureBoundsWidth + 'px')
        .style('height', featureBoundsHeight + 'px')
        .style('x', featureLowerLeft[0])
        .style('y', featureUpperRight[1]);

      mapChart.onSelectFeature(event, feature);
    };

    this.mouseOut = function (event, feature) {
      d3.select(this)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.7')
        .attr('stroke-dasharray', function (feature) {
          return feature.departmentsData ? '0' : '1,4';
        });
      tooltip.style('opacity', 0);
      bounds.style('opacity', 0);
    };

    this.raise = function () {
      tooltip.raise();
      bounds.raise();
    };
  }
}

/**
 * The default number format.
 *
 * @type {Intl.NumberFormat}
 */
const numberFormat = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 3
});

/**
 * Returns the formatted version from the given number.
 *
 * @param number The number to format.
 * @returns {string} The formatted version of the number.
 */
function formatNumber(number) {
  if (typeof number !== 'number') return number;
  return numberFormat.format(number);
}

/**
 *
 * @class MapLegendRenderer
 */
class MapLegendRenderer {

  constructor(mapChart) {

    this.legend = mapChart.svg
      .append('svg')
      .attr('class', 'legend')
      .attr('fill', 'red')
      .attr('width', mapChart.width)
      .attr('height', 200)
      .attr('x', 0)
      .attr('y', 0);

    this.removeDatasetLegend = function () {
      this.legend.selectAll('rect').remove();
      this.legend.selectAll('text').remove();
    };

    this.renderDatasetsLegend = function () {
      if (!mapChart.datasetController) return;

      let stackNames = mapChart.datasetController.stacks;
      let combinedData = mapChart.combinedData;

      this.legend.raise();
      this.removeDatasetLegend();

      for (let index = 0; index < stackNames.length; index++) {

        let stackName = stackNames[index];
        let dataForStack = combinedData.filter(data => data.stack === stackName);
        let max = d3.max(dataForStack, item => item.value);
        let offset = index * 80;
        let color = Color.colorsForStack(index, 1)[0];

        let steps = 4;
        let data = [0, 1, 2, 3, 4];

        this.legend
          .append('text')
          .attr('x', offset + 20)
          .attr('y', '14')
          .style('fill', color.rgbString())
          .text(stackName);

        this.legend
          .append("g")
          .selectAll("rect")
          .data(data)
          .enter()
          .append("rect")
          .style('fill', color.rgbString())
          .attr('x', '20')
          .attr('y', '20')
          .attr('width', 18)
          .attr('height', 18)
          .attr('transform', function (d, i) {
            return 'translate(' + offset + ',' + (i * 20) + ')';
          })
          .style('stroke', 'black')
          .style('stroke-width', 1)
          .style('fill-opacity', (d, i) => i / steps);

        this.legend
          .append("g")
          .selectAll("text")
          .data(data)
          .enter()
          .append("text")
          .style('fill', color.rgbString())
          .attr('x', '40')
          .attr('y', '35')
          .attr('width', 18)
          .attr('height', 18)
          .attr('transform', function (d, i) {
            return 'translate(' + offset + ',' + (i * 20) + ')';
          })
          .style('stroke', 'black')
          .style('stroke-width', 1)
          .style('fill-opacity', (d, i) => i / steps)
          .text(function (d, i) {
            return formatNumber((i / steps) * max);
          }.bind(this));

      }
    };
  }
}

class MapLabelRenderer {

  constructor(mapChart) {

    /**
     * Appends labels from datasets.
     */
    this.renderDatasetLabels = function () {
      if (!mapChart.geoJSON) return log_debug('no geoJSON');
      if (!mapChart.datasetController) return log_debug('no datasetController');

      let geoJSON = mapChart.geoJSON;
      let combinedData = mapChart.combinedData;

      mapChart.svg.selectAll('.map-label').remove();
      mapChart.svg
        .selectAll('text')
        .data(geoJSON.features)
        .enter()
        .append('text')
        .attr('class', 'map-label')
        .attr('text-anchor', 'middle')
        .attr('fill', mapChart.tintColor)
        .attr('font-size', 12)
        .attr('opacity', function () {
          return mapChart.isShowLabels ? 1 : 0;
        }.bind(this))
        .text(function (feature) {
          let code = +feature.properties.code;
          let dataset = combinedData.find(dataset => +dataset.location === code);
          return dataset ? formatNumber(dataset.value) : '';
        })
        .attr('x', function (feature) {
          return mapChart.projection(feature.center)[0];
        }.bind(this))
        .attr('y', function (feature) {
          return mapChart.projection(feature.center)[1];
        }.bind(this));
    };
  }
}

class MapDatasetRenderer {

  constructor(mapChart) {

    /**
     * Iterates the datasets per stack and draws them on svg.
     */
    this.renderDatasets = function () {
      if (!mapChart.geoJSON) return;
      if (!mapChart.datasetController) return;

      let stackNames = mapChart.datasetController.stacks;
      let combinedData = mapChart.combinedData;

      // reset colors
      mapChart.svg
        .selectAll('path')
        .attr('fill', 'white')
        .attr('fill-opacity', '.5');

      for (let index = 0; index < stackNames.length; index++) {

        let stackName = stackNames[index];
        let dataForStack = combinedData.filter(data => data.stack === stackName);
        let max = d3.max(dataForStack, item => item.value);
        let color = Color.colorsForStack(index)[0];

        for (let index = 0; index < dataForStack.length; index++) {
          let datasetEntry = dataForStack[index];
          let id = datasetEntry.location;

          mapChart.svg
            .selectAll('path')
            .filter(item => String(item.properties.code) === String(id))
            .attr('fill', color.rgbString())
            .attr('fill-opacity', datasetEntry.value / max);

        }
      }
    };
  }
}

/**
 *
 */
class MapGeoJsonRenderer {

  constructor(mapChart) {

    /**
     * Renders the `geoJSON` property.
     */
    this.renderGeoJson = function () {
      let geoJSON = mapChart.presentedGeoJSON;

      mapChart.svg
        .selectAll('path')
        .data(geoJSON.features)
        .enter()
        .append('path')
        .attr('d', mapChart.path)
        .attr('id', feature => feature.properties.code)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.5)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.7')
        .attr('stroke-dasharray', (feature) => feature.departmentsData ? '0' : '1,4')
        .attr('cursor', 'pointer')
        .on('click', mapChart.onSelectFeature.bind(mapChart))
        .on('mouseenter', mapChart.tooltipRenderer.mouserEnter)
        .on('mouseout', mapChart.tooltipRenderer.mouseOut);
    };
  }
}

/**
 * A component which renders a geo json with d3.
 *
 * @class MapChart
 * @extends Chart
 */
class MapChart extends Chart {

  /**
   * Creates a new instance of MapChart.
   *
   * @param parent The parental component.
   */
  constructor(parent) {
    super(parent);
    this.element = parent
      .append('div')
      .attr('id', this.selector);

    this.initialize();
    this.renderSVG();
    this.labelRenderer = new MapLabelRenderer(this);
    this.legendRenderer = new MapLegendRenderer(this);
    this.tooltipRenderer = new MapTooltipRenderer(this);
    this.datasetRenderer = new MapDatasetRenderer(this);
  }

  /**
   * Initialize with default values.
   */
  initialize() {
    this.width = 1000;
    this.height = 1000;

    this.tintColor = Color.defaultTint.rgbString();
    this.isShowLabels = true;
    this.geoJSON = null;
    this.departmentsData = [];
    this.excludedFeatureCodes = [];
    this.updateSensible = true;

    this.projection = d3.geoMercator();
    this.path = d3.geoPath().projection(this.projection);
  }

  /**
   * Tells the receiving map chart to update its view.
   */
  update() {
    if (!this.updateSensible) return;
    this.geoJSONDidChange();
    this.datasetsDidChange();
  }

  /**
   *
   */
  renderSVG() {
    this.svg = d3
      .select(`#${this.selector}`)
      .append('svg')
      .attr('id', this.svgSelector)
      .classed('map', true)
      .attr('viewBox', `0 0 ${this.width} ${this.height}`);

    this.background = this.svg
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'white');

    // create a background rectangle for receiving mouse enter events
    // in order to reset the location data filter.
    this.background
      .on('mouseenter', function () {
        let controller = this.datasetController;
        if (!controller) return;
        let filters = controller.locationFilters;
        if (!filters || filters.length === 0) return;
        this.updateSensible = false;
        controller.setLocationsFilter([]);
        this.updateSensible = true;
      }.bind(this));
  }

  /**
   * Sets the size of the projection to fit the given geo json.
   *
   * @param geoJSON
   */
  zoomTo(geoJSON) {
    this.projection.fitSize([this.width, this.height], geoJSON);
  }

  /**
   *
   * @param event
   * @param feature
   */
  onSelectFeature(event, feature) {
    if (!feature || !feature.properties) return;
    if (!this.datasetController) return;
    let locationID = feature.properties.code;
    this.updateSensible = false;
    this.datasetController.setLocationsFilter([locationID]);
    this.updateSensible = true;
  }

  /**
   * Sets the presented geo json.
   *
   * @param newGeoJSON
   */
  setGeoJSON(newGeoJSON) {
    this.geoJSON = newGeoJSON;
    this.presentedGeoJSON = newGeoJSON;
    this.geoJSONDidChange();
  }

  /**
   * Tells the receiving map chart that its `geoJSON` property did change.
   */
  geoJSONDidChange() {
    if (!this.geoJSON) return;
    // precalculate the center of each feature
    this.geoJSON.features.forEach((feature) => feature.center = d3.geoCentroid(feature));
    this.presentedGeoJSON = removeFeatures(this.geoJSON, this.excludedFeatureCodes);
    this.zoomTo(this.geoJSON);
    this.geoJSONRenderer = new MapGeoJsonRenderer(this);
    this.geoJSONRenderer.renderGeoJson();
  }

  /**
   *
   * @param newDatasets
   */
  set datasets(newDatasets) {
    this.setDatasetController(new FilterableDatasetsController(newDatasets));
  }

  /**
   *
   * @returns {*}
   */
  get datasets() {
    if (!this.datasetController) return [];
    return this.datasetController.datasets;
  }

  /**
   * Tells the receiving map chart that its `datasets` property did change.
   */
  datasetsDidChange() {
    if (!this.datasetController) return;
    const combinedByStack = combineByStacks(this.datasetController.enabledFlatData);
    this.combinedData = combineByLocation(combinedByStack);
    this.legendRenderer.renderDatasetsLegend();
    this.datasetRenderer.renderDatasets();
    this.labelRenderer.renderDatasetLabels();
    this.tooltipRenderer.raise();
  }

  /**
   *
   * @param newController
   */
  setDatasetController(newController) {
    this.datasetController = newController;
    this.datasetController.addListener(this);
    this.datasetsDidChange();
  }
}

/**
 *
 * @class MapChartSettingsPopup
 * @extends Popup
 */
class MapChartSettingsPopup extends Popup {

  /**
   *
   */
  render() {
    this.card
      .headerRow
      .append('h3')
      .text('Settings');

    this.row = this.card.body
      .append('div')
      .classed('row', true);

    this.renderShowLabelsCheckbox();
  }

  /**
   *
   */
  renderShowLabelsCheckbox() {
    let container = this.row.append('div').classed('col-12 margin-top', true);
    this.showLabelsCheckbox = new Checkbox(container);
    this.showLabelsCheckbox.setText('Labels');
    this.showLabelsCheckbox.onClick = function (checked) {
      this.mapChart.isShowLabels = checked;
      this.mapChart.update();
      URLParameters.getInstance().setWithoutDeleting('map-show-labels', checked);
    }.bind(this);
  }

  /**
   *
   * @returns {{width: number, height: number}}
   */
  preferredSize() {
    return {
      width: 240,
      height: 600
    };
  }

  /**
   *
   */
  willShow() {
    super.willShow();
    this.showLabelsCheckbox.setChecked(this.mapChart.isShowLabels);
    console.log('this.mapChart.showLabels: ' + this.mapChart.isShowLabels);
  }
}

/**
 *
 * @class MapChartCard
 * @extends ChartCard
 */
class MapChartCard extends ChartCard {

  /**
   * Creates a new instance of MapChartCard.
   *
   * @param parent The parental component.
   */
  constructor(parent) {
    super(parent);
  }

  /**
   * Creates and injects the map chart.
   */
  injectMapChart() {
    this.chart = new MapChart(this.body);
  }

  /**
   * Creates and downloads a screenshot from the chart.
   * @override
   */
  screenshotButtonAction() {
    let labels = this.chart.datasetController.labels;
    let name = labels.join(',') + '-map-chart';
    downloadImage(this.chart.svgSelector, name);
  }

  /**
   * Triggered when the more button is pushed.
   */
  presentSettingsPopupAction() {
    let bodyElement = d3.select('body');
    let button = document.getElementById(this.moreButton.selector);
    let settingsPopup = new MapChartSettingsPopup(bodyElement);
    settingsPopup.mapChart = this.chart;
    settingsPopup.showUnder(button, 'right');
  }
}

/**
 * @class PlotAxisRenderer
 */
class PlotAxisRenderer {

  /**
   * @constructor
   * @param plotChart
   */
  constructor(plotChart) {

    /**
     *
     */
    this.renderAxis = function () {

      // top axis
      plotChart.svg
        .append("g")
        .call(d3.axisTop(plotChart.xChart))
        .attr("transform", () => `translate(0,${plotChart.margin.top})`);

      // bottom axis
      plotChart.svg
        .append("g")
        .call(d3.axisBottom(plotChart.xChart))
        .attr("transform", () => `translate(0,${plotChart.height - plotChart.margin.bottom})`);

      // left axis
      plotChart.svg
        .append("g")
        .call(d3.axisLeft(plotChart.yChart))
        .attr("transform", () => `translate(${plotChart.margin.left},0)`);

    };

    /**
     * Adds a grid to the chart.
     */
    this.renderGrid = function () {
      let color = 'lightgray';
      let width = '0.5';
      let opacity = 0.3;

      plotChart.svg
        .append('g')
        .attr('class', 'x axis-grid')
        .attr('transform', 'translate(0,' + (plotChart.height - plotChart.margin.bottom) + ')')
        .attr('stroke', color)
        .attr('stroke-width', width)
        .attr("opacity", opacity)
        .call(plotChart.xAxisGrid);

      plotChart.svg
        .append('g')
        .attr('class', 'y axis-grid')
        .attr('transform', `translate(${plotChart.margin.left},0)`)
        .attr('stroke', color)
        .attr('stroke-width', width)
        .attr("opacity", opacity)
        .call(plotChart.yAxisGrid);

    };
  }
}

function hashCode(str) {
  let hash = 0, i, chr;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

class PlotBarsRenderer {

  constructor(plotChart) {

    /**
     *
     */
    this.renderBars = function () {
      let datasets = plotChart.workingDatasets;

      this.defs = plotChart.svg.append("defs");
      for (let index = 0; index < datasets.length; index++) {
        this.createGradient(datasets[index]);
      }

      let radius = 6;

      plotChart.barsData = plotChart
        .svg
        .append("g")
        .selectAll("g")
        .data(datasets)
        .enter();

      plotChart.bars = plotChart.barsData
        .append("rect")
        .attr("fill", (d) => `url(#${this.createIDFromDataset(d)})`)
        .style("stroke", 'gray')
        .style("stroke-width", 0.4)
        .attr("rx", radius)
        .attr("ry", radius)
        .attr("x", (d) => plotChart.xChart(d.earliestDate || 0))
        .attr("y", (d) => plotChart.yChart(d.label) + 1)
        .attr("height", plotChart.yChart.bandwidth() - 2)
        .attr("id", (d) => 'rect-' + hashCode(d.label))
        .on('mouseenter', plotChart.tooltipRenderer.showTooltip.bind(plotChart))
        .on('mouseout', plotChart.tooltipRenderer.hideTooltip.bind(plotChart))
        .attr("width", function (data) {
          if (!data.earliestDate || !data.latestDate) return 0;
          return plotChart.xChart(data.latestDate) - plotChart.xChart(data.earliestDate) + plotChart.xChart.bandwidth();
        }.bind(this));
    };

    this.createGradient = function (dataset) {
      let max = plotChart.datasetController.getMax();
      let gradient = this.defs
        .append("linearGradient")
        .attr("id", this.createIDFromDataset(dataset))
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

      let data = dataset.data;
      let count = data.length;
      let firstDate = dataset.earliestDate;
      let lastDate = dataset.latestDate;
      let timespan = lastDate - firstDate;
      let colorInterpolator = d3.interpolateRgb(
        plotChart.configuration.lowColor,
        plotChart.configuration.highColor
      );

      if (firstDate === lastDate) {
        if (!data || data.length === 0) return;
        let item = data[0];
        let value = item.value;
        let opacity = value / max;

        gradient
          .append("stop")
          .attr("offset", `100%`)
          .attr("stop-color", colorInterpolator(opacity));

      } else {

        for (let index = 0; index < count; index++) {

          let item = data[index];
          let date = item.date;
          let opacity = item.value / max;

          let dateDifference = lastDate - date;
          let datePercentage = (1 - (dateDifference / timespan)) * 100;

          gradient
            .append("stop")
            .attr("offset", `${datePercentage}%`)
            .attr("stop-color", colorInterpolator(opacity));

        }
      }
    };

    this.createIDFromDataset = function (dataset) {
      return hashCode(dataset.label);
    };
  }
}

/**
 *
 * @class PlotTooltipRenderer
 */
class PlotTooltipRenderer {

  /**
   * Creates a new instance of PlotTooltipRenderer.
   *
   * @constructor
   * @param plotChart
   */
  constructor(plotChart) {

    const tooltip = plotChart
      .element
      .append('div')
      .attr('class', 'lotivis-tooltip')
      .attr('rx', 5) // corner radius
      .attr('ry', 5)
      .style('opacity', 0);

    /**
     *
     * @param dataset
     */
    function getHTMLContentForDataset(dataset) {
      let components = [];

      components.push('Label: ' + dataset.label);
      components.push('');
      components.push('Start: ' + dataset.earliestDate);
      components.push('End: ' + dataset.latestDate);
      components.push('');
      components.push('Items: ' + dataset.data.map(item => item.value).reduce((acc, next) => acc + next, 0));
      components.push('');

      let filtered = dataset.data.filter(item => item.value !== 0);
      for (let index = 0; index < filtered.length; index++) {
        let entry = filtered[index];
        components.push(`${entry.date}: ${entry.value}`);
      }

      return components.join('<br/>');
    }

    function getTooltipLeftForDataset(dataset, factor, offset) {
      let left = plotChart.xChart(dataset.earliestDate);
      left *= factor;
      left += offset[0];
      return left;
    }

    /**
     * Presents the tooltip for the given dataset.
     *
     * @param event The mouse event.
     * @param dataset The dataset.
     */
    this.showTooltip = function (event, dataset) {

      tooltip.html(getHTMLContentForDataset(dataset));

      // position tooltip
      let tooltipHeight = Number(tooltip.style('height').replace('px', ''));
      let factor = plotChart.getElementEffectiveSize()[0] / plotChart.width;
      let offset = plotChart.getElementPosition();

      let top = plotChart.yChart(dataset.label);
      top *= factor;
      top += offset[1];

      if ((plotChart.yChart(dataset.label) - plotChart.margin.top) <= (plotChart.graphHeight / 2)) {
        top += (plotChart.lineHeight * factor) + Constants.tooltipOffset;
      } else {
        top -= tooltipHeight + 20; // subtract padding
        top -= Constants.tooltipOffset;
      }

      let left = getTooltipLeftForDataset(dataset, factor, offset);

      tooltip
        .style('left', left + 'px')
        .style('top', top + 'px')
        // .transition()
        .style('opacity', 1);

      // let id = 'rect-' + hashCode(dataset.label);

      // plotChart
      //   .svg
      //   .selectAll('rect')
      //   .transition()
      //   .attr('opacity', 0.15);

      // plotChart
      //   .labels
      //   .transition()
      //   .attr('opacity', plotChart.isShowLabels ? 0.15 : 0);

      // plotChart
      //   .svg
      //   .selectAll(`#${id}`)
      //   .transition()
      //   .attr('opacity', 1);
      //
      // plotChart
      //   .labels
      //   .selectAll(`#${id}`)
      //   .transition()
      //   .attr('opacity', 1);

      plotChart.onSelectDataset(event, dataset);
    };

    /**
     *
     */
    this.hideTooltip = function () {
      let controller = plotChart.datasetController;
      let filters = controller.datasetFilters;

      if (filters && filters.length !== 0) {
        controller.resetFilters();
      }

      if (+tooltip.style('opacity') === 0) return;
      tooltip.style('opacity', 0);
      // plotChart
      //   .svg
      //   .selectAll('rect')
      //   .transition()
      //   .attr('opacity', 1);
      // plotChart
      //   .labels
      //   .transition()
      //   .attr('opacity', plotChart.isShowLabels ? 1 : 0);
    };
  }
}

/**
 *
 * @class
 */
class PlotLabelRenderer {

  constructor(plotChart) {

    this.renderLabels = function () {
      let xBandwidth = plotChart.yChart.bandwidth();
      let xChart = plotChart.xChart;
      plotChart.labels = plotChart
        .barsData
        .append('g')
        .attr('transform', `translate(0,${(xBandwidth / 2) + 4})`)
        .append('text')
        .attr("id", (d) => 'rect-' + hashCode(d.label))
        .attr("fill", 'black')
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .attr('class', 'map-label')
        .attr('opacity', plotChart.isShowLabels ? 1 : 0)
        .attr("x", function (d) {
          let rectX = xChart(d.earliestDate);
          let offset = xBandwidth / 2;
          return rectX + offset;
        })
        .attr("y", (d) => plotChart.yChart(d.label))
        .attr("width", (d) => xChart(d.latestDate) - xChart(d.earliestDate) + xBandwidth)
        .text(function (dataset) {
          if (dataset.sum === 0) return;
          return `${dataset.duration} years, ${dataset.sum} items`;
        });
    };
  }
}

/**
 *
 * @class PlotChart
 * @extends Component
 */
class PlotChart extends Chart {
  radius = 23;
  isShowLabels = true;
  configuration = {
    lowColor: 'rgb(184, 233, 148)',
    highColor: 'rgb(0, 122, 255)'
  };
  sort = PlotChartSort.duration;

  /**
   * Creates an instance of DiachronicChart.
   *
   * @constructor
   * @param {Component} parent The parental component.
   */
  constructor(parent) {
    super(parent);

    if (Object.getPrototypeOf(parent) === String.prototype) {
      this.selector = parent;
      this.element = d3.select('#' + parent);
    } else {
      this.element = parent;
      this.element.attr('id', this.selector);
    }

    this.initialize();
    this.update();
  }

  /**
   * Initializes this diachronic chart by setting the default values.
   */
  initialize() {
    this.width = 1000;
    this.height = 600;
    this.defaultMargin = 60;
    this.lineHeight = 28;
    this.margin = {
      top: this.defaultMargin,
      right: this.defaultMargin,
      bottom: this.defaultMargin,
      left: this.defaultMargin + 100
    };

    this.isShowLabels = true;
    this.updateSensible = true;

    this.datasets = [];

    this.axisRenderer = new PlotAxisRenderer(this);
    this.barsRenderer = new PlotBarsRenderer(this);
    this.labelsRenderer = new PlotLabelRenderer(this);
    this.tooltipRenderer = new PlotTooltipRenderer(this);
  }

  /**
   *
   */
  configureChart() {
    let margin = this.margin;
    this.height = (this.workingDatasets.length * this.lineHeight) + margin.top + margin.bottom;
    this.graphWidth = this.width - margin.left - margin.right;
    this.graphHeight = this.height - margin.top - margin.bottom;
  }

  /**
   * Creates and renders the chart.
   */
  drawChart() {
    if (this.workingDatasets.length === 0) return;
    this.createSVG();
    this.createGraph();
    this.createScales();
    this.axisRenderer.renderAxis();
    this.axisRenderer.renderGrid();
    this.barsRenderer.renderBars();
    this.labelsRenderer.renderLabels();
  }

  /**
   * Updates the plot chart.
   */
  update(controller, reason) {
    if (!this.updateSensible) return;
    if (reason === 'dates-filter') return;
    this.datasetsDidChange();
    this.sortDatasets();
    this.configureChart();
    this.drawChart();
  }

  /**
   * Removes all `svg`s from the parental element.
   */
  removeSVG() {
    this.element.selectAll('svg').remove();
  }

  /**
   *
   */
  createSVG() {
    this.removeSVG();
    this.svg = this.element
      .append('svg')
      .attr('id', this.svgSelector)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr("viewBox", `0 0 ${this.width} ${this.height}`);

    this.background = this.svg
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'white')
      .on('mouseout', function () {
        // this.tooltipRenderer.hideTooltip();
      }.bind(this))
      .on('mouseenter', function () {
        // this.tooltipRenderer.hideTooltip();
      }.bind(this));
  }

  /**
   *
   */
  createGraph() {
    this.graph = this.svg
      .append('g')
      .attr('width', this.graphWidth)
      .attr('height', this.graphHeight)
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }

  /**
   * Creates scales which are used to calculate the x and y positions of bars or circles.
   */
  createScales() {
    let listOfDates = extractDatesFromDatasets(this.workingDatasets);
    let listOfLabels = this.workingDatasets
      .map(dataset => dataset.label)
      .reverse();

    this.xChart = d3
      .scaleBand()
      .domain(listOfDates)
      .rangeRound([this.margin.left, this.width - this.margin.right]);

    this.yChart = d3
      .scaleBand()
      .domain(listOfLabels)
      .rangeRound([this.height - this.margin.bottom, this.margin.top]);

    this.xAxisGrid = d3
      .axisBottom(this.xChart)
      .tickSize(-this.graphHeight)
      .tickFormat('');

    this.yAxisGrid = d3
      .axisLeft(this.yChart)
      .tickSize(-this.graphWidth)
      .tickFormat('');

  }

  /**
   *
   * @param event
   * @param dataset
   */
  onSelectDataset(event, dataset) {
    if (!dataset || !dataset.label) return;
    let label = dataset.label;
    this.updateSensible = false;
    this.datasetController.setDatasetsFilter([label]);
    this.updateSensible = true;
  }

  sortDatasets() {
    this.workingDatasets = this.workingDatasets.reverse();
    switch (this.sort) {
      case PlotChartSort.alphabetically:
        this.workingDatasets = this.workingDatasets
          .sort((set1, set2) => set1.label > set2.label);
        break;
      case PlotChartSort.duration:
        this.workingDatasets = this.workingDatasets
          .sort((set1, set2) => set1.duration < set2.duration);
        break;
      case PlotChartSort.intensity:
        this.workingDatasets = this.workingDatasets
          .sort((set1, set2) => set1.sum < set2.sum);
        break;
      case PlotChartSort.firstDate:
        this.workingDatasets = this.workingDatasets
          .sort((set1, set2) => set1.earliestDate > set2.earliestDate);
        break;
    }
  }

  set showLabels(newValue) {
    this.isShowLabels = newValue;
  }

  get showLabels() {
    return this.isShowLabels;
  }

  /**
   * Sets the datasets.
   * @param newDatasets The array of datasets.
   */
  set datasets(newDatasets) {
    this.setDatasetController(new FilterableDatasetsController(newDatasets));
  }

  /**
   * Returns the presented datasets.
   * @returns {*}
   */
  get datasets() {
    return this.datasetController.datasets;
  }

  /**
   *
   */
  datasetsDidChange() {
    if (!this.datasetController) return;
    let datasets = this.datasetController.enabledDatasets;
    this.workingDatasets = copy(datasets);
    this.workingDatasets.forEach(function (dataset) {
      let data = dataset.data;
      let firstDate = extractEarliestDateWithValue(data);
      let lastDate = extractLatestDateWithValue(data);
      let duration = lastDate - firstDate;
      data.forEach(item => item.label = dataset.label);
      data = data.sort((left, right) => left.date - right.date);
      dataset.earliestDate = firstDate;
      dataset.latestDate = lastDate;
      dataset.duration = duration;
      dataset.data = combineByDate(data);
      dataset.sum = sumOfLabel(data, dataset.label);
    });
    this.sortDatasets();
  }

  /**
   *
   * @param newController
   */
  setDatasetController(newController) {
    this.datasetController = newController;
    this.datasetController.addListener(this);
    this.datasetsDidChange();
    this.update();
  }
}

/**
 * Enumeration of sorts available in the plot chart.
 */
const PlotChartSort = {
  alphabetically: 'alphabetically',
  duration: 'duration',
  intensity: 'intensity',
  firstDate: 'firstDate'
};

/**
 *
 * @class Dropdown
 * @extends Component
 */
class Dropdown extends Component {

    constructor(parent) {
        super(parent);
        this.inputElements = [];
        this.selector = createID();
        this.element = parent
            .append('div')
            .classed('dropdown-container', true);
        this.selectId = createID();
        this.renderLabel();
        this.renderSelect();
    }

    renderLabel() {
        this.label = this.element
            .append('label')
            .attr('for', this.selectId);
    }

    renderSelect() {
        let thisReference = this;
        this.select = this.element
            .append('select')
            .classed('form-control form-control-sm', true)
            .attr('id', this.selectId)
            .on('change', function (event) {
                thisReference.onClick(event);
            });
    }

    addOption(optionId, optionName) {
        return this.select
            .append('option')
            .attr('id', optionId)
            .attr('value', optionId)
            .text(optionName);
    }

    setOptions(options) {
        this.removeAllInputs();
        for (let i = 0; i < options.length; i++) {
            let id = options[i][0] || options[i].id;
            let name = options[i][1] || options[i].translatedTitle;
            let inputElement = this.addOption(id, name);
            this.inputElements.push(inputElement);
        }
        return this;
    }

    removeAllInputs() {
        this.element.selectAll('input').remove();
        return this;
    }

    onClick(event) {
        let element = event.target;
        if (!element) {
            return;
        }
        let value = element.value;
        if (!this.onChange) {
            return;
        }
        this.onChange(value);
        return this;
    }

    onChange(argument) {
        console.log('argument: ' + argument);
        if (typeof argument !== 'string') {
            this.onChange = argument;
        }
        return this;
    }

    // MARK: - Chaining Setter

    setLabelText(text) {
        this.label.text(text);
        return this;
    }

    setOnChange(callback) {
        this.onChange = callback;
        return this;
    }

    setSelectedOption(optionID) {
        if (this.inputElements.find(function (item) {
            return item.attr('value') === optionID;
        }) !== undefined) {
            this.value = optionID;
        }
        return this;
    }

    set value(optionID) {
        document.getElementById(this.selectId).value = optionID;
    }

    get value() {
        return document.getElementById(this.selectId).value;
    }
}

/**
 *
 * @class PlotChartSettingsPopup
 * @extends Popup
 */
class PlotChartSettingsPopup extends Popup {
  chart;

  /**
   *
   */
  render() {
    this.card.headerRow.append('h3').text('Settings');
    this.row = this.card.body.append('div').classed('row', true);
    this.renderShowLabelsCheckbox();
  }

  /**
   *
   */
  renderShowLabelsCheckbox() {
    let container = this.row.append('div').classed('col-12 margin-top', true);
    this.showLabelsCheckbox = new Checkbox(container);
    this.showLabelsCheckbox.setText('Labels');
    this.showLabelsCheckbox.onClick = function (checked) {
      this.chart.showLabels = checked;
      this.chart.update();
      URLParameters.getInstance().set(URLParameters.chartShowLabels, checked);
    }.bind(this);

    let dropdownContainer = this.row.append('div').classed('col-12', true);
    this.sortDropdown = new Dropdown(dropdownContainer);
    this.sortDropdown.setLabelText('Sort');
    this.sortDropdown.setOptions([
      new Option(PlotChartSort.alphabetically),
      new Option(PlotChartSort.duration),
      new Option(PlotChartSort.intensity),
      new Option(PlotChartSort.firstDate)
    ]);
    this.sortDropdown.setOnChange(function (value) {
      this.chart.sort = value;
      this.chart.update();
    }.bind(this));
  }

  /**
   * Returns the preferred size of the popup.
   * @returns {{width: number, height: number}}
   */
  preferredSize() {
    return {
      width: 240,
      height: 600
    };
  }

  /**
   *
   */
  willShow() {
    log_debug('this.chart.showLabels', this.chart.showLabels);
    this.showLabelsCheckbox.setChecked(this.chart.showLabels);
    this.sortDropdown.setSelectedOption(this.chart.sort);
  }

  labels = {};
}

/**
 *
 *
 * @class PlotChartCard
 * @extends Card
 */
class PlotChartCard extends ChartCard {

  /**
   * Creates a new instance of PlotChartCard.
   *
   * @param selector The selector
   * @param name
   */
  constructor(selector, name) {
    super(selector);
    if (!selector) throw 'No selector specified.';
    this.selector = selector;
    this.name = selector;
    this.datasets = [];
    this.injectChart();
    this.injectRadioGroup();
    this.applyURLParameters();
  }

  /**
   * Injects the plot chart in the body of the card.
   */
  injectChart() {
    this.chart = new PlotChart(this.body);
    this.chart.margin.left = 120;
    this.chart.margin.right = 50;
  }

  /**
   * Injects the radio group in the top.
   */
  injectRadioGroup() {
    this.radioGroup = new RadioGroup(this.headerCenterComponent);
    this.radioGroup.onChange = function (value) {
      let dataset = this.datasets.find(dataset => dataset.label === value);
      this.setDataset(dataset);
    }.bind(this);
  }

  /**
   * Updates the button in the radio group.
   */
  updateRadioGroup() {
    if (!this.datasets) return;
    let names = this.datasets.map(dataset => dataset.label);
    let options = names.map(name => new Option(name));
    this.radioGroup.setOptions(options);
  }

  /**
   *
   */
  applyURLParameters() {
    let instance = URLParameters.getInstance();
    this.chart.type = instance.getString(URLParameters.chartType, 'bar');
    this.chart.isShowLabels = instance.getBoolean(URLParameters.chartShowLabels, false);
    this.chart.isCombineStacks = instance.getBoolean(URLParameters.chartCombineStacks, false);
  }

  /**
   *
   */
  presentSettingsPopupAction() {
    let bodyElement = d3.select('body');
    let button = document.getElementById(this.moreButton.selector);
    let settingsPopup = new PlotChartSettingsPopup(bodyElement);
    settingsPopup.chart = this.chart;
    settingsPopup.showUnder(button, 'right');
  }

  /**
   * Creates and downloads a screenshot from the chart.
   * @override
   */
  screenshotButtonAction() {
    let labels = this.chart.datasetController.labels;
    let name = labels.join(',') + '-plot-chart';
    downloadImage(this.chart.svgSelector, name);
  }
}

class Geometry {
  constructor(source) {
    this.type = source.type;
    this.coordinates = source.coordinates;
  }
}

/**
 *
 * @class Feature
 */
class Feature {

  constructor(source) {
    this.type = source.type;
    this.properties = source.properties;
    this.geometry = new Geometry(source.geometry);
  }
}

/**
 *
 * @class GeoJson
 */
class GeoJson {

  constructor(source) {
    this.type = source.type;
    this.features = [];

    if (source.features) {
      for (let index = 0; index < source.features.length; index++) {
        let featureSource = source.features[index];
        let feature = new Feature(featureSource);
        this.features.push(feature);
      }
    } else {
      this.properties = source.properties;
      this.geometry = new Geometry(source.geometry);
    }
  }

  getCenter() {
    let allCoordinates = this.extractAllCoordinates();
    console.log('allCoordinates.length: ' + allCoordinates.length);
    let latitudeSum = 0;
    let longitudeSum = 0;

    allCoordinates.forEach(function (coordinates) {
      latitudeSum += coordinates[1];
      longitudeSum += coordinates[0];
    });

    return [
      latitudeSum / allCoordinates.length,
      longitudeSum / allCoordinates.length
    ];
  }

  extractGeometryCollection() {
    let geometryCollection = [];
    if (this.type === 'Feature') {
      geometryCollection.push(this.geometry);
    } else if (this.type === 'FeatureCollection') {
      this.features.forEach(feature => geometryCollection.push(feature.geometry));
    } else if (this.type === 'GeometryCollection') {
      this.geometries.forEach(geometry => geometryCollection.push(geometry));
    } else {
      throw new Error('The geoJSON is not valid.');
    }
    return geometryCollection;
  }

  extractAllCoordinates() {
    let geometryCollection = this.extractGeometryCollection();
    let coordinatesCollection = [];

    geometryCollection.forEach(item => {

      let coordinates = item.coordinates;
      let type = item.type;

      if (type === 'Point') {
        console.log("Point: " + coordinates.length);
        coordinatesCollection.push(coordinates);
      } else if (type === 'MultiPoint') {
        console.log("MultiPoint: " + coordinates.length);
        coordinates.forEach(coordinate => coordinatesCollection.push(coordinate));
      } else if (type === 'LineString') {
        console.log("LineString: " + coordinates.length);
        coordinates.forEach(coordinate => coordinatesCollection.push(coordinate));
      } else if (type === 'Polygon') {
        coordinates.forEach(function (polygonCoordinates) {
          polygonCoordinates.forEach(function (coordinate) {
            coordinatesCollection.push(coordinate);
          });
        });
      } else if (type === 'MultiLineString') {
        coordinates.forEach(function (featureCoordinates) {
          featureCoordinates.forEach(function (polygonCoordinates) {
            polygonCoordinates.forEach(function (coordinate) {
              coordinatesCollection.push(coordinate);
            });
          });
        });
      } else if (type === 'MultiPolygon') {
        coordinates.forEach(function (featureCoordinates) {
          featureCoordinates.forEach(function (polygonCoordinates) {
            polygonCoordinates.forEach(function (coordinate) {
              coordinatesCollection.push(coordinate);
            });
          });
        });
      } else {
        throw new Error('The geoJSON is not valid.');
      }
    });

    return coordinatesCollection;
  }
}

/**
 *
 * @param datasets
 */
function renderCSV(datasets) {
  let flatData = flatDatasets(datasets);
  let csvContent = 'label,value,date,location\n';
  for (let index = 0; index < flatData.length; index++) {
    let data = flatData[index];
    csvContent += `${data.dataset || 'Unknown'},${data.value || '0'},`;
    csvContent += `${data.date || ''},${data.location || ''}\n`;
  }
  return csvContent;
}

async function parseCSV(
  url,
  extractItemBlock = function (components) {
    return {date: components[0], value: components[1]};
  }) {

  let name = getFilename(url);
  let dataset = {
    label: name,
    stack: name,
    data: []
  };

  return fetch(url)
    .then(function (response) {
      return response.text();
    })
    .then(function (text) {
      let lines = text.split('\n');

      // drop first line
      lines.shift();
      dataset.data = lines
        .map(line => line.split(',').map(word => trimByChar(word, '"')))
        .filter(components => components.length > 0)
        .map(components => extractItemBlock(components))
        .filter(item => item.value && item.date);

      return dataset;
    });
}

function trimByChar(string, character) {
  const first = [...string].findIndex(char => char !== character);
  const last = [...string].reverse().findIndex(char => char !== character);
  return string.substring(first, string.length - last);
}

function getFilename(url) {
  return url.substring(url.lastIndexOf('/') + 1);
}

function createGeoJSON(datasets) {
  let locations = extractLocationsFromDatasets(datasets);
  let rowsCount = Math.ceil(locations.length / 5);
  let latSpan = 0.1;
  let lngSpan = 0.1;
  let features = [];

  loop1: for (let rowIndex = 0; rowIndex < rowsCount; rowIndex++) {
    for (let itemIndex = 0; itemIndex < 5; itemIndex++) {
      if (locations.length === 0) break loop1;
      let location = locations.shift();

      let lat = (itemIndex + 1) * latSpan;
      let lng = (rowIndex + 1) * -lngSpan;

      let coordinates = [];

      coordinates.push([lat, lng]);
      coordinates.push([lat, lng + lngSpan]);
      coordinates.push([lat + latSpan, lng + lngSpan]);
      coordinates.push([lat + latSpan, lng]);
      coordinates.push([0, 0]);

      let feature = {
        type: 'Feature',
        id: location,
        properties: {
          id: location,
          code: location,
          location: location,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            coordinates
          ]
        }
      };

      features.push(feature);
    }
  }

  return {
    type: "FeatureCollection",
    features: features
  };
}

/**
 *
 * @class ModalPopup
 * @extends Popup
 */
class ModalPopup extends Popup {

  /**
   *
   * @param parent
   */
  constructor(parent) {
    super(parent);
    this.modalBackground
      .classed('popup-underground', false)
      .classed('modal-underground', true);
  }

  /**
   *
   */
  render() {
    super.render();
    this.renderRow();
  }

  /**
   *
   */
  renderRow() {
    this.row = this.card.body
      .append('div')
      .classed('row', true);
    this.content = this.row
      .append('div')
      .classed('col-12 info-box-margin', true);
  }

  /**
   *
   */
  loadContent(url) {
    if (!url) return;
    let content = this.content;

    d3.text(url)
      .then(function (text) {
        console.log(text);
        content.html(text);
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  /**
   * Returns the preferred size. The default is 800, 600.
   * @returns {{width: number, height: number}} The preferred size.
   */
  preferredSize() {
    return {
      width: 800,
      height: 600
    };
  }
}

exports.Component = Component;
exports.Card = Card;
exports.ChartCard = ChartCard;
exports.Checkbox = Checkbox;
exports.Dropdown = Dropdown;
exports.ModalPopup = ModalPopup;
exports.Popup = Popup;
exports.RadioGroup = RadioGroup;
exports.Option = Option;

exports.TimeChart = DateChart;
exports.TimeChartCard = DateChartCard;

exports.MapChart = MapChart;
exports.MapChartCard = MapChartCard;

exports.PlotChart = PlotChart;
exports.PlotChartCard = PlotChartCard;

exports.DatasetController = DatasetsController;
exports.FilterableDatasetController = FilterableDatasetsController;

exports.URLParameters = URLParameters;

exports.GeoJson = GeoJson;

exports.renderCSV = renderCSV;
exports.parseCSV = parseCSV;

exports.createGeoJSON = createGeoJSON;

// data juggling
exports.flatDataset = flatDataset;
exports.flatDatasets = flatDatasets;
exports.combine = combine;
exports.combineByStacks = combineByStacks;
exports.combineByDate = combineByDate;
exports.combineByLocation = combineByLocation;
exports.extractLabelsFromDatasets = extractLabelsFromDatasets;
exports.extractLabelsFromFlatData = extractLabelsFromFlatData;
exports.extractStacksFromDatasets = extractStacksFromDatasets;
exports.extractStacksFromFlatData = extractStacksFromFlatData;
exports.extractDatesFromDatasets = extractDatesFromDatasets;
exports.extractDatesFromFlatData = extractDatesFromFlatData;
exports.extractLocationsFromDatasets = extractLocationsFromDatasets;
exports.extractLocationsFromFlatData = extractLocationsFromFlatData;
exports.extractEarliestDate = extractEarliestDate;
exports.extractEarliestDateWithValue = extractEarliestDateWithValue;
exports.extractLatestDate = extractLatestDate;
exports.extractLatestDateWithValue = extractLatestDateWithValue;
exports.sumOfDataset = sumOfDataset;
exports.sumOfStack = sumOfStack;
exports.dateToItemsRelations = dateToItemsRelation;

var exports$1 = exports;

exports.default = exports$1;

})));
//# sourceMappingURL=lotivis.js.map