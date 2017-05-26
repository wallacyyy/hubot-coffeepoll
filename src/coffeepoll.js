// Description:
//   Help your team to find a place to drink a coffee !
//   Coffeepoll will create poll with random coffee shops nearby.
//
// Commands:
//   hubot coffeepoll near <text> - Configure the place for next polls
//   hubot coffeepoll start - Start the poll
//   hubot coffeepoll vote <number> - Vote in one of poll options
//   hubot coffeepoll partial - Show the partial results
//   hubot coffeepoll finish - Finish the poll

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require
  require('dotenv').config();
}

const _ = require('lodash');
const messages = require('../lib/messages');
const venues = require('node-foursquare-venues');

const foursquare = venues(
  process.env.FOURSQUARE_CLIENT_ID,
  process.env.FOURSQUARE_CLIENT_SECRET
);

module.exports = (bot) => {
  const brain = bot.brain;
  const options = [];
  const votes = [];
  const participants = {};

  brain.set('near', 'Berlin');
  brain.set('radius', 500);
  brain.set('participants', participants);
  brain.set('options', options);
  brain.set('votes', votes);

  const clearPoll = () => {
    options.length = 0;
    votes.length = 0;
    _.mapKeys(participants, (v, k) => {
      delete participants[k];
    });
  };

  const isPollNotStarted = () => _.isEmpty(options);
  const isUserAlreadyVoted = username => participants[username];
  const isVoteNotValid = vote => (typeof votes[vote] === 'undefined');
  const isRadiusNotValid = radius => !(radius > 0);

  bot.respond(/(?:coffeepoll|coffepoll) near (.*)/i, (res) => {
    const place = res.match[1];

    brain.set('near', place);

    return res.send(messages.places(place));
  });

  bot.respond(/(?:coffeepoll|coffepoll) start/i, (res) => {
    if (!isPollNotStarted()) return res.send(messages.errorAlreadyStarted);

    const near = brain.get('near');
    const radius = brain.get('radius');

    const params = {
      near,
      categoryId: messages.category,
      radius
    };

    return foursquare.venues.search(params, (error, payload) => {
      if (error === 400) return res.send(messages.errorPlaceNotFound(near));
      if (error) return res.send(error);

      let message = messages.hello(bot.name);
      const coffeeShops = _.sample(payload.response.venues, 3);

      for (let i = 0; i < coffeeShops.length; i += 1) {
        const cs = coffeeShops[i];
        message += `${i}: ${cs.name} (${messages.url}${cs.id})\n`;
        message += `${cs.location.address}\n\n`;
        options[i] = cs;
        votes[i] = 0;
      }

      return res.send(message);
    });
  });

  bot.respond(/(?:coffeepoll|coffepoll) radius (.*)/i, (res) => {
    const radius = res.match[1];

    if (isRadiusNotValid(radius)) return res.send(messages.errorRadiusNotValid);

    brain.set('radius', parseInt(radius, 10));
    return res.send(messages.radiusUpdated(brain.get('radius')));
  });

  bot.respond(/(?:coffeepoll|coffepoll) vote (.*)/i, (res) => {
    const username = res.message.user.name.toLowerCase();
    const number = res.match[1];

    if (isUserAlreadyVoted(username)) return res.send(messages.errorAlreadyVoted(username));
    if (isPollNotStarted()) return res.send(messages.errorStart(bot.name));
    if (isVoteNotValid(number)) return res.send(messages.errorVoteNotFound);

    votes[number] += 1;
    participants[username] = true;

    return res.send(messages.thanks);
  });

  bot.respond(/(?:coffeepoll|coffepoll) finish/i, (res) => {
    if (isPollNotStarted()) return res.send(messages.errorStart(bot.name));

    const greater = _.last(votes.slice().sort());
    const winner = options[_.indexOf(votes, greater)];
    clearPoll();

    return res.send(messages.win(winner));
  });

  bot.respond(/(?:coffeepoll|coffepoll) help/i, res => res.send(messages.help));

  bot.respond(/(?:coffeepoll|coffepoll) partial/i, (res) => {
    if (isPollNotStarted()) return res.send(messages.errorStart(bot.name));

    let message = messages.partial;

    for (let i = 0; i < options.length; i += 1) {
      message += `${options[i].name}: ${votes[i]} vote(s)\n`;
    }

    return res.send(message);
  });
};
