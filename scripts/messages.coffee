# Description:
#   Coffeepoll messages sent by the bot. 
#
# Example:
#  messages = require("messages")
#
#  messages.url
#  => "https://www.foursquare.com/v/"
#      
#  messages.places('Berlin')    
#  => "Ok ! your next polls will consider places near Berlin"

module.exports =
  url: "https://www.foursquare.com/v/"

  category: "4bf58dd8d48988d1e0931735"

  thanks: "Thanks for your vote !"

  partial: "\nThe partial result is:\n\n"

  hello: (name) ->
    "\nHello ! I will be your barista today.\nType " +
    "\"@#{name} coffeepoll vote [NUMBER]\" to choose between this places:\n\n"

  win: (winner) ->
    "\nThe winner is ...\n#{winner.name} at #{winner.location.address} !\nEnjoy your coffee :)"

  places: (place) ->
    "Ok ! your next polls will consider places near #{place}."

  errorVoteNotFound: "Hey dude, this options doesn't exist. Are you trying to be funny or what ?"

  errorStart: (name) ->
    "There's no poll started. To start a poll type \"@#{name} coffeepoll start\"."

  errorAlreadyVoted: (name) ->
    "Sorry @#{name}, but you already voted on this poll. Don't try to be sneaky !"
