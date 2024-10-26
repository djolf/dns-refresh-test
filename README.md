# dns-refresh-test

This is a test program written for an interview.
It will be a runnable CLI program to:
1. input a list of hostnames
2. list the hostnames with their associated IPs
3. perform a DNS refresh
4. export the list to a file

## Prerequisites
To run this program, you must have NodeJS installed.

## Installing and running the program
1. Clone the repository
2. Navigate to the folder
3. run `npm install`
4. run `npm start`

## Initialization
The program will have the following hostnames (top 5 most visited domains) to start
- google.com
- youtube.com
- facebook.com
- wikipedia.org
- instagram.com

You will be able to replace the list with your own list by editing hostnames.json
```hostnames.json
[
  "google.com",
  "youtube.com",
  "facebook.com",
  "wikipedia.org",
  "instagram.com"
  // feel free to remove or add more 
]
```