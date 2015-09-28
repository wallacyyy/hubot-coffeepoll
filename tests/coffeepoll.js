require('coffee-script').register()

var Helper = require('hubot-test-helper')
var helper = new Helper('../scripts')
var messages = require('../lib/messages')
var expect = require('chai').expect

describe('coffeepoll', function () {
  var pollStartedTest = function (command, room) {
    var msg = '@hubot coffeepoll ' + command
    var user = 'username'
    var bot = 'hubot'

    room.user.say(user, msg)

    expect(room.messages).to.eql([
      [user, msg],
      [bot, messages.errorStart(bot)]
    ])
  }

  beforeEach(function (done) {
    this.room = helper.createRoom()
    this.brain = this.room.robot.brain.data._private
    setTimeout(done, 50)
  })

  afterEach(function () {
    this.room.destroy()
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
})
