require('coffee-script')

var Helper = require('hubot-test-helper')
var helper = new Helper('../src/coffeepoll.js')
var messages = require('../lib/messages')
var expect = require('chai').expect
var _ = require('lodash')
var nock = require('nock')

describe('coffeepoll', function () {
  var pollStartedTest = function (command, room) {
    var msg = '@hubot coffeepoll ' + command
    var user = 'username'
    var bot = 'hubot'

    room.user.say(user, msg)
    expect(_.last(room.messages)).to.eql([bot, messages.errorStart(bot)])
  }

  var generateVenues = function (numberOfVenues) {
    var venues = []

    for (var i = 1; i <= numberOfVenues; i++) {
      venues.push({
        id: i,
        name: 'coffee-' + i,
        location: {
          address: 'address-' + i
        }
      })
    }

    return venues
  }

  var payload = {
    response: {
      venues: generateVenues(3)
    }
  }

  var error = {
    response: {
      meta: {
        code: 400
      }
    }
  }

  beforeEach(function (done) {
    this.room = helper.createRoom()
    this.brain = this.room.robot.brain.data._private

    setTimeout(done, 50)
    nock.disableNetConnect()

    nock('https://api.foursquare.com')
      .get('/v2/venues/search')
      .query(true)
      .reply(200, payload)
  })

  afterEach(function () {
    this.room.destroy()
    nock.cleanAll()
  })

  it('shows all commands', function () {
    this.room.user.say('username', '@hubot coffeepoll help')
    expect(_.last(this.room.messages)).to.eql(['hubot', messages.help])
  })

  it('starts with a default place configured', function () {
    expect(this.brain.near).to.be.a('string')
  })

  it('configure a place near', function () {
    this.room.user.say('username', '@hubot coffeepoll near Paris')
    expect(this.brain.near).to.eql('Paris')
  })

  it('tries to vote without a poll', function () {
    pollStartedTest('vote 0', this.room)
    expect(this.brain.votes).eql([])
  })

  it('tries to finish a poll without start one', function () {
    pollStartedTest('finish', this.room)
  })

  it('tries to verify the partial without a poll', function () {
    pollStartedTest('partial', this.room)
  })

  context('api returning a error', function () {
    beforeEach(function (done) {
      nock.cleanAll()
      nock('https://api.foursquare.com')
        .get('/v2/venues/search')
        .query(true)
        .reply(400, error)

      this.room.user.say('username', '@hubot coffeepoll start')
      setTimeout(done, 50)
    })


    it('tries to start a poll in a place with no shops nearby', function () {
      expect(this.brain.options).to.eql([])
      expect(_.last(this.room.messages)).to.eql(['hubot', messages.errorPlaceNotFound(this.brain.near)])
    })

  })

  context('with a poll started', function () {
    beforeEach(function (done) {
      this.room.user.say('username', '@hubot coffeepoll start')
      setTimeout(done, 50)
    })

    it('saves 3 location samples', function () {
      expect(this.brain.options.length).to.eql(3)
    })

    it('counts the votes', function () {
      this.room.user.say('username', '@hubot coffeepoll vote 0')
      expect(this.brain.votes[0]).to.eql(1)
    })

    it('tries to vote twice', function () {
      var user = 'username'
      var msg = '@hubot coffeepoll vote 0'

      this.room.user.say(user, msg)
      this.room.user.say(user, msg)

      expect(_.last(this.room.messages)).to.eql(['hubot', messages.errorAlreadyVoted(user)])
      expect(this.brain.votes[0]).to.eql(1)
    })

    it('tries to start another poll before finish it', function () {
      var bot = 'hubot'
      var user = 'username'

      this.room.user.say(user, '@hubot coffeepoll start')

      expect(_.last(this.room.messages)).to.eql([bot, messages.errorAlreadyStarted])
    })

    it('tries to vote in a option that does not exist', function () {
      var bot = 'hubot'
      var user = 'username'
      var msg = '@hubot coffeepoll vote 99'

      this.room.user.say(user, msg)

      expect(_.last(this.room.messages)).to.eql([bot, messages.errorVoteNotFound])
      expect(this.brain.votes).to.eql([0, 0, 0])
    })

    it('finishes the poll', function () {
      var user = 'username'
      var winner = this.brain.options[0]

      this.room.user.say(user, '@hubot coffeepoll vote 0')
      this.room.user.say(user, '@hubot coffeepoll finish')

      expect(_.last(this.room.messages)).to.eql(['hubot', messages.win(winner)])
    })

    context('and finished', function () {
      it('cleans out the poll data', function () {
        this.room.user.say('username', '@hubot coffeepoll finish')

        expect(this.brain.participants).to.eql({})
        expect(this.brain.options).to.eql([])
        expect(this.brain.votes).to.eql([])
      })
    })
  })
})
