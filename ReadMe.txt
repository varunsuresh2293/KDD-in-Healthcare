Load the result.csv in a table named health in MySQL or use the dump file
1. Install NodeJS from https://nodejs.org/en/
2. Open app.js this folder.
3. Change host, user, password and database in this file (line 44-49)
4. Open command prompt and navigate to this folder.
5. Type the following in the command prompt: node app
6. Open browser - localhost:3333
7. Set Support, confidence and lift (optional - by default set to 0)
8. Add filters - Demographics (optional)
9. Enter symptom or choose from the dropdown below (required) and 
hit on Get Diagnosis.
10. Results (Diagnosis codes) will be loaded in a window.
11. If none match then it display as "Nothing to show".
12. Click on each diagnosis code to get additional info - a Pop up 
window opens with demographic filters along with Average Length of Stay 
and Discharge Status. You can also apply filters (Demographics) for
the same. 