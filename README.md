# Fall 2026 CS 3354 
# Team 3
## Nepal-Tibet Flash Flood Relief Information Hub

The Nepal-Tibet Flash Flood Relief Information Hub brings flood information, relief updates, supporting organizations, and donation resources together in one place. It helps users find and browse information about affected communities and available relief efforts across Nepal and Tibet.

## Team members

- Yagnika Choppadandi
- Arturo Garcia
- Jessie X Sun
- Sanskriti Umesh Tiwari
- Danish Abdur Rehman Khan
- Saatwik R Jasti

## Run the prototype

Download or clone this repository, then open `team03-portal.html` in Chrome or Edge. No installation or server is required.

Demo login: `admin` / `Admin#2026` (or select **Fill demo credentials**).

The prototype supports searching and filtering relief information and adding, editing, and deleting entries through the admin dashboard. All seeded entries are illustrative. Data is stored in the current browser; authentication is for demonstration only.

See [README.txt](README.txt) for the demo workflow and limitations.

## Run the logic tests

With Node.js installed, run:

```sh
node tests/verify-relief.cjs
```

The test runner updates `test-results.csv`.
