import {Card} from "../components/card";
import {DatasetCard} from "./dataset.card";
import {parseCSVDate} from "../data.parse/parse.csv.date";
import {renderCSVDate} from "../data.render/render.csv.date";
import {downloadCSV} from "../shared/download";
import {createDownloadFilename} from "../shared/filname";

/**
 * Presents the CSV version of datasets.  The presented CSV can be edited.
 * @class DatasetCSVDateCard
 * @extends Card
 */
export class DatasetCSVDateCard extends DatasetCard {

  /**
   * Creates a new instance of DatasetCSVCard.
   * @param parent The parental element or a selector (id).
   */
  constructor(parent) {
    super(parent);
    this.setHeaderText('Dataset CSV Card');
  }

  download(content) {
    let filename = this.datasetController.getFilename();
    let downloadFilename = createDownloadFilename(filename, `datasets`);
    downloadCSV(content, downloadFilename);
  }

  textToDatasets(text) {
    if (text === "") return [];
    return parseCSVDate(text);
  }

  datasetsToText(datasets) {
    return renderCSVDate(datasets);
  }
}
