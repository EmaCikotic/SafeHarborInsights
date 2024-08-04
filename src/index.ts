import * as fs from "fs";
import csv from "csv-parser";

// Interface to define the structure of each crime record
interface CrimeRecord {
  area: string;
  gender: string;
}

// Saving the dataset in a variable for later use
const datasetPath = "./data/Crime_Data_from_2020_to_Present_reduced.csv";

const crimeData: CrimeRecord[] = [];

// Read the CSV file
fs.createReadStream(datasetPath)
  .pipe(csv())
  .on("data", (row: CrimeRecord) => {
    crimeData.push(row);
  })
  .on("end", () => {
    console.log("CSV file successfully processed.");
    dataAnalysis(); //calling the function after loaded data
  });

function dataAnalysis() {
  // Fields needed, converted to numerical format for clustering
  const crimeByArea: { [area: string]: number } = {};
  const crimeByAreaAndGender: {
    [area: string]: { male: number; female: number };
  } = {};

  // Process each crime record
  crimeData.forEach((record) => {
    const area = record.area;
    const gender = record.gender.toLowerCase();

    // Counting crimes by area
    if (!crimeByArea[area]) {
      crimeByArea[area] = 0;
    }
    crimeByArea[area]++;

    // Counting by area and gender
    if (!crimeByAreaAndGender[area]) {
      crimeByAreaAndGender[area] = { male: 0, female: 0 };
    }
    if (gender === "male" || gender === "female") {
      crimeByAreaAndGender[area][gender]++;
    }
  });

  // Converting counts to arrays for clustering
  const areaNames = Object.keys(crimeByArea);
  const crimeCounts = areaNames.map((area) => [crimeByArea[area]]);
  const crimeCountsGender = areaNames.map((area) => [
    crimeByAreaAndGender[area].male,
    crimeByAreaAndGender[area].female,
  ]);

  // Calling the k-means clustering
  const k = 3; // Number of clusters
  const generalClusters = kMeans(crimeCounts, k);
  const genderClusters = kMeans(crimeCountsGender, k);

  /// Displaying the results
  console.log("Gender-Based Safety Clusters:");
  genderClusters.forEach((cluster, index) => {
    console.log(`Cluster ${index + 1}:`);

    // Get the areas in this cluster
    cluster.forEach((areaIndexArray) => {
      const areaIndex = areaIndexArray[0]; // Assuming the first element is the area index
      console.log(
        `  ${areaNames[areaIndex]}: ${crimeCountsGender[areaIndex][0]} male crimes, ${crimeCountsGender[areaIndex][1]} female crimes`
      );
    });
  });
}

// K-means clustering algorithm implementation
function kMeans(data: number[][], k: number): number[][][] {
  const centroids: number[][] = initializeCentroids(data, k);
  let clusters: number[][][] = []; //empty array for clusters

  for (let i = 0; i < k; i++) {
    clusters[i] = []; // Creating  an empty array for each cluster
  }

  let iterations = 0;
  let prevCentroids: number[][] = [];

  while (!arraysEqual(prevCentroids, centroids) && iterations < 100) {
    clusters = assignClusters(data, centroids);
    prevCentroids = centroids.map((centroid) => centroid.slice());
    updateCentroids(clusters, centroids);
    iterations++;
  }

  return clusters;
}

// Initialization of centroids
function initializeCentroids(data: number[][], k: number): number[][] {
  const centroids: number[][] = [];
  const usedIndices: number[] = [];

  while (centroids.length < k) {
    const index = Math.floor(Math.random() * data.length);
    if (!usedIndices.includes(index)) {
      centroids.push(data[index]);
      usedIndices.push(index);
    }
  }
  return centroids;
}

function assignClusters(data: number[][], centroids: number[][]): number[][][] {
  const clusters: number[][][] = []; // Initialize an empty array for clusters

  // Using a for loop to create empty arrays for each centroid
  for (let i = 0; i < centroids.length; i++) {
    clusters[i] = []; // Create an empty array for each centroid
  }

  // Iterate through each point in the data
  data.forEach((point) => {
    let minDist = Infinity; // Initialize minimum distance
    let closestCentroid = 0; // Initialize index of the closest centroid

    // Iterate through each centroid
    centroids.forEach((centroid, index) => {
      const distance = euclideanDistance(point, centroid); // Calculate distance
      if (distance < minDist) {
        // Check if this is the closest centroid
        minDist = distance; // Update minimum distance
        closestCentroid = index; // Update closest centroid index
      }
    });

    clusters[closestCentroid].push(point); // Assign point to the closest centroid's cluster
  });

  return clusters;
}

function updateCentroids(clusters: number[][][], centroids: number[][]): void {
  clusters.forEach((cluster, index) => {
    if (cluster.length === 0) return; // Skip empty clusters

    const newCentroid: number[] = []; // Initialize an empty array for the new centroid

    // Using a for loop to set the initial values to 0
    for (let i = 0; i < cluster[0].length; i++) {
      newCentroid[i] = 0; // Initialize each dimension to 0
    }

    cluster.forEach((point) => {
      point.forEach((value, i) => {
        newCentroid[i] += value; // Sum the values for each dimension
      });
    });

    // Calculate the average for each dimension
    newCentroid.forEach((sum, i) => {
      newCentroid[i] = sum / cluster.length;
    });

    centroids[index] = newCentroid; // Update the centroid
  });
}

// Euclidean distance calculation
function euclideanDistance(point1: number[], point2: number[]): number {
  let sumOfSquares = 0;

  // Iterate through all dimensions of points
  for (let i = 0; i < point1.length; i++) {
    const difference = point1[i] - point2[i]; // Calculate the difference
    const multOfDifference = difference * difference; //saving the result in a variable
    sumOfSquares += multOfDifference; // Sum the squares of the differences
  }
  return Math.sqrt(sumOfSquares); // Return the square root of the sum of squares
}

// Function to check if two arrays are equal, needed for centroid  comparison and if they are the same the algorithm can stop
function arraysEqual(arr1: number[][], arr2: number[][]): boolean {
  if (arr1.length !== arr2.length) return false; // Check lengths

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i].length !== arr2[i].length) return false; // Check inner lengths
    for (let j = 0; j < arr1[i].length; j++) {
      if (arr1[i][j] !== arr2[i][j]) return false; // Check elements
    }
  }

  return true;
}
