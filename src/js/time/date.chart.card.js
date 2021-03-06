import {Card} from "../components/card";
import {DateChart} from "./date.chart";
import {DateChartSettingsPopup} from "./date.chart.settings.popup";
import {RadioGroup} from "../components/radio.group";
import {Option} from "../components/option";
import {ChartCard} from "../components/chart.card";
import {downloadImage} from "../shared/download";
import {createDownloadFilename} from "../shared/filname";
import {UrlParameters} from "../shared/url.parameters";

/**
 * A lotivis time chart card.
 * @class DateChartCard
 * @extends Card
 */
export class DateChartCard extends ChartCard {

  /**
   * Creates a new instance of DateChartCard.
   * @param {Component| string} selector The parental component or the selector.
   * @param config
   */
  constructor(selector, config = {}) {
    let theSelector = selector || config.selector || 'date-chart-card';
    super(theSelector, config);
    this.selector = theSelector;
    this.datasets = [];
    this.injectRadioGroup();
  }

  /**
   * Appends the `DateChart` to this card.
   * @override
   */
  injectChart() {
    this.chartID = this.selector + '-chart';
    this.body.attr('id', this.chartID);
    this.chart = new DateChart(this.chartID, this.config);
    this.applyURLParameters();
  }

  /**
   * Appends a radio group to the header of the card.
   */
  injectRadioGroup() {
    this.radioGroup = new RadioGroup(this.headerCenterComponent);
    this.radioGroup.onChange = function (value) {
      let dataset = this.datasets.find(dataset => dataset.label === value);
      this.setDataset(dataset);
    }.bind(this);
  }

  /**
   * Updates the radio group dependant on the datasets of this card.
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
    let parameters = UrlParameters.getInstance();
    this.chart.config.showLabels = parameters
      .getBoolean(`showLabels-${this.chartID}`, this.chart.config.showLabels);
    this.chart.config.combineStacks = parameters
      .getBoolean(`combineStacks-${this.chartID}`, this.chart.config.combineStacks);
  }

  /**
   * Tells this chart card to present the setting popup card.
   * @override
   */
  presentSettingsPopupAction() {
    let button = document.getElementById(this.moreButton.selector);
    let settingsPopup = new DateChartSettingsPopup();
    settingsPopup.chart = this.chart;
    settingsPopup.showUnder(button, 'right');
  }

  /**
   * Creates and downloads a screenshot from the chart.
   * @override
   */
  screenshotButtonAction() {
    let filename = this.chart.datasetController.getFilename() || 'time-chart';
    let downloadFilename = createDownloadFilename(filename, `date-chart`);
    downloadImage(this.chart.svgSelector, downloadFilename);
  }
}
