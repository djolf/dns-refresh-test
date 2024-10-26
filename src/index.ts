import * as readline from 'readline';
import * as fs from 'fs';
import * as dns from 'dns';
import * as util from 'util';

let hostnames: string[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Function to read hostnames from a file
async function readHostnamesFile() {
  try {
    const data = fs.readFileSync('src/hostnames.json', 'utf-8');
    console.log("Hostnames from file:");
    console.log(data);
    hostnames = JSON.parse(data);
  } catch (error) {
    console.error("Error reading hostnames file:", error);
  }
}

async function listHostnames() {
  console.log("Listing hostnames:");
  hostnames.forEach((hostname, index) => {
    console.log(`${index + 1}. ${hostname}`);
  });
}

// Function to perform a DNS refresh
async function dnsRefresh() {
 // todo
}

// Function to export the list to a file
async function exportListToFile() {
  // todo
}

// Main menu function
async function mainMenu() {
  console.clear();
  while (true) {
    console.log(`
Welcome to
  _____  _   _  _____             __               _       _            _   
 |  __ \\| \\ | |/ ____|           / _|             | |     | |          | |  
 | |  | |  \\| | (___    _ __ ___| |_ _ __ ___  ___| |__   | |_ ___  ___| |_ 
 | |  | | . \` |\\___ \\  | '__/ _ \\  _| '__/ _ \\/ __| '_ \\  | __/ _ \\/ __| __|
 | |__| | |\\  |____) | | | |  __/ | | | |  __/\\__ \\ | | | | ||  __/\\__ \\ |_ 
 |_____/|_| \\_|_____/  |_|  \\___|_| |_|  \\___||___/_| |_|  \\__\\___||___/\\__|

                                                                  by Lifan :)                                                                                  
`);
    console.log("Select an option:");
    console.log("1. Read hostnames file");
    console.log("2. List hostnames with their IPs");
    console.log("3. Perform a DNS refresh");
    console.log("4. Export list to file");
    console.log("5. Exit");

    const choice = await prompt("Enter your choice (1-5): ");
    
    switch (choice) {
      case '1':
        console.clear();
        await readHostnamesFile();
        break;
      case '2':
        console.clear();
        await listHostnames();
        break;
      case '3':
        console.clear();
        await dnsRefresh();
        break;
      case '4':
        console.clear();
        await exportListToFile();
        break;
      case '5':
        console.log("Goodbye!");
        rl.close();
        return;
      default:
        console.log("Invalid choice, please try again.");
    }
  }
}

// Start the main menu
mainMenu();
