import {Popup} from "../components/popup";
import {Checkbox} from "../components/checkbox";
import {URLParameters} from "../shared/url-parameters";

/**
 * A popup presenting a settings panel for a map chart.
 *
 * @class MapChartSettingsPopup
 * @extends Popup
 */
export class MapChartSettingsPopup extends Popup {

  /**
   * Injects the elements of the settings panel.
   * @override
   */
  render() {
    this.card
      .headerRow
      .append('h3')
      .text('Settings');

    this.row = this
      .card
      .body
      .append('div')
      .classed('row', true);

    this.renderShowLabelsCheckbox();
  }

  /**
   * Injects a checkbox to toggle the visibility of the labels of the map chart.
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
   * Returns the preferred size for this popup.
   * @override
   * @returns {{width: number, height: number}}
   */
  preferredSize() {
    return {width: 240, height: 600};
  }

  /**
   * Tells the popup that it is about to be presented.
   * @override
   */
  willShow() {
    this.showLabelsCheckbox.setChecked(this.mapChart.isShowLabels);
  }
}
