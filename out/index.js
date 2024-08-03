import * as fs from "fs";
import csv from "csv-parser";
//saving a dataset in variabe so it can be used  later
const datasetPath = "./data/Crime_Data_from_2020_to_Present.csv";
const crimeData = [];
// Read the CSV file
fs.createReadStream(datasetPath)
    .pipe(csv())
    .on("data", (row) => {
    crimeData.push(row);
})
    .on("end", () => {
    console.log("CSV file successfully processed.");
});
