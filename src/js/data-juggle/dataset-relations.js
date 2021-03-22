import {
  extractDatesFromDatasets,
  extractLabelsFromDatasets
} from "./dataset-extract";
import {flatDatasets} from "./dataset-flat";
import {combineByDate} from "./dataset-combine";
import {verbose_log} from "../shared/debug";

/**
 *
 * @param flatData The array of item.
 */
export function dateToItemsRelation(datasets, chart) {

  let flatData = flatDatasets(datasets);
  flatData = combineByDate(flatData);

  let dateAccess = chart.config.dateAccess;
  let listOfDates = extractDatesFromDatasets(datasets);
  verbose_log('listOfDates', listOfDates);
  listOfDates = listOfDates.reverse();
  verbose_log('listOfDates', listOfDates);
  // listOfDates = listOfDates.sort(function (left, right) {
  //   return dateAccess(left) - dateAccess(right);
  // });

  let listOfLabels = extractLabelsFromDatasets(datasets);

  return listOfDates.map(function (date) {
    let datasetDate = {date: date};
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
