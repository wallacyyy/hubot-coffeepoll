require('coffee-script');
const _ = require('lodash');
const nock = require('nock');
const Helper = require('hubot-test-helper');
const helper = new Helper('../src/coffeepoll.js');
const messages = require('../lib/messages');
const expect = require('chai').expect;

describe('coffeepoll', () => {
  const pollStartedTest = (command, room) => {
    const msg = `@hubot coffeepoll ${command}`;
    const user = 'username';
    const bot = 'hubot';

    room.user.say(user, msg);
    expect(_.last(room.messages)).to.eql([bot, messages.errorStart(bot)]);
  };

  const generateVenues = (numberOfVenues) => {
    const venues = [];

    for (let i = 1; i <= numberOfVenues; i += 1) {
      venues.push({
        id: i,
        name: `coffee-${i}`,
        location: {
          address: `address-${i}`
        }
      });
    }

    return venues;
  };

  const payload = {
    response: {
      venues: generateVenues(3)
    }
  };

  const error = {
    response: {
      meta: {
        code: 400
      }
    }
  };

  beforeEach((done) => {
    this.room = helper.createRoom();
    //eslint-disable-next-line
    this.brain = this.room.robot.brain.data._private;

    setTimeout(done, 50);
    nock.disableNetConnect();

    nock('https://api.foursquare.com')
      .get('/v2/venues/search')
      .query(true)
      .reply(200, payload);
  });

  afterEach(() => {
    this.room.destroy();
    nock.cleanAll();
  });

  it('shows all commands', () => {
    this.room.user.say('username', '@hubot coffeepoll help');
    expect(_.last(this.room.messages)).to.eql(['hubot', messages.help]);
  });

  it('tries to set a radius with something that is not a number', () => {
    this.room.user.say('username', '@hubot coffeepoll radius arandomword');
    expect(_.last(this.room.messages)).to.eql(['hubot', messages.errorRadiusNotValid]);
    expect(this.brain.radius).to.eql(500);
  });

  it('tries to set a radius with a not valid number', () => {
    this.room.user.say('username', '@hubot coffeepoll radius -5599');
    expect(_.last(this.room.messages)).to.eql(['hubot', messages.errorRadiusNotValid]);
    expect(this.brain.radius).to.eql(500);
  });

  it('configure search radius', () => {
    this.room.user.say('username', '@hubot coffeepoll radius 100');
    expect(_.last(this.room.messages)).to.eql(['hubot', messages.radiusUpdated(100)]);
    expect(this.brain.radius).to.eql(100);
  });

  it('rounds search radius', () => {
    this.room.user.say('username', '@hubot coffeepoll radius 22.2');
    expect(_.last(this.room.messages)).to.eql(['hubot', messages.radiusUpdated(22)]);
    expect(this.brain.radius).to.eql(22);
  });

  it('starts with a default radius configured', () => {
    expect(this.brain.radius).to.be.a('number');
  });

  it('starts with a default place configured', () => {
    expect(this.brain.near).to.be.a('string');
  });

  it('configure a place near', () => {
    this.room.user.say('username', '@hubot coffeepoll near Paris');
    expect(this.brain.near).to.eql('Paris');
  });

  it('tries to vote without a poll', () => {
    pollStartedTest('vote 0', this.room);
    expect(this.brain.votes).eql([]);
  });

  it('tries to finish a poll without start one', () => {
    pollStartedTest('finish', this.room);
  });

  it('tries to verify the partial without a poll', () => {
    pollStartedTest('partial', this.room);
  });

  context('api returning a error', () => {
    beforeEach((done) => {
      nock.cleanAll();
      nock('https://api.foursquare.com')
        .get('/v2/venues/search')
        .query(true)
        .reply(400, error);

      this.room.user.say('username', '@hubot coffeepoll start');
      setTimeout(done, 50);
    });

    it('tries to start a poll in a place with no shops nearby', () => {
      expect(this.brain.options).to.eql([]);
      expect(_.last(this.room.messages)).to.eql(['hubot', messages.errorPlaceNotFound(this.brain.near)]);
    });
  });

  context('with a poll started', () => {
    beforeEach((done) => {
      this.room.user.say('username', '@hubot coffeepoll start');
      setTimeout(done, 50);
    });

    it('saves 3 location samples', () => {
      expect(this.brain.options.length).to.eql(3);
    });

    it('counts the votes', () => {
      this.room.user.say('username', '@hubot coffeepoll vote 0');
      expect(this.brain.votes[0]).to.eql(1);
    });

    it('tries to vote twice', () => {
      const user = 'username';
      const msg = '@hubot coffeepoll vote 0';

      this.room.user.say(user, msg);
      this.room.user.say(user, msg);

      expect(_.last(this.room.messages)).to.eql(['hubot', messages.errorAlreadyVoted(user)]);
      expect(this.brain.votes[0]).to.eql(1);
    });

    it('tries to start another poll before finish it', () => {
      const bot = 'hubot';
      const user = 'username';

      this.room.user.say(user, '@hubot coffeepoll start');

      expect(_.last(this.room.messages)).to.eql([bot, messages.errorAlreadyStarted]);
    });

    it('tries to vote in a option that does not exist', () => {
      const bot = 'hubot';
      const user = 'username';
      const msg = '@hubot coffeepoll vote 99';

      this.room.user.say(user, msg);

      expect(_.last(this.room.messages)).to.eql([bot, messages.errorVoteNotFound]);
      expect(this.brain.votes).to.eql([0, 0, 0]);
    });

    it('finishes the poll', () => {
      const user = 'username';
      const winner = this.brain.options[1];

      this.room.user.say(user, '@hubot coffeepoll vote 1');
      this.room.user.say(user, '@hubot coffeepoll finish');

      expect(_.last(this.room.messages)).to.eql(['hubot', messages.win(winner)]);
    });

    context('and finished', () => {
      it('cleans out the poll data', () => {
        this.room.user.say('username', '@hubot coffeepoll finish');

        expect(this.brain.participants).to.eql({});
        expect(this.brain.options).to.eql([]);
        expect(this.brain.votes).to.eql([]);
      });
    });
  });
});
