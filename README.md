Review fetcher
=========

What does it do?  
=========
It fetches Android and iOS reviews for all configured apps. It then show these at it's website or/and posts them to slack.
Example of review-fetcher running with the google api: https://review-fetcher.herokuapp.com/ugrow/android
Example of review-fetcher running with the html scraping: https://review-fetcher.herokuapp.com/ugrow/android

How does it do this?  
=========
It fetch all ios reviews from the itunes rss feed:
https://itunes.apple.com/gb/rss/customerreviews/page=1/id=1063224663/sortby=mostrecent/xml
For android it either uses html scraping or the official google api.
Scraping: https://github.com/facundoolano/google-play-scraper
Google API: https://developers.google.com/android-publisher/api-ref/reviews

How to set it up locally?  
=========

### Prerequisites
Install node and postgres

### Setting up DB
Configure postgres with user:postgres password:postgres database postgres (You can change this at: ReviewJSONDB.js line 5 till 9)
Create the table as specified in dbStructure. You can do this automatically by running setupDB or run the command manually in the psql commandline.

### Setting up the configuration
Open configs.js, and follow the instructions in the file.

### Running it
You need to run startFetching once to fill the database. After the initial fetch I would advice to schedule it to run every 10 minutes to keep your database up to date. After the database is filled you can run node index.js to start the website.
Then in your web browser open:
localhost:8000/<app name from config>/android
localhost:8000/<app name from config>/ios
localhost:8000/<app name from config>/graph

How to set it up in heroku?  
=========

### Prerequisites
Add heroku postgres and heroku scheduler. This program can in heroku free tier, but you'll need a verified account to install these dependencies.
Follow the following steps to configure node for heroku on your machine.
https://devcenter.heroku.com/articles/getting-started-with-nodejs#set-up

### Setting up DB
Create the table as specified in dbStructure you can access the heroku db by running heroku psql in the terminal.
Now manually run the line defined in dbStructure.

### Setting up the configuration
Open configs.js, and follow the instructions in the file.

### Running it
Configure heroku scheduler to run startFetching.js to run every 10 minutes.
After that just do a git push to deploy review-fetcher.

Then in your web browser open:
<Heroku url>/<app name from config>/android
<Heroku url>/<app name from config>/ios
<Heroku url>/<app name from config>/graph
