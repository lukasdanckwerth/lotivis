import {Component} from "../components/component";
import {log_debug} from "../shared/debug";
import {TimeChart} from "../time/time-chart";
import {
  extractDatesFromDatasets,
  extractEarliestDateWithValue,
  extractLatestDateWithValue
} from "../data-juggle/dataset-extract";
import {Color} from "../shared/colors";
import {combineByDate} from "../data-juggle/dataset-combine";

/**
 *
 * @class PlotChart
 * @extends Component
 */
export class PlotChart extends Component {
  radius = 23;

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

    this.datasets = [];
    this.injectTooltipContainer();
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
    this.renderAxis();
    this.renderGrid();
    this.renderBars();
  }

  /**
   * Update the chart.
   */
  update() {
    this.configureChart();
    this.datasetsDidChange();
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
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr('id', TimeChart.svgID);
  }

  /**
   *
   */
  createGraph() {
    this.graph = this.svg
      .append('g')
      .attr('width', this.graphWidth)
      .attr('height', this.graphHeight)
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
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
   */
  renderAxis() {

    this.svg
      .append("g")
      .call(d3.axisTop(this.xChart))
      .attr("transform", () => `translate(0,${this.margin.top})`);

    this.svg
      .append("g")
      .call(d3.axisBottom(this.xChart))
      .attr("transform", () => `translate(0,${this.height - this.margin.bottom})`);

    this.svg
      .append("g")
      .call(d3.axisLeft(this.yChart))
      .attr("transform", () => `translate(${this.margin.left},0)`);

  }

  /**
   * Adds a grid to the chart.
   */
  renderGrid() {
    let color = 'lightgray';
    let width = '0.5';
    let opacity = 0.3;

    this.svg
      .append('g')
      .attr('class', 'x axis-grid')
      .attr('transform', 'translate(0,' + (this.height - this.margin.bottom) + ')')
      .attr('stroke', color)
      .attr('stroke-width', width)
      .attr("opacity", opacity)
      .call(this.xAxisGrid);

    this.svg
      .append('g')
      .attr('class', 'y axis-grid')
      .attr('transform', `translate(${this.margin.left},0)`)
      .attr('stroke', color)
      .attr('stroke-width', width)
      .attr("opacity", opacity)
      .call(this.yAxisGrid);

  }

  /**
   *
   */
  renderBars() {

    let datasets = this.workingDatasets.map(function (dataset) {
      let data = dataset.data;
      return {
        label: dataset.label,
        earliestDate: extractEarliestDateWithValue(data),
        latestDate: extractLatestDateWithValue(data),
        data: data.sort((left, right) => left.date > right.date)
      };
    });

    this.max = d3.max(datasets, function (dataset) {
      return d3.max(dataset.data, function (item) {
        return item.value;
      });
    });

    this.defs = this.svg.append("defs");
    for (let index = 0; index < datasets.length; index++) {
      let dataset = datasets[index];
      this.createGradient(dataset);
    }

    let radius = 6;

    this.barsData = this.svg
      .append("g")
      .selectAll("g")
      .data(datasets)
      .enter();

    this.bars = this.barsData
      .append("rect")
      .attr("fill", (d) => `url(#${this.createIDFromDataset(d)})`)
      .attr("rx", radius)
      .attr("ry", radius)
      .attr("x", (d) => this.xChart(d.earliestDate))
      .attr("y", (d) => this.yChart(d.label) + 1)
      .attr("width", (d) => this.xChart(d.latestDate) - this.xChart(d.earliestDate) + this.xChart.bandwidth())
      .attr("height", this.yChart.bandwidth() - 2)
      .on('mouseenter', this.showTooltip.bind(this))
      .on('mouseout', this.hideTooltip.bind(this));

    this.labels = this.barsData
      .append('g')
      .attr('transform', `translate(0,${(this.yChart.bandwidth() / 2) + 5})`)
      .attr("fill", 'white')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'map-label')
      .attr("x", function (d) {
        let rectX = this.xChart(d.earliestDate);
        let rectX2 = this.xChart(d.latestDate);
        let width = rectX2 - rectX;
        let offset = this.xChart.bandwidth() / 2;
        return rectX + (width / 2) + offset;
      }.bind(this))
      .attr("y", (d) => this.yChart(d.label))
      .attr("width", (d) => this.xChart(d.latestDate) - this.xChart(d.earliestDate) + this.xChart.bandwidth())
      // .text((d) => d.label);

  }

  createGradient(dataset) {

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
    let colorInterpolator = d3.interpolateRgb('rgb(184, 233, 148)', 'rgb(0, 122, 255)');

    if (firstDate === lastDate) {

      let item = data[0];
      let value = item.value;
      let opacity = value / this.max;

      gradient
        .append("stop")
        .attr("offset", `100%`)
        .attr("stop-color", colorInterpolator(opacity));

    } else {

      for (let index = 0; index < count; index++) {

        let item = data[index];
        let date = item.date;
        let opacity = item.value / this.max;

        let dateDifference = lastDate - date;
        let datePercentage = (1 - (dateDifference / timespan)) * 100;

        gradient
          .append("stop")
          .attr("offset", `${datePercentage}%`)
          .attr("stop-color", colorInterpolator(opacity));

      }
    }
  }

  createIDFromDataset(dataset) {
    return this.hashCode(dataset.label);
  }

  hashCode(str) {
    let hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Presents the tooltip for the given dataset.
   *
   * @param event The mouse event.
   * @param dataset The dataset.
   */
  showTooltip(event, dataset) {
    let tooltip = this.tooltip;
    let components = [];

    components.push('Label: ' + dataset.label);
    components.push('');
    components.push('Start: ' + dataset.earliestDate);
    components.push('End: ' + dataset.latestDate);
    components.push('');
    components.push('Items: ' + dataset.data.map(item => item.value).reduce((acc, next) => acc + next, 0));
    components.push('');

    for (let index = 0; index < dataset.data.length; index++) {
      let entry = dataset.data[index];
      components.push(`${entry.date}: ${entry.value}`);
    }
    tooltip.html(components.join('<br/>'));

    // position tooltip
    let tooltipWidth = Number(tooltip.style('width').replace('px', '') || 200);
    let tooltipHeight = Number(tooltip.style('height').replace('px', ''));

    let rectX = this.xChart(dataset.earliestDate);
    let rectX2 = this.xChart(dataset.latestDate);
    let width = rectX2 - rectX;

    let factor = this.getElementEffectiveSize()[0] / this.width;
    let offset = this.getElementPosition();
    let top = this.yChart(dataset.label);

    top *= factor;
    top -= tooltipHeight;
    top += offset[1];
    top -= this.lineHeight;

    let left = this.xChart(dataset.earliestDate);
    left += width / 2;
    left += this.xChart.bandwidth() / 2;
    left *= factor;
    left -= tooltipWidth / 2;
    left += offset[0];

    tooltip
      .style('opacity', 1)
      .style('left', left + 'px')
      .style('top', top + 'px');
  }

  hideTooltip() {
    this.tooltip.style('opacity', 0);
  }

  /**
   * Appends a division to the svg.
   */
  injectTooltipContainer() {
    let color = Color.defaultTint;
    this.tooltip = this.element
      .append('div')
      .attr('class', 'map-tooltip')
      .attr('rx', 5) // corner radius
      .attr('ry', 5)
      .style('position', 'absolute')
      .style('color', 'black')
      .style('border', function () {
        return `solid 1px ${color}`;
      })
      .style('opacity', 0);
  }

  /**
   * Sets the datasets.
   * @param datasets The array of datasets.
   */
  set datasets(datasets) {
    this.originalDatasets = datasets;
    this.workingDatasets = datasets
      .sort((set1, set2) => set1.label > set2.label);
    this.workingDatasets.forEach(function (dataset) {
      let data = dataset.data;
      data.forEach(item => item.label = dataset.label);
      dataset.data = combineByDate(data);
    });

    this.datasetsDidChange();
  }

  /**
   * Returns the presented datasets.
   * @returns {*}
   */
  get datasets() {
    return this.originalDatasets;
  }

  /**
   * Tells this chart that it's datasets has changed.
   */
  datasetsDidChange() {
    log_debug('this.workingDatasets', this.workingDatasets);
  }
}

