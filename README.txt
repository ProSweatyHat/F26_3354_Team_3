NEPAL-TIBET FLASH FLOOD RELIEF INFORMATION HUB
Team 03 prototype

RUN
Extract the ZIP, then double-click team03-portal.html to open it in Chrome or Edge.
No installation or server is required.
Demo login: admin / Admin#2026 (or select Fill demo credentials).

DEMO WORKFLOW
1. Browse the regional relief information board.
2. Search by keyword or organization; filter by region and category.
3. Select Admin login and sign in.
4. Publish a sample relief update with title, message, category, region,
   organization/source name, and optional HTTPS source link.
5. Public notices and donation-link entries require a source name and HTTPS URL.
6. Open Home to see the published entry. Clear filters if it is not visible.
7. Return to Dashboard to edit or delete the entry; deletion needs confirmation.
8. Log out to return to the public experience.

SCOPE SOURCE
https://github.com/ProSweatyHat/F26_3354_Team_3
The repository README names the Nepal-Tibet Flash Flood Relief Information Hub.
Project Scope.pdf describes background, relief updates, organizations, donation
links, publicly confirmed notices, search/filtering, and admin content management.
The SharePoint final report was not read or changed.

DEMO LIMITS
All seeded entries are explicitly illustrative. No real casualty records,
current relief claims, or active donation destinations are supplied.
Admin-provided links are not independently verified by this browser demo.
The hub does not process payments, coordinate rescue work, send real-time alerts,
or offer messaging. Content is stored only in this browser. Authentication and
lockout reset on reload. This is not a production client-server implementation.

TESTING (SEPARATE FROM THE DEMO WEBPAGE)
31 automated logic checks passed in Node.js on November 12, 2026.
Results are in test-results.csv; developer test sources are in tests/.
Browser checks passed for topic filtering, keyword search, region+category filters,
demo login, blank-title validation, adding an entry and viewing it publicly,
reload persistence with session reset, editing, cancelled and confirmed deletion,
and logout. Desktop rendering was inspected. Mobile and local-file storage
behavior should still be checked on the presentation device.
