import {DatasetsController} from "./datasets.controller";
import {copy} from "../shared/copy";
import {flatDatasets} from "../data.juggle/data.flat";
import {
  extractDatesFromDatasets,
  extractLabelsFromDatasets,
  extractLocationsFromDatasets,
  extractStacksFromDatasets
} from "../data.juggle/data.extract";
import {DatasetsColorsController} from "./datasets.controller.colors";

/**
 * Updates the datasets of this controller.
 * @param datasets The new datasets.
 */
DatasetsController.prototype.setDatasets = function (datasets) {
  this.originalDatasets = datasets;
  this.datasets = copy(datasets);
  this.update();
};

/**
 *
 */
DatasetsController.prototype.update = function () {
  if (!this.datasets || !Array.isArray(this.datasets)) return;

  let dateAccess = this.dateAccess;
  this.workingDatasets = copy(this.datasets)
    .sort((left, right) => left.label > right.label);
  this.workingDatasets.forEach(function (dataset) {
    dataset.isEnabled = true;
    dataset.data.forEach(function (item) {
      item.dateNumeric = dateAccess(item.date);
    });
    dataset.data = dataset.data
      .sort((left, right) => left.dateNumeric - right.dateNumeric);
  });

  this.flatData = flatDatasets(this.workingDatasets);
  this.labels = extractLabelsFromDatasets(this.datasets);
  this.stacks = extractStacksFromDatasets(this.datasets);
  this.dates = extractDatesFromDatasets(this.datasets)
    .sort((left, right) => dateAccess(left) - dateAccess(right));
  this.locations = extractLocationsFromDatasets(this.datasets);
  this.datasetsColorsController = new DatasetsColorsController(this.workingDatasets, this.stacks);
  // this.dateAccess = function (date) {
  //   return Date.parse(date);
  // };

  this.locationFilters = [];
  this.dateFilters = [];
  this.datasetFilters = [];
  this.notifyListeners(DatasetsController.NotificationReason.datasetsUpdate);
};

/**
 * Appends the given dataset to this controller.
 * @param additionalDataset The dataset to append.
 */
DatasetsController.prototype.add = function (additionalDataset) {
  if (this.datasets.find(dataset => dataset.label === additionalDataset.label)) {
    throw new Error(`DatasetsController already contains a dataset with the same label (${additionalDataset.label}).`);
  }
  this.datasets.push(additionalDataset);
  this.update();
};

/**
 * Removes the dataset with the given label from this controller. Will do nothing if no dataset
 * with the given label exists.
 *
 * @param label The label of the dataset to remove.
 */
DatasetsController.prototype.remove = function (label) {
  if (!this.datasets || !Array.isArray(this.datasets)) return;
  let candidate = this.datasets.find(dataset => dataset.label === label);
  if (!candidate) return;
  let index = this.datasets.indexOf(candidate);
  if (index < 0) return;
  this.datasets = this.datasets.splice(index, 1);
  this.update();
};


