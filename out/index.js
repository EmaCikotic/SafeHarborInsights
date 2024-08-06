import * as fs from "fs";
import csv from "csv-parser";
// Saving the dataset in a variable for later use
const datasetPath = "./data/Crime_Data_from_2020_to_Present_reduced.csv";
const crimeData = [];
// Read the CSV file
fs.createReadStream(datasetPath)
    .pipe(csv())
    .on("data", (row) => {
    crimeData.push(row);
})
    .on("end", () => {
    console.log("CSV file successfully processed.");
    dataAnalysis(); //calling the function after loaded data
});
function dataAnalysis() {
    const crimeByArea = {};
    const crimeByAreaAndGender = {};
    // Process each crime record
    crimeData.forEach((record) => {
        const area = record.area;
        const gender = record.victim_sex ? record.victim_sex.toUpperCase() : null; // Convert to uppercase
        // Skip records with unknown or missing gender
        //for simplicity sake I just used M and F as genders
        if (gender !== "M" && gender !== "F") {
            return;
        }
        // Counting crimes by area
        if (!crimeByArea[area]) {
            crimeByArea[area] = 0;
        }
        crimeByArea[area]++;
        // Counting by area and gender
        if (!crimeByAreaAndGender[area]) {
            crimeByAreaAndGender[area] = { male: 0, female: 0 };
        }
        // Incrementing  counts based on valid gender values
        if (gender === "M") {
            crimeByAreaAndGender[area].male++;
        }
        else if (gender === "F") {
            crimeByAreaAndGender[area].female++;
        }
    });
    // Converting counts to arrays for clustering
    const areaNames = Object.keys(crimeByArea);
    const crimeCountsGender = areaNames.map((area) => [
        crimeByAreaAndGender[area].male || 0,
        crimeByAreaAndGender[area].female || 0,
    ]);
    // Log the counts for verification
    console.log("Crime counts for gender before clustering:", crimeCountsGender);
    const k = 3; // Number of clusters
    const genderClusters = kMeans(crimeCountsGender, k);
    //console.log("Generated Gender Clusters (Before Processing):", genderClusters);
    // Displaying the results
    console.log("Gender-Based Safety Clusters:");
    genderClusters.forEach((cluster, index) => {
        console.log(`Cluster ${index + 1}:`);
        // Initialize totals for calculating averages
        let totalMale = 0;
        let totalFemale = 0;
        const areasInCluster = [];
        // Get the areas in this cluster
        cluster.forEach((point) => {
            const areaIndex = crimeCountsGender.findIndex((crimeDataPoint) => crimeDataPoint[0] === point[0] && crimeDataPoint[1] === point[1]);
            if (areaIndex >= 0 && areaIndex < crimeCountsGender.length) {
                const maleCount = crimeCountsGender[areaIndex][0] || 0; // Default to 0 if undefined
                const femaleCount = crimeCountsGender[areaIndex][1] || 0; // Default to 0 if undefined
                totalMale += maleCount;
                totalFemale += femaleCount;
                areasInCluster.push(areaNames[areaIndex]);
            }
            else {
                console.log(`Invalid area index: ${areaIndex}`);
            }
        });
        // Calculating  averages
        const areaCount = areasInCluster.length;
        const averageMale = areaCount > 0 ? (totalMale / areaCount).toFixed(2) : 0;
        const averageFemale = areaCount > 0 ? (totalFemale / areaCount).toFixed(2) : 0;
        //Results
        console.log(`  Areas: ${areasInCluster.join(", ")}`);
        console.log(`  Total Male Crimes: ${totalMale}`);
        console.log(`  Total Female Crimes: ${totalFemale}`);
        console.log(`  Average Male Crimes per Area: ${averageMale}`);
        console.log(`  Average Female Crimes per Area: ${averageFemale}`);
    });
}
// K-means clustering algorithm implementation
function kMeans(data, k) {
    const centroids = initializeCentroids(data, k);
    // Initialize an array to hold clusters, with a length equal to the number of desired clusters (k)
    let clusters = [];
    // Create k empty arrays, one for each cluster
    for (let i = 0; i < k; i++) {
        clusters.push([]); // Add an empty array for the ith cluster
    }
    let iterations = 0;
    let prevCentroids = [];
    while (!arraysEqual(prevCentroids, centroids) && iterations < 100) {
        //limiting to 100 iterations
        clusters = assignClusters(data, centroids); // Assign data points to the closest centroids
        prevCentroids = centroids.map((centroid) => centroid.slice()); // Store previous centroids
        updateCentroids(clusters, centroids); // Update centroids based on current clusters
        iterations++; // Increment iteration count
    }
    return clusters; // Return the final clusters
}
// Initialization of centroids
function initializeCentroids(data, k) {
    const centroids = [];
    const usedIndices = new Set();
    while (centroids.length < k) {
        const index = Math.floor(Math.random() * data.length);
        if (!usedIndices.has(index)) {
            centroids.push(data[index]);
            usedIndices.add(index);
        }
    }
    return centroids;
}
function assignClusters(data, centroids) {
    // Initialize an array to hold clusters for each centroid
    const clusters = []; // Start with an empty array
    // Use a for loop to create an empty array for each centroid
    for (let i = 0; i < centroids.length; i++) {
        // Initialize an empty array for the current cluster
        const currentCluster = [];
        clusters.push(currentCluster);
    }
    // Iterate through each point in the data
    data.forEach((point, index) => {
        let minDist = Infinity;
        let closestCentroid = 0;
        centroids.forEach((centroid, centroidIndex) => {
            const distance = euclideanDistance(point, centroid);
            if (distance < minDist) {
                minDist = distance;
                closestCentroid = centroidIndex; // Update closest centroid
            }
        });
        // Create a new point that includes the index without using the spread operator
        const pointWithIndex = new Array(point.length + 1); // Create a new array with one extra space
        for (let i = 0; i < point.length; i++) {
            pointWithIndex[i] = point[i]; // Copy existing values from point
        }
        pointWithIndex[point.length] = index; // Add the index as the last element
        // Add the new point to the cluster corresponding to the closest centroid
        clusters[closestCentroid].push(pointWithIndex);
    });
    return clusters; // Return the formed clusters
}
function updateCentroids(clusters, centroids) {
    // Iterate through each cluster to update its centroid
    clusters.forEach((cluster, index) => {
        // Skip empty clusters
        if (cluster.length === 0)
            return;
        // Initialize a new centroid array with the same number of dimensions as the data points
        const newCentroid = [];
        // Populate the newCentroid array with zeros
        for (let i = 0; i < cluster[0].length - 1; i++) {
            newCentroid[i] = 0; // Initialize each dimension to zero
        }
        // Sum all points in the cluster to calculate the new centroid
        cluster.forEach((point) => {
            point.slice(0, -1).forEach((value, i) => {
                newCentroid[i] += value; // Sum the values for each dimension
            });
        });
        // Calculating  the average for each dimension
        newCentroid.forEach((sum, i) => {
            newCentroid[i] = sum / cluster.length;
        });
        // Update the centroid for the current cluster
        centroids[index] = newCentroid;
    });
}
// Euclidean distance calculation
function euclideanDistance(point1, point2) {
    let sumOfSquares = 0;
    // Iterate through all dimensions of points
    for (let i = 0; i < point1.length; i++) {
        const difference = point1[i] - point2[i]; // Calculate the difference
        const multOfDifference = difference * difference; // Saving the result in a variable
        sumOfSquares += multOfDifference; // Sum the squares of the differences
    }
    return Math.sqrt(sumOfSquares); // Return the square root of the sum of squares
}
// Function to check if two arrays are equal
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false; //checking the lenghts
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i].length !== arr2[i].length)
            return false;
        for (let j = 0; j < arr1[i].length; j++) {
            if (arr1[i][j] !== arr2[i][j])
                return false;
        }
    }
    return true;
}
