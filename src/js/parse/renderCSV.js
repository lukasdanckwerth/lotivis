import {flatDatasets} from "../data.juggle/dataset.flat";

/**
 *
 * @param datasets
 */
export function renderCSV(datasets) {
  let flatData = flatDatasets(datasets);
  let headlines = ['label', 'stack', 'value', 'date', 'location'];
  let csvContent = `${headlines.join(',')}\n`;
  for (let index = 0; index < flatData.length; index++) {
    let data = flatData[index];
    let components = [];
    components.push(data.dataset || 'Unknown');
    components.push(data.stack || '');
    components.push(data.value || '0');
    components.push(data.date || '');
    components.push(data.location || '');
    csvContent += `"${components.join(`","`)}"\n`;
  }
  return csvContent;
}
