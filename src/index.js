import {Component} from "./js/components/component";
import {DateChart} from "./js/date/date-chart";
import {DateChartCard} from "./js/date/date-chart-card";
import {MapChart} from "./js/map/map-chart";
import {MapChartCard} from "./js/map/map-chart-card";
import {PlotChart} from "./js/plot/plot-chart";
import {PlotChartCard} from "./js/plot/plot-chart-card";
import {GeoJson} from "./js/geojson/geojson";
import {Feature} from "./js/geojson/feature";
import {RadioGroup} from "./js/components/radio-group";
import {Option} from "./js/components/option";
import {
  flatDataset,
  flatDatasets
} from "./js/data-juggle/dataset-flat";
import {
  combine,
  combineByDate,
  combineByLocation,
  combineByStacks
} from "./js/data-juggle/dataset-combine";
import {
  extractDatesFromDatasets,
  extractDatesFromFlatData,
  extractEarliestDate,
  extractEarliestDateWithValue,
  extractLabelsFromDatasets,
  extractLabelsFromFlatData,
  extractLatestDate,
  extractLatestDateWithValue,
  extractLocationsFromDatasets,
  extractLocationsFromFlatData,
  extractStacksFromDatasets,
  extractStacksFromFlatData
} from "./js/data-juggle/dataset-extract";
import {
  sumOfDataset,
  sumOfStack
} from "./js/data-juggle/dataset-sum";
import {
  dateToItemsRelation
} from "./js/data-juggle/dataset-relations";
import {URLParameters} from "./js/shared/url-parameters";
import {DatasetsController} from "./js/data/datasets.controller";
import "./js/data/datasets.controller.listeners";
import {DatasetsControllerFilter} from "./js/data/datasets.controller.filter";
import {renderCSV} from "./js/parse/render-csv";
import {parseCSV} from "./js/parse/parse-csv";
import {createGeoJSON} from "./js/geojson-juggle/create-geojson";
import {Card} from "./js/components/card";
import {Checkbox} from "./js/components/checkbox";
import {ModalPopup} from "./js/components/modal-popup";
import {ChartCard} from "./js/components/chart-card";
import {Dropdown} from "./js/components/dropdown";
import {Popup} from "./js/components/popup";
import {joinFeatures} from "./js/geojson-juggle/join-features";


exports.Component = Component;
exports.Card = Card;
exports.ChartCard = ChartCard;
exports.Checkbox = Checkbox;
exports.Dropdown = Dropdown;
exports.ModalPopup = ModalPopup;
exports.Popup = Popup;
exports.RadioGroup = RadioGroup;
exports.Option = Option;

exports.TimeChart = DateChart;
exports.TimeChartCard = DateChartCard;

exports.MapChart = MapChart;
exports.MapChartCard = MapChartCard;

exports.PlotChart = PlotChart;
exports.PlotChartCard = PlotChartCard;

exports.DatasetController = DatasetsController;
exports.FilterableDatasetController = DatasetsControllerFilter;

exports.URLParameters = URLParameters;

exports.GeoJson = GeoJson;
exports.Feature = Feature;
exports.joinFeatures = joinFeatures;

exports.renderCSV = renderCSV;
exports.parseCSV = parseCSV;

exports.createGeoJSON = createGeoJSON;

// data juggling
exports.flatDataset = flatDataset;
exports.flatDatasets = flatDatasets;
exports.combine = combine;
exports.combineByStacks = combineByStacks;
exports.combineByDate = combineByDate;
exports.combineByLocation = combineByLocation;
exports.extractLabelsFromDatasets = extractLabelsFromDatasets;
exports.extractLabelsFromFlatData = extractLabelsFromFlatData;
exports.extractStacksFromDatasets = extractStacksFromDatasets;
exports.extractStacksFromFlatData = extractStacksFromFlatData;
exports.extractDatesFromDatasets = extractDatesFromDatasets;
exports.extractDatesFromFlatData = extractDatesFromFlatData;
exports.extractLocationsFromDatasets = extractLocationsFromDatasets;
exports.extractLocationsFromFlatData = extractLocationsFromFlatData;
exports.extractEarliestDate = extractEarliestDate;
exports.extractEarliestDateWithValue = extractEarliestDateWithValue;
exports.extractLatestDate = extractLatestDate;
exports.extractLatestDateWithValue = extractLatestDateWithValue;
exports.sumOfDataset = sumOfDataset;
exports.sumOfStack = sumOfStack;
exports.dateToItemsRelations = dateToItemsRelation;

export default exports;
