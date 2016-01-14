# Better Buy Orders
Improves Steam market buy orders (hot-swap view different currencies and extended listings)

<img src="http://fat.gfycat.com/LiquidRelievedBarebirdbat.gif"></img>
# What is it?

BBO is a little script this extends the functionality of the "Buy Orders" system on the Steam Community Market. This script uses available data to extend the amount of buy and sell orders seen beyond the standard 5 rows. It also allows for you to quickly change the currency in which you view the buy order system in order to see the distribution of quantity more easily.

As of v1.3, BBO also allows all of these features on item pages and implements the ability to put buy orders on pages that have no items (very rare items etc...)

# How to Install

Better Buy Orders can be installed using <a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en">Tampermonkey</a> on Google Chrome or <a href="https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/">Greasemonkey</a> on Mozilla Firefox (other browsers have not been tested)

After you install the appropriate extension, just click <a href="https://github.com/Step7750/BetterBuyOrders/raw/master/master.user.js">here</a> and follow the install instructions

# Features
As of v1.3
* Extend the amount of buy and sell orders seen
* Works on commodity, items, and pages with nothing listed
* Allows "hot swapping" of currencies for the tables
* Place buy orders on items without any listings

#Changelog

v1.0.
* Initial Public Release

v1.1 
* Added HTTPS support

v1.2 
* Better Localization Support
* Fixed a bug in the handling of the Polish network response
* Improved the handling of the animation so that it only executes after the request is fully complete

v1.2.5
* Fixes crucial bug for Mac systems (at least on Chrome) that don't properly run the script

v1.3
* Implemented showing more/less buy orders on item pages
* Added currency selector for item pages
* Added the ability to place a buy order on a page with no item listings <a href="http://steamcommunity.com/market/listings/730/AWP%20%7C%20Dragon%20Lore%20%28Factory%20New%29">Example</a>
* Added more/less buy orders on item pages with no items
* Added currency selector on item pages with no items

v1.3.1
* Changes injection timings in order to prevent waiting for the item id on pages with no items

#Suggestions/Bugs

Are you encountering a bug or have a suggestion? Please use the available Github panel or contact me on <a href="http://steamcommunity.com/id/Step7750/">Steam</a>


