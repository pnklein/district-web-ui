
# district-web-ui

### Description
This is a repository providing the web framework for the redistricting project hosted [here](https://github.com/pnklein/district). This repository is still in development, as we are moving to Amazon Web Hosting and improving the data creation that will be used on this application.

This repository is designed to be a resource and teaching tool for what gerrymandering looks like in practice. Gerrymandering is the practice of redrawing districts that represent voters in order to gain advantage for a political party, ideology, or leader. In the United States, this happens often at the Congresional and state levels, and is aided by the fact that most districts representing voters are drawn by politicians in state legislatures, who can then draw boundaries for their own advantages.

Oftentimes, gerrymandering is done through creating districts of wild shapes in order to capture certain groups of voters into certain districts, either to dilute certain voting patterns by spreading out their influence across several districts (called cracking), or super-concentrating voters into a small number of districts in order to dilute their influence in the rest of the districts (often called "packing"). We are developing an algorithm and tools to negate both of these possibilities by making districts as "compact", or tightly clustered without large juts to the districts, while keeping the districts perfectly balanced in terms of the number of citizens represented by each district. To that end, we are using this repository to create graphs to show current districts, our new generated districts, and a whole host of other interesting factors that come out of this change in districting approaches.

This repository is still under construction, so continue to check in for changes!

### Requirements

`NodeJS (Version >= 7.6)`

### Installation

To install a new version of Node.js on Linux, run
`curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash\`

If you then run

`command -v nvm`

and nothing appears, close the terminal, reopen it, and re-run the command. If it works, then do

`nvm install node`

or for a specific version

`nvm install 10.0.0`

or whatever version you would use instead of `10.0.0`.

Then go into your `.bashrc` file and add the following line at the end of your program

`export PATH=~/.nvm/versions/node/v11.0.0/bin:$PATH`

or replace `11.0.0` with the version you want to run.

If you then run

`node server.js`

It should create a `localhost` listening on port `8080`. If you then go to `http://localhost:8080`, you will find the home page.

If you are still having issues installing, visit this page for `nvm`'s repo README. `https://github.com/creationix/nvm`