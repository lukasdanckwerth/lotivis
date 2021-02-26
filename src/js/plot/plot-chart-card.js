import {Card} from "../components/card";
import {URLParameters} from "../shared/url-parameters";
import {RadioGroup} from "../components/radio-group";
import {Option} from "../components/option";
import {ChartCard} from "../components/chart-card";
import {PlotChart} from "./plot-chart";
import {PlotChartSettingsPopup} from "./plot-chart-settings-popup";

/**
 *
 *
 * @class PlotChartCard
 * @extends Card
 */
export class PlotChartCard extends ChartCard {

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
    settingsPopup.diachronicChart = this.chart;
    settingsPopup.showUnder(button, 'right');
  }
}