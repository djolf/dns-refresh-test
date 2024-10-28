import readline from 'readline';
import fs from 'fs';
import fetch from 'node-fetch';

enum IPStatus {
  ACTIVE = "ACTIVE",
  HANGING = "HANGING"
}

type IPAddress = {
  address: string
  status: IPStatus
  hangingCount: number
}

type DnsList = {
  [hostname: string]: IPAddress[]
}

type DnsResponse = {
  Answer: { data: string }[]; 
}

const HANGING_THRESHOLD = 3;

const dnsList: DnsList = {};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function readHostnamesFile() {
  try {
    const data = JSON.parse(fs.readFileSync('src/hostnames.json', 'utf-8')) as string[];
    console.log("Hostnames from file:");
    data.forEach(hostname => dnsList[hostname] = []);
  } catch (error) {
    console.error("Error reading hostnames file:", error);
  }
}

async function listHostnames() {
  console.log("Hostnames:");
  for (const hostname in dnsList) {
    console.log(hostname);
    console.table(dnsList[hostname]);
  }
}

async function getDnsRecord(hostname: string) {
  console.log(`Getting dns records for hostname: ${hostname}...`);
  try {
    const response = await fetch(`https://dns.google.com/resolve?name=${hostname}&type=A`);
    const { Answer } = (await response.json()) as DnsResponse;
    if (!Answer) {
      console.log(`No DNS record found for ${hostname}`);
      return;
    }
    const newIPAddressList: string[] = Answer.map(record => record.data);
    const newIPObjList: IPAddress[] = newIPAddressList.map(ip => ({
      address: ip,
      status: IPStatus.ACTIVE,
      hangingCount: 0 
    }));

    // Filter out old hanging IPs or increment hanging count if they're not in the new list
    const existingIPs = dnsList[hostname] || [];
    const updatedIPs = existingIPs.map(ip => {
      if (!newIPAddressList.includes(ip.address)) {
        return { ...ip, status: IPStatus.HANGING, hangingCount: ip.hangingCount + 1 };
      }
      return ip;
    }).filter(ip => ip.hangingCount <= HANGING_THRESHOLD); // Remove IPs that exceed the threshold

    // Merge the new IPs with the filtered existing IPs
    dnsList[hostname] = Array.from(new Map(
      [...updatedIPs, ...newIPObjList].map(ip => [ip.address, ip])
    ).values());;
    console.log(`Finished getting DNS record for ${hostname}`);
  } catch (error) {
    console.error("Error getting DNS: ", error);
  }

}

async function dnsRefresh() {
  console.log(`Refreshing DNS...`)
  await Promise.allSettled(Object.keys(dnsList).map(getDnsRecord))
  listHostnames();
}

async function exportListToFile(filename: string) {
  try {
    fs.writeFileSync(filename, JSON.stringify(dnsList, null, 2));
    console.log(`DNS list exported to ${filename}.json`);
  } catch (error) {
    console.error("Error exporting DNS list:", error);
  }
}

async function mainMenu() {
  console.clear();
  await readHostnamesFile();
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
  while (true) {
    console.log("====================================");
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
        const filename = await prompt("Please provide a file name for the exported file (json)")
        await exportListToFile(filename);
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

mainMenu();
