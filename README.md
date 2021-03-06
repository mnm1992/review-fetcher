Review fetcher
=========

What does it do?  
=========
It fetches Android and iOS reviews for all configured apps. It then show these at it's website or/and posts them to slack.</br>
Example of review-fetcher running with the Google api: https://review-fetcher.herokuapp.com/ugrow/android</br>
Example of review-fetcher running with the html scraping: https://review-fetcher.herokuapp.com/compass/android

How does it do this?  
=========
It fetches all iOS reviews from the itunes rss feed:
https://itunes.apple.com/gb/rss/customerreviews/page=1/id=1063224663/sortby=mostrecent/xml</br>
For iOS ratings we use scraping via the itunes webobject interface (this requires the itunes appagent and a store id in the headers):
http://itunes.apple.com/WebObjects/MZStore.woa/wa/customerReviews?s=143444&id=1063224663&displayable-kind=11&#8217</br>
For Android it either uses html scraping or the official Google api.</br>
Scraping: https://github.com/facundoolano/google-play-scraper</br>
Google API: https://developers.google.com/android-publisher/api-ref/reviews

How to set it up locally?  
=========

### Prerequisites
Install node and postgres

### Setting up DB
Configure postgres with user:postgres password:postgres database:postgres (You can change this at: ReviewJSONDB.js line 5 till 9)
The database is automatically setup when you run "node website/index.js". It will also automatically migrate from older versions of review-fetcher.

### Setting up the configuration
Open configs.js, and follow the instructions in the file.

### installing the libraries
run npm install in the commandline to install the dependencies

### Running it
First run node website/index.js to setup the database.
Now open in a webbrowser: localhost:8000/&lt;app name from config&gt;</br>
You need to run node startFetching.js once to fill the database. After the initial fetch I would advice to schedule it to run every 10 minutes to keep your database up to date. 
If everything went right the website will refresh and show all the reviews.

How to set it up in heroku?  
=========

### Prerequisites
Add heroku postgres and heroku scheduler to the heroku app. This program can run in heroku free tier, but you'll need a verified account to install these dependencies.</br>
Follow the following steps to configure node for heroku on your heroku instance.</br>
https://devcenter.heroku.com/articles/getting-started-with-nodejs#set-up

### Setting up DB
The database will be setup automatically. Nothing todo manually.

### Setting up the configuration
Open configs.js, and follow the instructions in the file.

### Running it
Configure heroku scheduler to run node fetcher/startFetching.js every 10 minutes.
After that just do a git push to deploy review-fetcher.

Then in your web browser open:</br>
&lt;Heroku url&gt;/&lt;app name from config&gt;</br>
