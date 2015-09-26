# Description:
#   Help your team to find a place to drink a coffee !
#   Coffeepoll will create poll with random coffee shops nearby.
#
# Commands:
#   hubot coffeepoll near <text> - Configure the place for next polls 
#   hubot coffeepoll start - Start the poll
#   hubot coffeepoll vote <number> - Vote in one of poll options
#   hubot coffeepoll partial - Show the partial results
#   hubot coffeepoll finish - Finish the poll

_ = require("lodash")
messages = require("./messages")
require("dotenv").load() if (process.env.ENV != "production")
foursquare = require("node-foursquare-venues")(process.env.FOURSQUARE_CLIENT_ID,
                                               process.env.FOURSQUARE_CLIENT_SECRET)

module.exports = (bot) ->
  brain = bot.brain 
  options = []
  votes = []
  participants = {}

  brain.set("near", "Berlin")
  brain.set("participants", participants)
  brain.set("options", options)
  brain.set("votes", votes)

  isPollNotStarted = -> _.isEmpty(options)

  isUserAlreadyVoted = (username) -> participants[username]

  isVoteNotValid = (vote) -> typeof votes[vote] == 'undefined'

  bot.respond /coffeepoll near (.*)/i, (res) ->
    place = res.match[1]
    brain.set("near", place)
    res.send(messages.places(place))

  bot.respond /coffeepoll start/i, (res) ->
    params =
      near: brain.get("near")
      categoryId: messages.category
      radius: 1000

    foursquare.venues.search params, (error, payload) ->
      return res.send(error) if (error)
      
      message = messages.hello(bot.name)
      coffeeShops = _.sample(payload.response.venues, 3)

      for cs, i in coffeeShops
        message += "#{i}: #{cs.name} (#{messages.url}#{cs.id})\n"
        message += "#{cs.location.address}\n\n"
        options[i] = cs
        votes[i] = 0

      res.send(message)

  bot.respond /coffeepoll vote (.*)/i, (res) ->
    username = res.message.user.name.toLowerCase()
    number = res.match[1]

    return res.send(messages.errorAlreadyVoted(username)) if (isUserAlreadyVoted(username))
    return res.send(messages.errorStart(bot.name)) if (isPollNotStarted())
    return res.send(messages.errorVote) if (isVoteNotValid(number))

    votes[number] += 1
    participants[username] = true
    res.send(messages.thanks)

  bot.respond /coffeepoll finish/i, (res) ->
    return res.send(messages.errorStart(bot.name)) if (isPollNotStarted())

    greater = _.last(votes.slice().sort())
    winner = options[_.indexOf(votes, greater)]

    res.send(messages.win(winner))
    options = []
    votes = []
    participants = {}

  bot.respond /coffeepoll partial/i, (res) ->
    message = messages.partial
    message += "#{options[i].name}: #{votes[i]} vote(s)\n" 

    res.send(message)
