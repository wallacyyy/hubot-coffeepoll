# Hubot-coffeepoll
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard) [![Build Status](https://travis-ci.org/wallacyyy/hubot-coffeepoll.svg)](https://travis-ci.org/wallacyyy/hubot-coffeepoll)

Hubot-coffeepoll is a Hubot plugin that helps your team to decide where to drink a coffee.
The hubot will search for coffee shops nearby and show options to people in the chat vote.

## Configuration

You just need to register at [Foursquare](https://developer.foursquare.com/) and set your credentials on this environment variables:

```
FOURSQUARE_CLIENT_ID = xxx
FOURSQUARE_CLIENT_SECRET = xxx
```

To run it locally just set this variables on a .env file in the project root and load it with
a library like [```dotenv```](https://www.npmjs.com/package/dotenv).

## Usage 

### Configure the place for next polls
```
hubot coffeepoll near <text>
```
Examples:
```
hubot coffeepoll near Friedrichstraße
hubot coffeepoll near Champs-Elysées
hubot coffeepoll near my street
```

### Start the poll
```
hubot coffeepoll start 
```

### Vote in one of poll options
```
hubot coffeepoll vote <number>
```

### Show the partial results
```
hubot coffeepoll partial
```

### Finish the poll and show the winner
```
hubot coffeepoll finish
```

