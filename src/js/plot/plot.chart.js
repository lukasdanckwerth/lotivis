import {Chart} from "../components/chart";
import {
  extractDatesFromDatasets,
  extractEarliestDateWithValue,
  extractLatestDateWithValue
} from "../data-juggle/dataset.extract";
import {combineByDate} from "../data-juggle/dataset.combine";
import {sumOfLabel} from "../data-juggle/dataset.sum";
import {PlotAxisRenderer} from "./plot.axis.renderer";
import {copy} from "../shared/copy";
import {DatasetsControllerFilter} from "../data/datasets.controller.filter";
import {PlotBarsRenderer} from "./plot.bars.renderer";
import {PlotTooltipRenderer} from "./plot.tooltip.renderer";
import {PlotLabelRenderer} from "./plot.label.renderer";
import {PlotGridRenderer} from "./plot.grid.renderer";
import {PlotBackgroundRenderer} from "./plot.background.renderer";
import {defaultPlotChartConfig} from "./plot.chart.config";
import {PlotChartSort} from "./plot.chart.sort";
import {verbose_log} from "../shared/debug";

/**
 * A lotivis plot chart.
 *
 * @class PlotChart
 * @extends Chart
 */
export class PlotChart extends Chart {

  /**
   * Initializes this diachronic chart by setting the default values.
   */
  initialize() {

    let theConfig = this.config;
    let margin;
    margin = Object.assign({}, defaultPlotChartConfig.margin);
    margin = Object.assign(margin, this.config.margin);

    let config = Object.assign({}, defaultPlotChartConfig);
    this.config = Object.assign(config, this.config);
    this.config.margin = margin;

    this.createSVG();
    this.backgroundRenderer = new PlotBackgroundRenderer(this);
    this.axisRenderer = new PlotAxisRenderer(this);
    this.gridRenderer = new PlotGridRenderer(this);
    this.barsRenderer = new PlotBarsRenderer(this);
    this.labelsRenderer = new PlotLabelRenderer(this);
    this.tooltipRenderer = new PlotTooltipRenderer(this);
  }

  /**
   * Appends the svg element to the parental element.
   */
  createSVG() {
    this.svg = this.element
      .append('svg')
      .attr('id', this.svgSelector)
      .attr('class', 'lotivis-chart-svg')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr("viewBox", `0 0 ${this.config.width} ${this.config.height}`);
  }

  /**
   * Removes any (old) components from the svg.
   */
  remove() {
    this.svg.selectAll('*').remove();
  }

  /**
   *
   */
  precalculate() {
    let margin = this.config.margin;
    let barsCount = 0;
    if (this.workingDatasets && this.workingDatasets.length > 0) {
      barsCount = this.workingDatasets.length;
    }
    this.height = (barsCount * this.config.lineHeight) + margin.top + margin.bottom;
    this.preferredHeight = this.height;
    this.graphWidth = this.config.width - margin.left - margin.right;
    this.graphHeight = this.height - margin.top - margin.bottom;

    this.svg
      .attr("viewBox", `0 0 ${this.config.width} ${this.height}`);

    this.datasetsDidChange();
  }

  /**
   * Creates and renders the chart.
   */
  draw() {
    if (!this.workingDatasets || this.workingDatasets.length === 0) return;
    this.createScales();
    this.backgroundRenderer.render();
    this.gridRenderer.renderGrid();
    this.axisRenderer.renderAxis();
    this.barsRenderer.renderBars();
    this.labelsRenderer.renderLabels();
  }

  /**
   * Updates the plot chart.
   */
  update(controller, reason) {
    verbose_log('reason', reason);
    if (!this.updateSensible) return;
    if (reason === 'dates-filter') return;
    this.remove();
    this.precalculate();
    this.draw();
  }

  /**
   * Creates scales which are used to calculate the x and y positions of bars or circles.
   */
  createScales() {
    if (!this.workingDatasets || this.workingDatasets.length === 0) return;
    let listOfDates = extractDatesFromDatasets(this.workingDatasets);
    let listOfLabels = this.workingDatasets
      .map(dataset => dataset.label)
      .reverse();

    this.xChart = d3
      .scaleBand()
      .domain(listOfDates)
      .rangeRound([this.config.margin.left, this.config.width - this.config.margin.right])
      .paddingInner(0.1);

    this.yChart = d3
      .scaleBand()
      .domain(listOfLabels)
      .rangeRound([this.height - this.config.margin.bottom, this.config.margin.top])
      .paddingInner(0.1);

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
    if (this.datasetController.listeners.length === 1) return;
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
      default:
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
    this.setDatasetController(new DatasetsControllerFilter(newDatasets));
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
    this.createScales();
  }

  /**
   *
   * @param newController
   */
  setDatasetController(newController) {
    this.datasetController = newController;
    this.datasetController.addListener(this);
    this.update();
  }
}
