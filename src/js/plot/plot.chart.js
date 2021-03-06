import {Chart} from "../components/chart";
import {PlotAxisRenderer} from "./plot.axis.renderer";
import {PlotBarsRenderer} from "./plot.bars.renderer";
import {PlotTooltipRenderer} from "./plot.tooltip.renderer";
import {PlotLabelRenderer} from "./plot.label.renderer";
import {PlotGridRenderer} from "./plot.grid.renderer";
import {PlotBackgroundRenderer} from "./plot.background.renderer";
import {defaultPlotChartConfig} from "./plot.chart.config";
import {PlotChartSort} from "./plot.chart.sort";
import "../dataview/dataview.plot";
import {lotivis_log} from "../shared/debug";

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

    if (this.datasetController) {
      this.dataView = this.datasetController.getPlotDataview();
    } else {
      this.dataView = {datasets: [], barsCount: 0};
    }

    this.sortDatasets();

    let margin = this.config.margin;
    let barsCount = this.dataView.labelsCount || 0;

    this.graphWidth = this.config.width - margin.left - margin.right;
    this.graphHeight = (barsCount * this.config.lineHeight);
    this.height = this.graphHeight + margin.top + margin.bottom;
    this.preferredHeight = this.height;

    this.svg
      .attr("viewBox", `0 0 ${this.config.width} ${this.preferredHeight}`);

    this.createScales();
  }

  /**
   * Creates and renders the chart.
   */
  draw() {
    this.backgroundRenderer.render();
    this.gridRenderer.render();
    this.axisRenderer.renderAxis();
    this.barsRenderer.renderBars();
    this.labelsRenderer.renderLabels();
  }

  /**
   * Updates the plot chart.
   */
  update(controller, reason) {
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

    this.xChart = d3
      .scaleBand()
      .domain(this.dataView.dates || [])
      .rangeRound([this.config.margin.left, this.config.width - this.config.margin.right])
      .paddingInner(0.1);

    this.yChart = d3
      .scaleBand()
      .domain(this.dataView.labels || [])
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
    let datasets = this.dataView.datasets;
    let sortedDatasets = [];
    switch (this.config.sort) {
      case PlotChartSort.alphabetically:
        sortedDatasets = datasets
          .sort((set1, set2) => set1.label > set2.label);
        break;
      case PlotChartSort.duration:
        sortedDatasets = datasets
          .sort((set1, set2) => set1.duration < set2.duration);
        break;
      case PlotChartSort.intensity:
        sortedDatasets = datasets
          .sort((set1, set2) => set1.sum < set2.sum);
        break;
      case PlotChartSort.firstDate:
        sortedDatasets = datasets
          .sort((set1, set2) => set1.firstDate > set2.firstDate);
        break;
      default:
        sortedDatasets = datasets;
        break;
    }

    this.dataView.labels = sortedDatasets.map(dataset => String(dataset.label)).reverse();
  }
}
