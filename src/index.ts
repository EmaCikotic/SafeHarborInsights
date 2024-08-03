import * as fs from "fs";
import csv from "csv-parser";

interface CrimeRecord {
  area: string;
  gender: string;
}

//saving a dataset in variabe so it can be used  later
const datasetPath = "./data/Crime_Data_from_2020_to_Present.csv";

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
