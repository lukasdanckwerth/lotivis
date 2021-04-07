import {DatasetsController} from "../datasets.controller/datasets.controller";
import {dateToItemsRelation} from "../data.juggle/data.relations";
import {createStackModel} from "../data.juggle/data.stacks";
import {copy} from "../shared/copy";
import {combineDatasetsByRatio} from "../data.juggle/data.combine.ratio";
import {extractDatesFromDatasets} from "../data.juggle/data.extract";

/**
 * Returns a new generated DateDataview for the current enabled samples of dataset of this controller.
 */
DatasetsController.prototype.getDateDataview = function (groupSize) {
  let dateAccess = this.dateAccess;
  let datasets = copy(this.datasets);
  let enabledDatasets = copy(this.enabledDatasets() || datasets);
  let dataview = {};
  let saveGroupSize = groupSize || 1;

  dataview.groupSize = saveGroupSize;
  if (saveGroupSize <= 1) {
    dataview.datasets = datasets;
    dataview.enabledDatasets = enabledDatasets;
  } else {
    workingDatasets = combineDatasetsByRatio(datasets, saveGroupSize);
    enabledDatasets = combineDatasetsByRatio(enabledDatasets, saveGroupSize);
    dataview.datasets = datasets;
  }

  dataview.dateToItemsRelation = dateToItemsRelation(datasets, dateAccess);
  dataview.dateToItemsRelationPresented = dateToItemsRelation(enabledDatasets, dateAccess);
  dataview.datasetStacks = createStackModel(this, datasets, dataview.dateToItemsRelation);
  dataview.datasetStacksPresented = createStackModel(this, enabledDatasets, dataview.dateToItemsRelationPresented);

  dataview.max = d3.max(dataview.datasetStacksPresented, function (stack) {
    return d3.max(stack, function (series) {
      return d3.max(series.map(item => item['1']));
    });
  });

  dataview.dates = extractDatesFromDatasets(enabledDatasets);
  dataview.enabledStacks = this.enabledStacks();

  return dataview;
};
