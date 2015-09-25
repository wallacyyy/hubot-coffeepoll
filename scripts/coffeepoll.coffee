# Public: Duplicate some text an arbitrary number of times.
#
# text  - The String to be duplicated.
# count - The Integer number of times to duplicate the text.
#
# Examples
#
#   multiplex('Tom', 4)
#   # => 'TomTomTomTom'
#
# Returns the duplicated String.

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
      if (error)
        res.send(error)
        return
      
      message = messages.hello(bot.name)
      coffeeShops = _.sample(payload.response.venues, 3)

      for cs, i in coffeeShops
        message += "#{i}: #{cs.name} (#{messages.url}#{cs.id})\n"
        message += "#{cs.location.address}\n\n"
        options[i] = cs
        votes[i] = 0

      res.send(message)

  bot.respond /coffeepoll vote (.*)/i, (res) ->
    if (_.isEmpty(options))
      res.send(messages.errorStart)
      return

    username = res.message.user.name.toLowerCase()

    if (participants[username])
      res.send(messages.errorAlreadyVoted(username))
      return

    number = res.match[1]
    votes[number] += 1
    participants[username] = true 
    res.send(messages.thanks)

  bot.respond /coffeepoll finish/i, (res) ->
    if (_.isEmpty(options))
      res.send(messages.errorStart)
      return

    greater = _.last(votes.slice().sort())
    winner = options[_.indexOf(votes, greater)]

    res.send(messages.win(winner))
    options = []
    votes = []
    participants = {}

  bot.respond /coffeepoll partial/i, (res) ->
    message = messages.partial

    for option, i in options
      message += "#{options[i].name}: #{votes[i]} vote(s)\n"

    res.send(message)
