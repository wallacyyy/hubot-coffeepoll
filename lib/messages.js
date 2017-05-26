// Description:
//   Coffeepoll messages sent by the bot.
//
// Example:
//  messages = require('messages')
//
//  messages.url
//  => 'https://www.foursquare.com/v/'
//
//  messages.places('Berlin')
//  => 'Ok ! your next polls will consider places near Berlin'
module.exports = {
  url: 'https://www.foursquare.com/v/',

  category: '4bf58dd8d48988d1e0931735',

  thanks: 'Thanks for your vote !',

  partial: '\nThe partial result is:\n\n',

  help: `\nCommands:
    hubot coffeepoll near <text> - Configure the place for next polls
    hubot coffeepoll radius <number> - Configure the search radius
    hubot coffeepoll start - Start the poll
    hubot coffeepoll vote <number> - Vote in one of poll options
    hubot coffeepoll partial - Show the partial results
    hubot coffeepoll finish - Finish the poll`,

  radiusUpdated: radius => `Your radius was updated for ${radius}`,

  hello: name => `\nHello ! I will be your barista today.
  Type '@${name} coffeepoll vote [NUMBER]' to choose between this places:\n\n`,

  win: winner => `\nThe winner is ... ${winner.name} at ${winner.location.address} !
  Enjoy your coffee :) !`,

  places: place => `Ok ! your next polls will consider places near ${place}.`,

  errorVoteNotFound: 'Hey dude, this options doesn\'t exist. Are you trying to be funny or what ?',

  errorAlreadyStarted: 'You need to finish your poll first !',

  errorStart: name => `There's no poll started. To start a poll type '@${name} coffeepoll start'.`,

  errorAlreadyVoted: name => `Sorry @${name}, but you already voted on this poll. Don't try to be sneaky !`,

  errorPlaceNotFound: near => `I couldn't find places near ${near}. You can try another place :(`,

  errorRadiusNotValid: 'Dude, this looks like a radius to you ?'
};
