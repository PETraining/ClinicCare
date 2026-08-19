https://github.com/nagenn/ClinicCareDocs   - FeatureContextMaps

Doc link https://drive.google.com/drive/folders/1ptUJ8gH6WkCrZ137lAhZE09bftt2JWO-?usp=sharing
Prompt -1 
Look in the directory “FeatureContextMaps” – these are context maps and implementation plans for 5 different features. For each, summarize what files, endpoints, and tables they say they touch.


Prompt 2
Based on the other teams' context-map.md files, and our own plan,
does anyone's SERVICE_MAP entry (service name, route prefix) collide
with ours or with each other's? Also check gateway/main.py directly
on main for what's already merged there.



List all remote branches on origin. Identify which ones look like
they belong to the other four teams, not ours.

Here are the real branches per feature - please ignore all other branches for this entire session:
F1-Appointments
F2-InsuranceEligibility
F3-DiagnosticLab
F4-Pharmacy-Ann
F5.2-imp
 
For each of those branches, fetch it and show me the real diff on
gateway/main.py compared to main. Then compare that against our own
planned change to gateway/main.py — does a genuine collision exist
in the actual code, not just in what was planned?


 Confirm gateway/main.py on main right now doesn't already contain our
planned entry, or a conflicting one from anyone who's already merged

Share the real collision issues that involves only our feature (feature_name) as a .md file
