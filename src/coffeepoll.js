
const R = require('ramda');
const _ = require('lodash');
const messages = require('../lib/messages');
const venues = require('node-foursquare-venues');

const foursquare = venues(
  process.env.FOURSQUARE_CLIENT_ID,
  process.env.FOURSQUARE_CLIENT_SECRET
);

const INITIAL_STATE = {
  near: 'Berlin',
  radius: 500,
  participants: {},
  options: [],
  votes: []
};

/**
 * Help your team to find a place to drink a coffee !
 * Coffeepoll will create poll with random coffee shops nearby.
 *
 * @example
 * hubot coffeepoll near <text> - Configure the place for next polls
 * hubot coffeepoll start - Start the poll
 * hubot coffeepoll vote <number> - Vote in one of poll options
 * hubot coffeepoll partial - Show the partial results
 * hubot coffeepoll finish - Finish the poll
 */
module.exports = (bot) => {
  const { brain } = bot;

  brain.set(INITIAL_STATE);

  const isPollStarted = R.pipe(() => brain.get('options'), o => R.gt(o.length, 0));

  const isUserAlreadyVoted = username => (
    R.pipe(
      () => brain.get('participants'),
      p => !!R.prop(username, p)
    )()
  );

  const isVoteInvalid = voteIndex => (
    R.pipe(
      R.flip(R.prop)(brain.get('votes')),
      R.isNil
    )(voteIndex)
  );

  const handleSearchError = (error, near, res) => (
    R.ifElse(
      e => R.equals(e, 400),
      () => res.send(messages.errorPlaceNotFound(near)),
      () => res.send(error)
    )(error)
  );

  const handleVenues = (sample, res) => {
    R.pipe(
      R.reduce(
        (acc, cs) => {
          acc.message += `\n${sample.indexOf(cs)}: ${cs.name} (${messages.url}${cs.id})\n`;
          acc.message += `${cs.location.address}\n\n`;
          acc.options.push(cs);
          acc.votes.push(0);

          return acc;
        },
        {
          options: [],
          votes: [],
          message: ''
        }
      ),
      (st) => {
        brain.set('options', st.options);
        brain.set('votes', st.votes);
        res.send(st.message);
      }
    )(sample);
  };

  const searchVenues = params => (
    new Promise((resolve, reject) => (
      foursquare.venues.search(params, (error, payload) => (
        R.ifElse(
          R.isNil,
          () => resolve(payload),
          () => reject(error)
        )(error)
      )
    ))
  ));

  const updateVotes = voteIndex => (
    R.pipe(
      () => brain.get('votes'),
      v => R.adjust(R.add(1), voteIndex, v),
      incV => brain.set('votes', incV)
    )()
  );

  const updateParticipants = (username, res) => (
    R.pipe(
      () => brain.get('participants'),
      p => R.update(true, username, p),
      p => R.merge(p, { [username]: true }),
      updated => brain.set('participants', updated),
      () => res.send(messages.thanks)
    )()
  );

  const buildPartial = data => (
    R.reduce(
      (msg, opt) => (
        R.concat(
          msg,
          `${opt.name}: ${data.votes[data.options.indexOf(opt)]} vote(s)\n`
        )
      ),
      messages.partial,
      data.options
    )
  );

  const pickWinner = votes => (
    R.pipe(
      R.sortBy(R.identity),
      R.last,
      R.flip(R.indexOf)(votes),
      R.flip(R.nth)(brain.get('options'))
    )(votes)
  );

  bot.respond(/(?:coffeepoll|coffepoll) near (.*)/i, res => (
    R.pipe(
      r => r.match[1],
      (place) => {
        brain.set('near', place);
        res.send(messages.places(place));
      }
    )(res)
  ));

  bot.respond(/(?:coffeepoll|coffepoll) radius (.*)/i, res => (
    R.pipe(
      r => r.match[1],
      radius => R.ifElse(
        r => R.gt(r, 0),
        () => {
          const roundedRadius = Math.round(parseInt(radius, 10));
          brain.set('radius', roundedRadius);
          res.send(messages.radiusUpdated(roundedRadius));
        },
        () => res.send(messages.errorRadiusNotValid)
      )(radius)
    )(res)
  ));

  bot.respond(/(?:coffeepoll|coffepoll) start/i, (res) => {
    const params = {
      near: brain.get('near'),
      categoryId: messages.category,
      radius: brain.get('radius')
    };

    R.ifElse(
      isPollStarted,
      () => res.send(messages.errorAlreadyStarted),
      () => (
        searchVenues(params)
          .then(payload => handleVenues(
            _.sample(payload.response.venues, 3), res)
          )
          .catch(e => handleSearchError(e, params.near, res))
      )
    )();
  });

  bot.respond(/(?:coffeepoll|coffepoll) vote (.*)/i, (res) => {
    const username = res.message.user.name.toLowerCase();
    const voteIndex = res.match[1];

    R.cond([
      [
        () => isUserAlreadyVoted(username),
        () => res.send(messages.errorAlreadyVoted(username))
      ],
      [
        R.pipe(
          isPollStarted,
          R.not
        ),
        () => res.send(messages.errorStart(bot.name))
      ],
      [
        () => isVoteInvalid(voteIndex),
        () => res.send(messages.errorVoteNotFound)
      ],
      [
        R.T,
        () => {
          updateVotes(parseInt(voteIndex, 10));
          updateParticipants(username, res);
        }
      ]
    ])();
  });

  bot.respond(/(?:coffeepoll|coffepoll) finish/i, (res) => {
    R.ifElse(
      R.pipe(
        isPollStarted,
        R.not
      ),
      () => res.send(messages.errorStart(bot.name)),
      () => (
        R.pipe(
          () => brain.get('votes'),
          pickWinner,
          winner => res.send(messages.win(winner)),
          () => brain.set(INITIAL_STATE)
        )()
      )
    )();
  });

  bot.respond(/(?:coffeepoll|coffepoll) help/i, res => res.send(messages.help));

  bot.respond(/(?:coffeepoll|coffepoll) partial/i, (res) => {
    const data = {
      options: brain.get('options'),
      votes: brain.get('votes')
    };

    return R.ifElse(
      R.pipe(
        isPollStarted,
        R.not
      ),
      () => res.send(messages.errorStart(bot.name)),
      () => (
        R.pipe(
          buildPartial,
          partial => res.send(partial)
        )(data)
      )
    )();
  });
};
