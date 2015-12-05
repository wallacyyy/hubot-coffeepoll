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

var _ = require('lodash')
var messages = require('../lib/messages')
var foursquare = require('node-foursquare-venues')(process.env.FOURSQUARE_CLIENT_ID,
                                                   process.env.FOURSQUARE_CLIENT_SECRET)

module.exports = function (bot) {
  var brain = bot.brain
  var options = []
  var votes = []
  var participants = {}

  brain.set('near', 'Berlin')
  brain.set('participants', participants)
  brain.set('options', options)
  brain.set('votes', votes)

  var clearPoll = function () {
    options.length = 0
    votes.length = 0
    _.mapKeys(participants, function (v, k) {
      delete participants[k]
    })
  }

  var isPollNotStarted = function () {
    return _.isEmpty(options)
  }

  var isUserAlreadyVoted = function (username) {
    return participants[username]
  }

  var isVoteNotValid = function (vote) {
    return typeof votes[vote] === 'undefined'
  }

  bot.respond(/coffeepoll near (.*)/i, function (res) {
    var place = res.match[1]

    brain.set('near', place)

    return res.send(messages.places(place))
  })

  bot.respond(/coffeepoll start/i, function (res) {
    if (!isPollNotStarted()) return res.send(messages.errorAlreadyStarted)

    var near = brain.get('near')
    var params = {
      near: near,
      categoryId: messages.category,
      radius: 1000
    }

    return foursquare.venues.search(params, function (error, payload) {
      if (error === 400) return res.send(messages.errorPlaceNotFound(near))
      if (error) return res.send(error)

      var message = messages.hello(bot.name)
      var coffeeShops = _.sample(payload.response.venues, 3)

      for (var i = 0; i < coffeeShops.length; i++) {
        var cs = coffeeShops[i]
        message += i + ': ' + cs.name + ' (' + messages.url + cs.id + ')\n'
        message += cs.location.address + '\n\n'
        options[i] = cs
        votes[i] = 0
      }

      return res.send(message)
    })
  })

  bot.respond(/coffeepoll vote (.*)/i, function (res) {
    var username = res.message.user.name.toLowerCase()
    var number = res.match[1]

    if (isUserAlreadyVoted(username)) return res.send(messages.errorAlreadyVoted(username))
    if (isPollNotStarted()) return res.send(messages.errorStart(bot.name))
    if (isVoteNotValid(number)) return res.send(messages.errorVoteNotFound)

    votes[number] += 1
    participants[username] = true

    return res.send(messages.thanks)
  })

  bot.respond(/coffeepoll finish/i, function (res) {
    if (isPollNotStarted()) return res.send(messages.errorStart(bot.name))

    var greater = _.last(votes.slice().sort())
    var winner = options[_.indexOf(votes, greater)]
    clearPoll()

    return res.send(messages.win(winner))
  })

  bot.respond(/coffeepoll help/i, function (res) {
    return res.send(messages.help)
  })

  bot.respond(/coffeepoll partial/i, function (res) {
    if (isPollNotStarted()) return res.send(messages.errorStart(bot.name))

    var message = messages.partial

    for (var i = 0; i < options.length; i++) {
      message += options[i].name + ': ' + votes[i] + ' vote(s)\n'
    }

    return res.send(message)
  })
}
