import * as fs from "fs";
import csv from "csv-parser";

interface CrimeRecord {
  area: string;
  gender: string;
}

//saving a dataset in variabe so it can be used  later
const datasetPath = ".data/Crime_Data_from_2020_to_Present_reduced.csv";

const crimeData: CrimeRecord[] = [];

// Read the CSV file
fs.createReadStream(datasetPath)
  .pipe(csv())
  .on("data", (row: CrimeRecord) => {
    crimeData.push(row);
  })
  .on("end", () => {
    console.log("CSV file successfully processed.");
  });

function dataAnalysis() {
  //needed feelds converted to numberical format for clustering
  const crimeByArea: { [area: string]: number } = {};
  const crimeByAreaAndGender: {
    [area: string]: { male: number; female: number };
  } = {};

  crimeData.forEach((record) => {
    const area = record.area;
    const gender = record.gender.toLowerCase();

    //counting crimes by area
    if (!crimeByArea[area]) {
      crimeByArea[area] = 0;
    }
    crimeByArea[area]++;

    //counting by area and gender
    //counting crimes by area
    if (!crimeByAreaAndGender[area]) {
      crimeByAreaAndGender[area] = { male: 0, female: 0 };
    }
    if (gender === "male" || gender === "female") {
      crimeByAreaAndGender[area][gender]++;
    }
  });

  ///converting counts to arrays for clustering
  const areaNames = Object.keys(crimeByArea);
  const crimeCounts = areaNames.map((area) => [crimeByArea[area]]);
  const crimeCountsGender = areaNames.map((area) => [
    crimeByAreaAndGender[area].male,
    crimeByAreaAndGender[area].female,
  ]);

  //calling the k means clustering
  //set the number of clusters
  //call the functions for  general resukts and for gender results
}

//TODO
//k clustering algorithm
function kMeans(data: number[][], k: number): number[][][] {
  //todo

  let clusters: number[][][] = Array.from({ length: k }, () => []);
  return clusters;
}

//initialization of centroids

//assigning clusters

//updating centroids

//euclidian distance
